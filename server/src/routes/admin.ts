import { Router, Response } from 'express';
import { Types } from 'mongoose';
import User, { UserRole, IUser } from '../models/User';
import Venue from '../models/Venue';
import Catering from '../models/Catering';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();


// GET /api/admin/users - Get all users (Admin only)
router.get('/users', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { role, page = 1, limit = 10, search } = req.query;

    interface Filter {
      role?: unknown;
      $or?: ({
        firstName: {
          $regex: string;
          $options: string;
        };
        lastName?: undefined;
        email?: undefined;
      } | {
        lastName: {
          $regex: string;
          $options: string;
        };
        firstName?: undefined;
        email?: undefined;
      } | {
        email: {
          $regex: string;
          $options: string;
        };
        firstName?: undefined;
        lastName?: undefined;
      })[];
    }

    const filter: Filter = {};
    
    if (role && role !== 'ALL') {
      filter.role = role;
    }

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
    
    const user = await User.findById(userId).select('-password -firebaseUid');
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

// DELETE /api/admin/users/:id - Delete user (Admin only)
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

    // If deleting a provider, also delete their venues and catering services
    if (user.role === UserRole.PROVIDER) {
      await Venue.deleteMany({ providerId: user._id });
      await Catering.deleteMany({ provider: user._id });
    }

    await User.findByIdAndDelete(userId);

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
      rejectedCateringServices
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
      Catering.countDocuments({ status: 'REJECTED' })
    ]);

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
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
