'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Calendar, Clock, MapPin, User, Phone, Mail, IndianRupee, CheckCircle, XCircle, AlertCircle, MessageCircle, Eye, X } from 'lucide-react';
import Image from 'next/image';
import apiClient from '@/lib/api';
import { Booking } from '@/types/booking';
import { useRouter } from 'next/navigation';


export default function BookingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactBooking, setContactBooking] = useState<Booking | null>(null);
  
  // State for showing all dates modal
  const [showAllDatesModal, setShowAllDatesModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<Booking[]>('/bookings');
        setBookings(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load bookings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBookings();
    }
  }, [user]);

  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      case 'rejected':
        return 'Rejected';
      default:
        return '';
    }
  };

  const getStatusClass = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return '';
    }
  };

  const getServiceTypeLabel = (serviceType?: string) => {
    switch (serviceType) {
      case 'venue':
        return 'Venue';
      case 'catering':
        return 'Catering';
      case 'photography':
        return 'Photography';
      case 'videography':
        return 'Videography';
      case 'bridal-makeup':
        return 'Bridal Makeup';
      case 'decoration':
        return 'Decoration';
      default:
        return 'Service';
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await apiClient.put(`/bookings/${bookingId}/cancel`);
      // Refresh bookings
      const response = await apiClient.get<Booking[]>('/bookings');
      setBookings(response.data);
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError('Failed to cancel booking. Please try again.');
    }
  };

  const handleViewDetails = (booking: Booking) => {
    // Navigate to the service details page
    if (booking.serviceId && booking.serviceType) {
      const serviceRoutes: Record<string, string> = {
        'venue': '/venues',
        'catering': '/catering',
        'photography': '/photography',
        'videography': '/videography',
        'bridal-makeup': '/bridal-makeup',
        'decoration': '/decoration'
      };
      
      const route = serviceRoutes[booking.serviceType];
      if (route) {
        router.push(`${route}/${booking.serviceId}`);
      }
    }
  };

  const handleContactProvider = (booking: Booking) => {
    setContactBooking(booking);
    setShowContactModal(true);
  };

  const handlePhoneCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleViewAllDates = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowAllDatesModal(true);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['CUSTOMER']}>
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['CUSTOMER']}>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
                  <p className="text-gray-600">
                    View and manage your event service bookings
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  <button className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-300">
                    <Calendar className="h-5 w-5 mr-2" />
                    New Booking
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Bookings List */}
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row">
                    {/* Venue Image */}
                    <div className="lg:w-1/4 mb-4 lg:mb-0 lg:mr-6">
                      <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden">
                        <Image 
                          src={booking.serviceImage || booking.venueImage} 
                          alt={booking.serviceName || booking.venueName}
                          width={400}
                          height={225}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.setAttribute('style', 'display: flex');
                          }}
                        />
                        <div className="hidden w-full h-full bg-gray-300 rounded-xl items-center justify-center">
                          <MapPin className="h-8 w-8 text-gray-500" />
                        </div>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="lg:w-3/4">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                        <div>
                          <div className="flex items-center mb-2">
                            <h2 className="text-xl font-bold text-gray-900 mr-3">{booking.serviceName || booking.venueName}</h2>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(booking.status)}`}>
                              {getStatusIcon(booking.status)}
                              <span className="ml-1">{getStatusText(booking.status)}</span>
                            </span>
                          </div>
                          <div className="mb-2">
                            <span className="inline-block px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded">
                              {getServiceTypeLabel(booking.serviceType)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="flex items-center text-gray-600">
                              <Calendar className="h-5 w-5 mr-3 text-pink-600" />
                              {booking.isGroupBooking ? (
                                <div>
                                  <span>{booking.dates?.length} dates selected</span>
                                  <p className="text-xs text-gray-500">
                                    First: {new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {booking.time}
                                  </p>
                                  {booking.dates && booking.dates.length > 1 && (
                                    <button 
                                      onClick={() => handleViewAllDates(booking)}
                                      className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                                    >
                                      View all dates
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span>{new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                              )}
                            </div>
                            
                            <div className="flex items-center text-gray-600">
                              <Clock className="h-5 w-5 mr-3 text-pink-600" />
                              <span>{booking.time}</span>
                            </div>
                            
                            <div className="flex items-center text-gray-600">
                              <User className="h-5 w-5 mr-3 text-pink-600" />
                              <span>{booking.guestCount} guests</span>
                            </div>
                            
                            <div className="flex items-center text-gray-600">
                              <IndianRupee className="h-5 w-5 mr-3 text-pink-600" />
                              <span>{booking.totalPrice.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 md:mt-0">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Total Amount</p>
                            <p className="text-2xl font-bold text-gray-900">₹{booking.totalPrice.toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Provider Information */}
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Provider Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center text-gray-600">
                            <User className="h-5 w-5 mr-3 text-pink-600" />
                            <div>
                              <p className="text-sm text-gray-500">Provider</p>
                              <p className="font-medium text-gray-900">{booking.provider?.name || 'Provider'}</p>
                            </div>
                          </div>
                          
                          {booking.provider?.phone && (
                            <div className="flex items-center text-gray-600">
                              <Phone className="h-5 w-5 mr-3 text-pink-600" />
                              <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="font-medium text-gray-900">{booking.provider.phone}</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center text-gray-600">
                            <Mail className="h-5 w-5 mr-3 text-pink-600" />
                            <div>
                              <p className="text-sm text-gray-500">Email</p>
                              <p className="font-medium text-gray-900">{booking.provider?.email || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="mt-6 flex flex-wrap gap-3">
                        {booking.status === 'pending' && (
                          <button 
                            onClick={() => handleCancelBooking(booking.id)}
                            className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Cancel Booking
                          </button>
                        )}
                        
                        <button 
                          onClick={() => handleViewDetails(booking)}
                          className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </button>
                        
                        <button 
                          onClick={() => handleContactProvider(booking)}
                          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Contact Provider
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {!loading && bookings.length === 0 && !error && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
              <p className="text-gray-600 mb-6">You haven{`'`}t made any service bookings yet.</p>
              <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-300">
                <MapPin className="h-5 w-5 mr-2" />
                Browse Services
              </button>
            </div>
          )}
        </div>

        {/* Contact Provider Modal */}
        {showContactModal && contactBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Contact Provider</h3>
                <button 
                  onClick={() => setShowContactModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Provider Info */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <User className="h-5 w-5 text-pink-600" />
                    <span className="font-semibold text-gray-900">{contactBooking.provider?.name || 'Provider'}</span>
                  </div>
                  {contactBooking.provider?.email && (
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <Mail className="h-4 w-4 text-pink-600" />
                      <span>{contactBooking.provider.email}</span>
                    </div>
                  )}
                </div>

                {/* Contact Options */}
                <div className="space-y-3">
                  {/* Phone Call */}
                  {contactBooking.provider?.phone && (
                    <button
                      onClick={() => {
                        handlePhoneCall(contactBooking.provider!.phone!);
                        setShowContactModal(false);
                      }}
                      className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-600 p-2 rounded-full">
                          <Phone className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">Call Provider</p>
                          <p className="text-sm text-gray-600">{contactBooking.provider.phone}</p>
                        </div>
                      </div>
                      <div className="text-blue-600 group-hover:translate-x-1 transition-transform">
                        →
                      </div>
                    </button>
                  )}

                  {/* Email */}
                  {contactBooking.provider?.email && (
                    <button
                      onClick={() => {
                        window.location.href = `mailto:${contactBooking.provider!.email}?subject=Regarding my booking at ${contactBooking.serviceName || contactBooking.venueName}`;
                        setShowContactModal(false);
                      }}
                      className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="bg-purple-600 p-2 rounded-full">
                          <Mail className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">Send Email</p>
                          <p className="text-sm text-gray-600">{contactBooking.provider.email}</p>
                        </div>
                      </div>
                      <div className="text-purple-600 group-hover:translate-x-1 transition-transform">
                        →
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View All Dates Modal */}
        {showAllDatesModal && selectedBooking && selectedBooking.dates && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">All Booking Dates</h3>
                <button 
                  onClick={() => setShowAllDatesModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-gray-600 mb-4">
                  This booking includes {selectedBooking.dates.length} dates:
                </p>
                
                <div className="space-y-2">
                  {selectedBooking.dates.map((date, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <span className="w-6 h-6 flex items-center justify-center bg-pink-100 text-pink-800 rounded-full text-xs mr-3">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900">
                        {new Date(date).toLocaleDateString('en-IN', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Event Time:</span>
                    <span className="font-semibold">{selectedBooking.time}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-600">Total Price:</span>
                    <span className="font-bold text-lg text-gray-900">
                      ₹{selectedBooking.totalPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={() => setShowAllDatesModal(false)}
                  className="w-full py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}