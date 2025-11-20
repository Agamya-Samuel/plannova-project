'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { AvailabilityCalendar } from '@/components/booking/AvailabilityCalendar';
import { ServiceType } from '@/types/booking';

interface BookingButtonProps {
  serviceId: string;
  serviceType: ServiceType;
  basePrice: number;
  onDateSelect: (date: string | string[]) => void;
  selectedDate?: string;
  selectedDates?: string[];
  selectionMode?: 'single' | 'range' | 'multiple';
  onSelectionModeChange?: (mode: 'single' | 'range' | 'multiple') => void;
}

export function BookingButton({
  serviceId,
  serviceType,
  basePrice,
  onDateSelect,
  selectedDate,
  selectedDates = [],
  selectionMode = 'single',
  onSelectionModeChange
}: BookingButtonProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  const handleBookNow = () => {
    setShowCalendar(true);
  };

  const handleDateSelection = (date: string | string[]) => {
    onDateSelect(date);
    // Calendar will remain visible after date selection
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
          onDateSelect={handleDateSelection}
          selectedDate={selectedDate}
          selectedDates={selectedDates}
          selectionMode={selectionMode}
          onSelectionModeChange={onSelectionModeChange}
        />
      )}
    </div>
  );
}