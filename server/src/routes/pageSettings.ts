import { Router, Request, Response } from 'express';
import PageSetting from '../models/PageSetting.js';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Public: get page settings by key (e.g., home)
router.get('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const doc = await PageSetting.findOne({ key });
    if (!doc) {
      return res.status(404).json({ error: 'Page settings not found' });
    }
    res.json(doc);
  } catch (error) {
    console.error('Error fetching page settings:', error);
    res.status(500).json({ error: 'Failed to fetch page settings' });
  }
});

// Admin: upsert page settings by key
router.put('/:key', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { key } = req.params;
    const { title, description, backgroundImages, textGradientFrom, textGradientTo, typingOptions } = req.body as { title: string; description?: string; backgroundImages: string[]; textGradientFrom?: string; textGradientTo?: string; typingOptions?: string[] };

    if (!title || !Array.isArray(backgroundImages)) {
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const updated = await PageSetting.findOneAndUpdate(
      { key },
      { $set: { title, description, backgroundImages, textGradientFrom, textGradientTo, typingOptions, updatedBy: req.user ? req.user.id : undefined } },
      { new: true, upsert: true }
    );

    res.json(updated);
  } catch (error) {
    console.error('Error updating page settings:', error);
    res.status(500).json({ error: 'Failed to update page settings' });
  }
});

export default router;

