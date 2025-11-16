import { Router, Response } from 'express';
import { Types } from 'mongoose';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import Booking from '../models/Booking.js';
import { createOrder, verifyPayment } from '../services/razorpayService.js';
import { PaymentStatus } from '../models/Booking.js';

const router = Router();

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
    
    // Create Razorpay order
    const order = await createOrder(
      amountInPaise,
      'INR',
      `booking_${bookingId}_${Date.now()}`
    );

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      bookingId: bookingId
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
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
      return res.status(400).json({ error: 'Missing required payment information' });
    }

    // Validate booking ID
    if (!Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
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

    // Verify payment signature
    const isPaymentVerified = verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    
    if (!isPaymentVerified) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // Update booking payment status
    booking.paymentStatus = PaymentStatus.PAID;
    booking.advanceAmount = booking.totalPrice; // Assuming full payment for now
    booking.remainingAmount = 0;
    await booking.save();

    res.json({
      message: 'Payment successful',
      bookingId: bookingId,
      paymentStatus: booking.paymentStatus
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
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
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
});

export default router;