'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { processPayment, getPaymentStatus } from '@/lib/paymentService';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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
        return;
      }

      // Process payment
      await processPayment(
        bookingId,
        amount,
        currency,
        customerName,
        customerEmail,
        customerPhone
      );
      
      toast.success('Payment successful!');
      onPaymentSuccess?.();
      
      // Refresh the page to show updated payment status
      router.refresh();
    } catch (error) {
      console.error('Payment error:', error);
      if (error instanceof Error) {
        toast.error(error.message || 'Payment failed. Please try again.');
      } else {
        toast.error('Payment failed. Please try again.');
      }
    } finally {
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
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Processing Payment...
        </>
      ) : (
        `Pay ₹${amount.toLocaleString('en-IN')}`
      )}
    </Button>
  );
};

export default PaymentButton;