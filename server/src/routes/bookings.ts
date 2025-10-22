import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import Booking, { BookingStatus, IBooking, ServiceType } from '../models/Booking.js';
import { authenticateToken, AuthRequest, requireProvider } from '../middleware/auth.js';
import Venue, { IVenue } from '../models/Venue.js';
import Catering from '../models/Catering.js';
import Photography from '../models/Photography.js';
import Videography from '../models/Videography.js';
import BridalMakeup from '../models/BridalMakeup.js';
import Decoration from '../models/Decoration.js';

const router = Router();

// Validation middleware for booking creation
const createBookingValidation = [
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
      .populate('providerId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Transform bookings to include service and provider details
    const transformedBookings = await Promise.all(bookings.map(async (booking) => {
      let serviceName = 'Unknown Service';
      let serviceImage = 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400';
      let providerContact = {
        name: 'Provider',
        email: '',
        phone: ''
      };
      
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let service: any = null;
        
        switch (booking.serviceType) {
          case ServiceType.VENUE:
            service = await Venue.findById(booking.serviceId);
            break;
          case ServiceType.CATERING:
            service = await Catering.findById(booking.serviceId);
            break;
          case ServiceType.PHOTOGRAPHY:
            service = await Photography.findById(booking.serviceId);
            break;
          case ServiceType.VIDEOGRAPHY:
            service = await Videography.findById(booking.serviceId);
            break;
          case ServiceType.BRIDAL_MAKEUP:
            service = await BridalMakeup.findById(booking.serviceId);
            break;
          case ServiceType.DECORATION:
            service = await Decoration.findById(booking.serviceId);
            break;
        }
        
        if (service) {
          serviceName = service.name;
          serviceImage = service.images?.[0]?.url || serviceImage;
          
          // Get contact info from service
          if (service.contact) {
            providerContact = {
              name: service.contact.name || serviceName,
              email: service.contact.email || '',
              phone: service.contact.phone || ''
            };
          }
        }
        
        // Fallback to provider user info if service doesn't have contact
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const provider = booking.providerId as any;
        if (provider && !providerContact.email) {
          providerContact = {
            name: `${provider.firstName || ''} ${provider.lastName || ''}`.trim() || 'Provider',
            email: provider.email || '',
            phone: provider.phone || ''
          };
        }
      } catch (error) {
        console.error('Error fetching service details:', error);
      }

      return {
        id: (booking._id as Types.ObjectId).toString(),
        serviceId: booking.serviceId?.toString(),
        serviceType: booking.serviceType,
        serviceName,
        serviceImage,
        // For backward compatibility
        venueName: serviceName,
        venueImage: serviceImage,
        date: booking.date,
        time: booking.time,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        totalPrice: booking.totalPrice,
        guestCount: booking.guestCount,
        contactPerson: booking.contactPerson,
        contactPhone: booking.contactPhone,
        contactEmail: booking.contactEmail,
        specialRequests: booking.specialRequests,
        provider: providerContact,
        createdAt: booking.createdAt
      };
    }));

    res.json(transformedBookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /api/bookings/availability/:serviceType/:serviceId - Check availability for a service
router.get('/availability/:serviceType/:serviceId', async (req, res: Response) => {
  try {
    const { serviceType, serviceId } = req.params;
    const { month, year } = req.query;

    // Validate service type
    if (!Object.values(ServiceType).includes(serviceType as ServiceType)) {
      return res.status(400).json({ error: 'Invalid service type' });
    }

    // Validate serviceId format
    if (!Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ error: 'Invalid service ID' });
    }

    // Validate month and year
    const monthNum = month ? parseInt(month as string) : new Date().getMonth() + 1;
    const yearNum = year ? parseInt(year as string) : new Date().getFullYear();

    if (monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Invalid month' });
    }

    // Calculate date range for the month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

    // Fetch only confirmed bookings for this service in the month
    // Pending bookings should not block the calendar until provider approves them
    const bookings = await Booking.find({
      serviceType: serviceType as ServiceType,
      serviceId: new Types.ObjectId(serviceId),
      date: { $gte: startDate, $lte: endDate },
      status: BookingStatus.CONFIRMED
    });

    // Get blocked dates from the service model
    let blockedDates: Array<{ date: Date; reason: string; blockedAt: Date }> = [];
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let service: any = null;
      switch (serviceType) {
        case ServiceType.VENUE:
          service = await Venue.findById(serviceId);
          break;
        case ServiceType.CATERING:
          service = await Catering.findById(serviceId);
          break;
        case ServiceType.PHOTOGRAPHY:
          service = await Photography.findById(serviceId);
          break;
        case ServiceType.VIDEOGRAPHY:
          service = await Videography.findById(serviceId);
          break;
        case ServiceType.BRIDAL_MAKEUP:
          service = await BridalMakeup.findById(serviceId);
          break;
        case ServiceType.DECORATION:
          service = await Decoration.findById(serviceId);
          break;
      }

      if (service && service.blockedDates && Array.isArray(service.blockedDates)) {
        blockedDates = service.blockedDates.filter((blocked: { date: Date }) => {
          const blockedDate = new Date(blocked.date);
          return blockedDate >= startDate && blockedDate <= endDate;
        });
      }
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
      // Continue without blocked dates if there's an error
    }

    // Build bookedDates object
    const bookedDates: { [date: string]: Array<{ time: string; status: string; type?: string; reason?: string }> } = {};

    // Add booking dates
    bookings.forEach(booking => {
      const dateStr = booking.date.toISOString().split('T')[0];
      if (!bookedDates[dateStr]) {
        bookedDates[dateStr] = [];
      }
      bookedDates[dateStr].push({
        time: booking.time,
        status: booking.status,
        type: 'booking'
      });
    });

    // Add manually blocked dates
    blockedDates.forEach(blocked => {
      const dateStr = new Date(blocked.date).toISOString().split('T')[0];
      if (!bookedDates[dateStr]) {
        bookedDates[dateStr] = [];
      }
      bookedDates[dateStr].push({
        time: 'all-day',
        status: 'blocked',
        type: 'manual',
        reason: blocked.reason
      });
    });

    res.json({ bookedDates });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// GET /api/bookings/provider/incoming - Get incoming bookings for provider
router.get('/provider/incoming', authenticateToken, requireProvider, async (req: AuthRequest, res: Response) => {
  try {
    const providerId = req.user!.id;
    
    // Find all bookings where providerId matches
    const bookings = await Booking.find({ 
      providerId: new Types.ObjectId(providerId)
    })
    .populate('customerId', 'firstName lastName email phone')
    .sort({ createdAt: -1 });

    // Transform bookings to include service details
    const transformedBookings = await Promise.all(bookings.map(async (booking) => {
      let serviceName = 'Unknown Service';
      let serviceImage = 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400';
      
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let service: any = null;
        
        switch (booking.serviceType) {
          case ServiceType.VENUE:
            service = await Venue.findById(booking.serviceId);
            break;
          case ServiceType.CATERING:
            service = await Catering.findById(booking.serviceId);
            break;
          case ServiceType.PHOTOGRAPHY:
            service = await Photography.findById(booking.serviceId);
            break;
          case ServiceType.VIDEOGRAPHY:
            service = await Videography.findById(booking.serviceId);
            break;
          case ServiceType.BRIDAL_MAKEUP:
            service = await BridalMakeup.findById(booking.serviceId);
            break;
          case ServiceType.DECORATION:
            service = await Decoration.findById(booking.serviceId);
            break;
        }
        
        if (service) {
          serviceName = service.name;
          serviceImage = service.images?.[0]?.url || serviceImage;
        }
      } catch (error) {
        console.error('Error fetching service details:', error);
      }

      return {
        id: (booking._id as Types.ObjectId).toString(),
        serviceId: booking.serviceId.toString(),
        serviceType: booking.serviceType,
        serviceName,
        serviceImage,
        // For backward compatibility
        venueName: serviceName,
        venueImage: serviceImage,
        date: booking.date,
        time: booking.time,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        totalPrice: booking.totalPrice,
        guestCount: booking.guestCount,
        contactPerson: booking.contactPerson,
        contactPhone: booking.contactPhone,
        contactEmail: booking.contactEmail,
        specialRequests: booking.specialRequests,
        createdAt: booking.createdAt
      };
    }));

    res.json(transformedBookings);
  } catch (error) {
    console.error('Error fetching provider bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// PUT /api/bookings/:id/accept - Accept a booking (Provider only)
router.put('/:id/accept', authenticateToken, requireProvider, async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      providerId: req.user!.id
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or unauthorized' });
    }

    if (booking.status !== BookingStatus.PENDING) {
      return res.status(400).json({ error: 'Only pending bookings can be accepted' });
    }

    booking.status = BookingStatus.CONFIRMED;
    await booking.save();

    res.json({
      message: 'Booking accepted successfully',
      booking: {
        id: (booking._id as Types.ObjectId).toString(),
        status: booking.status
      }
    });
  } catch (error) {
    console.error('Error accepting booking:', error);
    res.status(500).json({ error: 'Failed to accept booking' });
  }
});

// PUT /api/bookings/:id/reject - Reject a booking (Provider only)
router.put('/:id/reject', authenticateToken, requireProvider, async (req: AuthRequest, res: Response) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      providerId: req.user!.id
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or unauthorized' });
    }

    if (booking.status !== BookingStatus.PENDING) {
      return res.status(400).json({ error: 'Only pending bookings can be rejected' });
    }

    booking.status = BookingStatus.REJECTED;
    await booking.save();

    res.json({
      message: 'Booking rejected successfully',
      booking: {
        id: (booking._id as Types.ObjectId).toString(),
        status: booking.status
      }
    });
  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({ error: 'Failed to reject booking' });
  }
});

// POST /api/bookings - Create a new booking
router.post('/', authenticateToken, createBookingValidation, async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { venueId, serviceId, serviceType, date, time, guestCount, contactPerson, contactPhone, contactEmail, specialRequests } = req.body;

    // Support both old (venueId) and new (serviceId + serviceType) formats
    const actualServiceId = serviceId || venueId;
    const actualServiceType = serviceType || ServiceType.VENUE;

    if (!actualServiceId) {
      return res.status(400).json({ error: 'Service ID is required' });
    }

    // Fetch the service to get provider and price information
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let service: any = null;
    let providerId: Types.ObjectId | null = null;
    let totalPrice = 0;

    try {
      switch (actualServiceType) {
        case ServiceType.VENUE:
          service = await Venue.findOne({ _id: actualServiceId, status: 'APPROVED', isActive: true });
          if (service) {
            providerId = service.providerId;
            totalPrice = service.basePrice + (guestCount * (service.pricePerGuest || 0));
          }
          break;
        case ServiceType.CATERING:
          service = await Catering.findOne({ _id: actualServiceId, status: 'APPROVED', isActive: true });
          if (service) {
            providerId = service.provider;
            totalPrice = service.basePrice;
          }
          break;
        case ServiceType.PHOTOGRAPHY:
          service = await Photography.findOne({ _id: actualServiceId, status: 'APPROVED', isActive: true });
          if (service) {
            providerId = service.provider;
            totalPrice = service.basePrice;
          }
          break;
        case ServiceType.VIDEOGRAPHY:
          service = await Videography.findOne({ _id: actualServiceId, status: 'APPROVED', isActive: true });
          if (service) {
            providerId = service.provider;
            totalPrice = service.basePrice;
          }
          break;
        case ServiceType.BRIDAL_MAKEUP:
          service = await BridalMakeup.findOne({ _id: actualServiceId, status: 'APPROVED', isActive: true });
          if (service) {
            providerId = service.provider;
            totalPrice = service.basePrice;
          }
          break;
        case ServiceType.DECORATION:
          service = await Decoration.findOne({ _id: actualServiceId, status: 'APPROVED', isActive: true });
          if (service) {
            providerId = service.provider;
            totalPrice = service.basePrice;
          }
          break;
      }
    } catch (error) {
      console.error('Error fetching service:', error);
    }

    if (!service || !providerId) {
      return res.status(404).json({ error: 'Service not found or not available for booking' });
    }

    // Prevent self-booking: Check if the user is trying to book their own service
    if (req.user!.id === providerId.toString()) {
      return res.status(400).json({ error: 'Providers cannot book their own services' });
    }

    const booking = await Booking.create({
      customerId: req.user!.id,
      providerId,
      serviceType: actualServiceType,
      serviceId: new Types.ObjectId(actualServiceId),
      // For backward compatibility
      venueId: actualServiceType === ServiceType.VENUE ? new Types.ObjectId(actualServiceId) : undefined,
      date: new Date(date),
      time,
      totalPrice,
      guestCount,
      contactPerson,
      contactPhone,
      contactEmail,
      specialRequests
    });

    // Return success response
    res.status(201).json({
      id: (booking._id as Types.ObjectId).toString(),
      serviceId: booking.serviceId.toString(),
      serviceType: booking.serviceType,
      date: booking.date.toISOString().split('T')[0],
      time: booking.time,
      status: booking.status,
      totalPrice: booking.totalPrice,
      guestCount: booking.guestCount,
      contactPerson: booking.contactPerson,
      contactPhone: booking.contactPhone,
      contactEmail: booking.contactEmail
    });
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