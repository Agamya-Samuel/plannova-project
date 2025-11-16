import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

/**
 * Create a Razorpay order
 * @param amount - Amount in smallest currency unit (paise for INR)
 * @param currency - Currency code (e.g., 'INR')
 * @param receipt - Unique receipt ID for the order
 * @returns Promise resolving to the created order
 */
export const createOrder = async (amount: number, currency: string, receipt: string) => {
  try {
    const options = {
      amount: amount, // amount in the smallest currency unit
      currency: currency,
      receipt: receipt
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw new Error('Failed to create payment order');
  }
};

/**
 * Verify Razorpay payment signature
 * @param orderId - Razorpay order ID
 * @param paymentId - Razorpay payment ID
 * @param signature - Payment signature from Razorpay
 * @returns Boolean indicating if signature is valid
 */
export const verifyPayment = (orderId: string, paymentId: string, signature: string): boolean => {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(orderId + '|' + paymentId)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Error verifying payment:', error);
    return false;
  }
};

/**
 * Capture a payment
 * @param paymentId - Razorpay payment ID
 * @param amount - Amount to capture in smallest currency unit
 * @returns Promise resolving to the captured payment details
 */
export const capturePayment = async (paymentId: string, amount: number) => {
  try {
    const payment = await razorpay.payments.capture(paymentId, amount, 'INR');
    return payment;
  } catch (error) {
    console.error('Error capturing payment:', error);
    throw new Error('Failed to capture payment');
  }
};

/**
 * Refund a payment
 * @param paymentId - Razorpay payment ID
 * @param amount - Amount to refund in smallest currency unit
 * @returns Promise resolving to the refund details
 */
export const refundPayment = async (paymentId: string, amount: number) => {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount
    });
    return refund;
  } catch (error) {
    console.error('Error refunding payment:', error);
    throw new Error('Failed to process refund');
  }
};

export default {
  createOrder,
  verifyPayment,
  capturePayment,
  refundPayment
};