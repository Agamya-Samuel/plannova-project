import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import Catering, { ApprovalStatus } from '../models/Catering.js';
import { authenticateToken, requireStaffOrAdmin, AuthRequest } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import User from '../models/User.js';

const router = Router();

interface ICateringFilter {
  isActive: boolean;
  status?: string | {[key: string]: unknown};
  $or?: Array<{[key: string]: unknown}>;
  _id?: {[key: string]: unknown};
  provider?: {[key: string]: unknown};
}

// Validation middleware for creating catering services
const createCateringValidation = [
  body('name').trim().isLength({ min: 1 }).withMessage('Service name is required'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('serviceLocation.address').trim().isLength({ min: 1 }).withMessage('Address is required'),
  body('serviceLocation.city').trim().isLength({ min: 1 }).withMessage('City is required'),
  body('serviceLocation.state').trim().isLength({ min: 1 }).withMessage('State is required'),
  body('serviceLocation.pincode').trim().isLength({ min: 1 }).withMessage('Pincode is required'),
  body('contact.phone').trim().isLength({ min: 1 }).withMessage('Phone number is required'),
  body('contact.email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('cuisineTypes').isArray({ min: 1 }).withMessage('At least one cuisine type is required'),
  body('serviceTypes').isArray({ min: 1 }).withMessage('At least one service type is required'),
];

// GET /api/catering - Get all approved catering services (for customers)
router.get('/', async (req: Request, res: Response) => {
  try {
    const caterings = await Catering.find({ 
      status: { $in: [ApprovalStatus.APPROVED, ApprovalStatus.PENDING_EDIT] },
      isActive: true 
    })
    .populate('provider', 'firstName lastName email phone')
    .sort({ createdAt: -1 });

    res.json({
      message: 'Catering services retrieved successfully',
      data: caterings
    });
  } catch (error) {
    console.error('Error fetching catering services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/catering/my-services - Get all catering services for the authenticated provider
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
    if (!fullUser || !fullUser.serviceCategories || !fullUser.serviceCategories.includes('catering')) {
      return res.status(403).json({ error: 'User is not registered as a catering provider' });
    }

    const caterings = await Catering.find({ provider: req.user.id, isActive: true })
      .sort({ createdAt: -1 });

    res.json({
      message: 'Your catering services retrieved successfully',
      data: caterings
    });
  } catch (error) {
    console.error('Error fetching provider catering services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/catering - Create a new catering service
router.post('/', authenticateToken, createCateringValidation, async (req: AuthRequest, res: Response) => {
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
      return res.status(403).json({ error: 'Only providers can create catering services' });
    }

    // Fetch the full user object to check service categories
    const fullUser = await User.findById(req.user.id);
    if (!fullUser || !fullUser.serviceCategories || !fullUser.serviceCategories.includes('catering')) {
      return res.status(403).json({ error: 'User is not registered as a catering provider' });
    }

    const {
      name,
      description,
      serviceLocation,
      contact,
      images,
      cuisineTypes,
      serviceTypes,
      dietaryOptions,
      addons,
      basePrice,
      minGuests,
      cancellationPolicy,
      paymentTerms
    } = req.body;

    const catering = await Catering.create({
      name,
      description,
      provider: req.user.id,
      serviceLocation,
      contact,
      images: images || [],
      cuisineTypes,
      serviceTypes,
      dietaryOptions: dietaryOptions || [],
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
      message: 'Catering service created successfully',
      data: catering
    });
  } catch (error) {
    console.error('Error creating catering service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/catering/:id/submit-for-approval - Submit catering service for approval
router.patch('/:id/submit-for-approval', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is a provider
    if (req.user.role !== UserRole.PROVIDER) {
      return res.status(403).json({ error: 'Only providers can submit services for approval' });
    }

    const catering = await Catering.findOne({
      _id: req.params.id,
      provider: req.user.id
    });

    if (!catering) {
      return res.status(404).json({ error: 'Catering service not found or unauthorized' });
    }

    if (catering.status !== ApprovalStatus.DRAFT) {
      return res.status(400).json({ 
        error: 'Only draft services can be submitted for approval',
        currentStatus: catering.status
      });
    }

    // Update status to pending
    catering.status = ApprovalStatus.PENDING;
    await catering.save();

    res.json({
      message: 'Catering service submitted for approval successfully',
      service: {
        _id: catering._id,
        name: catering.name,
        status: catering.status
      }
    });
  } catch (error) {
    console.error('Error submitting catering service for approval:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/catering/:id - Get a specific catering service
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid catering service ID' });
    }

    const catering = await Catering.findById(id)
      .populate('provider', 'firstName lastName email phone');

    if (!catering) {
      return res.status(404).json({ error: 'Catering service not found' });
    }

    // Allow viewing of approved and pending edit services
    if (catering.status !== ApprovalStatus.APPROVED && catering.status !== ApprovalStatus.PENDING_EDIT) {
      // In a real implementation, we would check if the user is the provider or staff
      // For now, we'll return it but in a real app you'd add authentication checks
    }

    res.json({
      message: 'Catering service retrieved successfully',
      data: catering
    });
  } catch (error) {
    console.error('Error fetching catering service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/catering/:id - Update a catering service
router.put('/:id', authenticateToken, createCateringValidation, async (req: AuthRequest, res: Response) => {
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
      return res.status(400).json({ error: 'Invalid catering service ID' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is a provider
    if (req.user.role !== UserRole.PROVIDER) {
      return res.status(403).json({ error: 'Only providers can update catering services' });
    }

    const catering = await Catering.findById(id);

    if (!catering) {
      return res.status(404).json({ error: 'Catering service not found' });
    }

    // Check if user is the owner of this service
    if (catering.provider.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own services' });
    }

    // Only allow updates if service is pending or approved
    if (catering.status === ApprovalStatus.REJECTED) {
      return res.status(400).json({ error: 'Cannot update rejected services. Please contact support.' });
    }

    const {
      name,
      description,
      serviceLocation,
      contact,
      images,
      cuisineTypes,
      serviceTypes,
      dietaryOptions,
      addons,
      basePrice,
      minGuests,
      cancellationPolicy,
      paymentTerms
    } = req.body;

    // For approved services, store edits in pendingEdits instead of directly updating
    if (catering.status === ApprovalStatus.APPROVED) {
      // Store the edits in pendingEdits field
      catering.pendingEdits = {
        name,
        description,
        serviceLocation,
        contact,
        images: images || [],
        cuisineTypes,
        serviceTypes,
        dietaryOptions: dietaryOptions || [],
        addons: addons || [],
        basePrice,
        minGuests,
        cancellationPolicy,
        paymentTerms,
        updatedAt: new Date()
      };
      catering.pendingEditSubmittedAt = new Date();
      catering.status = ApprovalStatus.PENDING_EDIT;
    } else {
      // Update the service directly for non-approved services (PENDING or PENDING_EDIT)
      catering.name = name;
      catering.description = description;
      catering.serviceLocation = serviceLocation;
      catering.contact = contact;
      catering.images = images || [];
      catering.cuisineTypes = cuisineTypes;
      catering.serviceTypes = serviceTypes;
      catering.dietaryOptions = dietaryOptions || [];
      catering.addons = addons || [];
      catering.basePrice = basePrice;
      catering.minGuests = minGuests;
      catering.cancellationPolicy = cancellationPolicy;
      catering.paymentTerms = paymentTerms;

      // If service was pending and now has edits, keep it as pending
      // If it was already in PENDING_EDIT status, keep it that way
    }

    await catering.save();

    res.json({
      message: 'Catering service updated successfully',
      data: catering
    });
  } catch (error) {
    console.error('Error updating catering service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/catering/:id - Delete a catering service
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid catering service ID' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is a provider
    if (req.user.role !== UserRole.PROVIDER) {
      return res.status(403).json({ error: 'Only providers can delete catering services' });
    }

    const catering = await Catering.findById(id);

    if (!catering) {
      return res.status(404).json({ error: 'Catering service not found' });
    }

    // Check if user is the owner of this service
    if (catering.provider.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own services' });
    }

    // Delete associated images from S3
    if (catering.images && catering.images.length > 0) {
      try {
        // Import the S3 delete function and URL extraction utility
        const { deleteFromS3 } = await import('../services/uploadService.js');
        const { extractS3Key } = await import('../utils/s3.js');
        
        // Delete each image from S3
        for (const image of catering.images) {
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
    await Catering.findByIdAndDelete(id);

    res.json({
      message: 'Catering service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting catering service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/catering/staff/pending - Get catering services for staff approval
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

    const filter: ICateringFilter = {
      isActive: true,
      _id: { $ne: null }
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

    // Add filter to exclude services with invalid providers
    filter.provider = { $ne: null, $exists: true };

    const caterings = await Catering.find(filter)
      .populate('provider', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    const total = await Catering.countDocuments(filter);

    res.json({
      caterings,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('Error fetching pending catering services:', error);
    res.status(500).json({ error: 'Failed to fetch catering services' });
  }
});

// DELETE /api/catering/staff/:id - Delete catering service (Staff only)
router.delete('/staff/:id', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid catering service ID' });
    }

    const catering = await Catering.findById(id);

    if (!catering) {
      return res.status(404).json({ error: 'Catering service not found' });
    }

    // Delete associated images from S3
    if (catering.images && catering.images.length > 0) {
      try {
        // Import the S3 delete function and URL extraction utility
        const { deleteFromS3 } = await import('../services/uploadService.js');
        const { extractS3Key } = await import('../utils/s3.js');
        
        // Delete each image from S3
        for (const image of catering.images) {
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
    await Catering.findByIdAndDelete(id);

    res.json({
      message: 'Catering service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting catering service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/catering/staff/stats - Get stats for staff dashboard
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
    const pendingCount = await Catering.countDocuments({ 
      status: ApprovalStatus.PENDING,
      isActive: true 
    });
    
    const approvedCount = await Catering.countDocuments({ 
      status: ApprovalStatus.APPROVED,
      isActive: true 
    });
    
    const rejectedCount = await Catering.countDocuments({ 
      status: ApprovalStatus.REJECTED,
      isActive: true 
    });

    // Get count of services with pending edits
    const pendingEditCount = await Catering.countDocuments({ 
      status: ApprovalStatus.PENDING_EDIT,
      isActive: true 
    });

    res.json({
      message: 'Catering stats retrieved successfully',
      data: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        pendingEdit: pendingEditCount
      }
    });
  } catch (error) {
    console.error('Error fetching catering stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Staff routes for approval
// PUT /api/catering/:id/approve - Approve a catering service (staff only)
router.put('/:id/approve', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid catering service ID' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is staff or admin
    if (req.user.role !== UserRole.STAFF && req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Only staff and admin can approve services' });
    }

    const catering = await Catering.findById(id);

    if (!catering) {
      return res.status(404).json({ error: 'Catering service not found' });
    }

    catering.status = ApprovalStatus.APPROVED;
    await catering.save();

    res.json({
      message: 'Catering service approved successfully',
      data: catering
    });
  } catch (error) {
    console.error('Error approving catering service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/catering/:id/reject - Reject a catering service (staff only)
router.put('/:id/reject', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; // Optional rejection reason

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid catering service ID' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is staff or admin
    if (req.user.role !== UserRole.STAFF && req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Only staff and admin can reject services' });
    }

    const catering = await Catering.findById(id);

    if (!catering) {
      return res.status(404).json({ error: 'Catering service not found' });
    }

    catering.status = ApprovalStatus.REJECTED;
    // Optionally store rejection reason
    if (reason) {
      // In a real implementation, you might want to store this in a separate field or collection
      console.log(`Catering service ${id} rejected. Reason: ${reason}`);
    }
    
    await catering.save();

    res.json({
      message: 'Catering service rejected successfully',
      data: catering
    });
  } catch (error) {
    console.error('Error rejecting catering service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/catering/:id/approve-edit - Approve catering service edit (Staff only)
router.post('/:id/approve-edit', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid catering service ID' });
    }

    const catering = await Catering.findById(id);
    if (!catering) {
      return res.status(404).json({ error: 'Catering service not found' });
    }

    if (catering.status !== ApprovalStatus.PENDING_EDIT) {
      return res.status(400).json({ error: 'Only catering services with pending edits can be approved' });
    }

    // Apply the pending edits to the service
    if (catering.pendingEdits) {
      // Merge pending edits with the current service data
      Object.assign(catering, catering.pendingEdits);
    }

    // Clear pending edits and update status
    catering.pendingEdits = undefined;
    catering.pendingEditSubmittedAt = undefined;
    catering.status = ApprovalStatus.APPROVED;
    catering.updatedAt = new Date();
    
    await catering.save();

    res.json({
      message: 'Catering service edits approved successfully',
      data: catering
    });
  } catch (error) {
    console.error('Error approving catering service edits:', error);
    res.status(500).json({ error: 'Failed to approve catering service edits' });
  }
});

// POST /api/catering/:id/reject-edit - Reject catering service edit (Staff only)
router.post('/:id/reject-edit', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid catering service ID' });
    }

    const catering = await Catering.findById(id);
    if (!catering) {
      return res.status(404).json({ error: 'Catering service not found' });
    }

    if (catering.status !== ApprovalStatus.PENDING_EDIT) {
      return res.status(400).json({ error: 'Only catering services with pending edits can be rejected' });
    }

    // Clear pending edits and update status
    catering.pendingEdits = undefined;
    catering.pendingEditSubmittedAt = undefined;
    catering.status = ApprovalStatus.APPROVED; // Revert to approved status
    catering.updatedAt = new Date();
    
    // Store rejection reason
    console.log(`Catering service ${id} edits rejected. Reason: ${reason}`);
    
    await catering.save();

    res.json({
      message: 'Catering service edits rejected successfully',
      data: catering
    });
  } catch (error) {
    console.error('Error rejecting catering service edits:', error);
    res.status(500).json({ error: 'Failed to reject catering service edits' });
  }
});

export default router;