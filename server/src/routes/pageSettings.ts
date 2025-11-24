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
    const { 
      title, 
      description, 
      backgroundImages, // Legacy field - kept for backward compatibility
      backgroundImagesMobile, 
      backgroundImagesLaptop, 
      textGradientFrom, 
      textGradientTo, 
      typingOptions,
      backgroundBlur
    } = req.body as { 
      title: string; 
      description?: string; 
      backgroundImages?: string[]; 
      backgroundImagesMobile?: string[]; 
      backgroundImagesLaptop?: string[]; 
      textGradientFrom?: string; 
      textGradientTo?: string; 
      typingOptions?: string[];
      backgroundBlur?: number;
    };

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    // Build update object - include all fields that are provided
    // Using Partial to allow optional fields, and Record for dynamic property assignment
    const updateData: Partial<{
      title: string;
      description?: string;
      backgroundImages?: string[];
      backgroundImagesMobile?: string[];
      backgroundImagesLaptop?: string[];
      textGradientFrom?: string;
      textGradientTo?: string;
      typingOptions?: string[];
      backgroundBlur?: number;
      updatedBy?: string;
    }> = {
      title,
      updatedBy: req.user ? req.user.id : undefined
    };

    if (description !== undefined) updateData.description = description;
    if (Array.isArray(backgroundImages)) updateData.backgroundImages = backgroundImages;
    if (Array.isArray(backgroundImagesMobile)) updateData.backgroundImagesMobile = backgroundImagesMobile;
    if (Array.isArray(backgroundImagesLaptop)) updateData.backgroundImagesLaptop = backgroundImagesLaptop;
    if (textGradientFrom !== undefined) updateData.textGradientFrom = textGradientFrom;
    if (textGradientTo !== undefined) updateData.textGradientTo = textGradientTo;
    if (Array.isArray(typingOptions)) updateData.typingOptions = typingOptions;
    if (backgroundBlur !== undefined) updateData.backgroundBlur = backgroundBlur;

    const updated = await PageSetting.findOneAndUpdate(
      { key },
      { $set: updateData },
      { new: true, upsert: true }
    );

    res.json(updated);
  } catch (error) {
    console.error('Error updating page settings:', error);
    res.status(500).json({ error: 'Failed to update page settings' });
  }
});

export default router;

