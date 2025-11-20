'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { processPayment, getPaymentStatus } from '@/lib/paymentService';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// Define the PaymentError type to match what's thrown by paymentService
interface PaymentError {
  type: string;
  message: string;
  details?: Record<string, unknown>;
}

interface PaymentButtonProps {
  bookingId: string;
  amount: number;
  currency?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  onPaymentSuccess?: () => void;
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  bookingId,
  amount,
  currency = 'INR',
  customerName,
  customerEmail,
  customerPhone,
  onPaymentSuccess
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handlePayment = async () => {
    if (!user) {
      toast.error('Please log in to make a payment');
      router.push('/auth/login');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Check current payment status
      const paymentStatus = await getPaymentStatus(bookingId);
      
      if (paymentStatus.paymentStatus === 'paid') {
        toast.success('This booking has already been paid');
        onPaymentSuccess?.();
        setIsProcessing(false);
        return;
      }

      // Process payment
      const result = await processPayment(
        bookingId,
        amount,
        currency,
        customerName,
        customerEmail,
        customerPhone
      );
      
      // Check if payment was successful
      if (result.success) {
        toast.success('Payment successful!');
        onPaymentSuccess?.();
      } else {
        // This shouldn't happen with the current implementation, but just in case
        toast.error('Payment processing completed but status is unclear. Please check your bookings.');
        onPaymentSuccess?.();
      }
    } catch (error) {
      // Handle case where error is null, undefined, or empty object (user cancellation)
      if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
        toast.info('Payment was cancelled. You can complete the payment later from your bookings.');
        setIsProcessing(false);
        return;
      }
      // Handle specific payment error types
      else if (error && typeof error === 'object' && 'type' in error) {
        const paymentError = error as PaymentError;
        
        switch (paymentError.type) {
          case 'user_cancelled':
            toast.info(paymentError.message);
            setIsProcessing(false);
            return;
          case 'payment_failed':
            toast.error(paymentError.message);
            break;
          case 'network_error':
            toast.error(paymentError.message);
            break;
          case 'verification_failed':
            toast.error(paymentError.message);
            break;
          case 'unknown_error':
          default:
            toast.error(paymentError.message || 'Payment failed. Please try again.');
            break;
        }
      } 
      // Handle generic errors
      else if (error instanceof Error) {
        // Check if it's a network error
        if (error.message.includes('fetch') || error.message.includes('network')) {
          toast.error('Network error. Please check your connection and try again.');
        } 
        // Check if it's a payment verification error
        else if (error.message.includes('verification')) {
          toast.error('Payment processed but verification failed. Please contact support.');
        }
        // Check if it's a general payment error
        else if (error.message.includes('Payment failed')) {
          toast.error('Payment was not completed. Please try again or use a different payment method.');
        }
        // Other errors
        else {
          toast.error(error.message || 'Payment failed. Please try again.');
        }
      } else {
        // Treat any other unknown error as a user cancellation to prevent stuck UI
        toast.info('Payment was cancelled. You can complete the payment later from your bookings.');
        setIsProcessing(false);
        return;
      }
      
      // Log error for debugging (except for user cancellations which we handled above)
      console.error('Payment error:', error);
    } finally {
      // Always reset loading state unless we've already done so
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={isProcessing}
      className="w-full bg-green-600 hover:bg-green-700 text-white"
    >
      {isProcessing ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Processing Payment...
        </div>
      ) : (
        `Pay ₹${amount.toLocaleString('en-IN')}`
      )}
    </Button>
  );
};

export default PaymentButton;