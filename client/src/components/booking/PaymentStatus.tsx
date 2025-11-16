'use client';

import React, { useEffect, useState } from 'react';
import { getPaymentStatus } from '@/lib/paymentService';
import { Badge } from '@/components/ui/badge';
import { IndianRupee } from 'lucide-react';

interface PaymentStatusProps {
  bookingId: string;
}

const PaymentStatus: React.FC<PaymentStatusProps> = ({ bookingId }) => {
  const [paymentStatus, setPaymentStatus] = useState<{
    paymentStatus: string;
    totalPrice: number;
    advanceAmount: number;
    remainingAmount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        const status = await getPaymentStatus(bookingId);
        setPaymentStatus(status);
      } catch (error) {
        console.error('Error fetching payment status:', error);
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      fetchPaymentStatus();
    }
  }, [bookingId]);

  if (loading) {
    return <div className="text-gray-500">Loading payment status...</div>;
  }

  if (!paymentStatus) {
    return <div className="text-gray-500">Payment status unavailable</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-gray-600">Payment Status:</span>
        <Badge className={getStatusColor(paymentStatus.paymentStatus)}>
          {paymentStatus.paymentStatus.charAt(0).toUpperCase() + paymentStatus.paymentStatus.slice(1)}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">Total Amount</div>
          <div className="flex items-center text-lg font-semibold">
            <IndianRupee className="h-4 w-4" />
            {paymentStatus.totalPrice.toLocaleString('en-IN')}
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">Advance Paid</div>
          <div className="flex items-center text-lg font-semibold">
            <IndianRupee className="h-4 w-4" />
            {(paymentStatus.advanceAmount || 0).toLocaleString('en-IN')}
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-500">Remaining</div>
          <div className="flex items-center text-lg font-semibold">
            <IndianRupee className="h-4 w-4" />
            {(paymentStatus.remainingAmount || 0).toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatus;