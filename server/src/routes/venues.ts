import { Router, Request, Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import { Types } from 'mongoose';
import Venue, { VenueType, VenueStatus, IVenue } from '../models/Venue.js';
import { authenticateToken, requireProvider, AuthRequest } from '../middleware/auth.js';
import { extractS3Key, getS3Url } from '../utils/s3.js';
import { deleteFromS3, bulkDeleteFromS3 } from '../services/uploadService.js';

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

    // Build filter object
    const filter: any = {
      status: VenueStatus.APPROVED,
      isActive: true
    };

    if (city) {
      filter['address.city'] = new RegExp(city as string, 'i');
    }

    if (type && type !== '') {
      filter.type = type;
    }

    if (minCapacity || maxCapacity) {
      filter.$and = filter.$and || [];
      if (minCapacity) {
        filter.$and.push({ 'capacity.max': { $gte: parseInt(minCapacity as string) } });
      }
      if (maxCapacity) {
        filter.$and.push({ 'capacity.min': { $lte: parseInt(maxCapacity as string) } });
      }
    }

    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = parseFloat(minPrice as string);
      if (maxPrice) filter.basePrice.$lte = parseFloat(maxPrice as string);
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    const venues = await Venue.find(filter)
      .populate('providerId', 'firstName lastName email')
      .sort(sort)
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

    const filter: any = { 
      providerId: req.user!.id,
      isActive: true // Only show active venues
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
      isActive: true
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

// GET /api/venues/:id - Get venue by ID (public)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const venue = await Venue.findOne({
      _id: req.params.id,
      status: VenueStatus.APPROVED,
      isActive: true
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

    const venueData = {
      ...req.body,
      providerId: req.user!.id,
      status: VenueStatus.DRAFT
    };

    const venue = await Venue.create(venueData);

    res.status(201).json({
      message: 'Venue created successfully',
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

    // Don't allow updates if venue is approved (except for specific fields)
    if (venue.status === VenueStatus.APPROVED) {
      const allowedFields = ['description', 'contact', 'basePrice', 'pricePerGuest', 'availability', 'foodOptions', 'decorationOptions', 'addonServices'];
      const updatedFields = Object.keys(req.body);
      const restrictedFields = updatedFields.filter(field => !allowedFields.includes(field));
      
      if (restrictedFields.length > 0) {
        return res.status(400).json({ 
          error: 'Cannot modify restricted fields for approved venues',
          restrictedFields 
        });
      }
    }

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
    const imageToDelete = venue.images.find((img: any) => 
      img._id?.toString() === req.params.imageId
    );

    if (!imageToDelete) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Remove image from venue
    venue.images = venue.images.filter((img: any) => 
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
      customerId: req.user!.id,
      customerName: `${req.user!.firstName} ${req.user!.lastName}`,
      rating,
      comment: comment || '',
      images: images || [],
      date: new Date(),
      verified: false
    } as any);

    // Recalculate average rating
    const totalRating = venue.reviews.reduce((sum: number, review: any) => sum + review.rating, 0);
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

    const filter: any = { 
      isActive: true
    };
    
    if (status && status !== 'ALL') {
      filter.status = status;
    } else {
      // Default to pending venues if no status specified
      filter.status = { $in: ['PENDING', 'APPROVED', 'REJECTED'] };
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

export default router;