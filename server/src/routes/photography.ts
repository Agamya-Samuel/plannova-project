import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import Photography, { ApprovalStatus } from '../models/Photography';
import { authenticateToken, requireStaffOrAdmin, AuthRequest } from '../middleware/auth';
import { UserRole } from '../models/User';
import User from '../models/User';

const router = Router();

interface IPhotographyFilter {
  isActive: boolean;
  status?: string | {[key: string]: unknown};
  $or?: Array<{[key: string]: unknown}>;
}

// Validation middleware for creating photography services
const createPhotographyValidation = [
  body('name').trim().isLength({ min: 1 }).withMessage('Service name is required'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('serviceLocation.address').trim().isLength({ min: 1 }).withMessage('Address is required'),
  body('serviceLocation.city').trim().isLength({ min: 1 }).withMessage('City is required'),
  body('serviceLocation.state').trim().isLength({ min: 1 }).withMessage('State is required'),
  body('serviceLocation.pincode').trim().isLength({ min: 1 }).withMessage('Pincode is required'),
  body('contact.phone').trim().isLength({ min: 1 }).withMessage('Phone number is required'),
  body('contact.email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('photographyTypes').isArray({ min: 1 }).withMessage('At least one photography type is required'),
  body('packages').isArray({ min: 1 }).withMessage('At least one package is required'),
];

// GET /api/photography - Get all approved photography services (for customers)
router.get('/', async (req: Request, res: Response) => {
  try {
    const photographies = await Photography.find({ 
      status: { $in: [ApprovalStatus.APPROVED, ApprovalStatus.PENDING_EDIT] },
      isActive: true 
    })
    .select('+images') // Explicitly select images field
    .populate('provider', 'firstName lastName email phone')
    .sort({ createdAt: -1 });

    res.json({
      message: 'Photography services retrieved successfully',
      data: photographies
    });
  } catch (error) {
    console.error('Error fetching photography services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/photography/my-services - Get all photography services for the authenticated provider
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
    if (!fullUser || !fullUser.serviceCategories || !fullUser.serviceCategories.includes('photography')) {
      return res.status(403).json({ error: 'User is not registered as a photography provider' });
    }

    const photographies = await Photography.find({ provider: req.user.id, isActive: true })
      .select('+images') // Explicitly select images field
      .sort({ createdAt: -1 });

    res.json({
      message: 'Your photography services retrieved successfully',
      data: photographies
    });
  } catch (error) {
    console.error('Error fetching provider photography services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/photography - Create a new photography service
router.post('/', authenticateToken, createPhotographyValidation, async (req: AuthRequest, res: Response) => {
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
      return res.status(403).json({ error: 'Only providers can create photography services' });
    }

    // Fetch the full user object to check service categories
    const fullUser = await User.findById(req.user.id);
    if (!fullUser || !fullUser.serviceCategories || !fullUser.serviceCategories.includes('photography')) {
      return res.status(403).json({ error: 'User is not registered as a photography provider' });
    }

    const {
      name,
      description,
      serviceLocation,
      contact,
      images,
      photographyTypes,
      packages,
      addons,
      basePrice,
      minGuests,
      cancellationPolicy,
      paymentTerms
    } = req.body;

    const photography = await Photography.create({
      name,
      description,
      provider: req.user.id,
      serviceLocation,
      contact,
      images: images || [],
      photographyTypes,
      packages,
      addons: addons || [],
      basePrice,
      minGuests,
      cancellationPolicy,
      paymentTerms,
      rating: 0,
      reviewCount: 0,
      status: ApprovalStatus.PENDING, // New services start as pending approval
      isActive: true
    });

    res.status(201).json({
      message: 'Photography service created successfully',
      data: photography
    });
  } catch (error) {
    console.error('Error creating photography service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/photography/:id - Get a specific photography service
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid photography service ID' });
    }

    const photography = await Photography.findById(id)
      .select('+images') // Explicitly select images field
      .populate('provider', 'firstName lastName email phone');

    if (!photography) {
      return res.status(404).json({ error: 'Photography service not found' });
    }

    // Allow viewing of approved and pending edit services
    if (photography.status !== ApprovalStatus.APPROVED && photography.status !== ApprovalStatus.PENDING_EDIT) {
      // In a real implementation, we would check if the user is the provider or staff
      // For now, we'll return it but in a real app you'd add authentication checks
    }

    res.json({
      message: 'Photography service retrieved successfully',
      data: photography
    });
  } catch (error) {
    console.error('Error fetching photography service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/photography/:id - Update a photography service
router.put('/:id', authenticateToken, createPhotographyValidation, async (req: AuthRequest, res: Response) => {
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
      return res.status(400).json({ error: 'Invalid photography service ID' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is a provider
    if (req.user.role !== UserRole.PROVIDER) {
      return res.status(403).json({ error: 'Only providers can update photography services' });
    }

    const photography = await Photography.findById(id);

    if (!photography) {
      return res.status(404).json({ error: 'Photography service not found' });
    }

    // Check if user is the owner of this service
    if (photography.provider.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own services' });
    }

    // Only allow updates if service is pending or approved
    if (photography.status === ApprovalStatus.REJECTED) {
      return res.status(400).json({ error: 'Cannot update rejected services. Please contact support.' });
    }

    const {
      name,
      description,
      serviceLocation,
      contact,
      images,
      photographyTypes,
      packages,
      addons,
      basePrice,
      minGuests,
      cancellationPolicy,
      paymentTerms
    } = req.body;

    // For approved services, store edits in pendingEdits instead of directly updating
    if (photography.status === ApprovalStatus.APPROVED) {
      // Store the edits in pendingEdits field
      photography.pendingEdits = {
        name,
        description,
        serviceLocation,
        contact,
        images: images || [],
        photographyTypes,
        packages,
        addons: addons || [],
        basePrice,
        minGuests,
        cancellationPolicy,
        paymentTerms,
        updatedAt: new Date()
      };
      photography.pendingEditSubmittedAt = new Date();
      photography.status = ApprovalStatus.PENDING_EDIT;
    } else {
      // Update the service directly for non-approved services (PENDING or PENDING_EDIT)
      photography.name = name;
      photography.description = description;
      photography.serviceLocation = serviceLocation;
      photography.contact = contact;
      photography.images = images || [];
      photography.photographyTypes = photographyTypes;
      photography.packages = packages;
      photography.addons = addons || [];
      photography.basePrice = basePrice;
      photography.minGuests = minGuests;
      photography.cancellationPolicy = cancellationPolicy;
      photography.paymentTerms = paymentTerms;

      // If service was pending and now has edits, keep it as pending
      // If it was already in PENDING_EDIT status, keep it that way
    }

    await photography.save();

    res.json({
      message: 'Photography service updated successfully',
      data: photography
    });
  } catch (error) {
    console.error('Error updating photography service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/photography/:id - Delete a photography service
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid photography service ID' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is a provider
    if (req.user.role !== UserRole.PROVIDER) {
      return res.status(403).json({ error: 'Only providers can delete photography services' });
    }

    const photography = await Photography.findById(id);

    if (!photography) {
      return res.status(404).json({ error: 'Photography service not found' });
    }

    // Check if user is the owner of this service
    if (photography.provider.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own services' });
    }

    // Delete associated images from S3
    if (photography.images && photography.images.length > 0) {
      try {
        // Import the S3 delete function and URL extraction utility
        const { deleteFromS3 } = await import('../services/uploadService');
        const { extractS3Key } = await import('../utils/s3');
        
        // Delete each image from S3
        for (const image of photography.images) {
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
    await Photography.findByIdAndDelete(id);

    res.json({
      message: 'Photography service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting photography service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/photography/staff/pending - Get photography services for staff approval
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

    const filter: IPhotographyFilter = {
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

    const photographies = await Photography.find(filter)
      .select('+images') // Explicitly select images field
      .populate('provider', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    const total = await Photography.countDocuments(filter);

    res.json({
      message: 'Pending photography services retrieved successfully',
      data: photographies,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        totalItems: total,
        itemsPerPage: limitNumber
      }
    });
  } catch (error) {
    console.error('Error fetching pending photography services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/photography/staff/:id/approve - Approve a photography service (staff only)
router.put('/staff/:id/approve', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid photography service ID' });
    }

    const photography = await Photography.findById(id);

    if (!photography) {
      return res.status(404).json({ error: 'Photography service not found' });
    }

    // Clear pending edits when approving
    photography.pendingEdits = undefined;
    photography.pendingEditSubmittedAt = undefined;
    photography.status = ApprovalStatus.APPROVED;
    await photography.save();

    res.json({
      message: 'Photography service approved successfully',
      data: photography
    });
  } catch (error) {
    console.error('Error approving photography service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/photography/staff/:id/reject - Reject a photography service (staff only)
router.put('/staff/:id/reject', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid photography service ID' });
    }

    const photography = await Photography.findById(id);

    if (!photography) {
      return res.status(404).json({ error: 'Photography service not found' });
    }

    // Clear pending edits when rejecting
    photography.pendingEdits = undefined;
    photography.pendingEditSubmittedAt = undefined;
    photography.status = ApprovalStatus.REJECTED;
    
    // Store rejection reason if provided
    if (rejectionReason) {
      // In a real implementation, you might want to store this in a separate field
      console.log(`Photography service ${id} rejected with reason: ${rejectionReason}`);
    }
    
    await photography.save();

    res.json({
      message: 'Photography service rejected successfully',
      data: photography
    });
  } catch (error) {
    console.error('Error rejecting photography service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/photography/staff/:id - Delete photography service (Staff only)
router.delete('/staff/:id', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid photography service ID' });
    }

    const photography = await Photography.findById(id);

    if (!photography) {
      return res.status(404).json({ error: 'Photography service not found' });
    }

    // Delete associated images from S3
    if (photography.images && photography.images.length > 0) {
      try {
        // Import the S3 delete function and URL extraction utility
        const { deleteFromS3 } = await import('../services/uploadService');
        const { extractS3Key } = await import('../utils/s3');
        
        // Delete each image from S3
        for (const image of photography.images) {
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
    await Photography.findByIdAndDelete(id);

    res.json({
      message: 'Photography service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting photography service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/photography/staff/stats - Get stats for staff dashboard
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
    const pendingCount = await Photography.countDocuments({ 
      status: ApprovalStatus.PENDING,
      isActive: true 
    });
    
    const approvedCount = await Photography.countDocuments({ 
      status: ApprovalStatus.APPROVED,
      isActive: true 
    });
    
    const rejectedCount = await Photography.countDocuments({ 
      status: ApprovalStatus.REJECTED,
      isActive: true 
    });

    // Get count of services with pending edits
    const pendingEditCount = await Photography.countDocuments({ 
      status: ApprovalStatus.PENDING_EDIT,
      isActive: true 
    });

    res.json({
      message: 'Photography stats retrieved successfully',
      data: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        pendingEdit: pendingEditCount
      }
    });
  } catch (error) {
    console.error('Error fetching photography stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/photography/:id/approve-edit - Approve photography service edit (Staff only)
router.post('/:id/approve-edit', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid photography service ID' });
    }

    const photography = await Photography.findById(id);
    if (!photography) {
      return res.status(404).json({ error: 'Photography service not found' });
    }

    if (photography.status !== ApprovalStatus.PENDING_EDIT) {
      return res.status(400).json({ error: 'Only photography services with pending edits can be approved' });
    }

    // Apply the pending edits to the service
    if (photography.pendingEdits) {
      // Merge pending edits with the current service data
      Object.assign(photography, photography.pendingEdits);
    }

    // Clear pending edits and update status
    photography.pendingEdits = undefined;
    photography.pendingEditSubmittedAt = undefined;
    photography.status = ApprovalStatus.APPROVED;
    photography.updatedAt = new Date();
    
    await photography.save();

    res.json({
      message: 'Photography service edits approved successfully',
      data: photography
    });
  } catch (error) {
    console.error('Error approving photography service edits:', error);
    res.status(500).json({ error: 'Failed to approve photography service edits' });
  }
});

// POST /api/photography/:id/reject-edit - Reject photography service edit (Staff only)
router.post('/:id/reject-edit', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid photography service ID' });
    }

    const photography = await Photography.findById(id);
    if (!photography) {
      return res.status(404).json({ error: 'Photography service not found' });
    }

    if (photography.status !== ApprovalStatus.PENDING_EDIT) {
      return res.status(400).json({ error: 'Only photography services with pending edits can be rejected' });
    }

    // Clear pending edits and update status
    photography.pendingEdits = undefined;
    photography.pendingEditSubmittedAt = undefined;
    photography.status = ApprovalStatus.APPROVED; // Revert to approved status
    photography.updatedAt = new Date();
    
    // Store rejection reason
    console.log(`Photography service ${id} edits rejected. Reason: ${reason}`);
    
    await photography.save();

    res.json({
      message: 'Photography service edits rejected successfully',
      data: photography
    });
  } catch (error) {
    console.error('Error rejecting photography service edits:', error);
    res.status(500).json({ error: 'Failed to reject photography service edits' });
  }
});

export default router;