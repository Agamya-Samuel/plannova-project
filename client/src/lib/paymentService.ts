import api from './api';

// Define types for payment responses
interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  bookingId: string;
}

interface VerifyPaymentResponse {
  success: boolean;
  paymentId: string;
  orderId: string;
}

interface PaymentStatusResponse {
  bookingId: string;
  paymentStatus: string;
  totalPrice: number;
  advanceAmount: number;
  remainingAmount: number;
}

// Define Razorpay types
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayPaymentResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  notes: Record<string, string>;
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayPaymentFailureResponse {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: Record<string, unknown>;
  };
}

// Declare Razorpay on window object
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, callback: (response: unknown) => void) => void;
}

// Load Razorpay script dynamically
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

// Create a payment order
export const createPaymentOrder = async (bookingId: string): Promise<CreateOrderResponse> => {
  try {
    const response = await api.post<CreateOrderResponse>('/payments/create-order', { bookingId });
    return response.data;
  } catch (error) {
    console.error('Error creating payment order:', error);
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to create payment order');
    } else {
      throw new Error('Failed to create payment order');
    }
  }
};

// Verify payment after successful payment
export const verifyPayment = async (
  orderId: string,
  paymentId: string,
  signature: string,
  bookingId: string
): Promise<VerifyPaymentResponse> => {
  try {
    const response = await api.post<VerifyPaymentResponse>('/payments/verify-payment', {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      bookingId
    });
    return response.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to verify payment');
    } else {
      throw new Error('Failed to verify payment');
    }
  }
};

// Get payment status
export const getPaymentStatus = async (bookingId: string): Promise<PaymentStatusResponse> => {
  try {
    const response = await api.get<PaymentStatusResponse>(`/payments/status/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching payment status:', error);
    if (error instanceof Error) {
      throw new Error(error.message || 'Failed to fetch payment status');
    } else {
      throw new Error('Failed to fetch payment status');
    }
  }
};

// Check if Razorpay is configured on the server
export const checkRazorpayConfig = async (): Promise<boolean> => {
  try {
    const response = await api.get<{ configured: boolean }>('/payments/config-status');
    return response.data.configured;
  } catch (error) {
    console.error('Error checking Razorpay configuration:', error);
    return false;
  }
};

// Process payment using Razorpay checkout
export const processPayment = async (
  bookingId: string,
  amount: number,
  currency: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string
): Promise<{ success: boolean; paymentId?: string; orderId?: string }> => {
  try {
    // Check if Razorpay is configured
    const isConfigured = await checkRazorpayConfig();
    if (!isConfigured) {
      throw new Error('Payment gateway is not properly configured. Please contact support.');
    }

    // Load Razorpay script
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      throw new Error('Failed to load payment gateway. Please try again.');
    }

    // Create order
    const orderData = await createPaymentOrder(bookingId);
    
    // Configure Razorpay options
    const options: RazorpayOptions = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_your_key_id_here',
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'Plannova',
      description: 'Booking Payment',
      order_id: orderData.orderId,
      handler: async function (response: RazorpayPaymentResponse) {
        try {
          // Verify payment on server
          await verifyPayment(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature,
            bookingId
          );
        } catch (error) {
          console.error('Payment verification failed:', error);
          throw new Error('Payment verification failed');
        }
      },
      prefill: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone
      },
      notes: {
        bookingId: bookingId
      },
      theme: {
        color: '#ef4444' // Red color to match Plannova theme
      },
      modal: {
        ondismiss: function() {
          console.log('Payment dialog closed by user');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    
    return new Promise((resolve, reject) => {
      // Set up success handler
      options.handler = async function (response: RazorpayPaymentResponse) {
        try {
          // Verify payment on server
          await verifyPayment(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature,
            bookingId
          );
          
          // Payment successful
          resolve({
            success: true,
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id
          });
        } catch (error) {
          console.error('Payment verification failed:', error);
          reject(new Error('Payment verification failed'));
        }
      };
      
      rzp.on('payment.failed', function (response: unknown) {
        console.error('Payment failed:', response);
        reject(new Error('Payment failed. Please try again.'));
      });
      
      // Open the payment dialog
      rzp.open();
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('An unexpected error occurred while processing payment');
    }
  }
};