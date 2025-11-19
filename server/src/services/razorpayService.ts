import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || ''
});

// Define error interface for Razorpay responses
interface RazorpayError extends Error {
  response?: {
    data?: unknown;
  };
}

/**
 * Create a Razorpay order
 * @param amount - Amount in smallest currency unit (paise for INR)
 * @param currency - Currency code (e.g., 'INR')
 * @param receipt - Unique receipt ID for the order
 * @param notes - Additional notes for the order
 * @returns Promise resolving to the created order
 */
export const createOrder = async (amount: number, currency: string, receipt: string, notes?: Record<string, string>) => {
  try {
    // Validate inputs
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }
    
    if (!currency) {
      throw new Error('Currency is required');
    }
    
    if (!receipt) {
      throw new Error('Receipt is required');
    }

    const options = {
      amount: amount, // amount in the smallest currency unit
      currency: currency,
      receipt: receipt,
      notes: notes || {}
    };

    const order = await razorpay.orders.create(options);
    console.log(`[Razorpay] Order created successfully: ${order.id}`);
    return order;
  } catch (error) {
    const razorpayError = error as RazorpayError;
    const errorMessage = razorpayError.message;
    const errorData = razorpayError.response?.data;
    console.error(`[Razorpay] Error creating order: ${errorMessage}`, { 
      amount, 
      currency, 
      receipt,
      error: errorData || errorMessage
    });
    throw new Error(`Failed to create payment order: ${errorMessage}`);
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
    // Validate inputs
    if (!orderId || !paymentId || !signature) {
      console.error('[Razorpay] Missing required parameters for payment verification', { orderId, paymentId, signature });
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(orderId + '|' + paymentId)
      .digest('hex');

    const isValid = expectedSignature === signature;
    console.log(`[Razorpay] Payment verification ${isValid ? 'successful' : 'failed'} for order: ${orderId}`);
    return isValid;
  } catch (error) {
    const errorMessage = (error as Error).message;
    console.error(`[Razorpay] Error verifying payment: ${errorMessage}`, { orderId, paymentId });
    return false;
  }
};

/**
 * Capture a payment
 * @param paymentId - Razorpay payment ID
 * @param amount - Amount to capture in smallest currency unit
 * @param currency - Currency code
 * @returns Promise resolving to the captured payment details
 */
export const capturePayment = async (paymentId: string, amount: number, currency: string) => {
  try {
    // Validate inputs
    if (!paymentId) {
      throw new Error('Payment ID is required');
    }
    
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    const payment = await razorpay.payments.capture(paymentId, amount, currency);
    console.log(`[Razorpay] Payment captured successfully: ${paymentId}`);
    return payment;
  } catch (error) {
    const razorpayError = error as RazorpayError;
    const errorMessage = razorpayError.message;
    const errorData = razorpayError.response?.data;
    console.error(`[Razorpay] Error capturing payment: ${errorMessage}`, { 
      paymentId, 
      amount,
      error: errorData || errorMessage
    });
    throw new Error(`Failed to capture payment: ${errorMessage}`);
  }
};

/**
 * Refund a payment
 * @param paymentId - Razorpay payment ID
 * @param amount - Amount to refund in smallest currency unit
 * @param notes - Additional notes for the refund
 * @returns Promise resolving to the refund details
 */
export const refundPayment = async (paymentId: string, amount: number, notes?: Record<string, string>) => {
  try {
    // Validate inputs
    if (!paymentId) {
      throw new Error('Payment ID is required');
    }
    
    if (amount <= 0) {
      throw new Error('Refund amount must be greater than zero');
    }

    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount,
      notes: notes || {}
    });
    console.log(`[Razorpay] Payment refunded successfully: ${paymentId}`);
    return refund;
  } catch (error) {
    const razorpayError = error as RazorpayError;
    const errorMessage = razorpayError.message;
    const errorData = razorpayError.response?.data;
    console.error(`[Razorpay] Error refunding payment: ${errorMessage}`, { 
      paymentId, 
      amount,
      error: errorData || errorMessage
    });
    throw new Error(`Failed to process refund: ${errorMessage}`);
  }
};

/**
 * Fetch payment details
 * @param paymentId - Razorpay payment ID
 * @returns Promise resolving to the payment details
 */
export const fetchPayment = async (paymentId: string) => {
  try {
    // Validate inputs
    if (!paymentId) {
      throw new Error('Payment ID is required');
    }

    const payment = await razorpay.payments.fetch(paymentId);
    console.log(`[Razorpay] Payment details fetched successfully: ${paymentId}`);
    return payment;
  } catch (error) {
    const razorpayError = error as RazorpayError;
    const errorMessage = razorpayError.message;
    const errorData = razorpayError.response?.data;
    console.error(`[Razorpay] Error fetching payment: ${errorMessage}`, { 
      paymentId,
      error: errorData || errorMessage
    });
    throw new Error(`Failed to fetch payment: ${errorMessage}`);
  }
};

/**
 * Validate Razorpay configuration
 * @returns Boolean indicating if configuration is valid
 */
export const isConfigured = (): boolean => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  const configured = !!(keyId && keySecret);
  if (!configured) {
    console.warn('[Razorpay] Payment gateway is not properly configured');
  }
  
  return configured;
};

export default {
  createOrder,
  verifyPayment,
  capturePayment,
  refundPayment,
  fetchPayment,
  isConfigured
};