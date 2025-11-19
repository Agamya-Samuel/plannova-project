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
    // Check if script is already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    
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
    
    // Handle different types of errors
    if (error instanceof Error) {
      // Network error
      if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
        throw new Error('Network connection failed. Please check your internet connection and try again.');
      }
      // HTTP error responses
      else if ('response' in error) {
        const apiError = error as { response?: { data?: { error?: string } } };
        throw new Error(apiError.response?.data?.error || 'Failed to create payment order. Please try again.');
      }
      // Other errors
      else {
        throw new Error(error.message || 'Failed to create payment order');
      }
    } else {
      throw new Error('Failed to create payment order. Please try again.');
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
    
    // Handle different types of errors
    if (error instanceof Error) {
      // Network error
      if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
        throw new Error('Network connection failed during payment verification. Please check your internet connection.');
      }
      // HTTP error responses
      else if ('response' in error) {
        const apiError = error as { response?: { data?: { error?: string } } };
        throw new Error(apiError.response?.data?.error || 'Failed to verify payment. Please contact support if payment was deducted.');
      }
      // Other errors
      else {
        throw new Error(error.message || 'Failed to verify payment');
      }
    } else {
      throw new Error('Failed to verify payment. Please contact support if payment was deducted.');
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
    
    // Handle different types of errors
    if (error instanceof Error) {
      // Network error
      if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
        throw new Error('Network connection failed. Please check your internet connection and try again.');
      }
      // HTTP error responses
      else if ('response' in error) {
        const apiError = error as { response?: { data?: { error?: string } } };
        throw new Error(apiError.response?.data?.error || 'Failed to fetch payment status');
      }
      // Other errors
      else {
        throw new Error(error.message || 'Failed to fetch payment status');
      }
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
    // If we can't check the configuration, assume it's configured to avoid blocking payments
    return true;
  }
};

// Define specific error types for different payment failure scenarios
interface PaymentError {
  type: 'payment_failed' | 'user_cancelled' | 'network_error' | 'verification_failed' | 'unknown_error';
  message: string;
  details?: Record<string, unknown>;
}

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
      throw {
        type: 'unknown_error',
        message: 'Payment gateway is not properly configured. Please contact support.'
      } as PaymentError;
    }

    // Load Razorpay script
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      throw {
        type: 'network_error',
        message: 'Failed to load payment gateway. Please check your internet connection and try again.'
      } as PaymentError;
    }

    // Create order
    const orderData = await createPaymentOrder(bookingId);
    
    // Return a Promise that will be resolved when payment is complete
    return new Promise((resolve, reject) => {
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
            
            // Payment successful
            resolve({
              success: true,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id
            });
          } catch (error) {
            console.error('Payment verification failed:', error);
            reject({
              type: 'verification_failed',
              message: 'Payment processed but verification failed. Please contact support if payment was deducted.',
              details: error instanceof Error ? { originalError: error.message } : {}
            } as PaymentError);
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
            // Reject with user cancellation error
            const userCancelledError = {
              type: 'user_cancelled',
              message: 'Payment was cancelled. You can complete the payment later from your bookings.'
            };
            console.log('Rejecting with user cancelled error:', userCancelledError);
            reject(userCancelledError);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      
      // Add error handling for Razorpay instance
      if (!rzp) {
        reject({
          type: 'unknown_error',
          message: 'Failed to initialize payment gateway. Please try again.'
        } as PaymentError);
        return;
      }
      
      rzp.on('payment.failed', function (response: unknown) {
        console.error('Payment failed:', response);
        
        // Extract error information from the response
        let errorMessage = 'Payment failed. Please try again.';
        let errorType: PaymentError['type'] = 'payment_failed';
        let errorDetails: Record<string, unknown> = {};
        
        // Handle case where response is null, undefined, or empty object
        if (response && typeof response === 'object' && Object.keys(response).length > 0) {
          const failureResponse = response as RazorpayPaymentFailureResponse;
          
          if (failureResponse.error) {
            const errorDetailsObj = failureResponse.error;
            
            // Check if error details object has content
            if (Object.keys(errorDetailsObj).length > 0) {
              errorMessage = errorDetailsObj.description || errorDetailsObj.reason || errorMessage;
              
              // Set specific error type based on the failure reason
              if (errorDetailsObj.reason === 'payment_failed' && errorDetailsObj.source === 'bank') {
                errorType = 'payment_failed';
                errorMessage = 'Your payment was declined by the bank. Please try another payment method or contact your bank.';
              } else if (errorDetailsObj.reason === 'authentication_failure') {
                errorType = 'payment_failed';
                errorMessage = 'Payment authentication failed. Please verify your payment details and try again.';
              } else if (errorDetailsObj.reason === 'card_expired') {
                errorType = 'payment_failed';
                errorMessage = 'The card you entered has expired. Please use another payment method.';
              } else if (errorDetailsObj.reason === 'insufficient_funds') {
                errorType = 'payment_failed';
                errorMessage = 'Insufficient funds in your account. Please use another payment method.';
              } else if (errorDetailsObj.reason === 'network_error') {
                errorType = 'network_error';
                errorMessage = 'Network error occurred during payment processing. Please check your connection and try again.';
              }
              
              errorDetails = {
                code: errorDetailsObj.code,
                description: errorDetailsObj.description,
                source: errorDetailsObj.source,
                step: errorDetailsObj.step,
                reason: errorDetailsObj.reason
              };
              
              console.error('Payment failure details:', errorDetails);
            } else {
              // Error object exists but is empty
              errorMessage = 'Payment failed due to an unknown error. Please try again or use a different payment method.';
            }
          } else {
            // Response object exists but doesn't have error property
            errorMessage = 'Payment failed due to an unexpected error. Please try again or use a different payment method.';
          }
        } else {
          // Response is null, undefined, or empty object
          errorMessage = 'Payment failed due to an unknown error. Please try again or use a different payment method.';
        }
        
        reject({
          type: errorType,
          message: errorMessage,
          details: errorDetails
        } as PaymentError);
      });
      
      // Open the payment dialog
      try {
        rzp.open();
      } catch (openError) {
        console.error('Error opening payment dialog:', openError);
        reject({
          type: 'unknown_error',
          message: 'Failed to open payment dialog. Please try again.'
        } as PaymentError);
      }
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    
    // Handle different types of errors
    if (error instanceof Error) {
      // Network error
      if (error.message.includes('fetch') || error.message.includes('NetworkError')) {
        throw {
          type: 'network_error',
          message: 'Network connection failed. Please check your internet connection and try again.'
        } as PaymentError;
      }
      // Other errors
      else {
        throw {
          type: 'unknown_error',
          message: error.message || 'An unexpected error occurred while processing payment'
        } as PaymentError;
      }
    } else {
      throw {
        type: 'unknown_error',
        message: 'An unexpected error occurred while processing payment'
      } as PaymentError;
    }
  }
};