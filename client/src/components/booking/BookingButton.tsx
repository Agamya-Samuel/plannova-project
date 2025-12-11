'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { AvailabilityCalendar, BookingPayload } from '@/components/booking/AvailabilityCalendar';
import { ServiceType } from '@/types/booking';

interface BookingButtonProps {
  serviceId: string;
  serviceType: ServiceType;
  basePrice: number;
  // Callback when user books selected dates
  onBook?: (payload: BookingPayload) => void;
  // Optional: callback for date selection changes (before booking)
  onDateSelect?: (dates: string[]) => void;
}

export function BookingButton({
  serviceId,
  serviceType,
  basePrice,
  onBook,
  onDateSelect
}: BookingButtonProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  const handleBookNow = () => {
    setShowCalendar(true);
  };

  // Handle date selection changes (for tracking)
  const handleDateSelection = (dates: string[]) => {
    setSelectedDates(dates);
    onDateSelect?.(dates);
  };

  // Handle booking action
  const handleBook = (payload: BookingPayload) => {
    onBook?.(payload);
    // Calendar remains visible after booking
  };

  return (
    <div className="space-y-6">
      {!showCalendar ? (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              ₹{basePrice.toLocaleString()}
            </div>
            <p className="text-gray-600">Starting Price</p>
          </div>
          
          <Button
            onClick={handleBookNow}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white py-3 rounded-lg transition-all duration-300 flex items-center justify-center"
          >
            <Calendar className="h-5 w-5 mr-2" />
            Book Now
          </Button>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-600">
              Click to select available dates and proceed with booking
            </p>
          </div>
        </div>
      ) : (
        <AvailabilityCalendar
          serviceId={serviceId}
          serviceType={serviceType}
          onBook={handleBook}
          onDateSelect={handleDateSelection}
          selectedDates={selectedDates}
        />
      )}
    </div>
  );
}