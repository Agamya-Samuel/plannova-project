'use client';

import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UnblockDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  date: Date | null;
  currentReason?: string;
  loading?: boolean;
}

export function UnblockDateModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  date, 
  currentReason,
  loading = false 
}: UnblockDateModalProps) {
  const [selectedReason, setSelectedReason] = useState('Cancel Booking');

  if (!isOpen || !date) return null;

  const handleConfirm = () => {
    if (selectedReason.trim()) {
      onConfirm(selectedReason);
    }
  };

  const unblockReasons = [
    'Cancel Booking',
    'Reject Booking',
    'Customer Request',
    'Date Change',
    'Pricing Adjustment',
    'Error Correction',
    'Other'
  ];

  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 bg-gray-500/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Unblock Date</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6">
          {/* Date Information */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 mb-1">
                  {formattedDate}
                </p>
                {currentReason && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Currently blocked for:</span> {currentReason}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700">
              <span className="font-medium text-blue-900">Important:</span> Once unblocked, this date will become available for online bookings again. Please select a reason for unblocking.
            </p>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Unblocking <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {unblockReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500">
              This information will be stored for audit purposes
            </p>
          </div>
        </div>

        {/* Reason Descriptions */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <p className="text-xs font-semibold text-gray-700 mb-2">Common Reasons:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• <span className="font-medium">Cancel Booking</span> - Customer cancelled their offline booking</li>
            <li>• <span className="font-medium">Reject Booking</span> - You declined an offline booking request</li>
            <li>• <span className="font-medium">Customer Request</span> - Customer requested a date change</li>
            <li>• <span className="font-medium">Error Correction</span> - Date was blocked by mistake</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            onClick={onClose}
            disabled={loading}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !selectedReason.trim()}
            className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Unblocking...
              </>
            ) : (
              'Confirm Unblock'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
