import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import { 
  generatePresignedPost, 
  uploadToS3, 
  deleteFromS3, 
  validateFile,
  getFileMetadata,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  MAX_FILE_SIZE
} from '../services/uploadService.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import { PresignedPostRequest, PresignedPostResponse } from '../types/index.js';
import { extractS3Key } from '../utils/s3.js';

const router = Router();

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: Math.max(MAX_FILE_SIZE.image, MAX_FILE_SIZE.document),
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
    }
  },
});

// Validation middleware for presigned URL requests
const presignedUrlValidation = [
  body('fileName')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('File name must be 1-255 characters')
    .matches(/^[^<>:"/\\\\|?*]+$/)
    .withMessage('File name contains invalid characters'),
  body('fileType')
    .isIn([...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES])
    .withMessage('Invalid file type'),
  body('fileSize')
    .isInt({ min: 1, max: Math.max(MAX_FILE_SIZE.image, MAX_FILE_SIZE.document) })
    .withMessage(`File size must be between 1 byte and ${Math.max(MAX_FILE_SIZE.image, MAX_FILE_SIZE.document)} bytes`),
  body('uploadType')
    .isIn(['venue', 'profile', 'document', 'catering', 'photography', 'videography'])
    .withMessage('Upload type must be venue, profile, document, catering, photography, or videography'),
  body('venueId')
    .optional()
    .isMongoId()
    .withMessage('Invalid venue ID format'),
];

// POST /api/upload/presigned-url - Generate presigned URL for frontend uploads
router.post('/presigned-url', authenticateToken, presignedUrlValidation, async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { fileName, fileType, fileSize, uploadType, venueId }: PresignedPostRequest = req.body;
    const userId = req.user!.id;

    // Additional validation for venue uploads
    if (uploadType === 'venue') {
      // Check if user owns the venue (if provider) or has permission
      if (req.user!.role === UserRole.PROVIDER) {
        // This would need to check venue ownership - implement based on your venue model
        // For now, we'll allow all providers to upload to any venue
        // Note: venueId is optional during venue creation process
      }
    }

    const result = await generatePresignedPost({
      userId,
      fileType,
      fileName,
      fileSize,
      uploadType,
      venueId,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    const response: PresignedPostResponse = {
      url: result.url!,
      fields: result.fields!,
      key: result.key!,
      expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
    };

    res.json({
      message: 'Presigned URL generated successfully',
      data: response,
    });

  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ error: 'Failed to generate presigned URL' });
  }
});

// POST /api/upload/direct - Handle direct file upload to server
router.post('/direct', authenticateToken, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { uploadType, venueId } = req.body;
    const userId = req.user!.id;

    if (!uploadType || !['venue', 'profile', 'document', 'catering', 'photography'].includes(uploadType)) {
      return res.status(400).json({ error: 'Invalid upload type' });
    }

    // Additional validation for venue uploads
    if (uploadType === 'venue') {
      // Note: venueId is optional during venue creation process
      // Check if user owns the venue (if provider) or has permission
      if (req.user!.role === UserRole.PROVIDER) {
        // This would need to check venue ownership - implement based on your venue model
        // For now, we'll allow all providers to upload to any venue
      }
    }

    const result = await uploadToS3(req.file.buffer, {
      userId,
      fileType: req.file.mimetype,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      uploadType,
      venueId,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      message: 'File uploaded successfully',
      data: {
        url: result.url,
        key: result.key,
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// DELETE /api/upload/:key - Delete file from S3
router.delete('/:key', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const key = req.params.key;
    
    if (!key) {
      return res.status(400).json({ error: 'File key is required' });
    }

    // Basic security check - ensure user can only delete their own files
    const userId = req.user!.id;
    if (!key.includes(userId) && req.user!.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Unauthorized to delete this file' });
    }

    const result = await deleteFromS3(key);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      message: 'File deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// DELETE /api/upload/by-url - Delete file by URL
router.delete('/by-url', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'File URL is required' });
    }

    const key = extractS3Key(url);
    if (!key) {
      return res.status(400).json({ error: 'Invalid S3 URL' });
    }

    // Basic security check - ensure user can only delete their own files
    const userId = req.user!.id;
    if (!key.includes(userId) && req.user!.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Unauthorized to delete this file' });
    }

    const result = await deleteFromS3(key);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      message: 'File deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// GET /api/upload/metadata/:key - Get file metadata
router.get('/metadata/:key', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const key = req.params.key;
    
    if (!key) {
      return res.status(400).json({ error: 'File key is required' });
    }

    // Basic security check - ensure user can only access their own files
    const userId = req.user!.id;
    if (!key.includes(userId) && req.user!.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Unauthorized to access this file' });
    }

    const result = await getFileMetadata(key);

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json({
      message: 'File metadata retrieved successfully',
      data: result.metadata,
    });

  } catch (error) {
    console.error('Error getting file metadata:', error);
    res.status(500).json({ error: 'Failed to get file metadata' });
  }
});

// GET /api/upload/config - Get upload configuration
router.get('/config', (req: Request, res: Response) => {
  res.json({
    message: 'Upload configuration retrieved successfully',
    data: {
      allowedImageTypes: ALLOWED_IMAGE_TYPES,
      allowedDocumentTypes: ALLOWED_DOCUMENT_TYPES,
      maxFileSize: MAX_FILE_SIZE,
      uploadTypes: ['venue', 'profile', 'document', 'catering', 'photography'],
    },
  });
});

// POST /api/upload/validate - Validate file before upload
router.post('/validate', (req: Request, res: Response) => {
  try {
    const { fileType, fileSize, uploadType } = req.body;

    if (!fileType || !fileSize || !uploadType) {
      return res.status(400).json({ 
        error: 'fileType, fileSize, and uploadType are required' 
      });
    }

    const category = ALLOWED_IMAGE_TYPES.includes(fileType) ? 'image' : 'document';
    const validation = validateFile(fileType, fileSize, category);

    if (!validation.valid) {
      return res.status(400).json({ 
        error: validation.error,
        valid: false 
      });
    }

    res.json({
      message: 'File validation passed',
      data: {
        valid: true,
        category,
        maxSize: category === 'image' ? MAX_FILE_SIZE.image : MAX_FILE_SIZE.document,
      },
    });

  } catch (error) {
    console.error('Error validating file:', error);
    res.status(500).json({ error: 'Failed to validate file' });
  }
});

export default router;