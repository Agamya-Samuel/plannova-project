'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, Users, User, Phone, Mail, X } from 'lucide-react';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ServiceType } from '@/types/booking';
import { useAuth } from '@/contexts/AuthContext';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  serviceName: string;
  serviceType: ServiceType;
  basePrice: number;
  pricePerGuest?: number;
  preselectedDate?: string; // Optional preselected date from calendar
}

export function BookingModal({
  isOpen,
  onClose,
  serviceId,
  serviceName,
  serviceType,
  basePrice,
  pricePerGuest = 0,
  preselectedDate
}: BookingModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: preselectedDate || '',
    time: '',
    guestCount: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: user?.email || ''
  });

  // Update date when preselectedDate changes
  useEffect(() => {
    if (preselectedDate) {
      setFormData(prev => ({ ...prev, date: preselectedDate }));
    }
  }, [preselectedDate]);

  // Format phone number with country code
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove all non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    
    // If user is typing and field is not empty
    if (numericValue) {
      // If doesn't start with country code, add +91
      if (!value.startsWith('+')) {
        // Remove existing country code if present
        const withoutCountryCode = numericValue.startsWith('91') && numericValue.length > 10 
          ? numericValue.substring(2) 
          : numericValue;
        value = '+91' + withoutCountryCode;
      } else {
        // Keep the + and numeric values
        value = '+' + numericValue;
      }
    }
    
    setFormData({ ...formData, contactPhone: value });
  };

  const calculateTotal = () => {
    const guests = parseInt(formData.guestCount) || 0;
    return basePrice + (guests * pricePerGuest);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.date || !formData.time || !formData.guestCount || !formData.contactPerson || !formData.contactPhone || !formData.contactEmail) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!user) {
      toast.error('Please login to make a booking');
      router.push('/auth/login');
      return;
    }

    // Check if user is staff
    if (user.role === 'STAFF') {
      toast.error('Staff members cannot make bookings');
      return;
    }

    setLoading(true);

    try {
      const bookingData = {
        serviceId,
        serviceType,
        date: formData.date,
        time: formData.time,
        guestCount: parseInt(formData.guestCount),
        contactPerson: formData.contactPerson,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        // For backward compatibility with old API
        venueId: serviceType === 'venue' ? serviceId : undefined
      };

      await apiClient.post('/bookings', bookingData);
      
      toast.success('Booking request submitted successfully! You can view it in "My Bookings".');
      
      // Reset form
      setFormData({
        date: '',
        time: '',
        guestCount: '',
        contactPerson: '',
        contactPhone: '',
        contactEmail: user?.email || ''
      });
      
      onClose();
      
      // Optionally redirect to bookings page after a delay
      setTimeout(() => {
        router.push('/bookings');
      }, 2000);
      
    } catch (error: unknown) {
      console.error('Error creating booking:', error);
      const apiError = error as { response?: { data?: { error?: string } } };
      const errorMessage = apiError.response?.data?.error || 'Failed to create booking. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={onClose}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Book {serviceName}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Fill in the details below to submit your booking request
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Event Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Event Date *
                  </label>
                  <Input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Event Time *
                  </label>
                  <Input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Guest Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="inline h-4 w-4 mr-1" />
                  Number of Guests *
                </label>
                <Input
                  type="number"
                  required
                  min="1"
                  value={formData.guestCount}
                  onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                  placeholder="Enter number of guests"
                  className="w-full"
                />
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Contact Person *
                </label>
                <Input
                  type="text"
                  required
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Enter contact person name"
                  className="w-full"
                />
              </div>

              {/* Contact Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="inline h-4 w-4 mr-1" />
                    Phone Number *
                  </label>
                  <Input
                    type="tel"
                    required
                    value={formData.contactPhone}
                    onChange={handlePhoneChange}
                    placeholder="+91 9999999999"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: +91 followed by 10 digits</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email *
                  </label>
                  <Input
                    type="email"
                    required
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="Enter email address"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-700">
                    <span>Base Price:</span>
                    <span>₹{basePrice.toLocaleString('en-IN')}</span>
                  </div>
                  {pricePerGuest > 0 && formData.guestCount && (
                    <div className="flex justify-between text-gray-700">
                      <span>Price per Guest ({formData.guestCount} guests):</span>
                      <span>₹{(pricePerGuest * parseInt(formData.guestCount || '0')).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between text-xl font-bold text-gray-900">
                      <span>Total:</span>
                      <span>₹{calculateTotal().toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                >
                  {loading ? 'Submitting...' : 'Submit Booking Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
