import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import Videography, { ApprovalStatus } from '../models/Videography.js';
import { authenticateToken, requireStaffOrAdmin, AuthRequest } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import User from '../models/User.js';

const router = Router();

interface IVideographyFilter {
  isActive: boolean;
  status?: string | {[key: string]: unknown};
  $or?: Array<{[key: string]: unknown}>;
}

// Validation middleware for creating videography services
const createVideographyValidation = [
  body('name').trim().isLength({ min: 1 }).withMessage('Service name is required'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('serviceLocation.address').trim().isLength({ min: 1 }).withMessage('Address is required'),
  body('serviceLocation.city').trim().isLength({ min: 1 }).withMessage('City is required'),
  body('serviceLocation.state').trim().isLength({ min: 1 }).withMessage('State is required'),
  body('serviceLocation.pincode').trim().isLength({ min: 1 }).withMessage('Pincode is required'),
  body('contact.phone').trim().isLength({ min: 1 }).withMessage('Phone number is required'),
  body('contact.email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('videographyTypes').isArray({ min: 1 }).withMessage('At least one videography type is required'),
  body('packages').isArray({ min: 1 }).withMessage('At least one package is required'),
];

// GET /api/videography - Get all approved videography services (for customers)
router.get('/', async (req: Request, res: Response) => {
  try {
    const videographies = await Videography.find({ 
      status: { $in: [ApprovalStatus.APPROVED, ApprovalStatus.PENDING_EDIT] },
      isActive: true 
    })
    .select('+images') // Explicitly select images field
    .populate('provider', 'firstName lastName email phone')
    .sort({ createdAt: -1 });

    res.json({
      message: 'Videography services retrieved successfully',
      data: videographies
    });
  } catch (error) {
    console.error('Error fetching videography services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/videography/my-services - Get all videography services for the authenticated provider
router.get('/my-services', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is a provider
    if (req.user.role !== UserRole.PROVIDER) {
      return res.status(403).json({ error: 'Only providers can access their services' });
    }

    // Fetch the full user object to check service categories
    const fullUser = await User.findById(req.user.id);
    if (!fullUser || !fullUser.serviceCategories || !fullUser.serviceCategories.includes('videography')) {
      return res.status(403).json({ error: 'User is not registered as a videography provider' });
    }

    const videographies = await Videography.find({ provider: req.user.id, isActive: true })
      .select('+images') // Explicitly select images field
      .sort({ createdAt: -1 });

    res.json({
      message: 'Your videography services retrieved successfully',
      data: videographies
    });
  } catch (error) {
    console.error('Error fetching provider videography services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/videography - Create a new videography service
router.post('/', authenticateToken, createVideographyValidation, async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        errors: errors.array() 
      });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is a provider
    if (req.user.role !== UserRole.PROVIDER) {
      return res.status(403).json({ error: 'Only providers can create videography services' });
    }

    // Fetch the full user object to check service categories
    const fullUser = await User.findById(req.user.id);
    if (!fullUser || !fullUser.serviceCategories || !fullUser.serviceCategories.includes('videography')) {
      return res.status(403).json({ error: 'User is not registered as a videography provider' });
    }

    const {
      name,
      description,
      serviceLocation,
      contact,
      images,
      videographyTypes,
      packages,
      addons,
      basePrice,
      minGuests,
      cancellationPolicy,
      paymentTerms
    } = req.body;

    const videography = await Videography.create({
      name,
      description,
      provider: req.user.id,
      serviceLocation,
      contact,
      images: images || [],
      videographyTypes,
      packages,
      addons: addons || [],
      basePrice,
      minGuests,
      cancellationPolicy,
      paymentTerms,
      rating: 0,
      reviewCount: 0,
      status: req.body.status || ApprovalStatus.PENDING, // Use provided status or default to pending
      isActive: true
    });

    res.status(201).json({
      message: 'Videography service created successfully',
      data: videography
    });
  } catch (error) {
    console.error('Error creating videography service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/videography/:id/submit-for-approval - Submit videography service for approval
router.patch('/:id/submit-for-approval', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is a provider
    if (req.user.role !== UserRole.PROVIDER) {
      return res.status(403).json({ error: 'Only providers can submit services for approval' });
    }

    const videography = await Videography.findOne({
      _id: req.params.id,
      provider: req.user.id
    });

    if (!videography) {
      return res.status(404).json({ error: 'Videography service not found or unauthorized' });
    }

    if (videography.status !== ApprovalStatus.DRAFT) {
      return res.status(400).json({ 
        error: 'Only draft services can be submitted for approval',
        currentStatus: videography.status
      });
    }

    // Update status to pending
    videography.status = ApprovalStatus.PENDING;
    await videography.save();

    res.json({
      message: 'Videography service submitted for approval successfully',
      service: {
        _id: videography._id,
        name: videography.name,
        status: videography.status
      }
    });
  } catch (error) {
    console.error('Error submitting videography service for approval:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/videography/:id - Get a specific videography service
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid videography service ID' });
    }

    const videography = await Videography.findById(id)
      .select('+images') // Explicitly select images field
      .populate('provider', 'firstName lastName email phone');

    if (!videography) {
      return res.status(404).json({ error: 'Videography service not found' });
    }

    // Allow viewing of approved and pending edit services
    if (videography.status !== ApprovalStatus.APPROVED && videography.status !== ApprovalStatus.PENDING_EDIT) {
      // In a real implementation, we would check if the user is the provider or staff
      // For now, we'll return it but in a real app you'd add authentication checks
    }

    res.json({
      message: 'Videography service retrieved successfully',
      data: videography
    });
  } catch (error) {
    console.error('Error fetching videography service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/videography/:id - Update a videography service
router.put('/:id', authenticateToken, createVideographyValidation, async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid videography service ID' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is a provider
    if (req.user.role !== UserRole.PROVIDER) {
      return res.status(403).json({ error: 'Only providers can update videography services' });
    }

    const videography = await Videography.findById(id);

    if (!videography) {
      return res.status(404).json({ error: 'Videography service not found' });
    }

    // Check if user is the owner of this service
    if (videography.provider.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own services' });
    }

    // Only allow updates if service is pending or approved
    if (videography.status === ApprovalStatus.REJECTED) {
      return res.status(400).json({ error: 'Cannot update rejected services. Please contact support.' });
    }

    const {
      name,
      description,
      serviceLocation,
      contact,
      images,
      videographyTypes,
      packages,
      addons,
      basePrice,
      minGuests,
      cancellationPolicy,
      paymentTerms
    } = req.body;

    // For approved services, store edits in pendingEdits instead of directly updating
    if (videography.status === ApprovalStatus.APPROVED) {
      // Store the edits in pendingEdits field
      videography.pendingEdits = {
        name,
        description,
        serviceLocation,
        contact,
        images: images || [],
        videographyTypes,
        packages,
        addons: addons || [],
        basePrice,
        minGuests,
        cancellationPolicy,
        paymentTerms,
        updatedAt: new Date()
      };
      videography.pendingEditSubmittedAt = new Date();
      videography.status = ApprovalStatus.PENDING_EDIT;
    } else {
      // Update the service directly for non-approved services (PENDING or PENDING_EDIT)
      videography.name = name;
      videography.description = description;
      videography.serviceLocation = serviceLocation;
      videography.contact = contact;
      videography.images = images || [];
      videography.videographyTypes = videographyTypes;
      videography.packages = packages;
      videography.addons = addons || [];
      videography.basePrice = basePrice;
      videography.minGuests = minGuests;
      videography.cancellationPolicy = cancellationPolicy;
      videography.paymentTerms = paymentTerms;

      // If service was pending and now has edits, keep it as pending
      // If it was already in PENDING_EDIT status, keep it that way
    }

    await videography.save();

    res.json({
      message: 'Videography service updated successfully',
      data: videography
    });
  } catch (error) {
    console.error('Error updating videography service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/videography/:id - Delete a videography service
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid videography service ID' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is a provider
    if (req.user.role !== UserRole.PROVIDER) {
      return res.status(403).json({ error: 'Only providers can delete videography services' });
    }

    const videography = await Videography.findById(id);

    if (!videography) {
      return res.status(404).json({ error: 'Videography service not found' });
    }

    // Check if user is the owner of this service
    if (videography.provider.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own services' });
    }

    // Delete associated images from S3
    if (videography.images && videography.images.length > 0) {
      try {
        // Import the S3 delete function and URL extraction utility
        const { deleteFromS3 } = await import('../services/uploadService.js');
        const { extractS3Key } = await import('../utils/s3.js');
        
        // Delete each image from S3
        for (const image of videography.images) {
          if (image.url) {
            try {
              const key = extractS3Key(image.url);
              if (key) {
                await deleteFromS3(key);
                console.log(`Deleted image from S3: ${key}`);
              }
            } catch (s3Error) {
              console.error(`Failed to delete image from S3: ${image.url}`, s3Error);
              // Continue with other images even if one fails
            }
          }
        }
      } catch (imageDeleteError) {
        console.error('Error deleting images from S3:', imageDeleteError);
        // Don't fail the entire operation if image deletion fails
      }
    }

    // Actually delete the service from the database
    await Videography.findByIdAndDelete(id);

    res.json({
      message: 'Videography service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting videography service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/videography/staff/pending - Get videography services for staff approval
router.get('/staff/pending', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is staff or admin
    if (req.user.role !== UserRole.STAFF && req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Only staff and admin can access pending services' });
    }

    const { status, page = 1, limit = 10, search } = req.query;

    const filter: IVideographyFilter = {
      isActive: true
    };
    
    if (status && status !== 'ALL') {
      filter.status = status as string;
    } else {
      // Default to pending services if no status specified
      filter.status = { $in: ['PENDING', 'APPROVED', 'REJECTED', 'PENDING_EDIT'] };
    }

    // Add search functionality
    if (search && search.toString().trim()) {
      const searchTerm = search.toString().trim();
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { 'serviceLocation.city': { $regex: searchTerm, $options: 'i' } },
        { 'serviceLocation.address': { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    const videographies = await Videography.find(filter)
      .select('+images') // Explicitly select images field
      .populate('provider', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    const total = await Videography.countDocuments(filter);

    res.json({
      message: 'Pending videography services retrieved successfully',
      data: videographies,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        totalItems: total,
        itemsPerPage: limitNumber
      }
    });
  } catch (error) {
    console.error('Error fetching pending videography services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/videography/staff/:id/approve - Approve a videography service (staff only)
router.put('/staff/:id/approve', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid videography service ID' });
    }

    const videography = await Videography.findById(id);

    if (!videography) {
      return res.status(404).json({ error: 'Videography service not found' });
    }

    // Clear pending edits when approving
    videography.pendingEdits = undefined;
    videography.pendingEditSubmittedAt = undefined;
    videography.status = ApprovalStatus.APPROVED;
    await videography.save();

    res.json({
      message: 'Videography service approved successfully',
      data: videography
    });
  } catch (error) {
    console.error('Error approving videography service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/videography/staff/:id/reject - Reject a videography service (staff only)
router.put('/staff/:id/reject', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid videography service ID' });
    }

    const videography = await Videography.findById(id);

    if (!videography) {
      return res.status(404).json({ error: 'Videography service not found' });
    }

    // Clear pending edits when rejecting
    videography.pendingEdits = undefined;
    videography.pendingEditSubmittedAt = undefined;
    videography.status = ApprovalStatus.REJECTED;
    
    // Store rejection reason if provided
    if (rejectionReason) {
      // In a real implementation, you might want to store this in a separate field
      console.log(`Videography service ${id} rejected with reason: ${rejectionReason}`);
    }
    
    await videography.save();

    res.json({
      message: 'Videography service rejected successfully',
      data: videography
    });
  } catch (error) {
    console.error('Error rejecting videography service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/videography/staff/:id - Delete videography service (Staff only)
router.delete('/staff/:id', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid videography service ID' });
    }

    const videography = await Videography.findById(id);

    if (!videography) {
      return res.status(404).json({ error: 'Videography service not found' });
    }

    // Delete associated images from S3
    if (videography.images && videography.images.length > 0) {
      try {
        // Import the S3 delete function and URL extraction utility
        const { deleteFromS3 } = await import('../services/uploadService.js');
        const { extractS3Key } = await import('../utils/s3.js');
        
        // Delete each image from S3
        for (const image of videography.images) {
          if (image.url) {
            try {
              const key = extractS3Key(image.url);
              if (key) {
                await deleteFromS3(key);
                console.log(`Deleted image from S3: ${key}`);
              }
            } catch (s3Error) {
              console.error(`Failed to delete image from S3: ${image.url}`, s3Error);
              // Continue with other images even if one fails
            }
          }
        }
      } catch (imageDeleteError) {
        console.error('Error deleting images from S3:', imageDeleteError);
        // Don't fail the entire operation if image deletion fails
      }
    }

    // Actually delete the service from the database
    await Videography.findByIdAndDelete(id);

    res.json({
      message: 'Videography service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting videography service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/videography/staff/stats - Get stats for staff dashboard
router.get('/staff/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is staff or admin
    if (req.user.role !== UserRole.STAFF && req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Only staff and admin can access stats' });
    }

    // Get counts for each status
    const pendingCount = await Videography.countDocuments({ 
      status: ApprovalStatus.PENDING,
      isActive: true 
    });
    
    const approvedCount = await Videography.countDocuments({ 
      status: ApprovalStatus.APPROVED,
      isActive: true 
    });
    
    const rejectedCount = await Videography.countDocuments({ 
      status: ApprovalStatus.REJECTED,
      isActive: true 
    });

    // Get count of services with pending edits
    const pendingEditCount = await Videography.countDocuments({ 
      status: ApprovalStatus.PENDING_EDIT,
      isActive: true 
    });

    res.json({
      message: 'Videography stats retrieved successfully',
      data: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        pendingEdit: pendingEditCount
      }
    });
  } catch (error) {
    console.error('Error fetching videography stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/videography/:id/approve-edit - Approve videography service edit (Staff only)
router.post('/:id/approve-edit', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid videography service ID' });
    }

    const videography = await Videography.findById(id);
    if (!videography) {
      return res.status(404).json({ error: 'Videography service not found' });
    }

    if (videography.status !== ApprovalStatus.PENDING_EDIT) {
      return res.status(400).json({ error: 'Only videography services with pending edits can be approved' });
    }

    // Apply the pending edits to the service
    if (videography.pendingEdits) {
      // Merge pending edits with the current service data
      Object.assign(videography, videography.pendingEdits);
    }

    // Clear pending edits and update status
    videography.pendingEdits = undefined;
    videography.pendingEditSubmittedAt = undefined;
    videography.status = ApprovalStatus.APPROVED;
    videography.updatedAt = new Date();
    
    await videography.save();

    res.json({
      message: 'Videography service edits approved successfully',
      data: videography
    });
  } catch (error) {
    console.error('Error approving videography service edits:', error);
    res.status(500).json({ error: 'Failed to approve videography service edits' });
  }
});

// POST /api/videography/:id/reject-edit - Reject videography service edit (Staff only)
router.post('/:id/reject-edit', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid videography service ID' });
    }

    const videography = await Videography.findById(id);
    if (!videography) {
      return res.status(404).json({ error: 'Videography service not found' });
    }

    if (videography.status !== ApprovalStatus.PENDING_EDIT) {
      return res.status(400).json({ error: 'Only videography services with pending edits can be rejected' });
    }

    // Clear pending edits and update status
    videography.pendingEdits = undefined;
    videography.pendingEditSubmittedAt = undefined;
    videography.status = ApprovalStatus.APPROVED; // Revert to approved status
    videography.updatedAt = new Date();
    
    // Store rejection reason
    console.log(`Videography service ${id} edits rejected. Reason: ${reason}`);
    
    await videography.save();

    res.json({
      message: 'Videography service edits rejected successfully',
      data: videography
    });
  } catch (error) {
    console.error('Error rejecting videography service edits:', error);
    res.status(500).json({ error: 'Failed to reject videography service edits' });
  }
});

export default router;
