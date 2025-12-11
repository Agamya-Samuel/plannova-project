'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api';
import { ServiceType } from '@/types/booking';

// Interface for booking payload
export interface BookingPayload {
  dates: string[];
  selectionType: 'single' | 'multiple';
}

interface AvailabilityCalendarProps {
  serviceId: string;
  serviceType: ServiceType;
  // Callback when user clicks "Book Selected Dates" button
  onBook?: (payload: BookingPayload) => void;
  // Optional: allow parent to control selected dates externally
  selectedDates?: string[];
  // Optional: callback for when dates are selected (before booking)
  onDateSelect?: (dates: string[]) => void;
}

interface BookedDates {
  [date: string]: Array<{
    time: string;
    status: string;
    type?: string; // 'booking' or 'manual'
    reason?: string; // For manually blocked dates
  }>;
}

/**
 * Optimized Booking Calendar Component
 * 
 * Features:
 * - Automatic selection type detection (single/multiple)
 * - Click any dates to select/deselect
 * - Visual indicators for booked and selected dates
 * - "Book Selected Dates" button with payload
 */
export function AvailabilityCalendar({ 
  serviceId, 
  serviceType, 
  onBook,
  selectedDates: externalSelectedDates,
  onDateSelect
}: AvailabilityCalendarProps) {
  // Internal state for selected dates
  const [internalSelectedDates, setInternalSelectedDates] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookedDates, setBookedDates] = useState<BookedDates>({});
  const [loading, setLoading] = useState(false);
  
  const calendarRef = useRef<HTMLDivElement>(null);

  // Use external dates if provided, otherwise use internal state
  const selectedDates = externalSelectedDates ?? internalSelectedDates;

  // Fetch availability when month or service changes
  useEffect(() => {
    fetchAvailability();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, serviceId, serviceType]);

  /**
   * Converts Date to YYYY-MM-DD string format
   * Uses UTC to avoid timezone issues
   */
  const formatDateToString = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  /**
   * Fetches booked dates from the API
   */
  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();
      
      const response = await apiClient.get(
        `/bookings/availability/${serviceType}/${serviceId}?month=${month}&year=${year}`
      );
      
      setBookedDates(response.data.bookedDates || {});
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculates days in month and starting day of week
   */
  const getDaysInMonth = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  }, []);

  /**
   * Checks if a date is booked
   */
  const isDateBooked = useCallback((date: Date) => {
    const dateStr = formatDateToString(date);
    return bookedDates[dateStr] && bookedDates[dateStr].length > 0;
  }, [bookedDates, formatDateToString]);

  /**
   * Checks if a date is manually blocked
   */
  const isDateManuallyBlocked = useCallback((date: Date) => {
    const dateStr = formatDateToString(date);
    return bookedDates[dateStr]?.some(booking => booking.type === 'manual') || false;
  }, [bookedDates, formatDateToString]);

  /**
   * Checks if a date is in the past
   */
  const isDatePast = useCallback((date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  }, []);

  /**
   * Checks if a date is currently selected
   */
  const isDateSelected = useCallback((date: Date) => {
    const dateStr = formatDateToString(date);
    return selectedDates.includes(dateStr);
  }, [selectedDates, formatDateToString]);

  /**
   * Updates selected dates and notifies parent
   */
  const updateSelectedDates = useCallback((dates: string[]) => {
    if (externalSelectedDates === undefined) {
      // Only update internal state if not controlled externally
      setInternalSelectedDates(dates);
    }
    // Always notify parent
    onDateSelect?.(dates);
  }, [externalSelectedDates, onDateSelect]);

  /**
   * Handles date click - toggles selection
   */
  const handleDateClick = useCallback((date: Date) => {
    if (isDateBooked(date) || isDatePast(date)) return;
    
    const dateStr = formatDateToString(date);
    
    // Toggle date in selection
    if (selectedDates.includes(dateStr)) {
      // Remove date
      const newDates = selectedDates.filter(d => d !== dateStr);
      updateSelectedDates(newDates);
    } else {
      // Add date
      const newDates = [...selectedDates, dateStr].sort();
      updateSelectedDates(newDates);
    }
  }, [selectedDates, formatDateToString, isDateBooked, isDatePast, updateSelectedDates]);

  /**
   * Automatically detects selection type
   */
  const detectSelectionType = useMemo((): 'single' | 'multiple' => {
    if (selectedDates.length === 0) return 'single';
    if (selectedDates.length === 1) return 'single';
    return 'multiple';
  }, [selectedDates]);

  /**
   * Handles "Book Selected Dates" button click
   */
  const handleBookClick = useCallback(() => {
    if (selectedDates.length === 0 || !onBook) return;
    
    const payload: BookingPayload = {
      dates: selectedDates,
      selectionType: detectSelectionType
    };
    
    onBook(payload);
  }, [selectedDates, detectSelectionType, onBook]);

  /**
   * Clears all selected dates
   */
  const handleClearSelection = useCallback(() => {
    updateSelectedDates([]);
  }, [updateSelectedDates]);

  /**
   * Navigate to previous month
   */
  const previousMonth = useCallback(() => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  }, [currentMonth]);

  /**
   * Navigate to next month
   */
  const nextMonth = useCallback(() => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  }, [currentMonth]);

  /**
   * Renders the calendar grid
   */
  const renderCalendar = useCallback(() => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const days = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square p-2" />
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const booked = isDateBooked(date);
      const manuallyBlocked = isDateManuallyBlocked(date);
      const past = isDatePast(date);
      const selected = isDateSelected(date);
      const disabled = booked || past;

      let buttonClass = 'aspect-square p-2 rounded-lg text-sm font-bold transition-all duration-200 ';
      let label = '';
      let title = '';

      if (selected) {
        // Selected dates - prominent gradient
        buttonClass += 'bg-gradient-to-r from-pink-600 to-purple-600 text-white cursor-pointer shadow-md transform scale-105';
        title = 'Selected date - Click to deselect';
      } else if (manuallyBlocked || booked) {
        // Booked dates - red styling
        buttonClass += 'bg-red-100 text-red-900 border-2 border-red-300 cursor-not-allowed opacity-75';
        label = 'Booked';
        if (manuallyBlocked) {
          title = 'Not available for booking';
        } else {
          title = 'Already booked';
        }
      } else if (past) {
        // Past dates - grayed out
        buttonClass += 'text-gray-400 bg-gray-50 cursor-not-allowed';
        title = 'Past date';
      } else {
        // Available dates - interactive
        buttonClass += 'text-gray-900 hover:border-pink-400 hover:bg-pink-50 border-2 border-gray-200 bg-white cursor-pointer hover:shadow-md';
        title = 'Available - Click to select';
      }

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(date)}
          disabled={disabled}
          className={buttonClass}
          title={title}
          aria-label={`${day} ${currentMonth.toLocaleString('default', { month: 'long' })}`}
        >
          <div className="flex flex-col items-center justify-center h-full">
            <span>{day}</span>
            {label && (
              <span className="text-[10px] mt-0.5 font-semibold">{label}</span>
            )}
          </div>
        </button>
      );
    }

    return days;
  }, [
    currentMonth,
    getDaysInMonth,
    isDateBooked,
    isDateManuallyBlocked,
    isDatePast,
    isDateSelected,
    handleDateClick
  ]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Selection type display text
  const selectionTypeText = useMemo(() => {
    switch (detectSelectionType) {
      case 'single':
        return 'Single Date';
      case 'multiple':
        return 'Multiple Dates';
      default:
        return 'No Selection';
    }
  }, [detectSelectionType]);

  return (
    <div 
      ref={calendarRef}
      className="bg-white rounded-xl shadow-lg p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2 text-pink-600" />
          Select Dates
        </h3>
        {/* Selection info */}
        {selectedDates.length > 0 && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">{selectedDates.length}</span> date{selectedDates.length !== 1 ? 's' : ''} selected
            <span className="ml-2 text-pink-600">({selectionTypeText})</span>
          </div>
        )}
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        
        <h4 className="text-lg font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h4>
        
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-bold text-gray-700 p-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {renderCalendar()}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleBookClick}
          disabled={selectedDates.length === 0}
          className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Book Selected Dates
        </Button>
        {selectedDates.length > 0 && (
          <Button
            onClick={handleClearSelection}
            variant="outline"
            className="sm:w-auto"
          >
            Clear Selection
          </Button>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-gradient-to-r from-pink-600 to-purple-600 mr-2"></div>
          <span className="text-gray-900 font-medium">Selected</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-300 mr-2"></div>
          <span className="text-gray-900 font-medium">Booked</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-white border-2 border-gray-200 mr-2"></div>
          <span className="text-gray-900 font-medium">Available</span>
        </div>
      </div>
    </div>
  );
}
