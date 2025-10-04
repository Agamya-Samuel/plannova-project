'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { Calendar, Clock, MapPin, User, Phone, Mail, IndianRupee, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import apiClient from '../../lib/api';
import { Booking } from '../../types/booking';

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        return 'bg-red-100 text-red-800';
      default:
        return '';
    }
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
                    View and manage your wedding venue bookings
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
                          src={booking.venueImage} 
                          alt={booking.venueName}
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
                            <h2 className="text-xl font-bold text-gray-900 mr-3">{booking.venueName}</h2>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(booking.status)}`}>
                              {getStatusIcon(booking.status)}
                              <span className="ml-1">{getStatusText(booking.status)}</span>
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="flex items-center text-gray-600">
                              <Calendar className="h-5 w-5 mr-3 text-pink-600" />
                              <span>{new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
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
                      
                      {/* Contact Information */}
                      <div className="mt-6 pt-6 border-t border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center text-gray-600">
                            <User className="h-5 w-5 mr-3 text-pink-600" />
                            <span>{booking.contactPerson}</span>
                          </div>
                          
                          <div className="flex items-center text-gray-600">
                            <Phone className="h-5 w-5 mr-3 text-pink-600" />
                            <span>{booking.contactPhone}</span>
                          </div>
                          
                          <div className="flex items-center text-gray-600">
                            <Mail className="h-5 w-5 mr-3 text-pink-600" />
                            <span>{booking.contactEmail}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="mt-6 flex flex-wrap gap-3">
                        {booking.status === 'pending' && (
                          <>
                            <button className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
                              Confirm Booking
                            </button>
                            <button className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors">
                              Cancel Booking
                            </button>
                          </>
                        )}
                        
                        {booking.status === 'confirmed' && (
                          <button className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors">
                            Cancel Booking
                          </button>
                        )}
                        
                        <button className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors">
                          View Details
                        </button>
                        
                        <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                          Contact Venue
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
              <p className="text-gray-600 mb-6">You haven{`'`}t made any venue bookings yet.</p>
              <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all duration-300">
                <MapPin className="h-5 w-5 mr-2" />
                Browse Venues
              </button>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}