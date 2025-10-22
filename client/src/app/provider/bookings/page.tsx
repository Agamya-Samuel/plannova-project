'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Calendar, User, Phone, Mail, IndianRupee, CheckCircle, XCircle, AlertCircle, MessageCircle, Eye, X } from 'lucide-react';
import Image from 'next/image';
import apiClient from '@/lib/api';
import { Booking } from '@/types/booking';
import { useRouter } from 'next/navigation';

export default function ProviderBookingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'rejected'>('all');
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);

  const [showContactModal, setShowContactModal] = useState(false);
  const [contactBooking, setContactBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching provider bookings, user:', user);
        console.log('🔍 User role:', user?.role);
        
        const response = await apiClient.get<Booking[]>('/bookings/provider/incoming');
        setBookings(response.data);
        setError(null);
      } catch (err: unknown) {
        console.error('❌ Error fetching bookings:', err);
        const apiError = err as { response?: { data?: unknown; status?: number } };
        console.error('❌ Error response:', apiError.response?.data);
        console.error('❌ Error status:', apiError.response?.status);
        
        if (apiError.response?.status === 403) {
          setError('Access denied. Please make sure you are logged in as a provider and have registered your service.');
        } else {
          setError('Failed to load bookings. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBookings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleAcceptBooking = async (bookingId: string) => {
    if (processingBookingId) return; // Prevent concurrent requests
    
    try {
      setProcessingBookingId(bookingId);
      setError(null);
      console.log('🔄 Attempting to accept booking:', bookingId);
      const response = await apiClient.put(`/bookings/${bookingId}/accept`);
      console.log('✅ Booking accepted successfully:', response.data);
      // Refresh bookings
      const bookingsResponse = await apiClient.get<Booking[]>('/bookings/provider/incoming');
      setBookings(bookingsResponse.data);
    } catch (err: unknown) {
      console.error('❌ Error accepting booking:', err);
      const apiError = err as { response?: { data?: { error?: string; status?: number } } };
      console.error('❌ Error response:', apiError.response?.data);
      console.error('❌ Error status:', apiError.response?.data?.status);
      const errorMessage = apiError.response?.data?.error || 'Failed to accept booking. Please try again.';
      setError(errorMessage);
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    if (processingBookingId) return; // Prevent concurrent requests
    
    try {
      setProcessingBookingId(bookingId);
      setError(null);
      console.log('🔄 Attempting to reject booking:', bookingId);
      const response = await apiClient.put(`/bookings/${bookingId}/reject`);
      console.log('✅ Booking rejected successfully:', response.data);
      // Refresh bookings
      const bookingsResponse = await apiClient.get<Booking[]>('/bookings/provider/incoming');
      setBookings(bookingsResponse.data);
    } catch (err: unknown) {
      console.error('❌ Error rejecting booking:', err);
      const apiError = err as { response?: { data?: { error?: string; status?: number } } };
      console.error('❌ Error response:', apiError.response?.data);
      console.error('❌ Error status:', apiError.response?.data?.status);
      const errorMessage = apiError.response?.data?.error || 'Failed to reject booking. Please try again.';
      setError(errorMessage);
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleViewDetails = (booking: Booking) => {
    // Navigate to the service details page based on service type
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

  const handleContactCustomer = (booking: Booking) => {
    setContactBooking(booking);
    setShowContactModal(true);
  };

  const handlePhoneCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };



  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-white" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-white" />;
      case 'cancelled':
      case 'rejected':
        return <XCircle className="h-5 w-5 text-white" />;
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
        return 'bg-green-600 text-white';
      case 'pending':
        return 'bg-yellow-600 text-white';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-600 text-white';
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

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filter);

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    rejected: bookings.filter(b => b.status === 'rejected' || b.status === 'cancelled').length,
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['PROVIDER']}>
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['PROVIDER']}>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-start">
                <XCircle className="h-6 w-6 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Access Error</h3>
                  <p className="text-red-800 mb-4">{error}</p>
                  {user?.role !== 'PROVIDER' && (
                    <div className="bg-white rounded-lg p-4 border border-red-200">
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Current Role:</strong> {user?.role || 'Not set'}
                      </p>
                      <p className="text-sm text-gray-700 mb-3">
                        To access provider bookings, you need to:
                      </p>
                      <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                        <li>Have a PROVIDER account</li>
                        <li>Register at least one service (venue, catering, photography, etc.)</li>
                        <li>Wait for service approval from staff</li>
                      </ol>
                      <div className="mt-4">
                        <a 
                          href="/provider/onboarding" 
                          className="inline-block px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                        >
                          Register as Provider
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Incoming Bookings</h1>
                  <p className="text-gray-600">
                    View and manage booking requests from customers
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Confirmed</p>
                  <p className="text-2xl font-bold text-green-900">{stats.confirmed}</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Rejected</p>
                  <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-2 mt-6">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All ({stats.total})
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'pending'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Pending ({stats.pending})
                </button>
                <button
                  onClick={() => setFilter('confirmed')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'confirmed'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Confirmed ({stats.confirmed})
                </button>
                <button
                  onClick={() => setFilter('rejected')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === 'rejected'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Rejected ({stats.rejected})
                </button>
              </div>
            </div>
          </div>

          {/* Bookings List */}
          <div className="space-y-6">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row">
                    {/* Service Image */}
                    <div className="lg:w-1/4 mb-4 lg:mb-0 lg:mr-6">
                      <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden">
                        <Image 
                          src={booking.serviceImage || booking.venueImage} 
                          alt={booking.serviceName || booking.venueName}
                          width={400}
                          height={225}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="lg:w-3/4">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h2 className="text-xl font-bold text-gray-900 mr-3">
                              {booking.serviceName || booking.venueName}
                            </h2>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(booking.status)}`}>
                              {getStatusIcon(booking.status)}
                              <span className="ml-1">{getStatusText(booking.status)}</span>
                            </span>
                          </div>
                          <div className="mb-4">
                            <span className="inline-block px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded">
                              {getServiceTypeLabel(booking.serviceType)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="flex items-center text-gray-900">
                              <Calendar className="h-5 w-5 mr-3 text-pink-600" />
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">Event Time</p>
                                <p className="font-semibold">{new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {booking.time}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center text-gray-900">
                              <User className="h-5 w-5 mr-3 text-pink-600" />
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">Guest Count</p>
                                <p className="font-semibold">{booking.guestCount} guests</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center text-gray-900">
                              <IndianRupee className="h-5 w-5 mr-3 text-pink-600" />
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">Total Price</p>
                                <p className="font-semibold">₹{booking.totalPrice.toLocaleString('en-IN')}</p>
                              </div>
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
                      
                      {/* Customer Information */}
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center text-gray-600">
                            <User className="h-5 w-5 mr-3 text-pink-600" />
                            <div>
                              <p className="text-sm text-gray-500">Customer</p>
                              <p className="font-medium text-gray-900">{booking.contactPerson}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center text-gray-600">
                            <Phone className="h-5 w-5 mr-3 text-pink-600" />
                            <div>
                              <p className="text-sm text-gray-500">Phone</p>
                              <p className="font-medium text-gray-900">{booking.contactPhone}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center text-gray-600">
                            <Mail className="h-5 w-5 mr-3 text-pink-600" />
                            <div>
                              <p className="text-sm text-gray-500">Email</p>
                              <p className="font-medium text-gray-900">{booking.contactEmail}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      {booking.status === 'pending' && (
                        <div className="mt-6 flex flex-wrap gap-3">
                          <button 
                            onClick={() => handleAcceptBooking(booking.id)}
                            disabled={processingBookingId !== null}
                            className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {processingBookingId === booking.id ? (
                              <>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                Processing...
                              </>
                            ) : (
                              'Accept Booking'
                            )}
                          </button>
                          <button 
                            onClick={() => handleRejectBooking(booking.id)}
                            disabled={processingBookingId !== null}
                            className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {processingBookingId === booking.id ? (
                              <>
                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                Processing...
                              </>
                            ) : (
                              'Reject Booking'
                            )}
                          </button>
                          <button 
                            onClick={() => handleContactCustomer(booking)}
                            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                            <MessageCircle className="h-4 w-4" />
                            Contact Customer
                          </button>
                        </div>
                      )}

                      {booking.status === 'confirmed' && (
                        <div className="mt-6 flex flex-wrap gap-3">
                          <button 
                            onClick={() => handleContactCustomer(booking)}
                            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                            <MessageCircle className="h-4 w-4" />
                            Contact Customer
                          </button>
                          <button 
                            onClick={() => handleViewDetails(booking)}
                            className="px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {!loading && filteredBookings.length === 0 && !error && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filter === 'all' ? 'No bookings yet' : `No ${filter} bookings`}
              </h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'You haven\'t received any booking requests yet.' 
                  : `You don't have any ${filter} bookings.`}
              </p>
            </div>
          )}
        </div>

        {/* Contact Customer Modal */}
        {showContactModal && contactBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Contact Customer</h3>
                <button 
                  onClick={() => setShowContactModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Customer Info */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <User className="h-5 w-5 text-pink-600" />
                    <span className="font-semibold text-gray-900">{contactBooking.contactPerson}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <Mail className="h-4 w-4 text-pink-600" />
                    <span>{contactBooking.contactEmail}</span>
                  </div>
                </div>

                {/* Contact Options */}
                <div className="space-y-3">
                  {/* Phone Call */}
                  {contactBooking.contactPhone && (
                    <button
                      onClick={() => {
                        handlePhoneCall(contactBooking.contactPhone);
                        setShowContactModal(false);
                      }}
                      className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-600 p-2 rounded-full">
                          <Phone className="h-5 w-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">Call Customer</p>
                          <p className="text-sm text-gray-600">{contactBooking.contactPhone}</p>
                        </div>
                      </div>
                      <div className="text-blue-600 group-hover:translate-x-1 transition-transform">
                        →
                      </div>
                    </button>
                  )}

                  {/* Email */}
                  <button
                    onClick={() => {
                      window.location.href = `mailto:${contactBooking.contactEmail}?subject=Regarding your booking at ${contactBooking.serviceName || contactBooking.venueName}`;
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
                        <p className="text-sm text-gray-600">{contactBooking.contactEmail}</p>
                      </div>
                    </div>
                    <div className="text-purple-600 group-hover:translate-x-1 transition-transform">
                      →
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
