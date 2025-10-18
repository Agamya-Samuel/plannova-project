import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { Upload } from '@aws-sdk/lib-storage';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client, getS3Config, generateFileKey, getS3Url } from '../utils/s3.js';

// File type configurations
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

export const MAX_FILE_SIZE = {
  image: 10 * 1024 * 1024, // 10MB for images
  document: 25 * 1024 * 1024, // 25MB for documents
};

// Upload options interface
export interface PresignedPostOptions {
  userId: string;
  fileType: string;
  fileName: string;
  fileSize: number;
  uploadType: 'venue' | 'profile' | 'document' | 'catering' | 'photography' | 'videography' | 'bridal-makeup' | 'decoration';
  venueId?: string;
}

// Upload result interface
export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  message?: string;
  error?: string;
}

// Presigned URL result interface
export interface PresignedUrlResult {
  success: boolean;
  url?: string;
  fields?: Record<string, string>;
  key?: string;
  message?: string;
  error?: string;
}

// Validate file type and size
export const validateFile = (
  fileType: string,
  fileSize: number,
  uploadType: 'image' | 'document'
): { valid: boolean; error?: string } => {
  // Check file type
  const allowedTypes = uploadType === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES;
  if (!allowedTypes.includes(fileType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types for ${uploadType}: ${allowedTypes.join(', ')}`
    };
  }

  // Check file size
  const maxSize = uploadType === 'image' ? MAX_FILE_SIZE.image : MAX_FILE_SIZE.document;
  if (fileSize > maxSize) {
    return {
      valid: false,
      error: `File size exceeds limit. Maximum size for ${uploadType}: ${Math.round(maxSize / (1024 * 1024))}MB`
    };
  }

  return { valid: true };
};

// Generate presigned POST URL for frontend uploads
export const generatePresignedPost = async (
  options: PresignedPostOptions
): Promise<PresignedUrlResult> => {
  try {
    const { userId, fileType, fileName, fileSize, uploadType, venueId } = options;

    // Validate file
    const uploadCategory = ALLOWED_IMAGE_TYPES.includes(fileType) ? 'image' : 'document';
    const validation = validateFile(fileType, fileSize, uploadCategory);
    
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Generate file key
    const key = generateFileKey(userId, uploadType, fileName, venueId);
    
    // Get S3 client and config
    const client = getS3Client();
    const config = getS3Config();

    // Create presigned POST
    console.log('Creating presigned POST with config:', {
      bucket: config.bucket,
      key,
      endpoint: config.endpoint,
      region: config.region
    });
    
    const presignedPost = await createPresignedPost(client, {
      Bucket: config.bucket,
      Key: key,
      Fields: {
        'Content-Type': fileType,
      },
      Conditions: [
        ['content-length-range', 0, fileSize * 1.1], // Allow 10% buffer for browser differences
        ['eq', '$Content-Type', fileType],
      ],
      Expires: 3600, // 1 hour expiration
    });
    
    console.log('Presigned POST created:', {
      url: presignedPost.url,
      fieldsKeys: Object.keys(presignedPost.fields),
      key
    });

    return {
      success: true,
      url: presignedPost.url,
      fields: presignedPost.fields,
      key,
      message: 'Presigned URL generated successfully'
    };

  } catch (error) {
    console.error('Error generating presigned POST:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Direct upload to S3 (server-side)
export const uploadToS3 = async (
  buffer: Buffer,
  options: PresignedPostOptions
): Promise<UploadResult> => {
  try {
    const { userId, fileType, fileName, fileSize, uploadType, venueId } = options;

    // Validate file
    const uploadCategory = ALLOWED_IMAGE_TYPES.includes(fileType) ? 'image' : 'document';
    const validation = validateFile(fileType, fileSize, uploadCategory);
    
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // Generate file key
    const key = generateFileKey(userId, uploadType, fileName, venueId);
    
    // Get S3 client and config
    const client = getS3Client();
    const config = getS3Config();

    // Use @aws-sdk/lib-storage for efficient upload
    const upload = new Upload({
      client,
      params: {
        Bucket: config.bucket,
        Key: key,
        Body: buffer,
        ContentType: fileType,
        Metadata: {
          userId,
          uploadType,
          originalFileName: fileName,
          ...(venueId && { venueId }),
        },
      },
      queueSize: 4,
      partSize: 1024 * 1024 * 5, // 5MB parts
      leavePartsOnError: false,
    });

    // Monitor upload progress (optional)
    upload.on('httpUploadProgress', (progress) => {
      console.log(`Upload progress: ${progress.loaded}/${progress.total} bytes`);
    });

    await upload.done();

    const url = getS3Url(key);

    return {
      success: true,
      url,
      key,
      message: 'File uploaded successfully'
    };

  } catch (error) {
    console.error('Error uploading to S3:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};

// Delete file from S3
export const deleteFromS3 = async (key: string): Promise<UploadResult> => {
  try {
    const client = getS3Client();
    const config = getS3Config();

    await client.send(new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }));

    return {
      success: true,
      message: 'File deleted successfully'
    };

  } catch (error) {
    console.error('Error deleting from S3:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed'
    };
  }
};

// Bulk delete files from S3
export const bulkDeleteFromS3 = async (keys: string[]): Promise<UploadResult> => {
  try {
    const client = getS3Client();
    const config = getS3Config();

    const { DeleteObjectsCommand } = await import('@aws-sdk/client-s3');
    
    await client.send(new DeleteObjectsCommand({
      Bucket: config.bucket,
      Delete: {
        Objects: keys.map(key => ({ Key: key })),
        Quiet: true,
      },
    }));

    return {
      success: true,
      message: `${keys.length} files deleted successfully`
    };

  } catch (error) {
    console.error('Error bulk deleting from S3:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bulk delete failed'
    };
  }
};

// Get file metadata from S3
export const getFileMetadata = async (key: string) => {
  try {
    const client = getS3Client();
    const config = getS3Config();

    const { HeadObjectCommand } = await import('@aws-sdk/client-s3');
    
    const result = await client.send(new HeadObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }));

    return {
      success: true,
      metadata: {
        size: result.ContentLength,
        type: result.ContentType,
        lastModified: result.LastModified,
        metadata: result.Metadata,
      }
    };

  } catch (error) {
    console.error('Error getting file metadata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get metadata'
    };
  }
};