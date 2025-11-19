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
import { PaymentModeSelector } from '@/components/booking/PaymentModeSelector';
import PaymentButton from '@/components/booking/PaymentButton';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  serviceName: string;
  serviceType: ServiceType;
  basePrice: number;
  pricePerGuest?: number;
  preselectedDate?: string; // Optional preselected date from calendar
  preselectedDates?: string[]; // Optional preselected dates for range/multiple selection
}

export function BookingModal({
  isOpen,
  onClose,
  serviceId,
  serviceName,
  serviceType,
  basePrice,
  pricePerGuest = 0,
  preselectedDate,
  preselectedDates
}: BookingModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'ONLINE' | null>(null);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: preselectedDate || (preselectedDates && preselectedDates.length > 0 ? preselectedDates[0] : '') || '',
    dates: preselectedDates || (preselectedDate ? [preselectedDate] : []),
    time: '',
    guestCount: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: user?.email || ''
  });

  // For online payments, we want to keep the form disabled until payment is completed
  const isFormDisabled = !!(loading || (createdBookingId && paymentMode === 'ONLINE'));

  // Update date when preselectedDate or preselectedDates changes
  useEffect(() => {
    if (preselectedDates && preselectedDates.length > 0) {
      setFormData(prev => ({ ...prev, dates: preselectedDates, date: preselectedDates[0] }));
    } else if (preselectedDate) {
      setFormData(prev => ({ ...prev, dates: [preselectedDate], date: preselectedDate }));
    }
  }, [preselectedDate, preselectedDates]);

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
    // For multiple dates, we might want to multiply the price by the number of dates
    const dateCount = formData.dates.length || 1;
    return (basePrice + (guests * pricePerGuest)) * dateCount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if ((!formData.date && formData.dates.length === 0) || !formData.time || !formData.guestCount || !formData.contactPerson || !formData.contactPhone || !formData.contactEmail) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!user) {
      toast.error('Please login to make a booking');
      router.push('/auth/login');
      return;
    }

    // Check if user is provider - providers cannot make bookings, they can only view bookings for their services
    if (user.role === 'PROVIDER') {
      toast.error('Providers cannot make bookings. They can only view bookings for their services.');
      return;
    }

    // Check if user is staff
    if (user.role === 'STAFF') {
      toast.error('Staff members cannot make bookings');
      return;
    }

    // For online payment, payment mode must be selected
    if (paymentMode === null) {
      toast.error('Please select a payment mode');
      return;
    }

    setLoading(true);

    try {
      let bookingResponse: { data: { id?: string; bookings?: { id: string }[] } };
      
      // If we have multiple dates, we need to create a grouped booking
      if (formData.dates.length > 1) {
        // Validate that all dates are properly formatted
        const validDates = formData.dates.filter(date => date && !isNaN(Date.parse(date)));
        if (validDates.length !== formData.dates.length) {
          throw new Error('One or more dates are invalid');
        }
      
        const bookingData = {
          serviceId,
          serviceType,
          dates: validDates, // Send array of dates
          time: formData.time,
          guestCount: parseInt(formData.guestCount),
          contactPerson: formData.contactPerson,
          contactPhone: formData.contactPhone,
          contactEmail: formData.contactEmail,
          paymentMode, // Add payment mode
          // For backward compatibility with old API
          venueId: serviceType === 'venue' ? serviceId : undefined
        };
      
        console.log('Sending multiple dates booking:', bookingData); // Debug log
        bookingResponse = await apiClient.post('/bookings', bookingData);
      
        toast.success(`Successfully booked ${formData.dates.length} date(s)! You can view them in "My Bookings".`);
      } else {
        // Single booking
        const dateToUse = formData.dates.length === 1 ? formData.dates[0] : formData.date;
      
        // Validate the date
        if (!dateToUse || isNaN(Date.parse(dateToUse))) {
          throw new Error('Invalid date format');
        }
      
        const bookingData = {
          serviceId,
          serviceType,
          date: dateToUse,
          time: formData.time,
          guestCount: parseInt(formData.guestCount),
          contactPerson: formData.contactPerson,
          contactPhone: formData.contactPhone,
          contactEmail: formData.contactEmail,
          paymentMode, // Add payment mode
          // For backward compatibility with old API
          venueId: serviceType === 'venue' ? serviceId : undefined
        };
      
        console.log('Sending single date booking:', bookingData); // Debug log
        bookingResponse = await apiClient.post('/bookings', bookingData);
      
        toast.success('Booking request submitted successfully! You can view it in "My Bookings".');
      }
      
      // Handle payment flow based on selected payment mode
      if (paymentMode === 'CASH') {
        // For cash payments, booking is created directly
        // Reset form
        setFormData({
          date: '',
          dates: [],
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
      } else {
        // For online payments, store the booking ID and show payment button
        const bookingId = bookingResponse.data.id || bookingResponse.data.bookings?.[0]?.id;
        if (bookingId) {
          setCreatedBookingId(bookingId);
        } else {
          throw new Error('Failed to get booking ID');
        }
      }
      
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
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          ></div>
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Book {serviceName}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="pl-10 w-full"
                    required
                    disabled={isFormDisabled}
                  />
                </div>
              </div>
              
              {/* Time Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="pl-10 w-full"
                    required
                    disabled={isFormDisabled}
                  />
                </div>
              </div>
              
              {/* Guest Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Guests
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="number"
                    min="1"
                    value={formData.guestCount}
                    onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
                    className="pl-10 w-full"
                    required
                    disabled={isFormDisabled}
                  />
                </div>
              </div>
              
              {/* Contact Person */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="pl-10 w-full"
                    placeholder="Full name"
                    required
                    disabled={isFormDisabled}
                  />
                </div>
              </div>
              
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={handlePhoneChange}
                    className="pl-10 w-full"
                    placeholder="+91XXXXXXXXXX"
                    required
                    disabled={isFormDisabled}
                  />
                </div>
              </div>
              
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="pl-10 w-full"
                    placeholder="your@email.com"
                    required
                    disabled={isFormDisabled}
                  />
                </div>
              </div>
              
              {/* Payment Mode Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Mode
                </label>
                <PaymentModeSelector
                  serviceId={serviceId}
                  serviceType={serviceType}
                  onPaymentModeSelect={setPaymentMode}
                  selectedMode={paymentMode}
                  disabled={isFormDisabled}
                />
              </div>
              
              {/* Total */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Total Amount:</span>
                  <span className="text-xl font-bold text-gray-900">
                    ₹{calculateTotal().toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
              
              {/* Payment Button for Online Bookings */}
              {createdBookingId && paymentMode === 'ONLINE' ? (
                <div className="space-y-4">
                  <p className="text-center text-gray-600">
                    Your booking has been created. Please complete the payment to confirm your booking.
                  </p>
                  <PaymentButton
                    bookingId={createdBookingId}
                    amount={calculateTotal()}
                    customerName={formData.contactPerson}
                    customerEmail={formData.contactEmail}
                    customerPhone={formData.contactPhone}
                    onPaymentSuccess={() => {
                      // Reset form and close modal after successful payment
                      setFormData({
                        date: '',
                        dates: [],
                        time: '',
                        guestCount: '',
                        contactPerson: '',
                        contactPhone: '',
                        contactEmail: user?.email || ''
                      });
                      setCreatedBookingId(null);
                      onClose();
                      
                      // Optionally redirect to bookings page after a delay
                      setTimeout(() => {
                        router.push('/bookings');
                      }, 2000);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCreatedBookingId(null);
                      onClose();
                      router.push('/bookings');
                    }}
                    className="w-full"
                  >
                    Pay Later (View in Bookings)
                  </Button>
                </div>
              ) : (
                /* Submit Button */
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold py-3 rounded-lg transition-all duration-300"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    'Confirm Booking'
                  )}
                </Button>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}