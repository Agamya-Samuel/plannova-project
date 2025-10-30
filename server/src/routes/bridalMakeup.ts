import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import BridalMakeup, { ApprovalStatus } from '../models/BridalMakeup.js';
import { authenticateToken, requireStaffOrAdmin, AuthRequest } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';

const router = Router();

interface IBridalMakeupFilter {
  isActive: boolean;
  status?: string | {[key: string]: unknown};
  $or?: Array<{[key: string]: unknown}>;
}

// Validation middleware for creating bridal makeup services
const createBridalMakeupValidation = [
  body('name').trim().isLength({ min: 1 }).withMessage('Service name is required'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('serviceLocation.address').trim().isLength({ min: 1 }).withMessage('Address is required'),
  body('serviceLocation.city').trim().isLength({ min: 1 }).withMessage('City is required'),
  body('serviceLocation.state').trim().isLength({ min: 1 }).withMessage('State is required'),
  body('serviceLocation.pincode').trim().isLength({ min: 1 }).withMessage('Pincode is required'),
  body('contact.phone').trim().isLength({ min: 1 }).withMessage('Phone number is required'),
  body('contact.email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('makeupTypes').isArray({ min: 1 }).withMessage('At least one makeup type is required'),
  body('packages').isArray({ min: 1 }).withMessage('At least one package is required'),
  body('packages.*.name').trim().isLength({ min: 1 }).withMessage('Package name is required'),
  body('packages.*.price').isFloat({ min: 0 }).withMessage('Package price must be a positive number'),
];

// GET /api/bridal-makeup - Get all approved bridal makeup services (for customers)
router.get('/', async (req: Request, res: Response) => {
  try {
    const bridalMakeups = await BridalMakeup.find({ 
      status: { $in: [ApprovalStatus.APPROVED, ApprovalStatus.PENDING_EDIT] },
      isActive: true 
    })
    .select('+images') // Explicitly select images field
    .populate('provider', 'firstName lastName email phone')
    .sort({ createdAt: -1 });

    res.json({
      message: 'Bridal makeup services retrieved successfully',
      data: bridalMakeups
    });
  } catch (error) {
    console.error('Error fetching bridal makeup services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bridal-makeup/my-services - Get all bridal makeup services for the authenticated provider
router.get('/my-services', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is a provider
    if (req.user.role !== UserRole.PROVIDER) {
      return res.status(403).json({ error: 'Only providers can access their services' });
    }

    // Allow any provider to access bridal makeup services
    // Note: In a production app, you might want to check service categories
    // For now, we'll allow all providers to access bridal makeup services

    const bridalMakeups = await BridalMakeup.find({ provider: req.user.id, isActive: true })
      .select('+images') // Explicitly select images field
      .sort({ createdAt: -1 });

    res.json({
      message: 'Your bridal makeup services retrieved successfully',
      data: bridalMakeups
    });
  } catch (error) {
    console.error('Error fetching provider bridal makeup services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/bridal-makeup - Create a new bridal makeup service
router.post('/', authenticateToken, createBridalMakeupValidation, async (req: AuthRequest, res: Response) => {
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
      return res.status(403).json({ error: 'Only providers can create bridal makeup services' });
    }

    // Allow any provider to create bridal makeup services
    // Note: In a production app, you might want to check service categories
    // For now, we'll allow all providers to create bridal makeup services

    const {
      name,
      description,
      serviceLocation,
      contact,
      images,
      makeupTypes,
      packages,
      addons,
      basePrice,
      cancellationPolicy,
      paymentTerms
    } = req.body;

    // Filter out empty descriptions from packages to prevent validation errors
    const validPackages = packages.map((pkg: { name: string; description: string; includes: string[]; duration?: string; price: number; isPopular: boolean }) => ({
      ...pkg,
      description: pkg.description?.trim() || 'Package description' // Provide default if empty
    }));

    // Filter out empty descriptions from addons
    const validAddons = addons ? addons.map((addon: { name: string; description: string; price: number }) => ({
      ...addon,
      description: addon.description?.trim() || 'Add-on service' // Provide default if empty
    })) : [];

    const bridalMakeup = await BridalMakeup.create({
      name,
      description,
      provider: req.user.id,
      serviceLocation,
      contact,
      images: images || [],
      makeupTypes,
      packages: validPackages,
      addons: validAddons,
      basePrice,
      cancellationPolicy,
      paymentTerms,
      rating: 0,
      reviewCount: 0,
      status: req.body.status || ApprovalStatus.PENDING, // Use provided status or default to pending
      isActive: true
    });

    res.status(201).json({
      message: 'Bridal makeup service created successfully',
      data: bridalMakeup
    });
  } catch (error) {
    console.error('Error creating bridal makeup service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/bridal-makeup/:id/submit-for-approval - Submit bridal makeup service for approval
router.patch('/:id/submit-for-approval', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is a provider
    if (req.user.role !== UserRole.PROVIDER) {
      return res.status(403).json({ error: 'Only providers can submit services for approval' });
    }

    const bridalMakeup = await BridalMakeup.findOne({
      _id: req.params.id,
      provider: req.user.id
    });

    if (!bridalMakeup) {
      return res.status(404).json({ error: 'Bridal makeup service not found or unauthorized' });
    }

    if (bridalMakeup.status !== ApprovalStatus.DRAFT) {
      return res.status(400).json({ 
        error: 'Only draft services can be submitted for approval',
        currentStatus: bridalMakeup.status
      });
    }

    // Update status to pending
    bridalMakeup.status = ApprovalStatus.PENDING;
    await bridalMakeup.save();

    res.json({
      message: 'Bridal makeup service submitted for approval successfully',
      service: {
        _id: bridalMakeup._id,
        name: bridalMakeup.name,
        status: bridalMakeup.status
      }
    });
  } catch (error) {
    console.error('Error submitting bridal makeup service for approval:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bridal-makeup/:id - Get a specific bridal makeup service
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid bridal makeup service ID' });
    }

    const bridalMakeup = await BridalMakeup.findById(id)
      .select('+images') // Explicitly select images field
      .populate('provider', 'firstName lastName email phone');

    if (!bridalMakeup) {
      return res.status(404).json({ error: 'Bridal makeup service not found' });
    }

    // Allow viewing of approved and pending edit services
    if (bridalMakeup.status !== ApprovalStatus.APPROVED && bridalMakeup.status !== ApprovalStatus.PENDING_EDIT) {
      // In a real implementation, we would check if the user is the provider or staff
      // For now, we'll return it but in a real app you'd add authentication checks
    }

    res.json({
      message: 'Bridal makeup service retrieved successfully',
      data: bridalMakeup
    });
  } catch (error) {
    console.error('Error fetching bridal makeup service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/bridal-makeup/:id - Update a bridal makeup service
router.put('/:id', authenticateToken, createBridalMakeupValidation, async (req: AuthRequest, res: Response) => {
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
      return res.status(400).json({ error: 'Invalid bridal makeup service ID' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is a provider
    if (req.user.role !== UserRole.PROVIDER) {
      return res.status(403).json({ error: 'Only providers can update bridal makeup services' });
    }

    const bridalMakeup = await BridalMakeup.findById(id);

    if (!bridalMakeup) {
      return res.status(404).json({ error: 'Bridal makeup service not found' });
    }

    // Check if user is the owner of this service
    if (bridalMakeup.provider.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own services' });
    }

    // Only allow updates if service is pending or approved
    if (bridalMakeup.status === ApprovalStatus.REJECTED) {
      return res.status(400).json({ error: 'Cannot update rejected services. Please contact support.' });
    }

    const {
      name,
      description,
      serviceLocation,
      contact,
      images,
      makeupTypes,
      packages,
      addons,
      basePrice,
      cancellationPolicy,
      paymentTerms
    } = req.body;

    // Filter out empty descriptions from packages to prevent validation errors
    const validPackages = packages.map((pkg: { name: string; description: string; includes: string[]; duration?: string; price: number; isPopular: boolean }) => ({
      ...pkg,
      description: pkg.description?.trim() || 'Package description' // Provide default if empty
    }));

    // Filter out empty descriptions from addons
    const validAddons = addons ? addons.map((addon: { name: string; description: string; price: number }) => ({
      ...addon,
      description: addon.description?.trim() || 'Add-on service' // Provide default if empty
    })) : [];

    // For approved services, store edits in pendingEdits instead of directly updating
    if (bridalMakeup.status === ApprovalStatus.APPROVED) {
      // Store the edits in pendingEdits field
      bridalMakeup.pendingEdits = {
        name,
        description,
        serviceLocation,
        contact,
        images: images || [],
        makeupTypes,
        packages: validPackages,
        addons: validAddons,
        basePrice,
        cancellationPolicy,
        paymentTerms,
        updatedAt: new Date()
      };
      bridalMakeup.pendingEditSubmittedAt = new Date();
      bridalMakeup.status = ApprovalStatus.PENDING_EDIT;
    } else {
      // Update the service directly for non-approved services (PENDING or PENDING_EDIT)
      bridalMakeup.name = name;
      bridalMakeup.description = description;
      bridalMakeup.serviceLocation = serviceLocation;
      bridalMakeup.contact = contact;
      bridalMakeup.images = images || [];
      bridalMakeup.makeupTypes = makeupTypes;
      bridalMakeup.packages = validPackages;
      bridalMakeup.addons = validAddons;
      bridalMakeup.basePrice = basePrice;
      bridalMakeup.cancellationPolicy = cancellationPolicy;
      bridalMakeup.paymentTerms = paymentTerms;

      // If service was pending and now has edits, keep it as pending
      // If it was already in PENDING_EDIT status, keep it that way
    }

    await bridalMakeup.save();

    res.json({
      message: 'Bridal makeup service updated successfully',
      data: bridalMakeup
    });
  } catch (error) {
    console.error('Error updating bridal makeup service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/bridal-makeup/:id - Delete a bridal makeup service
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid bridal makeup service ID' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is a provider
    if (req.user.role !== UserRole.PROVIDER) {
      return res.status(403).json({ error: 'Only providers can delete bridal makeup services' });
    }

    const bridalMakeup = await BridalMakeup.findById(id);

    if (!bridalMakeup) {
      return res.status(404).json({ error: 'Bridal makeup service not found' });
    }

    // Check if user is the owner of this service
    if (bridalMakeup.provider.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own services' });
    }

    // Delete associated images from S3
    if (bridalMakeup.images && bridalMakeup.images.length > 0) {
      try {
        // Import the S3 delete function and URL extraction utility
        const { deleteFromS3 } = await import('../services/uploadService.js');
        const { extractS3Key } = await import('../utils/s3.js');
        
        // Delete each image from S3
        for (const image of bridalMakeup.images) {
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
    await BridalMakeup.findByIdAndDelete(id);

    res.json({
      message: 'Bridal makeup service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bridal makeup service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bridal-makeup/staff/pending - Get bridal makeup services for staff approval
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

    const filter: IBridalMakeupFilter = {
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

    const bridalMakeups = await BridalMakeup.find(filter)
      .select('+images') // Explicitly select images field
      .populate('provider', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    const total = await BridalMakeup.countDocuments(filter);

    res.json({
      message: 'Pending bridal makeup services retrieved successfully',
      data: bridalMakeups,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        totalItems: total,
        itemsPerPage: limitNumber
      }
    });
  } catch (error) {
    console.error('Error fetching pending bridal makeup services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/bridal-makeup/staff/:id/approve - Approve a bridal makeup service (staff only)
router.put('/staff/:id/approve', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid bridal makeup service ID' });
    }

    const bridalMakeup = await BridalMakeup.findById(id);

    if (!bridalMakeup) {
      return res.status(404).json({ error: 'Bridal makeup service not found' });
    }

    // Clear pending edits when approving
    bridalMakeup.pendingEdits = undefined;
    bridalMakeup.pendingEditSubmittedAt = undefined;
    bridalMakeup.status = ApprovalStatus.APPROVED;
    await bridalMakeup.save();

    res.json({
      message: 'Bridal makeup service approved successfully',
      data: bridalMakeup
    });
  } catch (error) {
    console.error('Error approving bridal makeup service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/bridal-makeup/staff/:id/reject - Reject a bridal makeup service (staff only)
router.put('/staff/:id/reject', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid bridal makeup service ID' });
    }

    const bridalMakeup = await BridalMakeup.findById(id);

    if (!bridalMakeup) {
      return res.status(404).json({ error: 'Bridal makeup service not found' });
    }

    // Clear pending edits when rejecting
    bridalMakeup.pendingEdits = undefined;
    bridalMakeup.pendingEditSubmittedAt = undefined;
    bridalMakeup.status = ApprovalStatus.REJECTED;
    
    // Store rejection reason if provided
    if (rejectionReason) {
      // In a real implementation, you might want to store this in a separate field
      console.log(`Bridal makeup service ${id} rejected with reason: ${rejectionReason}`);
    }
    
    await bridalMakeup.save();

    res.json({
      message: 'Bridal makeup service rejected successfully',
      data: bridalMakeup
    });
  } catch (error) {
    console.error('Error rejecting bridal makeup service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/bridal-makeup/staff/:id - Delete bridal makeup service (Staff only)
router.delete('/staff/:id', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid bridal makeup service ID' });
    }

    const bridalMakeup = await BridalMakeup.findById(id);

    if (!bridalMakeup) {
      return res.status(404).json({ error: 'Bridal makeup service not found' });
    }

    // Delete associated images from S3
    if (bridalMakeup.images && bridalMakeup.images.length > 0) {
      try {
        // Import the S3 delete function and URL extraction utility
        const { deleteFromS3 } = await import('../services/uploadService.js');
        const { extractS3Key } = await import('../utils/s3.js');
        
        // Delete each image from S3
        for (const image of bridalMakeup.images) {
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
    await BridalMakeup.findByIdAndDelete(id);

    res.json({
      message: 'Bridal makeup service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bridal makeup service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bridal-makeup/staff/stats - Get stats for staff dashboard
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
    const pendingCount = await BridalMakeup.countDocuments({ 
      status: ApprovalStatus.PENDING,
      isActive: true 
    });
    
    const approvedCount = await BridalMakeup.countDocuments({ 
      status: ApprovalStatus.APPROVED,
      isActive: true 
    });
    
    const rejectedCount = await BridalMakeup.countDocuments({ 
      status: ApprovalStatus.REJECTED,
      isActive: true 
    });

    // Get count of services with pending edits
    const pendingEditCount = await BridalMakeup.countDocuments({ 
      status: ApprovalStatus.PENDING_EDIT,
      isActive: true 
    });

    res.json({
      message: 'Bridal makeup stats retrieved successfully',
      data: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        pendingEdit: pendingEditCount
      }
    });
  } catch (error) {
    console.error('Error fetching bridal makeup stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/bridal-makeup/:id/approve-edit - Approve bridal makeup service edit (Staff only)
router.post('/:id/approve-edit', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid bridal makeup service ID' });
    }

    const bridalMakeup = await BridalMakeup.findById(id);
    if (!bridalMakeup) {
      return res.status(404).json({ error: 'Bridal makeup service not found' });
    }

    if (bridalMakeup.status !== ApprovalStatus.PENDING_EDIT) {
      return res.status(400).json({ error: 'Only bridal makeup services with pending edits can be approved' });
    }

    // Apply the pending edits to the service
    if (bridalMakeup.pendingEdits) {
      // Merge pending edits with the current service data
      Object.assign(bridalMakeup, bridalMakeup.pendingEdits);
    }

    // Clear pending edits and update status
    bridalMakeup.pendingEdits = undefined;
    bridalMakeup.pendingEditSubmittedAt = undefined;
    bridalMakeup.status = ApprovalStatus.APPROVED;
    bridalMakeup.updatedAt = new Date();
    
    await bridalMakeup.save();

    res.json({
      message: 'Bridal makeup service edits approved successfully',
      data: bridalMakeup
    });
  } catch (error) {
    console.error('Error approving bridal makeup service edits:', error);
    res.status(500).json({ error: 'Failed to approve bridal makeup service edits' });
  }
});

// POST /api/bridal-makeup/:id/reject-edit - Reject bridal makeup service edit (Staff only)
router.post('/:id/reject-edit', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid bridal makeup service ID' });
    }

    const bridalMakeup = await BridalMakeup.findById(id);
    if (!bridalMakeup) {
      return res.status(404).json({ error: 'Bridal makeup service not found' });
    }

    if (bridalMakeup.status !== ApprovalStatus.PENDING_EDIT) {
      return res.status(400).json({ error: 'Only bridal makeup services with pending edits can be rejected' });
    }

    // Clear pending edits and update status
    bridalMakeup.pendingEdits = undefined;
    bridalMakeup.pendingEditSubmittedAt = undefined;
    bridalMakeup.status = ApprovalStatus.APPROVED; // Revert to approved status
    bridalMakeup.updatedAt = new Date();
    
    // Store rejection reason
    console.log(`Bridal makeup service ${id} edits rejected. Reason: ${reason}`);
    
    await bridalMakeup.save();

    res.json({
      message: 'Bridal makeup service edits rejected successfully',
      data: bridalMakeup
    });
  } catch (error) {
    console.error('Error rejecting bridal makeup service edits:', error);
    res.status(500).json({ error: 'Failed to reject bridal makeup service edits' });
  }
});

// ============ BLOCKED DATES MANAGEMENT ROUTES ============

// GET /api/bridal-makeup/:id/blocked-dates - Get blocked dates for a bridal makeup service
router.get('/:id/blocked-dates', async (req: Request, res: Response) => {
  try {
    const bridalMakeup = await BridalMakeup.findOne({
      _id: req.params.id,
      status: { $in: [ApprovalStatus.APPROVED, ApprovalStatus.PENDING_EDIT] },
      isActive: true
    });

    if (!bridalMakeup) {
      return res.status(404).json({ error: 'Bridal makeup service not found' });
    }

    res.json({
      blockedDates: bridalMakeup.blockedDates || []
    });
  } catch (error) {
    console.error('Error fetching blocked dates:', error);
    res.status(500).json({ error: 'Failed to fetch blocked dates' });
  }
});

// Helper middleware to check if user is the provider of the bridal makeup service
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const requireBridalMakeupProvider = async (req: AuthRequest, res: Response, next: Function) => {
  if (!req.user || req.user.role !== UserRole.PROVIDER) {
    return res.status(403).json({ error: 'Only providers can perform this action' });
  }
  next();
};

// POST /api/bridal-makeup/:id/blocked-dates - Add blocked dates (Provider only)
router.post('/:id/blocked-dates', authenticateToken, requireBridalMakeupProvider, async (req: AuthRequest, res: Response) => {
  try {
    const { dates, reason } = req.body;

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: 'Dates array is required' });
    }

    const bridalMakeup = await BridalMakeup.findOne({
      _id: req.params.id,
      provider: req.user!.id
    });

    if (!bridalMakeup) {
      return res.status(404).json({ error: 'Bridal makeup service not found or unauthorized' });
    }

    // Initialize blockedDates if it doesn't exist
    if (!bridalMakeup.blockedDates) {
      bridalMakeup.blockedDates = [];
    }

    // Add new blocked dates
    const newBlockedDates = dates.map((dateStr: string) => ({
      date: new Date(dateStr),
      reason: reason || 'Offline booking',
      blockedAt: new Date()
    }));

    // Filter out dates that are already blocked
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingBlockedDates = bridalMakeup.blockedDates.map((bd: any) => 
      bd.date.toISOString().split('T')[0]
    );
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uniqueNewDates = newBlockedDates.filter((bd: any) => 
      !existingBlockedDates.includes(bd.date.toISOString().split('T')[0])
    );

    bridalMakeup.blockedDates.push(...uniqueNewDates);
    await bridalMakeup.save();

    res.json({
      message: `Successfully blocked ${uniqueNewDates.length} date(s)`,
      blockedDates: bridalMakeup.blockedDates
    });
  } catch (error) {
    console.error('Error adding blocked dates:', error);
    res.status(500).json({ error: 'Failed to add blocked dates' });
  }
});

// DELETE /api/bridal-makeup/:id/blocked-dates - Remove blocked date (Provider only)
router.delete('/:id/blocked-dates', authenticateToken, requireBridalMakeupProvider, async (req: AuthRequest, res: Response) => {
  try {
    const { date, reason } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Unblocking reason is required' });
    }

    const bridalMakeup = await BridalMakeup.findOne({
      _id: req.params.id,
      provider: req.user!.id
    });

    if (!bridalMakeup) {
      return res.status(404).json({ error: 'Bridal makeup service not found or unauthorized' });
    }

    if (!bridalMakeup.blockedDates || bridalMakeup.blockedDates.length === 0) {
      return res.status(404).json({ error: 'No blocked dates found' });
    }

    // Remove the blocked date
    const dateToRemove = new Date(date).toISOString().split('T')[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bridalMakeup.blockedDates = bridalMakeup.blockedDates.filter((bd: any) => 
      bd.date.toISOString().split('T')[0] !== dateToRemove
    );

    await bridalMakeup.save();

    res.json({
      message: 'Blocked date removed successfully',
      blockedDates: bridalMakeup.blockedDates
    });
  } catch (error) {
    console.error('Error removing blocked date:', error);
    res.status(500).json({ error: 'Failed to remove blocked date' });
  }
});

export default router;

