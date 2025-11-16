import { Router, Response } from 'express';
import User, { UserRole } from '../models/User.js';
import Venue from '../models/Venue.js';
import Catering from '../models/Catering.js';
import Photography from '../models/Photography.js';
import Videography from '../models/Videography.js';
import Decoration from '../models/Decoration.js';
import Entertainment from '../models/Entertainment.js';
import BridalMakeup from '../models/BridalMakeup.js';
import { authenticateToken, requireStaffOrAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/staff/providers - List providers with search + pagination
router.get('/providers', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    const filter: Record<string, unknown> = { role: UserRole.PROVIDER };

    if (search && search.toString().trim()) {
      const term = search.toString().trim();
      filter.$or = [
        { firstName: { $regex: term, $options: 'i' } },
        { lastName: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
      ];
    }

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    const providers = await User.find(filter)
      .select('-password -firebaseUid')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    const providersWithCounts = await Promise.all(
      providers.map(async (u) => {
        const [venueCount, cateringCount, photoCount, videoCount, decoCount, entCount, makeupCount] = await Promise.all([
          Venue.countDocuments({ providerId: u._id, isDeleted: { $ne: true } }),
          Catering.countDocuments({ provider: u._id, isDeleted: { $ne: true } }),
          Photography.countDocuments({ provider: u._id, isDeleted: { $ne: true } }),
          Videography.countDocuments({ provider: u._id, isDeleted: { $ne: true } }),
          Decoration.countDocuments({ provider: u._id, isDeleted: { $ne: true } }),
          Entertainment.countDocuments({ provider: u._id, isDeleted: { $ne: true } }),
          BridalMakeup.countDocuments({ provider: u._id, isDeleted: { $ne: true } }),
        ]);
        return {
          ...u.toObject(),
          counts: { venues: venueCount, catering: cateringCount, photography: photoCount, videography: videoCount, decoration: decoCount, entertainment: entCount, bridalMakeup: makeupCount },
        };
      })
    );

    const total = await User.countDocuments(filter);

    res.json({
      providers: providersWithCounts,
      pagination: { page: pageNumber, limit: limitNumber, total, pages: Math.ceil(total / limitNumber) },
    });
  } catch (err) {
    console.error('Error fetching providers (staff):', err);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// GET /api/staff/providers/:id - Provider profile + works
router.get('/providers/:id', authenticateToken, requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const provider = await User.findById(id).select('-password -firebaseUid');
    if (!provider || provider.role !== UserRole.PROVIDER) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const [venues, catering, photography, videography, decoration, entertainment, bridalMakeup] = await Promise.all([
      Venue.find({ providerId: provider._id, isDeleted: { $ne: true } }).select('name status images createdAt'),
      Catering.find({ provider: provider._id, isDeleted: { $ne: true } }).select('name status images createdAt'),
      Photography.find({ provider: provider._id, isDeleted: { $ne: true } }).select('name status images createdAt'),
      Videography.find({ provider: provider._id, isDeleted: { $ne: true } }).select('name status images createdAt'),
      Decoration.find({ provider: provider._id, isDeleted: { $ne: true } }).select('name status images createdAt'),
      Entertainment.find({ provider: provider._id, isDeleted: { $ne: true } }).select('name status images createdAt'),
      BridalMakeup.find({ provider: provider._id, isDeleted: { $ne: true } }).select('name status images createdAt'),
    ]);

    res.json({ provider, works: { venues, catering, photography, videography, decoration, entertainment, bridalMakeup } });
  } catch (err) {
    console.error('Error fetching provider detail (staff):', err);
    res.status(500).json({ error: 'Failed to fetch provider' });
  }
});

export default router;




