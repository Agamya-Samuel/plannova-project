import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import Decoration, { ApprovalStatus } from '../models/Decoration.js';
import { authenticateToken, requireStaffOrAdmin, AuthRequest } from '../middleware/auth.js';
import { UserRole } from '../models/User.js';
import { transformImageUrls } from '../utils/s3.js';

const router = Router();

interface IDecorationFilter {
  isActive: boolean;
  isDeleted?: {[key: string]: unknown};
  status?: string | {[key: string]: unknown};
  $or?: Array<{[key: string]: unknown}>;
}

// Validation middleware for creating decoration services
const createDecorationValidation = [
  body('name').trim().isLength({ min: 1 }).withMessage('Service name is required'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('serviceLocation.address').trim().isLength({ min: 1 }).withMessage('Address is required'),
  body('serviceLocation.city').trim().isLength({ min: 1 }).withMessage('City is required'),
  body('serviceLocation.state').trim().isLength({ min: 1 }).withMessage('State is required'),
  body('serviceLocation.pincode').trim().isLength({ min: 1 }).withMessage('Pincode is required'),
  body('contact.phone').trim().isLength({ min: 1 }).withMessage('Phone number is required'),
  body('contact.email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('decorationTypes').isArray({ min: 1 }).withMessage('At least one decoration type is required'),
  body('packages').isArray({ min: 1 }).withMessage('At least one package is required'),
];

// GET /api/decoration - Get all approved decoration services (for customers)
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

    const decorations = await Decoration.find(filter)
      .select('+images') // Explicitly select images field
      .populate('provider', 'firstName lastName email phone')
      .sort({ createdAt: -1 });

    // Transform image URLs from S3 keys to full URLs before sending to client
    const transformedDecorations = decorations.map(decoration => ({
      ...decoration.toObject(),
      images: transformImageUrls(decoration.images || [])
    }));

    res.json({
      message: 'Decoration services retrieved successfully',
      data: transformedDecorations
    });
  } catch (error) {
    console.error('Error fetching decoration services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/decoration/my-services - Get all decoration services for the authenticated provider
router.get('/my-services', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is a provider
    if (req.user.role !== UserRole.PROVIDER) {
      return res.status(403).json({ error: 'Only providers can access their services' });
    }

    // Allow any provider to access decoration services
    // Note: In a production app, you might want to check service categories
    // For now, we'll allow all providers to access decoration services

    const decorations = await Decoration.find({ 
      provider: req.user.id, 
      isActive: true,
      isDeleted: { $ne: true }  // Exclude soft deleted services
    })
      .select('+images') // Explicitly select images field
      .sort({ createdAt: -1 });

    // Transform image URLs from S3 keys to full URLs before sending to client
    const transformedDecorations = decorations.map(decoration => ({
      ...decoration.toObject(),
      images: transformImageUrls(decoration.images || [])
    }));

    res.json({
      message: 'Your decoration services retrieved successfully',
      data: transformedDecorations
    });
  } catch (error) {
    console.error('Error fetching provider decoration services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/decoration - Create a new decoration service
router.post('/', authenticateToken, createDecorationValidation, async (req: AuthRequest, res: Response) => {
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
      return res.status(403).json({ error: 'Only providers can create decoration services' });
    }

    // Allow any provider to create decoration services
    // Note: In a production app, you might want to check service categories
    // For now, we'll allow all providers to create decoration services

    const {
      name,
      description,
      serviceLocation,
      contact,
      images,
      decorationTypes,
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

    const decoration = await Decoration.create({
      name,
      description,
      provider: req.user.id,
      serviceLocation,
      contact,
      images: images || [],
      decorationTypes,
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

    // Transform image URLs from S3 keys to full URLs before sending to client
    const transformedDecoration = {
      ...decoration.toObject(),
      images: transformImageUrls(decoration.images || [])
    };

    res.status(201).json({
      message: 'Decoration service created successfully',
      data: transformedDecoration
    });
  } catch (error) {
    console.error('Error creating decoration service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/decoration/:id/submit-for-approval - Submit decoration service for approval
router.patch('/:id/submit-for-approval', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is a provider
    if (req.user.role !== UserRole.PROVIDER) {
      return res.status(403).json({ error: 'Only providers can submit services for approval' });
    }

    const decoration = await Decoration.findOne({
      _id: req.params.id,
      provider: req.user.id
    });

    if (!decoration) {
      return res.status(404).json({ error: 'Decoration service not found or unauthorized' });
    }

    if (decoration.status !== ApprovalStatus.DRAFT) {
      return res.status(400).json({ 
        error: 'Only draft services can be submitted for approval',
        currentStatus: decoration.status
      });
    }

    // Update status to pending
    decoration.status = ApprovalStatus.PENDING;
    await decoration.save();

    res.json({
      message: 'Decoration service submitted for approval successfully',
      service: {
        _id: decoration._id,
        name: decoration.name,
        status: decoration.status
      }
    });
  } catch (error) {
    console.error('Error submitting decoration service for approval:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/decoration/:id - Get a specific decoration service
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid decoration service ID' });
    }

    const decoration = await Decoration.findById(id)
      .select('+images') // Explicitly select images field
      .populate('provider', 'firstName lastName email phone');

    if (!decoration) {
      return res.status(404).json({ error: 'Decoration service not found' });
    }

    // Allow viewing of approved and pending edit services
    if (decoration.status !== ApprovalStatus.APPROVED && decoration.status !== ApprovalStatus.PENDING_EDIT) {
      // In a real implementation, we would check if the user is the provider or staff
      // For now, we'll return it but in a real app you'd add authentication checks
    }

    // Transform image URLs from S3 keys to full URLs before sending to client
    const transformedDecoration = {
      ...decoration.toObject(),
      images: transformImageUrls(decoration.images || []),
      // Also transform pending edits images if they exist
      pendingEdits: decoration.pendingEdits ? {
        ...decoration.pendingEdits,
        images: decoration.pendingEdits.images ? transformImageUrls(decoration.pendingEdits.images) : undefined
      } : undefined
    };

    res.json({
      message: 'Decoration service retrieved successfully',
      data: transformedDecoration
    });
  } catch (error) {
    console.error('Error fetching decoration service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/decoration/:id - Update a decoration service
router.put('/:id', authenticateToken, createDecorationValidation, async (req: AuthRequest, res: Response) => {
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
      return res.status(400).json({ error: 'Invalid decoration service ID' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is a provider
    if (req.user.role !== UserRole.PROVIDER) {
      return res.status(403).json({ error: 'Only providers can update decoration services' });
    }

    const decoration = await Decoration.findById(id);

    if (!decoration) {
      return res.status(404).json({ error: 'Decoration service not found' });
    }

    // Check if user is the owner of this service
    if (decoration.provider.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own services' });
    }

    // Only allow updates if service is pending or approved
    if (decoration.status === ApprovalStatus.REJECTED) {
      return res.status(400).json({ error: 'Cannot update rejected services. Please contact support.' });
    }

    const {
      name,
      description,
      serviceLocation,
      contact,
      images,
      decorationTypes,
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
    if (decoration.status === ApprovalStatus.APPROVED) {
      // Store the edits in pendingEdits field
      decoration.pendingEdits = {
        name,
        description,
        serviceLocation,
        contact,
        images: images || [],
        decorationTypes,
        packages: validPackages,
        addons: validAddons,
        basePrice,
        cancellationPolicy,
        paymentTerms,
        updatedAt: new Date()
      };
      decoration.pendingEditSubmittedAt = new Date();
      decoration.status = ApprovalStatus.PENDING_EDIT;
    } else {
      // Update the service directly for non-approved services (PENDING or PENDING_EDIT)
      decoration.name = name;
      decoration.description = description;
      decoration.serviceLocation = serviceLocation;
      decoration.contact = contact;
      decoration.images = images || [];
      decoration.decorationTypes = decorationTypes;
      decoration.packages = validPackages;
      decoration.addons = validAddons;
      decoration.basePrice = basePrice;
      decoration.cancellationPolicy = cancellationPolicy;
      decoration.paymentTerms = paymentTerms;

      // If service was pending and now has edits, keep it as pending
      // If it was already in PENDING_EDIT status, keep it that way
    }

    await decoration.save();

    // Transform image URLs from S3 keys to full URLs before sending to client
    const transformedDecoration = {
      ...decoration.toObject(),
      images: transformImageUrls(decoration.images || []),
      // Also transform pending edits images if they exist
      pendingEdits: decoration.pendingEdits ? {
        ...decoration.pendingEdits,
        images: decoration.pendingEdits.images ? transformImageUrls(decoration.pendingEdits.images) : undefined
      } : undefined
    };

    res.json({
      message: 'Decoration service updated successfully',
      data: transformedDecoration
    });
  } catch (error) {
    console.error('Error updating decoration service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/decoration/:id - Delete a decoration service
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid decoration service ID' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is a provider, staff, or admin
    if (![UserRole.PROVIDER, UserRole.STAFF, UserRole.ADMIN].includes(req.user.role!)) {
      return res.status(403).json({ error: 'Only providers, staff, or admins can delete decoration services' });
    }

    const decoration = await Decoration.findById(id);

    if (!decoration) {
      return res.status(404).json({ error: 'Decoration service not found' });
    }

    // Check permissions
    if (req.user.role === UserRole.PROVIDER) {
      // Providers can only delete their own services
      if (decoration.provider.toString() !== req.user.id) {
        return res.status(403).json({ error: 'You can only delete your own services' });
      }
    }
    // Staff and Admin can delete any service

    // Soft delete the service instead of hard deleting
    decoration.isDeleted = true;
    decoration.deletedAt = new Date();
    await decoration.save();

    res.json({
      message: 'Decoration service moved to trash successfully',
      data: decoration
    });
  } catch (error) {
    console.error('Error deleting decoration service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/decoration/staff/pending - Get decoration services for staff approval
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

    const filter: IDecorationFilter = {
      isActive: true,
      isDeleted: { $ne: true }
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

    const decorations = await Decoration.find(filter)
      .select('+images') // Explicitly select images field
      .populate('provider', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    const total = await Decoration.countDocuments(filter);

    // Transform image URLs from S3 keys to full URLs before sending to client
    const transformedDecorations = decorations.map(decoration => ({
      ...decoration.toObject(),
      images: transformImageUrls(decoration.images || []),
      // Also transform pending edits images if they exist
      pendingEdits: decoration.pendingEdits ? {
        ...decoration.pendingEdits,
        images: decoration.pendingEdits.images ? transformImageUrls(decoration.pendingEdits.images) : undefined
      } : undefined
    }));

    res.json({
      message: 'Pending decoration services retrieved successfully',
      data: transformedDecorations,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(total / limitNumber),
        totalItems: total,
        itemsPerPage: limitNumber
      }
    });
  } catch (error) {
    console.error('Error fetching pending decoration services:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/decoration/staff/:id/approve - Approve a decoration service (staff only)
router.put('/staff/:id/approve', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid decoration service ID' });
    }

    const decoration = await Decoration.findById(id);

    if (!decoration) {
      return res.status(404).json({ error: 'Decoration service not found' });
    }

    // Clear pending edits when approving
    decoration.pendingEdits = undefined;
    decoration.pendingEditSubmittedAt = undefined;
    decoration.status = ApprovalStatus.APPROVED;
    await decoration.save();

    // Transform image URLs from S3 keys to full URLs before sending to client
    const transformedDecoration = {
      ...decoration.toObject(),
      images: transformImageUrls(decoration.images || [])
    };

    res.json({
      message: 'Decoration service approved successfully',
      data: transformedDecoration
    });
  } catch (error) {
    console.error('Error approving decoration service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/decoration/staff/:id/reject - Reject a decoration service (staff only)
router.put('/staff/:id/reject', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid decoration service ID' });
    }

    const decoration = await Decoration.findById(id);

    if (!decoration) {
      return res.status(404).json({ error: 'Decoration service not found' });
    }

    // Clear pending edits when rejecting
    decoration.pendingEdits = undefined;
    decoration.pendingEditSubmittedAt = undefined;
    decoration.status = ApprovalStatus.REJECTED;
    
    // Store rejection reason if provided
    if (rejectionReason) {
      // In a real implementation, you might want to store this in a separate field
      console.log(`Decoration service ${id} rejected with reason: ${rejectionReason}`);
    }
    
    await decoration.save();

    // Transform image URLs from S3 keys to full URLs before sending to client
    const transformedDecoration = {
      ...decoration.toObject(),
      images: transformImageUrls(decoration.images || [])
    };

    res.json({
      message: 'Decoration service rejected successfully',
      data: transformedDecoration
    });
  } catch (error) {
    console.error('Error rejecting decoration service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/decoration/staff/:id - Delete decoration service (Staff only)
router.delete('/staff/:id', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid decoration service ID' });
    }

    const decoration = await Decoration.findById(id);

    if (!decoration) {
      return res.status(404).json({ error: 'Decoration service not found' });
    }

    // Soft delete the service instead of hard deleting
    decoration.isDeleted = true;
    decoration.deletedAt = new Date();
    await decoration.save();

    res.json({
      message: 'Decoration service moved to trash successfully',
      data: decoration
    });
  } catch (error) {
    console.error('Error deleting decoration service:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/decoration/staff/stats - Get stats for staff dashboard
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
    const pendingCount = await Decoration.countDocuments({ 
      status: ApprovalStatus.PENDING,
      isActive: true,
      isDeleted: { $ne: true }
    });
    
    const approvedCount = await Decoration.countDocuments({ 
      status: ApprovalStatus.APPROVED,
      isActive: true,
      isDeleted: { $ne: true }
    });
    
    const rejectedCount = await Decoration.countDocuments({ 
      status: ApprovalStatus.REJECTED,
      isActive: true,
      isDeleted: { $ne: true }
    });

    // Get count of services with pending edits
    const pendingEditCount = await Decoration.countDocuments({ 
      status: ApprovalStatus.PENDING_EDIT,
      isActive: true,
      isDeleted: { $ne: true }
    });

    res.json({
      message: 'Decoration stats retrieved successfully',
      data: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        pendingEdit: pendingEditCount
      }
    });
  } catch (error) {
    console.error('Error fetching decoration stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/decoration/:id/approve-edit - Approve decoration service edit (Staff only)
router.post('/:id/approve-edit', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid decoration service ID' });
    }

    const decoration = await Decoration.findById(id);
    if (!decoration) {
      return res.status(404).json({ error: 'Decoration service not found' });
    }

    if (decoration.status !== ApprovalStatus.PENDING_EDIT) {
      return res.status(400).json({ error: 'Only decoration services with pending edits can be approved' });
    }

    // Apply the pending edits to the service
    if (decoration.pendingEdits) {
      // Merge pending edits with the current service data
      Object.assign(decoration, decoration.pendingEdits);
    }

    // Clear pending edits and update status
    decoration.pendingEdits = undefined;
    decoration.pendingEditSubmittedAt = undefined;
    decoration.status = ApprovalStatus.APPROVED;
    decoration.updatedAt = new Date();
    
    await decoration.save();

    // Transform image URLs from S3 keys to full URLs before sending to client
    const transformedDecoration = {
      ...decoration.toObject(),
      images: transformImageUrls(decoration.images || [])
    };

    res.json({
      message: 'Decoration service edits approved successfully',
      data: transformedDecoration
    });
  } catch (error) {
    console.error('Error approving decoration service edits:', error);
    res.status(500).json({ error: 'Failed to approve decoration service edits' });
  }
});

// POST /api/decoration/:id/reject-edit - Reject decoration service edit (Staff only)
router.post('/:id/reject-edit', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid decoration service ID' });
    }

    const decoration = await Decoration.findById(id);
    if (!decoration) {
      return res.status(404).json({ error: 'Decoration service not found' });
    }

    if (decoration.status !== ApprovalStatus.PENDING_EDIT) {
      return res.status(400).json({ error: 'Only decoration services with pending edits can be rejected' });
    }

    // Clear pending edits and update status
    decoration.pendingEdits = undefined;
    decoration.pendingEditSubmittedAt = undefined;
    decoration.status = ApprovalStatus.APPROVED; // Revert to approved status
    decoration.updatedAt = new Date();
    
    // Store rejection reason
    console.log(`Decoration service ${id} edits rejected. Reason: ${reason}`);
    
    await decoration.save();

    // Transform image URLs from S3 keys to full URLs before sending to client
    const transformedDecoration = {
      ...decoration.toObject(),
      images: transformImageUrls(decoration.images || [])
    };

    res.json({
      message: 'Decoration service edits rejected successfully',
      data: transformedDecoration
    });
  } catch (error) {
    console.error('Error rejecting decoration service edits:', error);
    res.status(500).json({ error: 'Failed to reject decoration service edits' });
  }
});

// ============ BLOCKED DATES MANAGEMENT ROUTES ============

// GET /api/decoration/:id/blocked-dates - Get blocked dates for a decoration service
router.get('/:id/blocked-dates', async (req: Request, res: Response) => {
  try {
    const decoration = await Decoration.findOne({
      _id: req.params.id,
      status: { $in: [ApprovalStatus.APPROVED, ApprovalStatus.PENDING_EDIT] },
      isActive: true
    });

    if (!decoration) {
      return res.status(404).json({ error: 'Decoration service not found' });
    }

    res.json({
      blockedDates: decoration.blockedDates || []
    });
  } catch (error) {
    console.error('Error fetching blocked dates:', error);
    res.status(500).json({ error: 'Failed to fetch blocked dates' });
  }
});

// Helper middleware to check if user is the provider of the decoration service
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const requireDecorationProvider = async (req: AuthRequest, res: Response, next: Function) => {
  if (!req.user || req.user.role !== UserRole.PROVIDER) {
    return res.status(403).json({ error: 'Only providers can perform this action' });
  }
  next();
};

// POST /api/decoration/:id/blocked-dates - Add blocked dates (Provider only)
router.post('/:id/blocked-dates', authenticateToken, requireDecorationProvider, async (req: AuthRequest, res: Response) => {
  try {
    const { dates, reason } = req.body;

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: 'Dates array is required' });
    }

    const decoration = await Decoration.findOne({
      _id: req.params.id,
      provider: req.user!.id
    });

    if (!decoration) {
      return res.status(404).json({ error: 'Decoration service not found or unauthorized' });
    }

    // Initialize blockedDates if it doesn't exist
    if (!decoration.blockedDates) {
      decoration.blockedDates = [];
    }

    // Add new blocked dates
    const newBlockedDates = dates.map((dateStr: string) => ({
      date: new Date(dateStr),
      reason: reason || 'Offline booking',
      blockedAt: new Date()
    }));

    // Filter out dates that are already blocked
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingBlockedDates = decoration.blockedDates.map((bd: any) => 
      bd.date.toISOString().split('T')[0]
    );
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uniqueNewDates = newBlockedDates.filter((bd: any) => 
      !existingBlockedDates.includes(bd.date.toISOString().split('T')[0])
    );

    decoration.blockedDates.push(...uniqueNewDates);
    await decoration.save();

    res.json({
      message: `Successfully blocked ${uniqueNewDates.length} date(s)`,
      blockedDates: decoration.blockedDates
    });
  } catch (error) {
    console.error('Error adding blocked dates:', error);
    res.status(500).json({ error: 'Failed to add blocked dates' });
  }
});

// DELETE /api/decoration/:id/blocked-dates - Remove blocked date (Provider only)
router.delete('/:id/blocked-dates', authenticateToken, requireDecorationProvider, async (req: AuthRequest, res: Response) => {
  try {
    const { date, reason } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Unblocking reason is required' });
    }

    const decoration = await Decoration.findOne({
      _id: req.params.id,
      provider: req.user!.id
    });

    if (!decoration) {
      return res.status(404).json({ error: 'Decoration service not found or unauthorized' });
    }

    if (!decoration.blockedDates || decoration.blockedDates.length === 0) {
      return res.status(404).json({ error: 'No blocked dates found' });
    }

    // Remove the blocked date
    const dateToRemove = new Date(date).toISOString().split('T')[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    decoration.blockedDates = decoration.blockedDates.filter((bd: any) => 
      bd.date.toISOString().split('T')[0] !== dateToRemove
    );

    await decoration.save();

    res.json({
      message: 'Blocked date removed successfully',
      blockedDates: decoration.blockedDates
    });
  } catch (error) {
    console.error('Error removing blocked date:', error);
    res.status(500).json({ error: 'Failed to remove blocked date' });
  }
});

export default router;




