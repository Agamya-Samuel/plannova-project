'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import apiClient from '@/lib/api';
import { ServiceType } from '@/types/booking';

interface AvailabilityCalendarProps {
  serviceId: string;
  serviceType: ServiceType;
  onDateSelect: (date: string | string[]) => void;
  selectedDate?: string;
  selectedDates?: string[]; // For multi-date selection
  selectionMode?: 'single' | 'range' | 'multiple'; // Selection mode
  onSelectionModeChange?: (mode: 'single' | 'range' | 'multiple') => void; // Callback for mode changes
}

interface BookedDates {
  [date: string]: Array<{
    time: string;
    status: string;
    type?: string; // 'booking' or 'manual'
    reason?: string; // For manually blocked dates
  }>;
}

export function AvailabilityCalendar({ 
  serviceId, 
  serviceType, 
  onDateSelect,
  selectedDate,
  selectedDates = [],
  selectionMode = 'single',
  onSelectionModeChange
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookedDates, setBookedDates] = useState<BookedDates>({});
  const [loading, setLoading] = useState(false);
  const [dragStart, setDragStart] = useState<Date | null>(null);
  const [dragEnd, setDragEnd] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAvailability();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth, serviceId, serviceType]);

  // Helper function to convert Date to YYYY-MM-DD string in UTC to avoid timezone issues
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const isDateBooked = (date: Date) => {
    const dateStr = formatDateToString(date);
    return bookedDates[dateStr] && bookedDates[dateStr].length > 0;
  };

  const isDateManuallyBlocked = (date: Date) => {
    const dateStr = formatDateToString(date);
    return bookedDates[dateStr]?.some(booking => booking.type === 'manual') || false;
  };

  const isDatePast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateSelected = (date: Date) => {
    const dateStr = formatDateToString(date);
    
    if (selectionMode === 'single') {
      return selectedDate ? dateStr === selectedDate : false;
    } else if (selectionMode === 'range' && dragStart && dragEnd) {
      const startDate = new Date(Math.min(dragStart.getTime(), dragEnd.getTime()));
      const endDate = new Date(Math.max(dragStart.getTime(), dragEnd.getTime()));
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      return date >= startDate && date <= endDate;
    } else if (selectionMode === 'multiple') {
      return selectedDates.includes(dateStr);
    }
    
    return false;
  };

  const getSelectedDatesInRange = (): string[] => {
    if (selectionMode === 'range' && dragStart && dragEnd) {
      const startDate = new Date(Math.min(dragStart.getTime(), dragEnd.getTime()));
      const endDate = new Date(Math.max(dragStart.getTime(), dragEnd.getTime()));
      
      const dates: string[] = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        if (!isDateBooked(currentDate) && !isDatePast(currentDate)) {
          dates.push(formatDateToString(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return dates;
    } else if (selectionMode === 'multiple') {
      return selectedDates;
    }
    
    return selectedDate ? [selectedDate] : [];
  };

  const handleDateMouseDown = (date: Date) => {
    if (isDateBooked(date) || isDatePast(date)) return;
    
    if (selectionMode === 'range') {
      setDragStart(date);
      setDragEnd(date);
      setIsDragging(true);
    } else if (selectionMode === 'multiple') {
      const dateStr = formatDateToString(date);
      if (selectedDates.includes(dateStr)) {
        // Remove date from selection
        const newSelectedDates = selectedDates.filter(d => d !== dateStr);
        onDateSelect(newSelectedDates);
      } else {
        // Add date to selection
        onDateSelect([...selectedDates, dateStr]);
      }
    } else {
      // Single selection mode
      const dateStr = formatDateToString(date);
      onDateSelect(dateStr);
    }
  };

  const handleDateMouseEnter = (date: Date) => {
    if (isDragging && dragStart && selectionMode === 'range') {
      setDragEnd(date);
    }
  };

  const handleDateMouseUp = () => {
    if (isDragging && selectionMode === 'range') {
      setIsDragging(false);
      // Notify parent of selected dates
      const selectedDates = getSelectedDatesInRange();
      onDateSelect(selectedDates);
    }
  };

  const handleCalendarMouseUp = () => {
    if (isDragging && selectionMode === 'range') {
      setIsDragging(false);
      // Notify parent of selected dates
      const selectedDates = getSelectedDatesInRange();
      onDateSelect(selectedDates);
    }
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const renderCalendar = () => {
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

      let buttonClass = 'aspect-square p-2 rounded-lg text-sm font-bold transition-all ';
      let label = '';
      let title = '';

      if (selected) {
        buttonClass += 'bg-gradient-to-r from-pink-600 to-purple-600 text-white cursor-pointer';
        title = 'Selected date';
      } else if (manuallyBlocked || booked) {
        // Show both manually blocked and regular bookings as "Booked" (red styling)
        buttonClass += 'bg-red-100 text-red-900 border border-red-300 cursor-not-allowed';
        label = 'Booked';
        if (manuallyBlocked) {
          title = 'Not available for booking';
        } else {
          title = 'Already booked';
        }
      } else if (past) {
        buttonClass += 'text-gray-400 bg-gray-50 cursor-not-allowed';
        title = 'Past date';
      } else {
        buttonClass += 'text-gray-900 hover:border-pink-300 border border-gray-200 bg-white hover:bg-pink-50 cursor-pointer';
        title = 'Available - Click to select';
      }

      days.push(
        <button
          key={day}
          onMouseDown={() => handleDateMouseDown(date)}
          onMouseEnter={() => handleDateMouseEnter(date)}
          onMouseUp={handleDateMouseUp}
          disabled={disabled}
          className={buttonClass}
          title={title}
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
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div 
      ref={calendarRef}
      className="bg-white rounded-xl shadow-lg p-6"
      onMouseUp={handleCalendarMouseUp}
      onMouseLeave={handleCalendarMouseUp}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2 text-pink-600" />
          Check Availability
        </h3>
        {/* Selection Mode Controls */}
        <div className="flex space-x-2">
          <button
            onClick={() => onSelectionModeChange?.('single')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              selectionMode === 'single'
                ? 'bg-pink-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Single
          </button>
          <button
            onClick={() => onSelectionModeChange?.('range')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              selectionMode === 'range'
                ? 'bg-pink-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Range
          </button>
          <button
            onClick={() => onSelectionModeChange?.('multiple')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              selectionMode === 'multiple'
                ? 'bg-pink-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Multiple
          </button>
        </div>
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

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-gradient-to-r from-pink-600 to-purple-600 mr-2"></div>
          <span className="text-gray-900 font-medium">Selected</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-red-100 border border-red-300 mr-2"></div>
          <span className="text-gray-900 font-medium">Booked</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-white border border-gray-300 mr-2"></div>
          <span className="text-gray-900 font-medium">Available</span>
        </div>
      </div>
    </div>
  );
}