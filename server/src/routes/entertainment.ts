import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import Entertainment, { IEntertainment } from '../models/Entertainment.js';
import { ApprovalStatus } from '../models/Photography.js';
import { authenticateToken, requireStaffOrAdmin, AuthRequest } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import User from '../models/User.js';
import { transformImageUrls } from '../utils/s3.js';

const router = Router();

interface IEntertainmentFilter {
  isActive: boolean;
  isDeleted?: { [key: string]: unknown };
  status?: string | { [key: string]: unknown };
  $or?: Array<{ [key: string]: unknown }>;
}

const createEntertainmentValidation = [
  body('name').trim().isLength({ min: 1 }).withMessage('Service name is required'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('serviceLocation.address').trim().isLength({ min: 1 }).withMessage('Address is required'),
  body('serviceLocation.city').trim().isLength({ min: 1 }).withMessage('City is required'),
  body('serviceLocation.state').trim().isLength({ min: 1 }).withMessage('State is required'),
  body('serviceLocation.pincode').trim().isLength({ min: 1 }).withMessage('Pincode is required'),
  body('contact.phone').trim().isLength({ min: 1 }).withMessage('Phone number is required'),
  body('contact.email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('entertainmentTypes').isArray({ min: 1 }).withMessage('At least one entertainment type is required'),
  body('packages').isArray({ min: 1 }).withMessage('At least one package is required'),
];

// Public list of approved services
// Supports filtering by state and city from query parameters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { state, city } = req.query;

    // Build filter object - matches provider's serviceLocation data
    const filter: Record<string, unknown> = {
      status: { $in: [ApprovalStatus.APPROVED, ApprovalStatus.PENDING_EDIT] },
      isActive: true,
      isDeleted: { $ne: true }  // Exclude soft deleted services
    };

    // Filter by city if provided - matches provider's serviceLocation.city
    if (city) {
      filter['serviceLocation.city'] = new RegExp(city as string, 'i');
    }

    // Filter by state if provided - matches provider's serviceLocation.state
    // State can be state code (e.g., "MH") or state name (e.g., "Maharashtra")
    if (state) {
      filter['serviceLocation.state'] = new RegExp(state as string, 'i');
    }

    const services = await Entertainment.find(filter)
      .select('+images')
      .populate('provider', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    // Transform image URLs from S3 keys to full URLs before sending to client
    const transformedServices = services.map(service => ({
      ...service.toObject(),
      images: transformImageUrls(service.images || [])
    }));

    res.json({ message: 'Entertainment services retrieved successfully', data: transformedServices });
  } catch (error) {
    console.error('Error fetching entertainment services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Provider: list own services
router.get('/my-services', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'User not authenticated' });
    if (req.user.role !== UserRole.PROVIDER) {
      return res.status(403).json({ error: 'Only providers can access their services' });
    }
    const fullUser = await User.findById(req.user.id);
    if (!fullUser || !fullUser.serviceCategories || !fullUser.serviceCategories.includes('music')) {
      return res.status(403).json({ error: 'User is not registered as an entertainment provider' });
    }

    const services = await Entertainment.find({ 
      provider: req.user.id, 
      isActive: true,
      isDeleted: { $ne: true }  // Exclude soft deleted services
    })
      .select('+images')
      .sort({ createdAt: -1 });

    // Transform image URLs from S3 keys to full URLs before sending to client
    const transformedServices = services.map(service => ({
      ...service.toObject(),
      images: transformImageUrls(service.images || [])
    }));

    res.json({ message: 'Your entertainment services retrieved successfully', data: transformedServices });
  } catch (error) {
    console.error('Error fetching provider entertainment services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create
router.post('/', authenticateToken, createEntertainmentValidation, async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
    }
    if (!req.user) return res.status(401).json({ error: 'User not authenticated' });
    if (req.user.role !== UserRole.PROVIDER) {
      return res.status(403).json({ error: 'Only providers can create entertainment services' });
    }
    const fullUser = await User.findById(req.user.id);
    if (!fullUser || !fullUser.serviceCategories || !fullUser.serviceCategories.includes('music')) {
      return res.status(403).json({ error: 'User is not registered as an entertainment provider' });
    }

    const {
      name,
      description,
      serviceLocation,
      contact,
      images,
      entertainmentTypes,
      packages,
      addons,
      basePrice,
      minGuests,
      cancellationPolicy,
      paymentTerms
    } = req.body as Partial<IEntertainment> & { [key: string]: unknown };

    const service = await Entertainment.create({
      name,
      description,
      provider: req.user.id,
      serviceLocation,
      contact,
      images: images || [],
      entertainmentTypes,
      packages,
      addons: addons || [],
      basePrice,
      minGuests,
      cancellationPolicy,
      paymentTerms,
      rating: 0,
      reviewCount: 0,
      status: req.body.status || ApprovalStatus.PENDING,
      isActive: true
    });

    // Transform image URLs from S3 keys to full URLs before sending to client
    const transformedService = {
      ...service.toObject(),
      images: transformImageUrls(service.images || [])
    };

    res.status(201).json({ message: 'Entertainment service created successfully', data: transformedService });
  } catch (error) {
    console.error('Error creating entertainment service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit for approval (same flow as photography)
router.patch('/:id/submit-for-approval', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'User not authenticated' });
    if (req.user.role !== UserRole.PROVIDER) {
      return res.status(403).json({ error: 'Only providers can submit services for approval' });
    }
    const service = await Entertainment.findOne({ _id: req.params.id, provider: req.user.id });
    if (!service) return res.status(404).json({ error: 'Entertainment service not found or unauthorized' });
    if (service.status !== ApprovalStatus.DRAFT) {
      return res.status(400).json({ error: 'Only draft services can be submitted for approval', currentStatus: service.status });
    }
    service.status = ApprovalStatus.PENDING;
    await service.save();
    res.json({ message: 'Entertainment service submitted for approval successfully', service: { _id: service._id, name: service.name, status: service.status } });
  } catch (error) {
    console.error('Error submitting entertainment service for approval:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get by id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id as string)) return res.status(400).json({ error: 'Invalid entertainment service ID' });
    const service = await Entertainment.findById(id)
      .select('+images')
      .populate('provider', 'firstName lastName email phone');
    if (!service) return res.status(404).json({ error: 'Entertainment service not found' });
    
    // Transform image URLs from S3 keys to full URLs before sending to client
    const transformedService = {
      ...service.toObject(),
      images: transformImageUrls(service.images || []),
      // Also transform pending edits images if they exist
      pendingEdits: service.pendingEdits ? {
        ...service.pendingEdits,
        images: service.pendingEdits.images ? transformImageUrls(service.pendingEdits.images) : undefined
      } : undefined
    };
    
    res.json({ message: 'Entertainment service retrieved successfully', data: transformedService });
  } catch (error) {
    console.error('Error fetching entertainment service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update
router.put('/:id', authenticateToken, createEntertainmentValidation, async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    if (!Types.ObjectId.isValid(id as string)) return res.status(400).json({ error: 'Invalid entertainment service ID' });
    if (!req.user) return res.status(401).json({ error: 'User not authenticated' });
    if (req.user.role !== UserRole.PROVIDER) {
      return res.status(403).json({ error: 'Only providers can update entertainment services' });
    }

    const service = await Entertainment.findById(id);
    if (!service) return res.status(404).json({ error: 'Entertainment service not found' });
    if (service.provider.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own services' });
    }

    const {
      name, description, serviceLocation, contact, images, entertainmentTypes,
      packages, addons, basePrice, minGuests, cancellationPolicy, paymentTerms
    } = req.body as Partial<IEntertainment> & { [key: string]: unknown };

    if (service.status === ApprovalStatus.APPROVED) {
      service.pendingEdits = {
        name, description, serviceLocation, contact,
        images: images || [],
        entertainmentTypes, packages, addons: addons || [],
        basePrice, minGuests, cancellationPolicy, paymentTerms,
        updatedAt: new Date()
      } as Partial<IEntertainment>;
      service.pendingEditSubmittedAt = new Date();
      service.status = ApprovalStatus.PENDING_EDIT;
    } else {
      service.name = name!;
      service.description = description!;
      service.serviceLocation = serviceLocation!;
      service.contact = contact!;
      service.images = (images as IEntertainment['images']) || [];
      service.entertainmentTypes = entertainmentTypes!;
      service.packages = packages!;
      service.addons = (addons as IEntertainment['addons']) || [];
      service.basePrice = basePrice!;
      service.minGuests = minGuests;
      service.cancellationPolicy = cancellationPolicy;
      service.paymentTerms = paymentTerms;
    }

    await service.save();
    
    // Transform image URLs from S3 keys to full URLs before sending to client
    const transformedService = {
      ...service.toObject(),
      images: transformImageUrls(service.images || []),
      // Also transform pending edits images if they exist
      pendingEdits: service.pendingEdits ? {
        ...service.pendingEdits,
        images: service.pendingEdits.images ? transformImageUrls(service.pendingEdits.images) : undefined
      } : undefined
    };
    
    res.json({ message: 'Entertainment service updated successfully', data: transformedService });
  } catch (error) {
    console.error('Error updating entertainment service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/entertainment/:id - Delete an entertainment service
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ error: 'Invalid entertainment service ID' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is a provider, staff, or admin
    if (![UserRole.PROVIDER, UserRole.STAFF, UserRole.ADMIN].includes(req.user.role!)) {
      return res.status(403).json({ error: 'Only providers, staff, or admins can delete entertainment services' });
    }

    const entertainment = await Entertainment.findById(id);

    if (!entertainment) {
      return res.status(404).json({ error: 'Entertainment service not found' });
    }

    // Check permissions
    if (req.user.role === UserRole.PROVIDER) {
      // Providers can only delete their own services
      if (entertainment.provider.toString() !== req.user.id) {
        return res.status(403).json({ error: 'You can only delete your own services' });
      }
    }
    // Staff and Admin can delete any service

    // Soft delete the service instead of hard deleting
    entertainment.isDeleted = true;
    entertainment.deletedAt = new Date();
    await entertainment.save();

    res.json({
      message: 'Entertainment service moved to trash successfully',
      data: entertainment
    });
  } catch (error) {
    console.error('Error deleting entertainment service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Staff: list pending/approved/rejected and approve/reject (reuse common pattern)
// GET /api/entertainment/staff/stats - Get stats for staff dashboard
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
    const pendingCount = await Entertainment.countDocuments({ 
      status: ApprovalStatus.PENDING,
      isActive: true,
      isDeleted: { $ne: true }
    });
    
    const approvedCount = await Entertainment.countDocuments({ 
      status: ApprovalStatus.APPROVED,
      isActive: true,
      isDeleted: { $ne: true }
    });
    
    const rejectedCount = await Entertainment.countDocuments({ 
      status: ApprovalStatus.REJECTED,
      isActive: true,
      isDeleted: { $ne: true }
    });

    res.json({
      message: 'Entertainment service stats retrieved successfully',
      data: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount
      }
    });
  } catch (error) {
    console.error('Error fetching entertainment service stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/staff/pending', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'User not authenticated' });
    if (req.user.role !== UserRole.STAFF && req.user.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Only staff and admin can access pending services' });
    }

    const { status, page = 1, limit = 10, search } = req.query;
    const filter: IEntertainmentFilter = { isActive: true, isDeleted: { $ne: true } };
    if (status && status !== 'ALL') filter.status = status as string;
    else filter.status = { $in: ['PENDING', 'APPROVED', 'REJECTED', 'PENDING_EDIT'] };

    if (search && search.toString().trim()) {
      const term = search.toString().trim();
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { 'serviceLocation.city': { $regex: term, $options: 'i' } },
        { 'serviceLocation.address': { $regex: term, $options: 'i' } }
      ];
    }

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    const services = await Entertainment.find(filter)
      .select('+images')
      .populate('provider', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);
    const total = await Entertainment.countDocuments(filter);
    
    // Transform image URLs from S3 keys to full URLs before sending to client
    const transformedServices = services.map(service => ({
      ...service.toObject(),
      images: transformImageUrls(service.images || []),
      // Also transform pending edits images if they exist
      pendingEdits: service.pendingEdits ? {
        ...service.pendingEdits,
        images: service.pendingEdits.images ? transformImageUrls(service.pendingEdits.images) : undefined
      } : undefined
    }));
    
    res.json({
      message: 'Pending entertainment services retrieved successfully',
      data: transformedServices,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        totalItems: total,
        itemsPerPage: limitNumber
      }
    });
  } catch (error) {
    console.error('Error fetching pending entertainment services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/staff/:id/approve', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id as string)) return res.status(400).json({ error: 'Invalid entertainment service ID' });
    const service = await Entertainment.findById(id);
    if (!service) return res.status(404).json({ error: 'Entertainment service not found' });
    service.pendingEdits = undefined;
    service.pendingEditSubmittedAt = undefined;
    service.status = ApprovalStatus.APPROVED;
    await service.save();
    
    // Transform image URLs from S3 keys to full URLs before sending to client
    const transformedService = {
      ...service.toObject(),
      images: transformImageUrls(service.images || [])
    };
    
    res.json({ message: 'Entertainment service approved successfully', data: transformedService });
  } catch (error) {
    console.error('Error approving entertainment service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/staff/:id/reject', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body as { rejectionReason?: string };
    if (!Types.ObjectId.isValid(id as string)) return res.status(400).json({ error: 'Invalid entertainment service ID' });
    const service = await Entertainment.findById(id);
    if (!service) return res.status(404).json({ error: 'Entertainment service not found' });
    service.pendingEdits = undefined;
    service.pendingEditSubmittedAt = undefined;
    service.status = ApprovalStatus.REJECTED;
    if (rejectionReason) {
      console.log(`Entertainment service ${id} rejected with reason: ${rejectionReason}`);
    }
    await service.save();
    
    // Transform image URLs from S3 keys to full URLs before sending to client
    const transformedService = {
      ...service.toObject(),
      images: transformImageUrls(service.images || [])
    };
    
    res.json({ message: 'Entertainment service rejected successfully', data: transformedService });
  } catch (error) {
    console.error('Error rejecting entertainment service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/entertainment/:id/approve-edit - Approve entertainment service edit (Staff only)
router.post('/:id/approve-edit', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ error: 'Invalid entertainment service ID' });
    }

    const service = await Entertainment.findById(id);
    if (!service) {
      return res.status(404).json({ error: 'Entertainment service not found' });
    }

    if (service.status !== ApprovalStatus.PENDING_EDIT) {
      return res.status(400).json({ error: 'Only entertainment services with pending edits can be approved' });
    }

    // Apply the pending edits to the service
    if (service.pendingEdits) {
      // Merge pending edits with the current service data
      Object.assign(service, service.pendingEdits);
    }

    // Clear pending edits and update status
    service.pendingEdits = undefined;
    service.pendingEditSubmittedAt = undefined;
    service.status = ApprovalStatus.APPROVED;
    service.updatedAt = new Date();
    
    await service.save();

    // Transform image URLs from S3 keys to full URLs before sending to client
    const transformedService = {
      ...service.toObject(),
      images: transformImageUrls(service.images || [])
    };

    res.json({
      message: 'Entertainment service edits approved successfully',
      data: transformedService
    });
  } catch (error) {
    console.error('Error approving entertainment service edits:', error);
    res.status(500).json({ error: 'Failed to approve entertainment service edits' });
  }
});

// POST /api/entertainment/:id/reject-edit - Reject entertainment service edit (Staff only)
router.post('/:id/reject-edit', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    if (!Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ error: 'Invalid entertainment service ID' });
    }

    const service = await Entertainment.findById(id);
    if (!service) {
      return res.status(404).json({ error: 'Entertainment service not found' });
    }

    if (service.status !== ApprovalStatus.PENDING_EDIT) {
      return res.status(400).json({ error: 'Only entertainment services with pending edits can be rejected' });
    }

    // Clear pending edits and revert to approved status
    service.pendingEdits = undefined;
    service.pendingEditSubmittedAt = undefined;
    service.status = ApprovalStatus.APPROVED;
    service.updatedAt = new Date();
    
    await service.save();

    // Transform image URLs from S3 keys to full URLs before sending to client
    const transformedService = {
      ...service.toObject(),
      images: transformImageUrls(service.images || [])
    };

    res.json({
      message: 'Entertainment service edits rejected successfully',
      data: transformedService
    });
  } catch (error) {
    console.error('Error rejecting entertainment service edits:', error);
    res.status(500).json({ error: 'Failed to reject entertainment service edits' });
  }
});

// DELETE /api/entertainment/staff/:id - Delete entertainment service (Staff/Admin only)
router.delete('/staff/:id', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({ error: 'Invalid entertainment service ID' });
    }

    const entertainment = await Entertainment.findById(id);

    if (!entertainment) {
      return res.status(404).json({ error: 'Entertainment service not found' });
    }

    // Soft delete the service instead of hard deleting
    entertainment.isDeleted = true;
    entertainment.deletedAt = new Date();
    await entertainment.save();

    res.json({
      message: 'Entertainment service moved to trash successfully',
      data: entertainment
    });
  } catch (error) {
    console.error('Error deleting entertainment service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Blocked dates endpoints
router.get('/:id/blocked-dates', async (req: Request, res: Response) => {
  try {
    const service = await Entertainment.findOne({
      _id: req.params.id,
      status: { $in: [ApprovalStatus.APPROVED, ApprovalStatus.PENDING_EDIT] },
      isActive: true
    });
    if (!service) return res.status(404).json({ error: 'Entertainment service not found' });
    res.json({ blockedDates: service.blockedDates || [] });
  } catch (error) {
    console.error('Error fetching blocked dates:', error);
    res.status(500).json({ error: 'Failed to fetch blocked dates' });
  }
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const requireEntertainmentProvider = async (req: AuthRequest, res: Response, next: Function) => {
  if (!req.user || req.user.role !== UserRole.PROVIDER) {
    return res.status(403).json({ error: 'Only providers can perform this action' });
  }
  next();
};

router.post('/:id/blocked-dates', authenticateToken, requireEntertainmentProvider, async (req: AuthRequest, res: Response) => {
  try {
    const { dates, reason } = req.body as { dates?: string[]; reason?: string };
    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: 'Dates array is required' });
    }
    const service = await Entertainment.findOne({ _id: req.params.id, provider: req.user!.id });
    if (!service) return res.status(404).json({ error: 'Entertainment service not found or unauthorized' });
    if (!service.blockedDates) { service.blockedDates = []; }
    const newBlockedDates = dates.map((d) => ({
      date: new Date(d),
      reason: reason || 'Offline booking',
      blockedAt: new Date()
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingKeys = service.blockedDates.map((bd: any) => bd.date.toISOString().split('T')[0]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unique = newBlockedDates.filter((bd: any) => !existingKeys.includes(bd.date.toISOString().split('T')[0]));
    service.blockedDates.push(...unique);
    await service.save();
    res.json({ message: `Successfully blocked ${unique.length} date(s)`, blockedDates: service.blockedDates });
  } catch (error) {
    console.error('Error adding blocked dates:', error);
    res.status(500).json({ error: 'Failed to add blocked dates' });
  }
});

router.delete('/:id/blocked-dates', authenticateToken, requireEntertainmentProvider, async (req: AuthRequest, res: Response) => {
  try {
    const { date, reason } = req.body as { date?: string; reason?: string };
    if (!date) return res.status(400).json({ error: 'Date is required' });
    if (!reason || reason.trim() === '') return res.status(400).json({ error: 'Unblocking reason is required' });
    const service = await Entertainment.findOne({ _id: req.params.id, provider: req.user!.id });
    if (!service) return res.status(404).json({ error: 'Entertainment service not found or unauthorized' });
    if (!service.blockedDates || service.blockedDates.length === 0) {
      return res.status(404).json({ error: 'No blocked dates found' });
    }
    const key = new Date(date).toISOString().split('T')[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    service.blockedDates = service.blockedDates.filter((bd: any) => bd.date.toISOString().split('T')[0] !== key);
    await service.save();
    res.json({ message: 'Blocked date removed successfully', blockedDates: service.blockedDates });
  } catch (error) {
    console.error('Error removing blocked date:', error);
    res.status(500).json({ error: 'Failed to remove blocked date' });
  }
});

export default router;






