'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, Plus, Trash2, AlertCircle } from 'lucide-react';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { UnblockDateModal } from './UnblockDateModal';

interface BlockedDate {
  date: Date;
  reason?: string;
  blockedAt: Date;
}

interface BlockedDatesManagerProps {
  serviceId: string; // Changed from venueId to serviceId for generic support
  serviceType?: 'venue' | 'catering' | 'photography' | 'videography' | 'bridal-makeup' | 'decoration'; // Service type
  onUpdate?: () => void;
}

export function BlockedDatesManager({ serviceId, serviceType = 'venue', onUpdate }: BlockedDatesManagerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [blockReason, setBlockReason] = useState('Offline booking');
  
  // Unblock modal state
  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [dateToUnblock, setDateToUnblock] = useState<Date | null>(null);
  const [currentBlockReason, setCurrentBlockReason] = useState<string>('');

  useEffect(() => {
    fetchBlockedDates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, serviceType]);

  // Helper to get API path based on service type
  const getApiPath = () => {
    switch (serviceType) {
      case 'venue':
        return `/venues/${serviceId}/blocked-dates`;
      case 'catering':
        return `/catering/${serviceId}/blocked-dates`;
      case 'photography':
        return `/photography/${serviceId}/blocked-dates`;
      case 'videography':
        return `/videography/${serviceId}/blocked-dates`;
      case 'bridal-makeup':
        return `/bridal-makeup/${serviceId}/blocked-dates`;
      case 'decoration':
        return `/decoration/${serviceId}/blocked-dates`;
      default:
        return `/venues/${serviceId}/blocked-dates`;
    }
  };

  const fetchBlockedDates = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(getApiPath());
      setBlockedDates(response.data.blockedDates || []);
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
      toast.error('Failed to load blocked dates');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockDates = async () => {
    if (selectedDates.length === 0) {
      toast.error('Please select at least one date to block');
      return;
    }

    setShowReasonModal(true);
  };

  const confirmBlockDates = async () => {
    try {
      setLoading(true);
      await apiClient.post(getApiPath(), {
        dates: selectedDates,
        reason: blockReason
      });

      toast.success(`Successfully blocked ${selectedDates.length} date(s)`);
      setSelectedDates([]);
      setShowReasonModal(false);
      setBlockReason('Offline booking');
      await fetchBlockedDates();
      onUpdate?.();
    } catch (error: unknown) {
      console.error('Error blocking dates:', error);
      const apiError = error as { response?: { data?: { error?: string } } };
      toast.error(apiError.response?.data?.error || 'Failed to block dates');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockDate = async (dateStr: string) => {
    // Find the blocked date to get its reason
    const blockedDate = blockedDates.find(
      bd => new Date(bd.date).toISOString().split('T')[0] === dateStr
    );
    
    if (!blockedDate) {
      toast.error('Blocked date not found');
      return;
    }

    // Set the date to unblock and show modal
    setDateToUnblock(new Date(dateStr));
    setCurrentBlockReason(blockedDate.reason || 'Not specified');
    setShowUnblockModal(true);
  };

  const confirmUnblockDate = async (reason: string) => {
    if (!dateToUnblock) return;

    const dateStr = dateToUnblock.toISOString().split('T')[0];

    try {
      setLoading(true);
      await apiClient.delete(getApiPath(), {
        data: { 
          date: dateStr,
          reason: reason
        }
      });

      toast.success('Date unblocked successfully');
      setShowUnblockModal(false);
      setDateToUnblock(null);
      setCurrentBlockReason('');
      await fetchBlockedDates();
      onUpdate?.();
    } catch (error: unknown) {
      console.error('Error unblocking date:', error);
      const apiError = error as { response?: { data?: { error?: string } } };
      toast.error(apiError.response?.data?.error || 'Failed to unblock date');
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

  const isDateBlocked = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return blockedDates.some(bd => 
      new Date(bd.date).toISOString().split('T')[0] === dateStr
    );
  };

  const isDatePast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateSelected = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return selectedDates.includes(dateStr);
  };

  const handleDateClick = (date: Date) => {
    if (isDatePast(date)) return;

    const dateStr = date.toISOString().split('T')[0];

    if (isDateBlocked(date)) {
      // If already blocked, prompt for unblocking with reason
      handleUnblockDate(dateStr);
      return;
    }

    // Toggle selection
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter(d => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr]);
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

    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const isBlocked = isDateBlocked(currentDate);
      const isPast = isDatePast(currentDate);
      const isSelected = isDateSelected(currentDate);

      let dayClasses = 'h-10 flex items-center justify-center text-sm rounded-lg transition-all cursor-pointer ';

      if (isSelected) {
        dayClasses += 'bg-blue-600 text-white font-semibold ring-2 ring-blue-300';
      } else if (isBlocked) {
        dayClasses += 'bg-orange-100 text-orange-700 font-medium hover:bg-orange-200 border border-orange-300';
      } else if (isPast) {
        dayClasses += 'bg-gray-50 text-gray-300 cursor-not-allowed';
      } else {
        dayClasses += 'hover:bg-blue-50 text-gray-700 hover:text-blue-700 border border-transparent hover:border-blue-200';
      }

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(currentDate)}
          disabled={isPast && !isBlocked}
          className={dayClasses}
          title={
            isBlocked 
              ? 'Click to unblock this date' 
              : isSelected 
              ? 'Selected - Click to deselect' 
              : 'Click to select for blocking'
          }
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Calendar className="h-6 w-6 mr-2 text-pink-600" />
            Manage Blocked Dates
          </h3>
          {selectedDates.length > 0 && (
            <Button
              onClick={handleBlockDates}
              disabled={loading}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Block {selectedDates.length} Date{selectedDates.length !== 1 ? 's' : ''}
            </Button>
          )}
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-1">How to use:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><span className="font-medium">Click dates</span> to select them for blocking</li>
                <li><span className="font-medium text-orange-700">Orange dates</span> are already blocked - click to unblock</li>
                <li>Blocked dates will be unavailable for online bookings</li>
                <li>Use this for offline bookings or maintenance periods</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h4 className="text-lg font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h4>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="mb-4">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="h-8 flex items-center justify-center text-xs font-semibold text-gray-500">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {renderCalendar()}
        </div>
      </div>

      {/* Legend */}
      <div className="border-t pt-4">
        <p className="text-sm font-semibold text-gray-700 mb-2">Legend:</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-blue-600" />
            <span className="text-xs text-gray-600">Selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-orange-100 border border-orange-300" />
            <span className="text-xs text-gray-600">Blocked</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-gray-50" />
            <span className="text-xs text-gray-600">Past Date</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded border border-gray-200" />
            <span className="text-xs text-gray-600">Available</span>
          </div>
        </div>
      </div>

      {/* Blocked Dates List */}
      {blockedDates.length > 0 && (
        <div className="border-t mt-4 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Currently Blocked Dates ({blockedDates.length})
          </h4>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {blockedDates
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((bd, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-orange-50 rounded-lg p-3 border border-orange-200"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(bd.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    {bd.reason && (
                      <p className="text-xs text-gray-600 mt-1">{bd.reason}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleUnblockDate(new Date(bd.date).toISOString().split('T')[0])}
                    className="ml-3 p-1.5 hover:bg-orange-100 rounded transition-colors"
                    title="Unblock this date"
                  >
                    <Trash2 className="h-4 w-4 text-orange-600" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Reason Modal */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Block Selected Dates</h3>
              <button
                onClick={() => setShowReasonModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                You are about to block <span className="font-semibold text-gray-900">{selectedDates.length}</span> date(s). 
                Please provide a reason for blocking these dates.
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Blocking
              </label>
              <select
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="Offline booking">Offline booking</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Private event">Private event</option>
                <option value="Holiday">Holiday</option>
                <option value="Other">Other reason</option>
              </select>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => setShowReasonModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmBlockDates}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white"
              >
                {loading ? 'Blocking...' : 'Confirm Block'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Unblock Date Modal */}
      <UnblockDateModal
        isOpen={showUnblockModal}
        onClose={() => {
          setShowUnblockModal(false);
          setDateToUnblock(null);
          setCurrentBlockReason('');
        }}
        onConfirm={confirmUnblockDate}
        date={dateToUnblock}
        currentReason={currentBlockReason}
        loading={loading}
      />
    </div>
  );
}
