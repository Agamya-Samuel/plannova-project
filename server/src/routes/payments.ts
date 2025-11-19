import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import Booking from '../models/Booking.js';
import { createOrder, verifyPayment, isConfigured } from '../services/razorpayService.js';
import { PaymentStatus } from '../models/Booking.js';

const router = Router();

// Check if Razorpay is properly configured
router.get('/config-status', (req, res) => {
  const configured = isConfigured();
  res.json({ 
    configured,
    message: configured ? 'Razorpay is properly configured' : 'Razorpay is not configured properly'
  });
});

/**
 * Create a payment order for a booking
 * POST /api/payments/create-order
 */
router.post('/create-order', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.body;

    // Validate booking ID
    if (!Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    // Check if Razorpay is configured
    if (!isConfigured()) {
      return res.status(500).json({ error: 'Payment gateway is not configured properly' });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if booking belongs to the user
    if (booking.customerId.toString() !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized access to booking' });
    }

    // Check if booking is already paid
    if (booking.paymentStatus === PaymentStatus.PAID) {
      return res.status(400).json({ error: 'Booking is already paid' });
    }

    // Convert amount to paise (smallest currency unit)
    const amountInPaise = Math.round(booking.totalPrice * 100);
    
    // Log the amount for debugging
    console.log(`[Payment] Booking ID: ${bookingId}, Total Price: ${booking.totalPrice}, Amount in Paise: ${amountInPaise}`);
    
    // Validate the amount
    if (amountInPaise <= 0) {
      console.error(`[Payment] Invalid amount for booking ${bookingId}: ${amountInPaise}`);
      return res.status(400).json({ error: 'Invalid booking amount' });
    }
    
    // Validate amount is within reasonable limits (Razorpay has limits)
    if (amountInPaise > 1000000000) { // 10 million INR (~110k USD)
      console.error(`[Payment] Amount too large for booking ${bookingId}: ${amountInPaise}`);
      return res.status(400).json({ error: 'Booking amount exceeds maximum allowed limit' });
    }
    
    // Generate receipt with proper length
    const timestamp = Date.now();
    let receipt = `booking_${bookingId}_${timestamp}`;
    if (receipt.length > 40) {
      // Truncate to 40 characters as per Razorpay limits
      receipt = receipt.substring(0, 40);
    }
    
    console.log(`[Payment] Creating order with receipt: ${receipt}`);
    
    // Create Razorpay order with additional notes
    const order = await createOrder(
      amountInPaise,
      'INR',
      receipt,
      {
        bookingId: bookingId,
        serviceType: booking.serviceType,
        customerId: req.user!.id,
        customerEmail: req.user!.email || ''
      }
    );

    console.log(`Payment order created for booking ${bookingId}: ${order.id}`);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      bookingId: bookingId
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message || 'Failed to create payment order' });
    } else {
      res.status(500).json({ error: 'Failed to create payment order' });
    }
  }
});

/**
 * Verify payment and update booking status
 * POST /api/payments/verify-payment
 */
router.post('/verify-payment', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId) {
      console.error('[Payment] Missing required fields for payment verification', {
        orderId: !!razorpay_order_id,
        paymentId: !!razorpay_payment_id,
        signature: !!razorpay_signature,
        bookingId: !!bookingId
      });
      return res.status(400).json({ error: 'Missing required payment information' });
    }

    // Validate booking ID
    if (!Types.ObjectId.isValid(bookingId)) {
      console.error('[Payment] Invalid booking ID format', { bookingId });
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    // Check if Razorpay is configured
    if (!isConfigured()) {
      console.error('[Payment] Razorpay not properly configured');
      return res.status(500).json({ error: 'Payment gateway is not configured properly' });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.error('[Payment] Booking not found', { bookingId });
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if booking belongs to the user
    if (booking.customerId.toString() !== req.user!.id) {
      console.error('[Payment] Unauthorized access to booking', {
        userId: req.user!.id,
        customerId: booking.customerId.toString(),
        bookingId
      });
      return res.status(403).json({ error: 'Unauthorized access to booking' });
    }

    // Verify payment signature
    const isPaymentVerified = verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    
    if (!isPaymentVerified) {
      console.warn(`[Payment] Payment verification failed for order: ${razorpay_order_id}`, {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      });
      return res.status(400).json({ error: 'Payment verification failed. Please contact support if payment was deducted.' });
    }

    // Update booking payment status
    booking.paymentStatus = PaymentStatus.PAID;
    booking.advanceAmount = booking.totalPrice; // Assuming full payment for now
    booking.remainingAmount = 0;
    await booking.save();

    console.log(`[Payment] Payment successful for booking ${bookingId}: ${razorpay_payment_id}`);

    res.json({
      message: 'Payment successful',
      bookingId: bookingId,
      paymentStatus: booking.paymentStatus
    });
  } catch (error) {
    console.error('[Payment] Error verifying payment:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message || 'Failed to verify payment' });
    } else {
      res.status(500).json({ error: 'Failed to verify payment due to an unexpected error' });
    }
  }
});

/**
 * Get payment status for a booking
 * GET /api/payments/status/:bookingId
 */
router.get('/status/:bookingId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.params;

    // Validate booking ID
    if (!Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if booking belongs to the user or user is provider/admin
    const isAuthorized = (
      booking.customerId.toString() === req.user!.id ||
      booking.providerId.toString() === req.user!.id ||
      req.user!.role === 'ADMIN'
    );

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Unauthorized access to booking' });
    }

    res.json({
      bookingId: bookingId,
      paymentStatus: booking.paymentStatus,
      totalPrice: booking.totalPrice,
      advanceAmount: booking.advanceAmount,
      remainingAmount: booking.remainingAmount
    });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message || 'Failed to fetch payment status' });
    } else {
      res.status(500).json({ error: 'Failed to fetch payment status' });
    }
  }
});

export default router;