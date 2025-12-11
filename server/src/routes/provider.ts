import { Router, Response } from 'express';
import { Types } from 'mongoose';
import Booking, { BookingType, PaymentStatus, ServiceType } from '../models/Booking.js';
import Venue from '../models/Venue.js';
import Catering from '../models/Catering.js';
import Photography from '../models/Photography.js';
import Videography from '../models/Videography.js';
import BridalMakeup from '../models/BridalMakeup.js';
import Decoration from '../models/Decoration.js';
import Entertainment from '../models/Entertainment.js';
import User from '../models/User.js';
import { authenticateToken, requireProvider, AuthRequest } from '../middleware/auth.js';
import { getS3Url } from '../utils/s3.js';

const router = Router();

// GET /api/provider/bookings - Get all bookings for the logged-in provider with filters
// Similar to admin/bookings but automatically filtered by providerId
router.get('/bookings', authenticateToken, requireProvider, async (req: AuthRequest, res: Response) => {
  try {
    const providerId = req.user!.id;
    
    const { 
      page = '1', 
      limit = '20', 
      serviceType, 
      paymentType, 
      paymentStatus, 
      dateFrom, 
      dateTo,
      search 
    } = req.query as { 
      page?: string; 
      limit?: string; 
      serviceType?: string; 
      paymentType?: string; 
      paymentStatus?: string; 
      dateFrom?: string; 
      dateTo?: string; 
      search?: string;
    };

    const pageNum = Math.max(parseInt(page || '1', 10), 1);
    const limitNum = Math.min(Math.max(parseInt(limit || '20', 10), 1), 100);

    // Always filter by providerId - providers can only see their own bookings
    const filter: Record<string, unknown> = {
      providerId: new Types.ObjectId(providerId)
    };

    // Apply service type filter
    if (serviceType && Object.values(ServiceType).includes(serviceType as ServiceType)) {
      filter.serviceType = serviceType;
    }

    // Apply payment type filter
    if (paymentType && Object.values(BookingType).includes(paymentType as BookingType)) {
      filter.bookingType = paymentType;
    }

    // Apply payment status filter
    if (paymentStatus && Object.values(PaymentStatus).includes(paymentStatus as PaymentStatus)) {
      filter.paymentStatus = paymentStatus;
    }

    // Apply date range filter
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) {
        (filter.date as Record<string, unknown>).$gte = new Date(dateFrom);
      }
      if (dateTo) {
        (filter.date as Record<string, unknown>).$lte = new Date(dateTo);
      }
    }

    // Apply search filter
    if (search && search.trim()) {
      const searchTerm = search.trim();
      const userSearchFilter = {
        $or: [
          { firstName: { $regex: searchTerm, $options: 'i' } },
          { lastName: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } }
        ]
      };

      // Find users matching the search term
      const matchingUsers = await User.find(userSearchFilter, '_id');
      const userIds = matchingUsers.map(user => user._id);

      // Filter bookings by customer
      filter.$or = [
        { customerId: { $in: userIds } },
        { contactPerson: { $regex: searchTerm, $options: 'i' } },
        { contactEmail: { $regex: searchTerm, $options: 'i' } },
        { contactPhone: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Fetch all bookings (before pagination) to group them properly
    const allBookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .populate('customerId', 'firstName lastName email phone')
      .populate('providerId', 'firstName lastName email phone')
      .lean();

    // Group bookings by bookingGroupId to prevent duplicate cards for multi-date bookings
    const groupedBookings: { [key: string]: typeof allBookings } = {};
    const ungroupedBookings: typeof allBookings = [];

    allBookings.forEach(booking => {
      const groupId = (booking as { bookingGroupId?: string }).bookingGroupId;
      if (groupId) {
        if (!groupedBookings[groupId]) {
          groupedBookings[groupId] = [];
        }
        groupedBookings[groupId].push(booking);
      } else {
        ungroupedBookings.push(booking);
      }
    });

    // Transform grouped bookings into single booking objects
    const transformedGroupedBookings = await Promise.all(
      Object.values(groupedBookings).map(async (group) => {
        // Use the first booking as the primary one for display
        const primaryBooking = group[0];
        
        // Get all dates in the group, sorted chronologically
        const dates = group.map(b => new Date((b as { date: Date }).date))
          .sort((a, b) => a.getTime() - b.getTime());
        
        // Calculate total price for all bookings in the group
        const totalPrice = group.reduce((sum, b) => sum + ((b as { totalPrice: number }).totalPrice || 0), 0);
        
        // Build rich response for the grouped booking
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
          switch ((primaryBooking as { serviceType: string }).serviceType) {
            case ServiceType.VENUE:
              service = await Venue.findById((primaryBooking as { serviceId: Types.ObjectId }).serviceId);
              break;
            case ServiceType.CATERING:
              service = await Catering.findById((primaryBooking as { serviceId: Types.ObjectId }).serviceId);
              break;
            case ServiceType.PHOTOGRAPHY:
              service = await Photography.findById((primaryBooking as { serviceId: Types.ObjectId }).serviceId);
              break;
            case ServiceType.VIDEOGRAPHY:
              service = await Videography.findById((primaryBooking as { serviceId: Types.ObjectId }).serviceId);
              break;
            case ServiceType.BRIDAL_MAKEUP:
              service = await BridalMakeup.findById((primaryBooking as { serviceId: Types.ObjectId }).serviceId);
              break;
            case ServiceType.DECORATION:
              service = await Decoration.findById((primaryBooking as { serviceId: Types.ObjectId }).serviceId);
              break;
            case ServiceType.ENTERTAINMENT:
              service = await Entertainment.findById((primaryBooking as { serviceId: Types.ObjectId }).serviceId);
              break;
          }

          if (service) {
            serviceName = service.name;
            const imageUrl = service.images?.[0]?.url;
            serviceImage = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : getS3Url(imageUrl)) : serviceImage;

            if (service.contact) {
              providerContact = {
                name: service.contact.name || serviceName,
                email: service.contact.email || '',
                phone: service.contact.phone || ''
              };
            }
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const provider = (primaryBooking as any).providerId;
          if (provider && !providerContact.email) {
            providerContact = {
              name: `${provider.firstName || ''} ${provider.lastName || ''}`.trim() || 'Provider',
              email: provider.email || '',
              phone: provider.phone || ''
            };
          }
        } catch (error) {
          console.error('Error fetching service/provider details (provider/bookings):', error);
        }

        return {
          id: String((primaryBooking as unknown as { _id: Types.ObjectId })._id),
          serviceId: String((primaryBooking as unknown as { serviceId: Types.ObjectId }).serviceId),
          serviceType: (primaryBooking as { serviceType: string }).serviceType,
          serviceName,
          serviceImage,
          // Group information
          isGroupBooking: true,
          bookingGroupId: (primaryBooking as { bookingGroupId?: string }).bookingGroupId,
          dates: dates.map(d => d.toISOString().split('T')[0]),
          date: dates[0].toISOString().split('T')[0], // First date for display
          time: (primaryBooking as { time: string }).time,
          status: (primaryBooking as { status: string }).status,
          paymentStatus: (primaryBooking as { paymentStatus: string }).paymentStatus,
          bookingType: (primaryBooking as { bookingType: string }).bookingType,
          paymentMode: (primaryBooking as { paymentMode: string }).paymentMode,
          totalPrice,
          guestCount: (primaryBooking as { guestCount: number }).guestCount,
          contactPerson: (primaryBooking as { contactPerson: string }).contactPerson,
          contactPhone: (primaryBooking as { contactPhone: string }).contactPhone,
          contactEmail: (primaryBooking as { contactEmail: string }).contactEmail,
          specialRequests: (primaryBooking as { specialRequests?: string }).specialRequests,
          provider: providerContact,
          createdAt: (primaryBooking as { createdAt: Date }).createdAt
        };
      })
    );

    // Transform ungrouped bookings
    const transformedUngroupedBookings = await Promise.all(
      ungroupedBookings.map(async (booking) => {
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
            // Transform image URL from S3 key to full URL if needed
            const imageUrl = service.images?.[0]?.url;
            serviceImage = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : getS3Url(imageUrl)) : serviceImage;

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
          console.error('Error fetching service/provider details (provider/bookings):', error);
        }

        return {
          id: String((booking as unknown as { _id: Types.ObjectId })._id),
          serviceId: String((booking as unknown as { serviceId: Types.ObjectId }).serviceId),
          serviceType: (booking as { serviceType: string }).serviceType,
          serviceName,
          serviceImage,
          date: (booking as { date: Date }).date,
          time: (booking as { time: string }).time,
          status: (booking as { status: string }).status,
          paymentStatus: (booking as { paymentStatus: string }).paymentStatus,
          bookingType: (booking as { bookingType: string }).bookingType,
          paymentMode: (booking as { paymentMode: string }).paymentMode,
          totalPrice: (booking as { totalPrice: number }).totalPrice,
          guestCount: (booking as { guestCount: number }).guestCount,
          contactPerson: (booking as { contactPerson: string }).contactPerson,
          contactPhone: (booking as { contactPhone: string }).contactPhone,
          contactEmail: (booking as { contactEmail: string }).contactEmail,
          specialRequests: (booking as { specialRequests?: string }).specialRequests,
          provider: providerContact,
          createdAt: (booking as { createdAt: Date }).createdAt,
          bookingGroupId: (booking as { bookingGroupId?: string }).bookingGroupId
        };
      })
    );

    // Combine grouped and ungrouped bookings
    const allTransformedBookings = [...transformedGroupedBookings, ...transformedUngroupedBookings];
    
    // Apply pagination to the combined results
    const paginatedBookings = allTransformedBookings.slice(
      (pageNum - 1) * limitNum,
      pageNum * limitNum
    );

    // Total count is the number of unique bookings (grouped + ungrouped)
    const total = allTransformedBookings.length;

    res.json({
      bookings: paginatedBookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching bookings for provider:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /api/provider/payments - Get all payments for the logged-in provider
// Similar to admin/payments but automatically filtered by providerId
router.get('/payments', authenticateToken, requireProvider, async (req: AuthRequest, res: Response) => {
  try {
    const providerId = req.user!.id;
    
    // Get query parameters for filtering
    const { paymentMode, serviceType } = req.query;

    // Build filter object - always filter by providerId and exclude pending payments
    const filter: Record<string, unknown> = {
      providerId: new Types.ObjectId(providerId),
      paymentStatus: { $ne: PaymentStatus.PENDING }
    };

    // Add payment mode filter if provided
    if (paymentMode && paymentMode !== 'all') {
      filter.paymentMode = paymentMode;
    }

    // Add service type filter if provided
    if (serviceType && serviceType !== 'all') {
      filter.serviceType = serviceType;
    }

    // Get all bookings with populated service details and filters applied
    const bookings = await Booking.find(filter)
      .populate('customerId', 'firstName lastName')
      .populate('providerId', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Transform bookings to payment objects
    const payments = await Promise.all(bookings.map(async (booking) => {
      // Get service details
      let serviceName = 'Unknown Service';
      let serviceImage = 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400';
      let providerName = 'Unknown Provider';
      let customerName = 'Unknown Customer';

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
        }
      } catch (error) {
        console.error('Error fetching service details:', error);
      }

      // Get provider and customer names
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const provider = booking.providerId as any;
        if (provider && provider.firstName) {
          providerName = `${provider.firstName} ${provider.lastName || ''}`.trim();
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const customer = booking.customerId as any;
        if (customer && customer.firstName) {
          customerName = `${customer.firstName} ${customer.lastName || ''}`.trim();
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }

      return {
        id: booking._id,
        paymentId: booking._id, // Using booking ID as payment ID
        orderId: booking._id, // Using booking ID as order ID
        serviceType: booking.serviceType,
        serviceName,
        serviceImage,
        providerName,
        customerName,
        amount: booking.totalPrice,
        status: booking.paymentStatus,
        paymentMode: booking.paymentMode, // Include payment mode for revenue calculation
        date: booking.createdAt
      };
    }));

    res.json({
      payments
    });
  } catch (error) {
    console.error('Error fetching payments for provider:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

export default router;

