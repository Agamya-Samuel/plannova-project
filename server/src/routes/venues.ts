import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import Venue, { VenueType, VenueStatus, IVenueImage } from '../models/Venue.js';
import User from '../models/User.js';
import { authenticateToken, requireProvider, requireStaffOrAdmin, AuthRequest } from '../middleware/auth.js';
import { extractS3Key } from '../utils/s3.js';
import { deleteFromS3 } from '../services/uploadService.js';
import mongoose from 'mongoose';

const router = Router();

// Validation middleware for venue creation
const createVenueValidation = [
  body('name').trim().isLength({ min: 3, max: 200 }).withMessage('Name must be 3-200 characters'),
  body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
  body('type').isIn(Object.values(VenueType)).withMessage('Invalid venue type'),
  body('address.street').trim().notEmpty().withMessage('Street address is required'),
  body('address.area').trim().notEmpty().withMessage('Area is required'),
  body('address.city').trim().notEmpty().withMessage('City is required'),
  body('address.state').trim().notEmpty().withMessage('State is required'),
  body('address.pincode').trim().notEmpty().withMessage('Pincode is required'),
  body('contact.phone').trim().notEmpty().withMessage('Phone is required'),
  body('contact.email').isEmail().withMessage('Valid email is required'),
  body('capacity.min').isInt({ min: 1 }).withMessage('Minimum capacity must be at least 1'),
  body('capacity.max').isInt({ min: 1 }).withMessage('Maximum capacity must be at least 1'),
  body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('advancePayment').isFloat({ min: 0, max: 100 }).withMessage('Advance payment must be 0-100%'),
  body('cancellationPolicy').trim().notEmpty().withMessage('Cancellation policy is required')
];

// Validation middleware for venue updates
const updateVenueValidation = [
  body('name').optional().trim().isLength({ min: 3, max: 200 }).withMessage('Name must be 3-200 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10-2000 characters'),
  body('type').optional().isIn(Object.values(VenueType)).withMessage('Invalid venue type'),
  body('basePrice').optional().isFloat({ min: 0 }).withMessage('Base price must be a positive number'),
  body('advancePayment').optional().isFloat({ min: 0, max: 100 }).withMessage('Advance payment must be 0-100%')
];

// GET /api/venues - Get all approved venues (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      city,
      state,
      type,
      minCapacity,
      maxCapacity,
      minPrice,
      maxPrice,
      page = 1,
      limit = 12,
      sortBy = 'averageRating',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object to include both approved venues and venues with pending edits
    const filter: Record<string, unknown> = {
      isActive: true,
      isDeleted: { $ne: true },
      status: { $in: [VenueStatus.APPROVED, VenueStatus.PENDING_EDIT] }
    };

    // Filter by city if provided - matches provider's address.city
    if (city) {
      filter['address.city'] = new RegExp(city as string, 'i');
    }

    // Filter by state if provided - matches provider's address.state
    // State can be state code (e.g., "MH") or state name (e.g., "Maharashtra")
    if (state) {
      filter['address.state'] = new RegExp(state as string, 'i');
    }

    if (type && type !== '') {
      filter.type = type;
    }

    if (minCapacity || maxCapacity) {
      filter.$and = filter.$and || [];
      if (minCapacity) {
        (filter.$and as Record<string, unknown>[]).push({ 'capacity.max': { $gte: parseInt(minCapacity as string) } });
      }
      if (maxCapacity) {
        (filter.$and as Record<string, unknown>[]).push({ 'capacity.min': { $lte: parseInt(maxCapacity as string) } });
      }
    }

    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) (filter.basePrice as Record<string, unknown>).$gte = parseFloat(minPrice as string);
      if (maxPrice) (filter.basePrice as Record<string, unknown>).$lte = parseFloat(maxPrice as string);
    }

    // Build sort object
    const sort: {[key: string]: 1 | -1} = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    const venues = await Venue.find(filter)
      .populate('providerId', 'firstName lastName email')
      .sort(sort as {[key: string]: 1 | -1})
      .skip(skip)
      .limit(limitNumber)
      .select('-reviews'); // Exclude reviews for performance

    const total = await Venue.countDocuments(filter);

    res.json({
      venues,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('Error fetching venues:', error);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

// GET /api/venues/provider/my-venues - Get provider's venues
router.get('/provider/my-venues', authenticateToken, requireProvider, async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;

    const filter: Record<string, unknown> = { 
      providerId: req.user!.id,
      isActive: true, // Only show active venues
      isDeleted: { $ne: true }
    };
    
    if (status && status !== 'ALL') {
      filter.status = status;
    }

    // Add search functionality
    if (search && search.toString().trim()) {
      const searchTerm = search.toString().trim();
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { 'address.city': { $regex: searchTerm, $options: 'i' } },
        { 'address.area': { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    const venues = await Venue.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    const total = await Venue.countDocuments(filter);

    res.json({
      venues,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('Error fetching provider venues:', error);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

// GET /api/venues/provider/:id - Get provider's venue by ID (for editing)
router.get('/provider/:id', authenticateToken, requireProvider, async (req: AuthRequest, res: Response) => {
  try {
    const venue = await Venue.findOne({
      _id: req.params.id,
      providerId: req.user!.id,
      isActive: true,
      isDeleted: { $ne: true }
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found or unauthorized' });
    }

    res.json(venue);
  } catch (error) {
    console.error('Error fetching provider venue:', error);
    res.status(500).json({ error: 'Failed to fetch venue' });
  }
});

// GET /api/venues/favorites - Get user's favorite venues
router.get('/favorites', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get user with populated favorites
    const user = await User.findById(userId).populate({
      path: 'favorites',
      match: { 
        status: { $in: [VenueStatus.APPROVED, VenueStatus.PENDING_EDIT] },
        isActive: true,
        isDeleted: { $ne: true }
      },
      select: '-reviews' // Exclude reviews for performance
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Filter out any null values that might have occurred from populate
    const favorites = (user.favorites || []).filter((venue: unknown) => venue !== null);

    res.json({
      venues: favorites
    });
  } catch (error) {
    console.error('Error fetching favorite venues:', error);
    res.status(500).json({ error: 'Failed to fetch favorite venues' });
  }
});

// GET /api/venues/staff/pending - Get venues pending approval (Staff only)
router.get('/staff/pending', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;

    const filter: Record<string, unknown> = { 
      isActive: true,
      isDeleted: { $ne: true }
    };
    
    if (status && status !== 'ALL') {
      filter.status = status;
    } else {
      // Default to pending venues if no status specified
      filter.status = { $in: ['PENDING', 'APPROVED', 'REJECTED', 'PENDING_EDIT'] };
    }

    // Add search functionality
    if (search && search.toString().trim()) {
      const searchTerm = search.toString().trim();
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { 'address.city': { $regex: searchTerm, $options: 'i' } },
        { 'address.area': { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    // Add filter to exclude venues with invalid providers
    filter.providerId = { $ne: null, $exists: true };

    const venues = await Venue.find(filter)
      .populate('providerId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    const total = await Venue.countDocuments(filter);

    res.json({
      venues,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('Error fetching pending venues:', error);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

// GET /api/venues/staff/pending-edits - Get venues with pending edits (Staff only)
router.get('/staff/pending-edits', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    const filter: Record<string, unknown> = { 
      isActive: true,
      isDeleted: { $ne: true },
      status: 'PENDING_EDIT'
    };

    // Add search functionality
    if (search && search.toString().trim()) {
      const searchTerm = search.toString().trim();
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { 'address.city': { $regex: searchTerm, $options: 'i' } },
        { 'address.area': { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    // Add filter to exclude venues with invalid providers
    filter.providerId = { $ne: null, $exists: true };

    const venues = await Venue.find(filter)
      .populate('providerId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    const total = await Venue.countDocuments(filter);

    res.json({
      venues,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('Error fetching venues with pending edits:', error);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

// GET /api/venues/staff/stats - Get stats for staff dashboard
router.get('/staff/stats', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    // Get counts for each status
    const pendingCount = await Venue.countDocuments({ 
      status: VenueStatus.PENDING,
      isActive: true,
      isDeleted: { $ne: true }
    });
    
    const approvedCount = await Venue.countDocuments({ 
      status: VenueStatus.APPROVED,
      isActive: true,
      isDeleted: { $ne: true }
    });
    
    const rejectedCount = await Venue.countDocuments({ 
      status: VenueStatus.REJECTED,
      isActive: true,
      isDeleted: { $ne: true }
    });

    res.json({
      message: 'Venue stats retrieved successfully',
      data: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount
      }
    });
  } catch (error) {
    console.error('Error fetching venue stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/venues/staff/:id - Get venue by ID (staff only - includes pending venues)
router.get('/staff/:id', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const venue = await Venue.findOne({
      _id: req.params.id,
      isActive: true,
      isDeleted: { $ne: true }
    }).populate('providerId', 'firstName lastName email phone');

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    res.json(venue);
  } catch (error) {
    console.error('Error fetching venue:', error);
    res.status(500).json({ error: 'Failed to fetch venue' });
  }
});

// GET /api/venues/:id - Get venue by ID (public)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const venue = await Venue.findOne({
      _id: req.params.id,
      status: { $in: [VenueStatus.APPROVED, VenueStatus.PENDING_EDIT] },
      isActive: true,
      isDeleted: { $ne: true }
    }).populate('providerId', 'firstName lastName email phone');

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    res.json(venue);
  } catch (error) {
    console.error('Error fetching venue:', error);
    res.status(500).json({ error: 'Failed to fetch venue' });
  }
});

// POST /api/venues - Create new venue
router.post('/', authenticateToken, requireProvider, createVenueValidation, async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Validate capacity
    if (req.body.capacity.max < req.body.capacity.min) {
      return res.status(400).json({ error: 'Maximum capacity must be greater than or equal to minimum capacity' });
    }

    // Use the status from the request body if provided, otherwise default to DRAFT
    const status = req.body.status && Object.values(VenueStatus).includes(req.body.status) 
      ? req.body.status 
      : VenueStatus.DRAFT;
    
    const venueData = {
      ...req.body,
      providerId: req.user!.id,
      status
    };

    const venue = await Venue.create(venueData);

    res.status(201).json({
      message: `Venue created successfully with status ${status}`,
      venue
    });
  } catch (error) {
    console.error('Error creating venue:', error);
    res.status(500).json({ error: 'Failed to create venue' });
  }
});

// PUT /api/venues/:id - Update venue
router.put('/:id', authenticateToken, requireProvider, updateVenueValidation, async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const venue = await Venue.findOne({
      _id: req.params.id,
      providerId: req.user!.id
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found or unauthorized' });
    }

    // For approved venues, store edits in pendingEdits instead of directly updating
    if (venue.status === VenueStatus.APPROVED) {
      // Preserve existing images if not provided in the update
      const pendingEdits = {
        ...req.body,
        updatedAt: new Date()
      };
      
      // If images are not provided in the request, preserve existing images
      if (!req.body.images && venue.images) {
        pendingEdits.images = venue.images;
      }
      
      // Store the edits in pendingEdits field
      venue.pendingEdits = {
        ...venue.pendingEdits,
        ...pendingEdits
      };
      venue.pendingEditSubmittedAt = new Date();
      venue.status = VenueStatus.PENDING_EDIT;
      
      await venue.save();
      
      return res.json({
        message: 'Venue edits submitted for approval',
        venue: {
          _id: venue._id,
          name: venue.name,
          status: venue.status,
          pendingEdits: venue.pendingEdits
        }
      });
    }

    // For non-approved venues, apply changes directly (existing behavior)
    // Validate capacity if being updated
    if (req.body.capacity && req.body.capacity.max < req.body.capacity.min) {
      return res.status(400).json({ error: 'Maximum capacity must be greater than or equal to minimum capacity' });
    }

    Object.assign(venue, req.body);
    await venue.save();

    res.json({
      message: 'Venue updated successfully',
      venue
    });
  } catch (error) {
    console.error('Error updating venue:', error);
    res.status(500).json({ error: 'Failed to update venue' });
  }
});

// DELETE /api/venues/:id - Delete venue (soft delete)
router.delete('/:id', authenticateToken, requireProvider, async (req: AuthRequest, res: Response) => {
  try {
    console.log('Delete venue request:', {
      venueId: req.params.id,
      userId: req.user?.id
    });

    const venue = await Venue.findOne({
      _id: req.params.id,
      providerId: req.user!.id
    });

    if (!venue) {
      console.log('Venue not found for deletion:', {
        venueId: req.params.id,
        providerId: req.user!.id
      });
      return res.status(404).json({ error: 'Venue not found or unauthorized' });
    }

    console.log('Deleting venue:', {
      venueId: venue._id,
      venueName: venue.name,
      currentStatus: venue.status
    });

    venue.isActive = false;
    await venue.save();

    console.log('Venue deleted successfully:', venue._id);
    res.json({ message: 'Venue deleted successfully' });
  } catch (error) {
    console.error('Error deleting venue:', error);
    res.status(500).json({ error: 'Failed to delete venue' });
  }
});

// POST /api/venues/:id/images - Add images to venue (enhanced for S3)
router.post('/:id/images', authenticateToken, requireProvider, async (req: AuthRequest, res: Response) => {
  try {
    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Images array is required' });
    }

    // Validate image objects structure (simplified for existing IVenueImage interface)
    for (const image of images) {
      if (!image.url) {
        return res.status(400).json({ 
          error: 'Each image must have a url property' 
        });
      }
      
      // Validate that the S3 URL belongs to this user (security check)
      const userId = req.user!.id;
      const extractedKey = extractS3Key(image.url);
      if (extractedKey && !extractedKey.includes(userId)) {
        return res.status(403).json({ 
          error: 'Unauthorized: Image URL does not belong to current user' 
        });
      }
    }

    const venue = await Venue.findOne({
      _id: req.params.id,
      providerId: req.user!.id
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found or unauthorized' });
    }

    // Add images with S3 metadata
    const enhancedImages = images.map(image => ({
      url: image.url,
      alt: image.alt || image.name || 'Venue image',
      category: image.category || 'gallery',
      isPrimary: image.isPrimary || false,
      // Note: Additional metadata like key, name, type, size, etc. can be stored
      // in a separate collection or as extended fields if needed
    }));

    venue.images.push(...enhancedImages);
    await venue.save();

    res.json({
      message: 'Images added successfully',
      venue: {
        _id: venue._id,
        name: venue.name,
        images: venue.images
      }
    });
  } catch (error) {
    console.error('Error adding images:', error);
    res.status(500).json({ error: 'Failed to add images' });
  }
});

// DELETE /api/venues/:id/images/:imageId - Remove image from venue (enhanced with S3 cleanup)
router.delete('/:id/images/:imageId', authenticateToken, requireProvider, async (req: AuthRequest, res: Response) => {
  try {
    const venue = await Venue.findOne({
      _id: req.params.id,
      providerId: req.user!.id
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found or unauthorized' });
    }

    // Find the image to be deleted
    const imageToDelete = venue.images.find((img: IVenueImage & { _id?: Types.ObjectId }) => 
      img._id?.toString() === req.params.imageId
    );

    if (!imageToDelete) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Remove image from venue
    venue.images = venue.images.filter((img: IVenueImage & { _id?: Types.ObjectId }) => 
      img._id?.toString() !== req.params.imageId
    );
    
    await venue.save();

    // Delete from S3 by extracting key from URL
    const s3Key = extractS3Key(imageToDelete.url);
    if (s3Key) {
      try {
        await deleteFromS3(s3Key);
        console.log(`Successfully deleted S3 file: ${s3Key}`);
      } catch (s3Error) {
        console.error('Failed to delete from S3:', s3Error);
        // Don't fail the request if S3 deletion fails
      }
    }

    res.json({
      message: 'Image removed successfully',
      venue: {
        _id: venue._id,
        name: venue.name,
        images: venue.images
      }
    });
  } catch (error) {
    console.error('Error removing image:', error);
    res.status(500).json({ error: 'Failed to remove image' });
  }
});

// POST /api/venues/:id/submit - Submit venue for approval
router.post('/:id/submit', authenticateToken, requireProvider, async (req: AuthRequest, res: Response) => {
  try {
    console.log('Submit venue request:', {
      venueId: req.params.id,
      userId: req.user?.id,
      userRole: req.user?.role
    });

    const venue = await Venue.findOne({
      _id: req.params.id,
      providerId: req.user!.id
    });

    if (!venue) {
      console.log('Venue not found or unauthorized:', {
        venueId: req.params.id,
        providerId: req.user!.id
      });
      return res.status(404).json({ error: 'Venue not found or unauthorized' });
    }

    console.log('Venue found:', {
      venueId: venue._id,
      venueName: venue.name,
      currentStatus: venue.status,
      imagesCount: venue.images.length
    });

    if (venue.status !== VenueStatus.DRAFT) {
      console.log('Invalid status for submission:', venue.status);
      return res.status(400).json({ 
        error: 'Only draft venues can be submitted for approval',
        currentStatus: venue.status
      });
    }

    // Basic validation for submission
    if (venue.images.length === 0) {
      console.log('No images found for venue submission');
      return res.status(400).json({ error: 'At least one image is required for submission' });
    }

    venue.status = VenueStatus.PENDING;
    await venue.save();

    console.log('Venue submitted successfully:', {
      venueId: venue._id,
      newStatus: venue.status
    });

    res.json({
      message: 'Venue submitted for approval successfully',
      venue: {
        _id: venue._id,
        name: venue.name,
        status: venue.status
      }
    });
  } catch (error) {
    console.error('Error submitting venue:', error);
    res.status(500).json({ error: 'Failed to submit venue' });
  }
});

// POST /api/venues/:id/reviews - Add review to venue (authenticated customers only)
router.post('/:id/reviews', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { rating, comment, images } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const venue = await Venue.findOne({
      _id: req.params.id,
      status: VenueStatus.APPROVED,
      isActive: true
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // Check if user already reviewed this venue
    const existingReview = venue.reviews.find(
      review => review.customerId.toString() === req.user!.id
    );

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this venue' });
    }

    // Add the review
    venue.reviews.push({
      customerId: new Types.ObjectId(req.user!.id),
      customerName: `${req.user!.firstName} ${req.user!.lastName}`,
      rating,
      comment: comment || '',
      images: images || [],
      date: new Date(),
      verified: false
    });

    // Recalculate average rating
    const totalRating = venue.reviews.reduce((sum: number, review: {rating: number}) => sum + review.rating, 0);
    venue.averageRating = Math.round((totalRating / venue.reviews.length) * 10) / 10;
    venue.totalReviews = venue.reviews.length;

    await venue.save();

    res.json({
      message: 'Review added successfully'
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ error: 'Failed to add review' });
  }
});

// GET /api/venues/staff/pending - Get venues pending approval (Staff only)
router.get('/staff/pending', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 10, search } = req.query;

    const filter: Record<string, unknown> = { 
      isActive: true
    };
    
    if (status && status !== 'ALL') {
      filter.status = status;
    } else {
      // Default to pending venues if no status specified
      filter.status = { $in: ['PENDING', 'APPROVED', 'REJECTED', 'PENDING_EDIT'] };
    }

    // Add search functionality
    if (search && search.toString().trim()) {
      const searchTerm = search.toString().trim();
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { 'address.city': { $regex: searchTerm, $options: 'i' } },
        { 'address.area': { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    // Add filter to exclude venues with invalid providers
    filter.providerId = { $ne: null, $exists: true };

    const venues = await Venue.find(filter)
      .populate('providerId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    const total = await Venue.countDocuments(filter);

    res.json({
      venues,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('Error fetching pending venues:', error);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

// GET /api/venues/staff/pending-edits - Get venues with pending edits (Staff only)
router.get('/staff/pending-edits', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { 
      status: VenueStatus.PENDING_EDIT,
      isActive: true,
      isDeleted: { $ne: true }
    };

    // Add search functionality
    if (search && search.toString().trim()) {
      const searchTerm = search.toString().trim();
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { 'address.city': { $regex: searchTerm, $options: 'i' } },
        { 'address.area': { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    const venues = await Venue.find(filter)
      .populate('providerId', 'firstName lastName email')
      .sort({ pendingEditSubmittedAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    const total = await Venue.countDocuments(filter);

    res.json({
      venues,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('Error fetching venues with pending edits:', error);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

// GET /api/venues/staff/stats - Get stats for staff dashboard
router.get('/staff/stats', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    // Get counts for each status
    const pendingCount = await Venue.countDocuments({ 
      status: VenueStatus.PENDING,
      isActive: true 
    });
    
    const approvedCount = await Venue.countDocuments({ 
      status: VenueStatus.APPROVED,
      isActive: true 
    });
    
    const rejectedCount = await Venue.countDocuments({ 
      status: VenueStatus.REJECTED,
      isActive: true 
    });

    res.json({
      message: 'Venue stats retrieved successfully',
      data: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount
      }
    });
  } catch (error) {
    console.error('Error fetching venue stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/venues/staff/:id/approve - Approve a venue (Staff only)
router.post('/staff/:id/approve', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const venueId = req.params.id;
    
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    if (venue.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending venues can be approved' });
    }

    venue.status = VenueStatus.APPROVED;
    venue.updatedAt = new Date();
    await venue.save();

    res.json({
      message: 'Venue approved successfully',
      venue: {
        id: venue._id,
        name: venue.name,
        status: venue.status
      }
    });
  } catch (error) {
    console.error('Error approving venue:', error);
    res.status(500).json({ error: 'Failed to approve venue' });
  }
});

// POST /api/venues/staff/:id/approve-edit - Approve venue edit (Staff only)
router.post('/staff/:id/approve-edit', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const venueId = req.params.id;
    
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    if (venue.status !== VenueStatus.PENDING_EDIT) {
      return res.status(400).json({ error: 'Only venues with pending edits can be approved' });
    }

    // Apply the pending edits to the venue
    if (venue.pendingEdits) {
      // Preserve images if not explicitly updated
      const updatedData = { ...venue.pendingEdits };
      
      // Merge pending edits with the current venue data
      Object.assign(venue, updatedData);
    }

    // Clear pending edits and update status
    venue.pendingEdits = undefined;
    venue.pendingEditSubmittedAt = undefined;
    venue.status = VenueStatus.APPROVED;
    venue.updatedAt = new Date();
    
    await venue.save();

    res.json({
      message: 'Venue edits approved successfully',
      venue: {
        id: venue._id,
        name: venue.name,
        status: venue.status
      }
    });
  } catch (error) {
    console.error('Error approving venue edits:', error);
    res.status(500).json({ error: 'Failed to approve venue edits' });
  }
});

// POST /api/venues/staff/:id/reject - Reject a venue (Staff only)
router.post('/staff/:id/reject', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const venueId = req.params.id;
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    if (venue.status !== 'PENDING') {
      return res.status(400).json({ error: 'Only pending venues can be rejected' });
    }

    venue.status = VenueStatus.REJECTED;
    venue.updatedAt = new Date();
    
    // Store rejection reason in a separate field or in description
    // For now, we'll add it to the description
    venue.description += `\n\n[REJECTED: ${reason}]`;
    
    await venue.save();

    res.json({
      message: 'Venue rejected successfully',
      venue: {
        id: venue._id,
        name: venue.name,
        status: venue.status
      }
    });
  } catch (error) {
    console.error('Error rejecting venue:', error);
    res.status(500).json({ error: 'Failed to reject venue' });
  }
});

// POST /api/venues/staff/:id/reject-edit - Reject venue edit (Staff only)
router.post('/staff/:id/reject-edit', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const venueId = req.params.id;
    const { reason } = req.body;
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    if (venue.status !== VenueStatus.PENDING_EDIT) {
      return res.status(400).json({ error: 'Only venues with pending edits can be rejected' });
    }

    // Clear pending edits and update status
    venue.pendingEdits = undefined;
    venue.pendingEditSubmittedAt = undefined;
    venue.status = VenueStatus.APPROVED; // Revert to approved status
    venue.updatedAt = new Date();
    
    // Store rejection reason
    if (!venue.description.includes('[EDIT REJECTED]')) {
      venue.description += `\n\n[EDIT REJECTED: ${reason}]`;
    }
    
    await venue.save();

    res.json({
      message: 'Venue edits rejected successfully',
      venue: {
        id: venue._id,
        name: venue.name,
        status: venue.status
      }
    });
  } catch (error) {
    console.error('Error rejecting venue edits:', error);
    res.status(500).json({ error: 'Failed to reject venue edits' });
  }
});

// POST /api/venues/:id/favorite - Add venue to user's favorites
router.post('/:id/favorite', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const venueId = req.params.id;
    const userId = req.user!.id;

    // Check if venue exists and is approved
    const venue = await Venue.findOne({
      _id: venueId,
      status: VenueStatus.APPROVED,
      isActive: true
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // Add venue to user's favorites
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if venue is already in favorites
    const isFavorite = user.favorites?.some((fav: mongoose.Types.ObjectId) => fav.toString() === venueId);
    
    if (isFavorite) {
      // Venue is already favorited
      return res.json({
        message: 'Venue is already in favorites',
        isFavorite: true
      });
    }
    
    if (!user.favorites) {
      user.favorites = [];
    }
    user.favorites.push(new Types.ObjectId(venueId));
    await user.save();

    res.json({
      message: 'Venue added to favorites',
      isFavorite: true
    });
  } catch (error) {
    console.error('Error adding venue to favorites:', error);
    res.status(500).json({ error: 'Failed to add venue to favorites' });
  }
});

// DELETE /api/venues/:id/favorite - Remove venue from user's favorites
router.delete('/:id/favorite', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const venueId = req.params.id;
    const userId = req.user!.id;

    // Remove venue from user's favorites
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if venue is in favorites
    const isFavorite = user.favorites?.some((fav: mongoose.Types.ObjectId) => fav.toString() === venueId);
    
    if (!isFavorite) {
      // Venue is not in favorites
      return res.json({
        message: 'Venue is not in favorites',
        isFavorite: false
      });
    }

    if (user.favorites) {
      user.favorites = user.favorites.filter((fav: Types.ObjectId) => fav.toString() !== venueId);
      await user.save();
    }

    res.json({
      message: 'Venue removed from favorites',
      isFavorite: false
    });
  } catch (error) {
    console.error('Error removing venue from favorites:', error);
    res.status(500).json({ error: 'Failed to remove venue from favorites' });
  }
});

// DELETE /api/venues/staff/:id - Delete venue (Staff only)
router.delete('/staff/:id', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const venueId = req.params.id;
    
    // Find the venue (no provider check for staff)
    const venue = await Venue.findById(venueId);
    
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // Delete associated images from S3
    if (venue.images && venue.images.length > 0) {
      try {
        // Import the S3 delete function and URL extraction utility
        const { deleteFromS3 } = await import('../services/uploadService.js');
        const { extractS3Key } = await import('../utils/s3.js');
        
        // Delete each image from S3
        for (const image of venue.images) {
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

    // Soft delete the venue instead of hard deleting
    venue.isDeleted = true;
    venue.deletedAt = new Date();
    await venue.save();

    res.json({
      message: 'Venue moved to trash successfully',
      data: venue
    });
  } catch (error) {
    console.error('Error deleting venue:', error);
    res.status(500).json({ error: 'Failed to delete venue' });
  }
});

// ============ BLOCKED DATES MANAGEMENT ROUTES ============

// GET /api/venues/:id/blocked-dates - Get blocked dates for a venue
router.get('/:id/blocked-dates', async (req: Request, res: Response) => {
  try {
    const venue = await Venue.findOne({
      _id: req.params.id,
      status: { $in: [VenueStatus.APPROVED, VenueStatus.PENDING_EDIT] },
      isActive: true
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    res.json({
      blockedDates: venue.blockedDates || []
    });
  } catch (error) {
    console.error('Error fetching blocked dates:', error);
    res.status(500).json({ error: 'Failed to fetch blocked dates' });
  }
});

// POST /api/venues/:id/blocked-dates - Add blocked date(s) (Provider only)
router.post('/:id/blocked-dates', authenticateToken, requireProvider, async (req: AuthRequest, res: Response) => {
  try {
    const { dates, reason } = req.body;

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: 'Dates array is required' });
    }

    const venue = await Venue.findOne({
      _id: req.params.id,
      providerId: req.user!.id
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found or unauthorized' });
    }

    // Initialize blockedDates if it doesn't exist
    if (!venue.blockedDates) {
      venue.blockedDates = [];
    }

    // Add new blocked dates
    const newBlockedDates = dates.map((dateStr: string) => ({
      date: new Date(dateStr),
      reason: reason || 'Offline booking',
      blockedAt: new Date()
    }));

    // Filter out dates that are already blocked
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingBlockedDates = venue.blockedDates.map((bd: any) => 
      bd.date.toISOString().split('T')[0]
    );
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uniqueNewDates = newBlockedDates.filter((bd: any) => 
      !existingBlockedDates.includes(bd.date.toISOString().split('T')[0])
    );

    venue.blockedDates.push(...uniqueNewDates);
    await venue.save();

    res.json({
      message: `Successfully blocked ${uniqueNewDates.length} date(s)`,
      blockedDates: venue.blockedDates
    });
  } catch (error) {
    console.error('Error adding blocked dates:', error);
    res.status(500).json({ error: 'Failed to add blocked dates' });
  }
});

// DELETE /api/venues/:id/blocked-dates - Remove blocked date (Provider only)
router.delete('/:id/blocked-dates', authenticateToken, requireProvider, async (req: AuthRequest, res: Response) => {
  try {
    const { date, reason } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Unblocking reason is required' });
    }

    const venue = await Venue.findOne({
      _id: req.params.id,
      providerId: req.user!.id
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found or unauthorized' });
    }

    if (!venue.blockedDates || venue.blockedDates.length === 0) {
      return res.status(404).json({ error: 'No blocked dates found' });
    }

    // Find the blocked date to get its original reason
    const dateToRemove = new Date(date).toISOString().split('T')[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blockedDate = venue.blockedDates.find((bd: any) => 
      bd.date.toISOString().split('T')[0] === dateToRemove
    );

    if (!blockedDate) {
      return res.status(404).json({ error: 'Blocked date not found' });
    }

    // Store in unblock history before removing
    if (!venue.unblockHistory) {
      venue.unblockHistory = [];
    }

    venue.unblockHistory.push({
      date: new Date(date),
      reason: reason.trim(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      originalBlockReason: (blockedDate as any).reason || 'Not specified',
      unblockedAt: new Date(),
      unblockedBy: new Types.ObjectId(req.user!.id)
    });

    // Remove the blocked date
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    venue.blockedDates = venue.blockedDates.filter((bd: any) => 
      bd.date.toISOString().split('T')[0] !== dateToRemove
    );

    await venue.save();

    res.json({
      message: 'Blocked date removed successfully',
      blockedDates: venue.blockedDates,
      unblockHistory: venue.unblockHistory
    });
  } catch (error) {
    console.error('Error removing blocked date:', error);
    res.status(500).json({ error: 'Failed to remove blocked date' });
  }
});

export default router;





