import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Types } from 'mongoose';
import { authenticateToken, AuthRequest, requireProvider } from '../middleware/auth.js';
import VendorServiceConfig, { PaymentMode, ServiceType } from '../models/VendorServiceConfig.js';
import Booking from '../models/Booking.js';

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

// GET /api/vendor-service-config/:serviceType/payment-options - Get available payment options for a service
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
    
    // Get the vendor service config
    const service = await Booking.findOne({ serviceId: new Types.ObjectId(serviceId) });
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    const config = await VendorServiceConfig.findOne({ 
      vendorId: service.providerId, 
      serviceType 
    });
    
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