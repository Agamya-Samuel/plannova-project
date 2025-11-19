import { Router, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import User, { UserRole, IUser } from '../models/User.js';
import Venue from '../models/Venue.js';
import Catering from '../models/Catering.js';
import Photography from '../models/Photography.js';
import Videography from '../models/Videography.js';
import BridalMakeup from '../models/BridalMakeup.js';
import Decoration from '../models/Decoration.js';
import Booking, { BookingStatus, BookingType, PaymentStatus, ServiceType } from '../models/Booking.js';
import Blog from '../models/Blog.js';
import Entertainment from '../models/Entertainment.js';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();


// GET /api/admin/users - Get all users (Admin only)
router.get('/users', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { role, page = 1, limit = 10, search } = req.query;

    const filter: Record<string, unknown> = {};
    
    if (role && role !== 'ALL') {
      filter.role = role;
    }

    // Exclude soft deleted users
    filter.isDeleted = { $ne: true };

    // Add search functionality
    if (search && search.toString().trim()) {
      const searchTerm = search.toString().trim();
      filter.$or = [
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    const users = await User.find(filter)
      .select('-password -firebaseUid')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    // Get venue and catering service counts for providers
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        interface UserObject extends IUser {
          venueCount?: number;
          cateringCount?: number;
        }
        const userObj = user.toObject() as UserObject;
        if (user.role === UserRole.PROVIDER) {
          const venueCount = await Venue.countDocuments({ providerId: user._id });
          const cateringCount = await Catering.countDocuments({ provider: user._id });
          userObj.venueCount = venueCount;
          userObj.cateringCount = cateringCount;
        }
        return userObj;
      })
    );

    const total = await User.countDocuments(filter);

    res.json({
      users: usersWithCounts,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/admin/users/:id - Get user by ID (Admin only)
router.get('/users/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findOne({ _id: userId, isDeleted: { $ne: true } }).select('-password -firebaseUid');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get additional data based on role
    let additionalData = {};
    if (user.role === UserRole.PROVIDER) {
      const venues = await Venue.find({ providerId: user._id }).select('name status createdAt');
      const cateringServices = await Catering.find({ provider: user._id }).select('name status createdAt');
      additionalData = { venues, cateringServices };
    }

    res.json({
      user,
      ...additionalData
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PATCH /api/admin/users/:id/status - Toggle user active status (Admin only)
router.patch('/users/:id/status', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean value' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from deactivating themselves
    if ((user._id as Types.ObjectId).toString() === req.user!.id && !isActive) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    user.isActive = isActive;
    user.updatedAt = new Date();
    await user.save();

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// DELETE /api/admin/users/:id - Soft delete user (Admin only)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (userId === req.user!.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Soft delete the user
    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    // If deleting a provider, also soft delete their services
    if (user.role === UserRole.PROVIDER) {
      await Venue.updateMany({ providerId: user._id }, { isDeleted: true, deletedAt: new Date() });
      await Catering.updateMany({ provider: user._id }, { isDeleted: true, deletedAt: new Date() });
      await Photography.updateMany({ provider: user._id }, { isDeleted: true, deletedAt: new Date() });
      await Videography.updateMany({ provider: user._id }, { isDeleted: true, deletedAt: new Date() });
      await BridalMakeup.updateMany({ provider: user._id }, { isDeleted: true, deletedAt: new Date() });
      await Decoration.updateMany({ provider: user._id }, { isDeleted: true, deletedAt: new Date() });
      await Booking.updateMany({ providerId: user._id }, { isDeleted: true, deletedAt: new Date() });
      await Blog.updateMany({ author: user._id }, { isDeleted: true, deletedAt: new Date() });
    }

    res.json({
      message: 'User deleted successfully',
      deletedUser: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// PATCH /api/admin/users/:id/role - Update user role (Admin only)
router.patch('/users/:id/role', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Prevent admin from changing their own role
    if (userId === req.user!.id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.role = role;
    user.updatedAt = new Date();
    await user.save();

    res.json({
      message: 'User role updated successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// GET /api/admin/stats - Get admin dashboard statistics (Admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers,
      totalCustomers,
      totalProviders,
      totalStaff,
      totalAdmins,
      totalVenues,
      pendingVenues,
      approvedVenues,
      rejectedVenues,
      totalCateringServices,
      pendingCateringServices,
      approvedCateringServices,
      rejectedCateringServices,
      totalBookings,
      confirmedBookings,
      revenueAgg
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: UserRole.CUSTOMER }),
      User.countDocuments({ role: UserRole.PROVIDER }),
      User.countDocuments({ role: UserRole.STAFF }),
      User.countDocuments({ role: UserRole.ADMIN }),
      Venue.countDocuments(),
      Venue.countDocuments({ status: 'PENDING' }),
      Venue.countDocuments({ status: 'APPROVED' }),
      Venue.countDocuments({ status: 'REJECTED' }),
      Catering.countDocuments(),
      Catering.countDocuments({ status: 'PENDING' }),
      Catering.countDocuments({ status: 'APPROVED' }),
      Catering.countDocuments({ status: 'REJECTED' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: BookingStatus.CONFIRMED }),
      Booking.aggregate([
        { $match: { status: BookingStatus.CONFIRMED } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ])
    ]);

    const revenue = Array.isArray(revenueAgg) && revenueAgg.length > 0 ? revenueAgg[0].total : 0;
    const successRate = totalBookings > 0 ? Math.round((confirmedBookings / totalBookings) * 100) : 0;

    res.json({
      users: {
        total: totalUsers,
        customers: totalCustomers,
        providers: totalProviders,
        staff: totalStaff,
        admins: totalAdmins
      },
      venues: {
        total: totalVenues,
        pending: pendingVenues,
        approved: approvedVenues,
        rejected: rejectedVenues
      },
      catering: {
        total: totalCateringServices,
        pending: pendingCateringServices,
        approved: approvedCateringServices,
        rejected: rejectedCateringServices
      },
      bookings: {
        total: totalBookings,
        confirmed: confirmedBookings,
        successRate
      },
      revenue
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/admin/trash - Get all soft deleted items (Admin only)
router.get('/trash', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    console.log('Trash endpoint called with query:', req.query);
    console.log('_authenticated user:', req.user);
    const { page = 1, limit = 10, type } = req.query;
    console.log('Type parameter:', type);
    
    // Handle empty string or undefined type parameter
    const processedType = (!type || type === '' || type === 'undefined') ? undefined : type;
    console.log('Processed type parameter:', processedType);
    
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    let deletedItems: Array<Record<string, unknown>> = [];
    let total = 0;

    // Get soft deleted users
    if (!processedType || processedType === 'users') {
      console.log('Fetching deleted users...');
      const users = await User.find({ isDeleted: true })
        .select('-password -firebaseUid')
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limitNumber);
      
      const usersWithDetails = await Promise.all(
        users.map(async (user) => ({
          ...user.toObject(),
          type: 'user',
          deletedAt: user.deletedAt
        }))
      );
      
      deletedItems = [...deletedItems, ...usersWithDetails];
      total += await User.countDocuments({ isDeleted: true });
    }

    // Get soft deleted venues
    if (!processedType || processedType === 'venues') {
      console.log('Fetching deleted venues...');
      const venues = await Venue.find({ isDeleted: true })
        .populate('providerId', 'firstName lastName email')
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limitNumber);
      
      const venuesWithDetails = venues.map(venue => ({
        ...venue.toObject(),
        type: 'venue',
        deletedAt: venue.deletedAt
      }));
      
      deletedItems = [...deletedItems, ...venuesWithDetails];
      total += await Venue.countDocuments({ isDeleted: true });
    }

    // Get soft deleted catering services
    if (!processedType || processedType === 'catering') {
      console.log('Fetching deleted catering services...');
      const cateringServices = await Catering.find({ isDeleted: true })
        .populate('provider', 'firstName lastName email')
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limitNumber);
      
      const cateringWithDetails = cateringServices.map(service => ({
        ...service.toObject(),
        type: 'catering',
        deletedAt: service.deletedAt
      }));
      
      deletedItems = [...deletedItems, ...cateringWithDetails];
      total += await Catering.countDocuments({ isDeleted: true });
    }

    // Get soft deleted photography services
    if (!processedType || processedType === 'photography') {
      console.log('Fetching deleted photography services...');
      const photographyServices = await Photography.find({ isDeleted: true })
        .populate('provider', 'firstName lastName email')
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limitNumber);
      
      const photographyWithDetails = photographyServices.map(service => ({
        ...service.toObject(),
        type: 'photography',
        deletedAt: service.deletedAt
      }));
      
      deletedItems = [...deletedItems, ...photographyWithDetails];
      total += await Photography.countDocuments({ isDeleted: true });
    }

    // Get soft deleted videography services
    if (!processedType || processedType === 'videography') {
      console.log('Fetching deleted videography services...');
      const videographyServices = await Videography.find({ isDeleted: true })
        .populate('provider', 'firstName lastName email')
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limitNumber);
      
      const videographyWithDetails = videographyServices.map(service => ({
        ...service.toObject(),
        type: 'videography',
        deletedAt: service.deletedAt
      }));
      
      deletedItems = [...deletedItems, ...videographyWithDetails];
      total += await Videography.countDocuments({ isDeleted: true });
    }

    // Get soft deleted bridal makeup services
    if (!processedType || processedType === 'bridal-makeup') {
      console.log('Fetching deleted bridal makeup services...');
      const bridalMakeupServices = await BridalMakeup.find({ isDeleted: true })
        .populate('provider', 'firstName lastName email')
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limitNumber);
      
      const bridalMakeupWithDetails = bridalMakeupServices.map(service => ({
        ...service.toObject(),
        type: 'bridal-makeup',
        deletedAt: service.deletedAt
      }));
      
      deletedItems = [...deletedItems, ...bridalMakeupWithDetails];
      total += await BridalMakeup.countDocuments({ isDeleted: true });
    }

    // Get soft deleted decoration services
    if (!processedType || processedType === 'decoration') {
      console.log('Fetching deleted decoration services...');
      const decorationServices = await Decoration.find({ isDeleted: true })
        .populate('provider', 'firstName lastName email')
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limitNumber);
      
      const decorationWithDetails = decorationServices.map(service => ({
        ...service.toObject(),
        type: 'decoration',
        deletedAt: service.deletedAt
      }));
      
      deletedItems = [...deletedItems, ...decorationWithDetails];
      total += await Decoration.countDocuments({ isDeleted: true });
    }

    // Get soft deleted bookings
    if (!processedType || processedType === 'bookings') {
      console.log('Fetching deleted bookings...');
      const bookings = await Booking.find({ isDeleted: true })
        .populate('customerId', 'firstName lastName email')
        .populate('providerId', 'firstName lastName email')
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limitNumber);
      
      const bookingsWithDetails = bookings.map(booking => ({
        ...booking.toObject(),
        type: 'booking',
        deletedAt: booking.deletedAt
      }));
      
      deletedItems = [...deletedItems, ...bookingsWithDetails];
      total += await Booking.countDocuments({ isDeleted: true });
    }

    // Get soft deleted blogs
    if (!processedType || processedType === 'blogs') {
      console.log('Fetching deleted blogs...');
      const blogs = await Blog.find({ isDeleted: true })
        .populate('author', 'firstName lastName email')
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(limitNumber);
      
      const blogsWithDetails = blogs.map(blog => ({
        ...blog.toObject(),
        type: 'blog',
        deletedAt: blog.deletedAt
      }));
      
      deletedItems = [...deletedItems, ...blogsWithDetails];
      total += await Blog.countDocuments({ isDeleted: true });
    }

    // Sort all items by deletedAt date
    deletedItems.sort((a, b) => {
      const dateA = a.deletedAt ? new Date(a.deletedAt as string).getTime() : 0;
      const dateB = b.deletedAt ? new Date(b.deletedAt as string).getTime() : 0;
      return dateB - dateA;
    });

    // Apply pagination to the combined list
    const paginatedItems = deletedItems.slice(skip, skip + limitNumber);

    console.log(`Returning ${paginatedItems.length} items out of ${total} total`);
    res.json({
      items: paginatedItems,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    console.error('Error fetching trash items:', error);
    res.status(500).json({ error: 'Failed to fetch trash items' });
  }
});

// POST /api/admin/trash/:id/restore - Restore a soft deleted item (Admin only)
router.post('/trash/:id/restore', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    let restoredItem: Record<string, unknown> | null = null;

    switch (type) {
      case 'user':
        restoredItem = await User.findByIdAndUpdate(id, { isDeleted: false, deletedAt: null }, { new: true });
        break;
      case 'venue':
        restoredItem = await Venue.findByIdAndUpdate(id, { isDeleted: false, deletedAt: null }, { new: true });
        break;
      case 'catering':
        restoredItem = await Catering.findByIdAndUpdate(id, { isDeleted: false, deletedAt: null }, { new: true });
        break;
      case 'photography':
        restoredItem = await Photography.findByIdAndUpdate(id, { isDeleted: false, deletedAt: null }, { new: true });
        break;
      case 'videography':
        restoredItem = await Videography.findByIdAndUpdate(id, { isDeleted: false, deletedAt: null }, { new: true });
        break;
      case 'bridal-makeup':
        restoredItem = await BridalMakeup.findByIdAndUpdate(id, { isDeleted: false, deletedAt: null }, { new: true });
        break;
      case 'decoration':
        restoredItem = await Decoration.findByIdAndUpdate(id, { isDeleted: false, deletedAt: null }, { new: true });
        break;
      case 'booking':
        restoredItem = await Booking.findByIdAndUpdate(id, { isDeleted: false, deletedAt: null }, { new: true });
        break;
      case 'blog':
        restoredItem = await Blog.findByIdAndUpdate(id, { isDeleted: false, deletedAt: null }, { new: true });
        break;
      default:
        return res.status(400).json({ error: 'Invalid item type' });
    }

    if (!restoredItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({
      message: 'Item restored successfully',
      item: restoredItem
    });
  } catch (error) {
    console.error('Error restoring item:', error);
    res.status(500).json({ error: 'Failed to restore item' });
  }
});

// DELETE /api/admin/trash/:id/permanent - Permanently delete an item (Admin only)
router.delete('/trash/:id/permanent', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { type } = req.body;

    let deletedItem: Record<string, unknown> | null = null;

    switch (type) {
      case 'user':
        deletedItem = await User.findByIdAndDelete(id);
        break;
      case 'venue':
        deletedItem = await Venue.findByIdAndDelete(id);
        break;
      case 'catering':
        deletedItem = await Catering.findByIdAndDelete(id);
        break;
      case 'photography':
        deletedItem = await Photography.findByIdAndDelete(id);
        break;
      case 'videography':
        deletedItem = await Videography.findByIdAndDelete(id);
        break;
      case 'bridal-makeup':
        deletedItem = await BridalMakeup.findByIdAndDelete(id);
        break;
      case 'decoration':
        deletedItem = await Decoration.findByIdAndDelete(id);
        break;
      case 'booking':
        deletedItem = await Booking.findByIdAndDelete(id);
        break;
      case 'blog':
        deletedItem = await Blog.findByIdAndDelete(id);
        break;
      default:
        return res.status(400).json({ error: 'Invalid item type' });
    }

    if (!deletedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({
      message: 'Item permanently deleted',
      item: deletedItem
    });
  } catch (error) {
    console.error('Error permanently deleting item:', error);
    res.status(500).json({ error: 'Failed to permanently delete item' });
  }
});

// GET /api/admin/bookings - Get all bookings with filters (Admin only)
router.get('/bookings', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { 
      page = '1', 
      limit = '20', 
      vendor, 
      serviceType, 
      paymentType, 
      paymentStatus, 
      dateFrom, 
      dateTo,
      search 
    } = req.query as { 
      page?: string; 
      limit?: string; 
      vendor?: string; 
      serviceType?: string; 
      paymentType?: string; 
      paymentStatus?: string; 
      dateFrom?: string; 
      dateTo?: string;
      search?: string;
    };

    const pageNum = Math.max(parseInt(page || '1', 10), 1);
    const limitNum = Math.min(Math.max(parseInt(limit || '20', 10), 1), 100);

    const filter: Record<string, unknown> = {};

    // Apply vendor filter
    if (vendor && Types.ObjectId.isValid(vendor)) {
      filter.providerId = new Types.ObjectId(vendor);
    }

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

      // Filter bookings by customer or provider
      filter.$or = [
        { customerId: { $in: userIds } },
        { providerId: { $in: userIds } },
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
          console.error('Error fetching service/provider details (admin/bookings):', error);
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
    console.error('Error fetching all bookings for admin:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /api/admin/payments - Get all payments for admin (Admin only)
router.get('/payments', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    // Get query parameters for filtering
    const { paymentMode, serviceType } = req.query;

    // Build filter object
    const filter: Record<string, unknown> = {
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
        date: booking.createdAt
      };
    }));

    res.json({
      payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// GET /api/admin/revenue - Get revenue statistics (Admin only)
router.get('/revenue', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    // Get all paid bookings
    const paidBookings = await Booking.find({ 
      paymentStatus: PaymentStatus.PAID 
    }).select('totalPrice paymentMode serviceType createdAt');

    // Calculate revenue statistics
    let totalPlatformRevenue = 0;
    let totalOnlineRevenue = 0;
    let totalCashRevenue = 0;

    paidBookings.forEach(booking => {
      totalPlatformRevenue += booking.totalPrice;
      
      if (booking.paymentMode === 'ONLINE') {
        totalOnlineRevenue += booking.totalPrice;
      } else if (booking.paymentMode === 'CASH') {
        totalCashRevenue += booking.totalPrice;
      }
    });

    res.json({
      summary: {
        totalPlatformRevenue,
        totalOnlineRevenue,
        totalCashRevenue
      },
      bookings: paidBookings.map(booking => ({
        id: booking._id,
        totalPrice: booking.totalPrice,
        paymentMode: booking.paymentMode,
        serviceType: booking.serviceType,
        date: booking.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
});

// PUT /api/admin/bookings/:id/payment-status - Update booking payment status (Admin only)
router.put('/bookings/:id/payment-status', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    // Validate payment status
    if (!Object.values(PaymentStatus).includes(paymentStatus)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }

    // Find the booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Store previous status for response
    const previousStatus = booking.paymentStatus;

    // Update payment status
    booking.paymentStatus = paymentStatus;
    booking.updatedAt = new Date();
    
    // If payment is marked as paid, also update advance and remaining amounts
    if (paymentStatus === PaymentStatus.PAID) {
      booking.advanceAmount = booking.totalPrice;
      booking.remainingAmount = 0;
    }
    
    await booking.save();

    // Populate related data for response
    const populatedBooking = await Booking.findById(id)
      .populate('customerId', 'firstName lastName email phone')
      .populate('providerId', 'firstName lastName email phone')
      .lean();

    // Get service details
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
      const provider = (populatedBooking as any)?.providerId;
      if (provider && !providerContact.email) {
        providerContact = {
          name: `${provider.firstName || ''} ${provider.lastName || ''}`.trim() || 'Provider',
          email: provider.email || '',
          phone: provider.phone || ''
        };
      }
    } catch (error) {
      console.error('Error fetching service/provider details (admin/bookings/payment-status):', error);
    }

    const transformedBooking = {
      id: (populatedBooking?._id as mongoose.Types.ObjectId).toString(),
      serviceId: populatedBooking?.serviceId?.toString(),
      serviceType: populatedBooking?.serviceType,
      serviceName,
      serviceImage,
      date: populatedBooking?.date,
      time: populatedBooking?.time,
      status: populatedBooking?.status,
      paymentStatus: populatedBooking?.paymentStatus,
      bookingType: populatedBooking?.bookingType,
      paymentMode: populatedBooking?.paymentMode,
      totalPrice: populatedBooking?.totalPrice,
      guestCount: populatedBooking?.guestCount,
      contactPerson: populatedBooking?.contactPerson,
      contactPhone: populatedBooking?.contactPhone,
      contactEmail: populatedBooking?.contactEmail,
      specialRequests: populatedBooking?.specialRequests,
      provider: providerContact,
      createdAt: populatedBooking?.createdAt
    };

    res.json({
      message: `Payment status updated from ${previousStatus} to ${paymentStatus}`,
      booking: transformedBooking
    });
  } catch (error) {
    console.error('Error updating booking payment status:', error);
    res.status(500).json({ error: 'Failed to update booking payment status' });
  }
});

export default router;
