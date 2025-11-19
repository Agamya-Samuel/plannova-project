import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import Booking, { BookingStatus, IBooking, ServiceType, BookingType, PaymentMode, PaymentStatus } from '../models/Booking.js';
import { authenticateToken, AuthRequest, requireProvider, requireStaffOrAdmin } from '../middleware/auth.js';
import Venue, { IVenue } from '../models/Venue.js';
import Catering from '../models/Catering.js';
import Photography from '../models/Photography.js';
import Videography from '../models/Videography.js';
import BridalMakeup from '../models/BridalMakeup.js';
import Decoration from '../models/Decoration.js';
import Entertainment from '../models/Entertainment.js';

const router = Router();

// Validation middleware for booking creation
const createBookingValidation = [
  body('time').notEmpty().withMessage('Time is required'),
  body('guestCount').isInt({ min: 1 }).withMessage('Guest count must be at least 1'),
  body('contactPerson').trim().notEmpty().withMessage('Contact person is required'),
  body('contactPhone').trim().notEmpty().withMessage('Contact phone is required'),
  body('contactEmail').isEmail().withMessage('Valid email is required')
];

// Custom validation middleware for date/dates
const validateBookingDates = (req: AuthRequest, res: Response, next: () => void) => {
  const { date, dates } = req.body;
  
  // Either date or dates must be provided
  if (!date && (!dates || !Array.isArray(dates) || dates.length === 0)) {
    return res.status(400).json({ error: 'Either date or dates array is required' });
  }
  
  // If dates array is provided, validate each date
  if (dates && Array.isArray(dates) && dates.length > 0) {
    for (const dateStr of dates) {
      if (!dateStr || typeof dateStr !== 'string' || isNaN(Date.parse(dateStr))) {
        return res.status(400).json({ error: `Invalid date format in dates array: ${dateStr}` });
      }
    }
  }
  
  // If single date is provided, validate it
  if (date) {
    if (typeof date !== 'string' || isNaN(Date.parse(date))) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
  }
  
  next();
};

// Interface for a booking populated with venue details
interface IPopulatedBooking extends Omit<IBooking, 'venueId'> {
  venueId?: IVenue;
}

// Interface for populated user data
interface IPopulatedUser {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

// Interface for service objects
interface IService {
  _id: Types.ObjectId;
  name: string;
  images?: Array<{ url: string }>;
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  providerId?: Types.ObjectId;
  provider?: Types.ObjectId;
  basePrice: number;
  pricePerGuest?: number;
  reviews?: Array<{ rating: number }>;
  rating?: number;
  reviewCount?: number;
  totalReviews?: number;
  averageRating?: number;
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

    // Group bookings by bookingGroupId
    const groupedBookings: { [key: string]: IBooking[] } = {};
    const ungroupedBookings: IBooking[] = [];

    bookings.forEach(booking => {
      const groupId = booking.bookingGroupId;
      if (groupId) {
        if (!groupedBookings[groupId]) {
          groupedBookings[groupId] = [];
        }
        groupedBookings[groupId].push(booking);
      } else {
        ungroupedBookings.push(booking);
      }
    });

    // Transform grouped bookings
    const transformedGroupedBookings = Object.values(groupedBookings).map(group => {
      // Use the first booking as the primary one for display
      const primaryBooking = group[0];
      
      // Get all dates in the group
      const dates = group.map(b => b.date).sort((a, b) => a.getTime() - b.getTime());
      
      // Calculate total price for all bookings in the group
      const totalPrice = group.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      
      // Get provider contact info
      let providerContact = {
        name: 'Provider',
        email: '',
        phone: ''
      };
      
      try {
        const provider = primaryBooking.providerId as unknown as IPopulatedUser | null;
        if (provider) {
          providerContact = {
            name: `${provider.firstName || ''} ${provider.lastName || ''}`.trim() || 'Provider',
            email: provider.email || '',
            phone: provider.phone || ''
          };
        }
      } catch (error) {
        console.error('Error fetching provider details:', error);
      }
      
      return {
        id: (primaryBooking._id as Types.ObjectId).toString(),
        serviceId: (primaryBooking.serviceId as Types.ObjectId).toString(),
        serviceType: primaryBooking.serviceType,
        serviceName: '', // Will be populated below
        serviceImage: '', // Will be populated below
        // For backward compatibility
        venueName: '',
        venueImage: '',
        // Group information
        isGroupBooking: true,
        bookingGroupId: primaryBooking.bookingGroupId,
        dates: dates.map(d => d.toISOString().split('T')[0]),
        date: dates[0], // First date for display
        time: primaryBooking.time,
        status: primaryBooking.status,
        paymentStatus: primaryBooking.paymentStatus,
        paymentMode: primaryBooking.paymentMode,
        bookingType: primaryBooking.bookingType,
        totalPrice,
        guestCount: primaryBooking.guestCount,
        contactPerson: primaryBooking.contactPerson,
        contactPhone: primaryBooking.contactPhone,
        contactEmail: primaryBooking.contactEmail,
        specialRequests: primaryBooking.specialRequests,
        provider: providerContact,
        createdAt: primaryBooking.createdAt,
        // Individual bookings in the group
        individualBookings: group.map(b => ({
          id: (b._id as Types.ObjectId).toString(),
          date: b.date.toISOString().split('T')[0],
          status: b.status,
          paymentStatus: b.paymentStatus,
          paymentMode: b.paymentMode,
          bookingType: b.bookingType,
          totalPrice: b.totalPrice
        }))
      };
    });

    // Transform ungrouped bookings
    const transformedUngroupedBookings = await Promise.all(ungroupedBookings.map(async (booking) => {
      let serviceName = 'Unknown Service';
      let serviceImage = 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400';
      let providerContact = {
        name: 'Provider',
        email: '',
        phone: ''
      };
      
      try {
                let service: IService | null = null;
        
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
        case ServiceType.ENTERTAINMENT:
          service = await Entertainment.findById(booking.serviceId);
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
        const provider = booking.providerId as unknown as IPopulatedUser | null;
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
        serviceId: (booking.serviceId as Types.ObjectId).toString(),
        serviceType: booking.serviceType,
        serviceName,
        serviceImage,
        // For backward compatibility
        venueName: serviceName,
        venueImage: serviceImage,
        // Single booking information
        isGroupBooking: false,
        date: booking.date,
        time: booking.time,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentMode: booking.paymentMode,
        bookingType: booking.bookingType,
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

    // Combine all bookings
    const allBookings = [...transformedGroupedBookings, ...transformedUngroupedBookings];

    // Transform grouped bookings to include service details
    const transformedBookings = await Promise.all(allBookings.map(async (booking) => {
      // If service details are already populated, return as is
      if (booking.serviceName && booking.serviceName !== 'Unknown Service') {
        return booking;
      }
      
      let serviceName = 'Unknown Service';
      let serviceImage = 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400';
      
      try {
                let service: IService | null = null;
        
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
        case ServiceType.ENTERTAINMENT:
          service = await Entertainment.findById(booking.serviceId);
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
        ...booking,
        serviceName,
        serviceImage,
        // For backward compatibility
        venueName: serviceName,
        venueImage: serviceImage
      };
    }));

    res.json(transformedBookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /api/bookings/staff/all - Get all bookings (Staff/Admin)
router.get('/staff/all', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '200', status } = req.query as { page?: string; limit?: string; status?: string };
    const pageNum = Math.max(parseInt(page || '1', 10), 1);
    const limitNum = Math.min(Math.max(parseInt(limit || '200', 10), 1), 1000);

    const filter: Record<string, unknown> = {};
    if (status && typeof status === 'string' && status.toLowerCase() !== 'all') {
      filter.status = status.toUpperCase();
    }

    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('venueId', 'name images')
      .populate('providerId', 'firstName lastName email')
      .populate('customerId', 'firstName lastName email')
      .lean();

    // Build rich response including service and provider contact like customer route
    const transformed = await Promise.all(
      bookings.map(async (booking) => {
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
            case ServiceType.ENTERTAINMENT:
              service = await Entertainment.findById(booking.serviceId);
              break;
          }

          if (service) {
            serviceName = service.name;
            serviceImage = service.images?.[0]?.url || serviceImage;

            if (service.contact) {
              providerContact = {
                name: service.contact.name || serviceName,
                email: service.contact.email || '',
                phone: service.contact.phone || ''
              };
            }
          }

          // Fallback to populated provider user if service lacks contact
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const provider = (booking as any).providerId;
          if (provider && !providerContact.email) {
            providerContact = {
              name: `${provider.firstName || ''} ${provider.lastName || ''}`.trim() || 'Provider',
              email: provider.email || '',
              phone: provider.phone || ''
            };
          }
        } catch (error) {
          console.error('Error fetching service/provider details (staff/all):', error);
        }

        return {
          id: (booking._id as Types.ObjectId).toString(),
          serviceId: booking.serviceId?.toString(),
          serviceType: booking.serviceType,
          serviceName,
          serviceImage,
          // Backward compatibility with client fields
          venueName: serviceName,
          venueImage: serviceImage,
          date: booking.date,
          time: booking.time,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          paymentMode: booking.paymentMode,
          bookingType: booking.bookingType,
          totalPrice: booking.totalPrice,
          guestCount: booking.guestCount,
          contactPerson: booking.contactPerson,
          contactPhone: booking.contactPhone,
          contactEmail: booking.contactEmail,
          specialRequests: booking.specialRequests,
          provider: providerContact,
          createdAt: booking.createdAt
        };
      })
    );

    res.json(transformed);
  } catch (error) {
    console.error('Error fetching all bookings for staff:', error);
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
        case ServiceType.ENTERTAINMENT:
          service = await Entertainment.findById(serviceId);
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

    // Helper function to format date as YYYY-MM-DD in UTC
    const formatDateUTC = (date: Date): string => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Build bookedDates object
    const bookedDates: { [date: string]: Array<{ time: string; status: string; type?: string; reason?: string }> } = {};

    // Add booking dates
    bookings.forEach(booking => {
      const dateStr = formatDateUTC(booking.date);
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
      const dateStr = formatDateUTC(new Date(blocked.date));
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

    // Group bookings by bookingGroupId
    const groupedBookings: { [key: string]: IBooking[] } = {};
    const ungroupedBookings: IBooking[] = [];

    bookings.forEach(booking => {
      const groupId = booking.bookingGroupId;
      if (groupId) {
        if (!groupedBookings[groupId]) {
          groupedBookings[groupId] = [];
        }
        groupedBookings[groupId].push(booking);
      } else {
        ungroupedBookings.push(booking);
      }
    });

    // Transform grouped bookings
    const transformedGroupedBookings = Object.values(groupedBookings).map(group => {
      // Use the first booking as the primary one for display
      const primaryBooking = group[0];
      
      // Get all dates in the group
      const dates = group.map(b => b.date).sort((a, b) => a.getTime() - b.getTime());
      
      // Calculate total price for all bookings in the group
      const totalPrice = group.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      
      return {
        id: (primaryBooking._id as Types.ObjectId).toString(),
        serviceId: (primaryBooking.serviceId as Types.ObjectId).toString(),
        serviceType: primaryBooking.serviceType,
        serviceName: '', // Will be populated below
        serviceImage: '', // Will be populated below
        // For backward compatibility
        venueName: '',
        venueImage: '',
        // Group information
        isGroupBooking: true,
        bookingGroupId: primaryBooking.bookingGroupId,
        dates: dates.map(d => d.toISOString().split('T')[0]),
        date: dates[0], // First date for display
        time: primaryBooking.time,
        status: primaryBooking.status,
        paymentStatus: primaryBooking.paymentStatus,
        bookingType: primaryBooking.bookingType,
        paymentMode: primaryBooking.paymentMode,
        totalPrice,
        guestCount: primaryBooking.guestCount,
        contactPerson: primaryBooking.contactPerson,
        contactPhone: primaryBooking.contactPhone,
        contactEmail: primaryBooking.contactEmail,
        specialRequests: primaryBooking.specialRequests,
        createdAt: primaryBooking.createdAt,
        // Individual bookings in the group
        individualBookings: group.map(b => ({
          id: (b._id as Types.ObjectId).toString(),
          date: b.date.toISOString().split('T')[0],
          status: b.status,
          paymentStatus: b.paymentStatus,
          bookingType: b.bookingType,
          paymentMode: b.paymentMode,
          totalPrice: b.totalPrice
        }))
      };
    });

    // Transform ungrouped bookings
    const transformedUngroupedBookings = ungroupedBookings.map(booking => ({
      id: (booking._id as Types.ObjectId).toString(),
      serviceId: (booking.serviceId as Types.ObjectId).toString(),
      serviceType: booking.serviceType,
      serviceName: '', // Will be populated below
      serviceImage: '', // Will be populated below
      // For backward compatibility
      venueName: '',
      venueImage: '',
      // Single booking information
      isGroupBooking: false,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      bookingType: booking.bookingType,
      paymentMode: booking.paymentMode,
      totalPrice: booking.totalPrice,
      guestCount: booking.guestCount,
      contactPerson: booking.contactPerson,
      contactPhone: booking.contactPhone,
      contactEmail: booking.contactEmail,
      specialRequests: booking.specialRequests,
      createdAt: booking.createdAt
    }));

    // Combine all bookings
    const allBookings = [...transformedGroupedBookings, ...transformedUngroupedBookings];

    // Transform bookings to include service details
    const transformedBookings = await Promise.all(allBookings.map(async (booking) => {
      let serviceName = 'Unknown Service';
      let serviceImage = 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400';
      
      try {
                let service: IService | null = null;
        
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
        case ServiceType.ENTERTAINMENT:
          service = await Entertainment.findById(booking.serviceId);
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
        ...booking,
        serviceName,
        serviceImage,
        // For backward compatibility
        venueName: serviceName,
        venueImage: serviceImage
      };
    }));

    res.json(transformedBookings);
  } catch (error) {
    console.error('Error fetching provider bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /api/bookings/provider/stats - Get provider dashboard statistics
router.get('/provider/stats', authenticateToken, requireProvider, async (req: AuthRequest, res: Response) => {
  try {
    const providerId = req.user!.id;
    
    // Get all bookings for this provider
    const allBookings = await Booking.find({ 
      providerId: new Types.ObjectId(providerId)
    });
    
    // Calculate total bookings
    const totalBookings = allBookings.length;
    
    // Calculate revenue from confirmed bookings only
    const confirmedBookings = allBookings.filter(b => b.status === BookingStatus.CONFIRMED);
    const revenue = confirmedBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
    
    // Calculate response time (average time from booking creation to status change from PENDING)
    // Only consider bookings that are no longer pending
    const respondedBookings = allBookings.filter(b => b.status !== BookingStatus.PENDING);
    let totalResponseTime = 0;
    let responseTimeCount = 0;
    
    respondedBookings.forEach(booking => {
      // Calculate time difference between createdAt and updatedAt when status changed
      // If updatedAt is close to createdAt, provider responded immediately (or status changed quickly)
      const responseTimeMs = booking.updatedAt.getTime() - booking.createdAt.getTime();
      const responseTimeHours = responseTimeMs / (1000 * 60 * 60); // Convert to hours
      
      // Only count if the booking was actually responded to (not auto-updated)
      // Consider responses within reasonable time (less than 30 days)
      if (responseTimeHours > 0 && responseTimeHours < 720) {
        totalResponseTime += responseTimeHours;
        responseTimeCount++;
      }
    });
    
    const avgResponseTimeHours = responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0;
    
    // Format response time for display
    let responseTimeFormatted = '—';
    let responseTimeStatus = 'No data';
    
    if (avgResponseTimeHours > 0) {
      if (avgResponseTimeHours < 1) {
        const minutes = Math.round(avgResponseTimeHours * 60);
        responseTimeFormatted = `${minutes}m`;
        responseTimeStatus = minutes <= 30 ? 'Excellent' : 'Good';
      } else if (avgResponseTimeHours < 24) {
        const hours = Math.round(avgResponseTimeHours);
        responseTimeFormatted = `${hours}h`;
        responseTimeStatus = hours <= 2 ? 'Very Good' : hours <= 6 ? 'Good' : 'Fair';
      } else {
        const days = Math.round(avgResponseTimeHours / 24);
        responseTimeFormatted = `${days}d`;
        responseTimeStatus = days <= 1 ? 'Good' : days <= 3 ? 'Fair' : 'Poor';
      }
    }
    
    // Calculate average rating from all services owned by provider
    // We need to aggregate ratings from Venue, Catering, Photography, etc.
    let totalRating = 0;
    let totalReviews = 0;
    
    // Helper function to process service ratings
    const processServiceRating = (service: { rating?: number; reviewCount?: number; totalReviews?: number; averageRating?: number }) => {
      if (!service) return;
      
      // Services can have either reviewCount or totalReviews
      const reviewCount = service.reviewCount || service.totalReviews || 0;
      // Services can have either rating or averageRating
      const rating = service.rating || service.averageRating || 0;
      
      if (reviewCount > 0 && rating > 0) {
        totalRating += rating * reviewCount;
        totalReviews += reviewCount;
      }
    };
    
    // Get all services for this provider and calculate average rating
    try {
      // Fetch venues
      const venues = await Venue.find({ providerId: new Types.ObjectId(providerId) });
      for (const venue of venues) {
        // Venues use reviews array and store averageRating/totalReviews
        if (venue.reviews && venue.reviews.length > 0) {
          processServiceRating(venue);
        }
      }
      
      // Fetch catering services
      const cateringServices = await Catering.find({ provider: new Types.ObjectId(providerId) });
      cateringServices.forEach(service => processServiceRating(service));
      
      // Fetch photography services
      const photographyServices = await Photography.find({ provider: new Types.ObjectId(providerId) });
      photographyServices.forEach(service => processServiceRating(service));
      
      // Fetch videography services
      const videographyServices = await Videography.find({ provider: new Types.ObjectId(providerId) });
      videographyServices.forEach(service => processServiceRating(service));
      
      // Fetch bridal makeup services
      const bridalMakeupServices = await BridalMakeup.find({ provider: new Types.ObjectId(providerId) });
      bridalMakeupServices.forEach(service => processServiceRating(service));
      
      // Fetch decoration services
      const decorationServices = await Decoration.find({ provider: new Types.ObjectId(providerId) });
      decorationServices.forEach(service => processServiceRating(service));
      
      // Fetch entertainment services
      const entertainmentServices = await Entertainment.find({ provider: new Types.ObjectId(providerId) });
      entertainmentServices.forEach(service => processServiceRating(service));
    } catch (error) {
      console.error('Error fetching service ratings:', error);
      // Continue with bookings stats even if service rating fetch fails
    }
    
    // Calculate overall average rating
    const avgRating = totalReviews > 0 ? totalRating / totalReviews : 0;
    
    // Calculate bookings trend (this month vs last month)
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const bookingsThisMonth = allBookings.filter(b => b.createdAt >= startOfThisMonth).length;
    const bookingsLastMonth = allBookings.filter(b => {
      const created = b.createdAt;
      return created >= startOfLastMonth && created <= endOfLastMonth;
    }).length;
    
    const bookingsGrowth = bookingsLastMonth > 0 
      ? Math.round(((bookingsThisMonth - bookingsLastMonth) / bookingsLastMonth) * 100)
      : bookingsThisMonth > 0 ? 100 : 0;
    
    // Calculate revenue trend
    const revenueThisMonth = confirmedBookings
      .filter(b => b.createdAt >= startOfThisMonth)
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const revenueLastMonth = confirmedBookings
      .filter(b => {
        const created = b.createdAt;
        return created >= startOfLastMonth && created <= endOfLastMonth;
      })
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    
    const revenueGrowth = revenueLastMonth > 0
      ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
      : revenueThisMonth > 0 ? 100 : 0;
    
    res.json({
      totalBookings,
      bookingsGrowth,
      revenue,
      revenueGrowth,
      avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
      totalReviews,
      responseTime: responseTimeFormatted,
      responseTimeStatus,
      responseTimeHours: avgResponseTimeHours
    });
  } catch (error) {
    console.error('Error fetching provider stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// PUT /api/bookings/:id/accept - Accept a booking (Provider only)
router.put('/:id/accept', authenticateToken, requireProvider, async (req: AuthRequest, res: Response) => {
  try {
    // First, find the booking to get its bookingGroupId if it exists
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

    // If this is a group booking, update all bookings in the group
    if (booking.bookingGroupId) {
      // Update all bookings in the same group
      await Booking.updateMany(
        { bookingGroupId: booking.bookingGroupId },
        { status: BookingStatus.CONFIRMED }
      );
    } else {
      // Single booking
      booking.status = BookingStatus.CONFIRMED;
      await booking.save();
    }

    res.json({
      message: 'Booking accepted successfully',
      booking: {
        id: (booking._id as Types.ObjectId).toString(),
        status: BookingStatus.CONFIRMED,
        // Include bookingGroupId if it exists
        bookingGroupId: booking.bookingGroupId
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
    // First, find the booking to get its bookingGroupId if it exists
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

    // If this is a group booking, update all bookings in the group
    if (booking.bookingGroupId) {
      // Update all bookings in the same group
      await Booking.updateMany(
        { bookingGroupId: booking.bookingGroupId },
        { status: BookingStatus.REJECTED }
      );
    } else {
      // Single booking
      booking.status = BookingStatus.REJECTED;
      await booking.save();
    }

    res.json({
      message: 'Booking rejected successfully',
      booking: {
        id: (booking._id as Types.ObjectId).toString(),
        status: BookingStatus.REJECTED,
        // Include bookingGroupId if it exists
        bookingGroupId: booking.bookingGroupId
      }
    });
  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({ error: 'Failed to reject booking' });
  }
});

// PUT /api/bookings/:id/complete - Mark a booking as completed (Provider only)
router.put('/:id/complete', authenticateToken, requireProvider, async (req: AuthRequest, res: Response) => {
  try {
    // First, find the booking to get its bookingGroupId if it exists
    const booking = await Booking.findOne({
      _id: req.params.id,
      providerId: req.user!.id
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or unauthorized' });
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      return res.status(400).json({ error: 'Only confirmed bookings can be marked as completed' });
    }

    // Verify the event date has passed
    const eventDate = new Date(booking.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (eventDate > today) {
      return res.status(400).json({ error: 'Cannot mark future bookings as completed. The event must have occurred.' });
    }

    // If this is a group booking, update all bookings in the group
    if (booking.bookingGroupId) {
      // Update all bookings in the same group
      await Booking.updateMany(
        { bookingGroupId: booking.bookingGroupId },
        { status: BookingStatus.COMPLETED }
      );
    } else {
      // Single booking
      booking.status = BookingStatus.COMPLETED;
      await booking.save();
    }

    res.json({
      message: 'Booking marked as completed successfully',
      booking: {
        id: (booking._id as Types.ObjectId).toString(),
        status: BookingStatus.COMPLETED,
        // Include bookingGroupId if it exists
        bookingGroupId: booking.bookingGroupId
      }
    });
  } catch (error) {
    console.error('Error completing booking:', error);
    res.status(500).json({ error: 'Failed to mark booking as completed' });
  }
});

// POST /api/bookings - Create a new booking
router.post('/', authenticateToken, createBookingValidation, validateBookingDates, async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { venueId, serviceId, serviceType, date, time, guestCount, contactPerson, contactPhone, contactEmail, specialRequests, dates, paymentMode } = req.body;

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
            // Calculate total price including per-guest pricing if applicable
            totalPrice = service.basePrice + (guestCount * (service.pricePerGuest || 0));
          }
          break;
        case ServiceType.PHOTOGRAPHY:
          service = await Photography.findOne({ _id: actualServiceId, status: 'APPROVED', isActive: true });
          if (service) {
            providerId = service.provider;
            // Calculate total price including per-guest pricing if applicable
            totalPrice = service.basePrice + (guestCount * (service.pricePerGuest || 0));
          }
          break;
        case ServiceType.VIDEOGRAPHY:
          service = await Videography.findOne({ _id: actualServiceId, status: 'APPROVED', isActive: true });
          if (service) {
            providerId = service.provider;
            // Calculate total price including per-guest pricing if applicable
            totalPrice = service.basePrice + (guestCount * (service.pricePerGuest || 0));
          }
          break;
        case ServiceType.BRIDAL_MAKEUP:
          service = await BridalMakeup.findOne({ _id: actualServiceId, status: 'APPROVED', isActive: true });
          if (service) {
            providerId = service.provider;
            // Calculate total price including per-guest pricing if applicable
            totalPrice = service.basePrice + (guestCount * (service.pricePerGuest || 0));
          }
          break;
        case ServiceType.DECORATION:
          service = await Decoration.findOne({ _id: actualServiceId, status: 'APPROVED', isActive: true });
          if (service) {
            providerId = service.provider;
            // Calculate total price including per-guest pricing if applicable
            totalPrice = service.basePrice + (guestCount * (service.pricePerGuest || 0));
          }
          break;
        case ServiceType.ENTERTAINMENT:
          service = await Entertainment.findOne({ _id: actualServiceId, status: 'APPROVED', isActive: true });
          if (service) {
            providerId = service.provider;
            // Calculate total price including per-guest pricing if applicable
            totalPrice = service.basePrice + (guestCount * (service.pricePerGuest || 0));
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

    // Validate payment mode
    let bookingPaymentMode = PaymentMode.ONLINE;
    let bookingType = BookingType.ONLINE;
    
    if (paymentMode === 'CASH') {
      bookingPaymentMode = PaymentMode.CASH;
      bookingType = BookingType.CASH;
    }

    // Handle multiple dates - create a booking group
    if (dates && Array.isArray(dates) && dates.length > 1) {
      // Generate a unique booking group ID
      const bookingGroupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create bookings for each date
      const bookingPromises = dates.map((dateStr: string) => {
        const bookingData = {
          customerId: req.user!.id,
          providerId,
          serviceType: actualServiceType,
          serviceId: new Types.ObjectId(actualServiceId),
          // For backward compatibility
          venueId: actualServiceType === ServiceType.VENUE ? new Types.ObjectId(actualServiceId) : undefined,
          date: new Date(dateStr),
          time,
          totalPrice,
          guestCount: parseInt(guestCount),
          contactPerson,
          contactPhone,
          contactEmail,
          specialRequests,
          bookingGroupId, // Group all related bookings together
          paymentMode: bookingPaymentMode,
          bookingType: bookingType,
          // For cash bookings, set payment status to pending
          paymentStatus: paymentMode === 'CASH' ? PaymentStatus.PENDING : PaymentStatus.PENDING
        };
        
        return Booking.create(bookingData);
      });
      
      // Wait for all bookings to be created
      const bookings = await Promise.all(bookingPromises);
      
      // Return success response with group information
      res.status(201).json({
        message: `Successfully created ${bookings.length} bookings`,
        bookingGroupId,
        bookings: bookings.map(booking => ({
          id: (booking._id as Types.ObjectId).toString(),
          serviceId: booking.serviceId.toString(),
          serviceType: booking.serviceType,
          date: booking.date.toISOString().split('T')[0],
          time: booking.time,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          bookingType: booking.bookingType,
          paymentMode: booking.paymentMode,
          totalPrice: booking.totalPrice,
          guestCount: booking.guestCount,
          contactPerson: booking.contactPerson,
          contactPhone: booking.contactPhone,
          contactEmail: booking.contactEmail
        }))
      });
    } else {
      // Single booking (existing behavior)
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
        guestCount: parseInt(guestCount),
        contactPerson,
        contactPhone,
        contactEmail,
        specialRequests,
        paymentMode: bookingPaymentMode,
        bookingType: bookingType,
        // For cash bookings, set payment status to pending
        paymentStatus: paymentMode === 'CASH' ? PaymentStatus.PENDING : PaymentStatus.PENDING
      });

      // Return success response
      res.status(201).json({
        id: (booking._id as Types.ObjectId).toString(),
        serviceId: booking.serviceId.toString(),
        serviceType: booking.serviceType,
        date: booking.date.toISOString().split('T')[0],
        time: booking.time,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        bookingType: booking.bookingType,
        paymentMode: booking.paymentMode,
        totalPrice: booking.totalPrice,
        guestCount: booking.guestCount,
        contactPerson: booking.contactPerson,
        contactPhone: booking.contactPhone,
        contactEmail: booking.contactEmail
      });
    }
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

    // Only pending bookings can be cancelled by the customer
    // Once a provider approves (confirms) a booking, prevent customer cancellation
    if (booking.status !== BookingStatus.PENDING) {
      return res.status(400).json({ error: 'Only pending bookings can be cancelled' });
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