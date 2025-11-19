'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api';

interface PaymentModeSelectorProps {
  serviceId: string;
  serviceType: string;
  onPaymentModeSelect: (mode: 'CASH' | 'ONLINE' | null) => void;
  selectedMode: 'CASH' | 'ONLINE' | null;
}

export function PaymentModeSelector({
  serviceId,
  serviceType,
  onPaymentModeSelect,
  selectedMode
}: PaymentModeSelectorProps) {
  const [paymentOptions, setPaymentOptions] = useState({
    cash: true,
    online: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentOptions = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/vendor-service-config/${serviceType}/payment-options/${serviceId}`);
        setPaymentOptions(response.data);
      } catch (error) {
        console.error('Error fetching payment options:', error);
        // Default to both options if there's an error
        setPaymentOptions({
          cash: true,
          online: true
        });
      } finally {
        setLoading(false);
      }
    };

    if (serviceId && serviceType) {
      fetchPaymentOptions();
    }
  }, [serviceId, serviceType]);

  if (loading) {
    return <div className="text-center py-4">Loading payment options...</div>;
  }

  // If neither payment option is available, show a message
  if (!paymentOptions.cash && !paymentOptions.online) {
    return <div className="text-center py-4 text-red-500">No payment options available for this service.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {paymentOptions.cash && (
          <Button
            type="button"
            variant={selectedMode === 'CASH' ? 'default' : 'outline'}
            className={`flex-1 ${selectedMode === 'CASH' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
            onClick={() => onPaymentModeSelect('CASH')}
          >
            <span className="font-medium">Cash Payment</span>
          </Button>
        )}
        
        {paymentOptions.online && (
          <Button
            type="button"
            variant={selectedMode === 'ONLINE' ? 'default' : 'outline'}
            className={`flex-1 ${selectedMode === 'ONLINE' ? 'bg-green-600 hover:bg-green-700' : ''}`}
            onClick={() => onPaymentModeSelect('ONLINE')}
          >
            <span className="font-medium">Online Payment</span>
          </Button>
        )}
      </div>
      
      {selectedMode === 'CASH' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            You have selected cash payment. The booking will be created and the provider will contact you for payment details.
          </p>
        </div>
      )}
      
      {selectedMode === 'ONLINE' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">
            You have selected online payment. You will be redirected to the payment gateway after booking confirmation.
          </p>
        </div>
      )}
    </div>
  );
}