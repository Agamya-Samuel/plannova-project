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

    const bookings = await Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('customerId', 'firstName lastName email phone')
      .populate('providerId', 'firstName lastName email phone')
      .lean();

    // Build rich response including service details
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
          id: (booking._id as Types.ObjectId).toString(),
          serviceId: booking.serviceId?.toString(),
          serviceType: booking.serviceType,
          serviceName,
          serviceImage,
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
          provider: providerContact,
          createdAt: booking.createdAt
        };
      })
    );

    const total = await Booking.countDocuments(filter);

    res.json({
      bookings: transformed,
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

