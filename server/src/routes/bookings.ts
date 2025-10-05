import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import Booking, { BookingStatus, IBooking } from '../models/Booking.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import Venue from '../models/Venue.js';

const router = Router();

// Validation middleware for booking creation
const createBookingValidation = [
  body('venueId').isMongoId().withMessage('Valid venue ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').notEmpty().withMessage('Time is required'),
  body('guestCount').isInt({ min: 1 }).withMessage('Guest count must be at least 1'),
  body('contactPerson').trim().notEmpty().withMessage('Contact person is required'),
  body('contactPhone').trim().notEmpty().withMessage('Contact phone is required'),
  body('contactEmail').isEmail().withMessage('Valid email is required')
];

// GET /api/bookings - Get all bookings for the authenticated user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await Booking.find({ customerId: req.user!.id })
      .populate('venueId', 'name images')
      .sort({ createdAt: -1 });

    // Transform bookings to match client-side interface
    const transformedBookings = bookings.map(booking => ({
      id: (booking._id as Types.ObjectId).toString(),
      venueName: (booking as any).venueId?.name || 'Unknown Venue',
      venueImage: (booking as any).venueId?.images?.length > 0 
        ? (booking as any).venueId.images[0].url 
        : 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400',
      date: booking.date.toISOString().split('T')[0],
      time: booking.time,
      status: booking.status,
      totalPrice: booking.totalPrice,
      guestCount: booking.guestCount,
      contactPerson: booking.contactPerson,
      contactPhone: booking.contactPhone,
      contactEmail: booking.contactEmail
    }));

    res.json(transformedBookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// POST /api/bookings - Create a new booking
router.post('/', authenticateToken, createBookingValidation, async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { venueId, date, time, guestCount, contactPerson, contactPhone, contactEmail } = req.body;

    // Verify venue exists and is approved
    const venue = await Venue.findOne({
      _id: venueId,
      status: 'APPROVED',
      isActive: true
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found or not available for booking' });
    }

    // Calculate total price (simplified - in a real app this would be more complex)
    const totalPrice = venue.basePrice + (guestCount * (venue.pricePerGuest || 0));

    // Create booking
    const booking = await Booking.create({
      customerId: req.user!.id,
      venueId,
      date: new Date(date),
      time,
      totalPrice,
      guestCount,
      contactPerson,
      contactPhone,
      contactEmail
    });

    // Transform booking to match client-side interface
    const transformedBooking = {
      id: (booking._id as Types.ObjectId).toString(),
      venueName: venue.name,
      venueImage: venue.images?.length > 0 ? venue.images[0].url : 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400',
      date: booking.date.toISOString().split('T')[0],
      time: booking.time,
      status: booking.status,
      totalPrice: booking.totalPrice,
      guestCount: booking.guestCount,
      contactPerson: booking.contactPerson,
      contactPhone: booking.contactPhone,
      contactEmail: booking.contactEmail
    };

    res.status(201).json(transformedBooking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// GET /api/bookings/:id - Get a specific booking by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      customerId: req.user!.id
    }).populate('venueId', 'name images');

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Transform booking to match client-side interface
    const transformedBooking = {
      id: (booking._id as Types.ObjectId).toString(),
      venueName: (booking as any).venueId?.name || 'Unknown Venue',
      venueImage: (booking as any).venueId?.images?.length > 0 
        ? (booking as any).venueId.images[0].url 
        : 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400',
      date: booking.date.toISOString().split('T')[0],
      time: booking.time,
      status: booking.status,
      totalPrice: booking.totalPrice,
      guestCount: booking.guestCount,
      contactPerson: booking.contactPerson,
      contactPhone: booking.contactPhone,
      contactEmail: booking.contactEmail
    };

    res.json(transformedBooking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// PUT /api/bookings/:id/cancel - Cancel a booking
router.put('/:id/cancel', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      customerId: req.user!.id
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if booking can be cancelled (implement your business logic here)
    if (booking.status === BookingStatus.CANCELLED) {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    // Update booking status
    booking.status = BookingStatus.CANCELLED;
    await booking.save();

    // Transform booking to match client-side interface
    const transformedBooking = {
      id: (booking._id as Types.ObjectId).toString(),
      venueName: (booking as any).venueId?.name || 'Unknown Venue',
      venueImage: (booking as any).venueId?.images?.length > 0 
        ? (booking as any).venueId.images[0].url 
        : 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400',
      date: booking.date.toISOString().split('T')[0],
      time: booking.time,
      status: booking.status,
      totalPrice: booking.totalPrice,
      guestCount: booking.guestCount,
      contactPerson: booking.contactPerson,
      contactPhone: booking.contactPhone,
      contactEmail: booking.contactEmail
    };

    res.json({
      message: 'Booking cancelled successfully',
      booking: transformedBooking
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

export default router;