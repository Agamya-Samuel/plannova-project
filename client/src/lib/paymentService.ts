import api from './api';

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
export const createPaymentOrder = async (bookingId: string) => {
  try {
    const response = await api.post('/payments/create-order', { bookingId });
    return response.data;
  } catch (error) {
    console.error('Error creating payment order:', error);
    throw error;
  }
};

// Verify payment after successful payment
export const verifyPayment = async (
  orderId: string,
  paymentId: string,
  signature: string,
  bookingId: string
) => {
  try {
    const response = await api.post('/payments/verify-payment', {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      bookingId
    });
    return response.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

// Get payment status
export const getPaymentStatus = async (bookingId: string) => {
  try {
    const response = await api.get(`/payments/status/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching payment status:', error);
    throw error;
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
) => {
  try {
    // Load Razorpay script
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      throw new Error('Failed to load Razorpay SDK. Please try again.');
    }

    // Create order
    const orderData = await createPaymentOrder(bookingId);
    
    // Configure Razorpay options
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_your_key_id_here',
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'Plannova',
      description: 'Booking Payment',
      order_id: orderData.orderId,
      handler: async function (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
        try {
          // Verify payment on server
          await verifyPayment(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature,
            bookingId
          );
          
          // Payment successful
          return {
            success: true,
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id
          };
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
      }
    };

    // @ts-expect-error: Razorpay is loaded dynamically via script tag
    const rzp = new window.Razorpay(options);
    rzp.open();
    
    return new Promise((resolve, reject) => {
      // @ts-expect-error: Razorpay is loaded dynamically via script tag
      window.Razorpay.on('payment.success', (response: { razorpay_payment_id: string; razorpay_order_id: string }) => {
        resolve({
          success: true,
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id
        });
      });
      
      // @ts-expect-error: Razorpay is loaded dynamically via script tag
      window.Razorpay.on('payment.error', () => {
        reject(new Error('Payment failed'));
      });
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};