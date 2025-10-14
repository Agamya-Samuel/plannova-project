import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import Booking, { BookingStatus, IBooking } from '../models/Booking';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import Venue, { IVenue } from '../models/Venue';

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

// Interface for a booking populated with venue details
interface IPopulatedBooking extends Omit<IBooking, 'venueId'> {
  venueId?: IVenue;
}

// Helper to transform booking data
const transformBooking = (booking: IPopulatedBooking) => {
  return {
    id: (booking._id as Types.ObjectId).toString(),
    venueName: booking.venueId?.name || 'Unknown Venue',
    venueImage: booking.venueId?.images?.[0]?.url || 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400',
    date: booking.date.toISOString().split('T')[0],
    time: booking.time,
    status: booking.status,
    totalPrice: booking.totalPrice,
    guestCount: booking.guestCount,
    contactPerson: booking.contactPerson,
    contactPhone: booking.contactPhone,
    contactEmail: booking.contactEmail
  };
};

// GET /api/bookings - Get all bookings for the authenticated user
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await Booking.find({ customerId: req.user!.id })
      .populate('venueId', 'name images')
      .sort({ createdAt: -1 });

    const transformedBookings = bookings.map(b => transformBooking(b as unknown as IPopulatedBooking));
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

    const venue = await Venue.findOne({
      _id: venueId,
      status: 'APPROVED',
      isActive: true
    });

    if (!venue) {
      return res.status(404).json({ error: 'Venue not found or not available for booking' });
    }

    const totalPrice = venue.basePrice + (guestCount * (venue.pricePerGuest || 0));

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

    const newBooking = await Booking.findById(booking._id).populate('venueId', 'name images');
    res.status(201).json(transformBooking(newBooking as unknown as IPopulatedBooking));
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

    res.json(transformBooking(booking as unknown as IPopulatedBooking));
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

    if (booking.status === BookingStatus.CANCELLED) {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    booking.status = BookingStatus.CANCELLED;
    await booking.save();

    const updatedBooking = await Booking.findById(booking._id).populate('venueId', 'name images');

    res.json({
      message: 'Booking cancelled successfully',
      booking: transformBooking(updatedBooking as unknown as IPopulatedBooking)
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

export default router;