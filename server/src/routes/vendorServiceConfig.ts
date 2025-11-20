import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { authenticateToken, AuthRequest, requireProvider } from '../middleware/auth.js';
import VendorServiceConfig, { PaymentMode, ServiceType } from '../models/VendorServiceConfig.js';
// Import all service models to find the service by serviceType and serviceId
import Venue from '../models/Venue.js';
import Catering from '../models/Catering.js';
import Photography from '../models/Photography.js';
import Videography from '../models/Videography.js';
import BridalMakeup from '../models/BridalMakeup.js';
import Decoration from '../models/Decoration.js';
import Entertainment from '../models/Entertainment.js';

const router = Router();

// Validation middleware for vendor service config
const vendorServiceConfigValidation = [
  body('serviceType').isIn(Object.values(ServiceType)).withMessage('Invalid service type'),
  body('paymentMode').isIn(Object.values(PaymentMode)).withMessage('Invalid payment mode')
];

// GET /api/vendor-service-config - Get all vendor service configs for the authenticated provider
router.get('/', authenticateToken, requireProvider, async (req: AuthRequest, res: Response) => {
  try {
    const configs = await VendorServiceConfig.find({ vendorId: req.user!.id });
    res.json(configs);
  } catch (error) {
    console.error('Error fetching vendor service configs:', error);
    res.status(500).json({ error: 'Failed to fetch vendor service configs' });
  }
});

// GET /api/vendor-service-config/:serviceType - Get vendor service config for a specific service type
router.get('/:serviceType', authenticateToken, requireProvider, async (req: AuthRequest, res: Response) => {
  try {
    const { serviceType } = req.params;
    
    if (!Object.values(ServiceType).includes(serviceType as ServiceType)) {
      return res.status(400).json({ error: 'Invalid service type' });
    }
    
    const config = await VendorServiceConfig.findOne({ 
      vendorId: req.user!.id, 
      serviceType 
    });
    
    res.json(config || { 
      vendorId: req.user!.id, 
      serviceType, 
      paymentMode: PaymentMode.ONLINE_CASH 
    });
  } catch (error) {
    console.error('Error fetching vendor service config:', error);
    res.status(500).json({ error: 'Failed to fetch vendor service config' });
  }
});

// POST /api/vendor-service-config - Create or update vendor service config
router.post('/', authenticateToken, requireProvider, vendorServiceConfigValidation, async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { serviceType, paymentMode } = req.body;

    // Create or update the vendor service config
    const config = await VendorServiceConfig.findOneAndUpdate(
      { vendorId: req.user!.id, serviceType },
      { vendorId: req.user!.id, serviceType, paymentMode },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(config);
  } catch (error) {
    console.error('Error creating/updating vendor service config:', error);
    res.status(500).json({ error: 'Failed to create/update vendor service config' });
  }
});

// GET /api/vendor-service-config/:serviceType/payment-options/:serviceId - Get available payment options for a service
// This endpoint finds the service document directly (not a Booking) to get the provider's payment config
router.get('/:serviceType/payment-options/:serviceId', async (req, res: Response) => {
  try {
    const { serviceType, serviceId } = req.params;
    
    // Validate service type
    if (!Object.values(ServiceType).includes(serviceType as ServiceType)) {
      return res.status(400).json({ error: 'Invalid service type' });
    }
    
    // Validate service ID
    if (!Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({ error: 'Invalid service ID' });
    }
    
    // Find the service document based on serviceType
    // Note: Venue uses providerId, while other services use provider field
    // Using unknown type to avoid importing all service interfaces
    let service: unknown = null;
    let providerId: Types.ObjectId | null = null;
    
    const serviceObjectId = new Types.ObjectId(serviceId);
    
    // Query the appropriate service model based on serviceType
    switch (serviceType) {
      case ServiceType.VENUE: {
        const venueService = await Venue.findById(serviceObjectId);
        service = venueService;
        providerId = venueService?.providerId || null;
        break;
      }
      case ServiceType.CATERING: {
        const cateringService = await Catering.findById(serviceObjectId);
        service = cateringService;
        providerId = cateringService?.provider || null;
        break;
      }
      case ServiceType.PHOTOGRAPHY: {
        const photographyService = await Photography.findById(serviceObjectId);
        service = photographyService;
        providerId = photographyService?.provider || null;
        break;
      }
      case ServiceType.VIDEOGRAPHY: {
        const videographyService = await Videography.findById(serviceObjectId);
        service = videographyService;
        providerId = videographyService?.provider || null;
        break;
      }
      case ServiceType.BRIDAL_MAKEUP: {
        const bridalMakeupService = await BridalMakeup.findById(serviceObjectId);
        service = bridalMakeupService;
        providerId = bridalMakeupService?.provider || null;
        break;
      }
      case ServiceType.DECORATION: {
        const decorationService = await Decoration.findById(serviceObjectId);
        service = decorationService;
        providerId = decorationService?.provider || null;
        break;
      }
      case ServiceType.ENTERTAINMENT: {
        const entertainmentService = await Entertainment.findById(serviceObjectId);
        service = entertainmentService;
        providerId = entertainmentService?.provider || null;
        break;
      }
      default:
        return res.status(400).json({ error: 'Unsupported service type' });
    }
    
    // Check if service was found
    if (!service || !providerId) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Find the vendor service config for this provider and service type
    const config = await VendorServiceConfig.findOne({ 
      vendorId: providerId, 
      serviceType 
    });
    
    // Return payment options
    // cash is always available, online depends on the config
    const paymentOptions = {
      cash: true,
      online: config ? config.paymentMode === PaymentMode.ONLINE_CASH : true
    };
    
    res.json(paymentOptions);
  } catch (error) {
    console.error('Error fetching payment options:', error);
    res.status(500).json({ error: 'Failed to fetch payment options' });
  }
});

export default router;