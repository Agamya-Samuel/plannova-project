'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { 
  Calendar, 
  Search,
  X,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  IndianRupee,
  ChevronDown
} from 'lucide-react';
import type { Booking } from '@/types/booking';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

export default function AdminBookingsPage() {
  const { user: currentUser, isLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [totalBookings, setTotalBookings] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingPaymentStatus, setEditingPaymentStatus] = useState<string | null>(null);

  // Memoize expensive calculations
  const pendingBookingsCount = useMemo(() => {
    return bookings.filter(b => b.status === 'pending').length;
  }, [bookings]);

  const confirmedBookingsCount = useMemo(() => {
    return bookings.filter(b => b.status === 'confirmed').length;
  }, [bookings]);

  const totalRevenue = useMemo(() => {
    return bookings.reduce((sum, b) => sum + b.totalPrice, 0);
  }, [bookings]);

  // Fetch bookings from API instead of mock data
  // Memoized to satisfy react-hooks exhaustive-deps and avoid unnecessary re-creations
  const fetchBookings = useCallback(async (status: string = 'all', search: string = '') => {
    try {
      setLoading(true);
      // Determine endpoint by role
      const role = currentUser?.role;
      let endpoint = '/bookings';
      if (role === 'PROVIDER') {
        endpoint = '/bookings/provider/incoming';
      } else if (role === 'STAFF' || role === 'ADMIN') {
        const params = new URLSearchParams({ page: '1', limit: '200', status });
        endpoint = `/admin/bookings?${params.toString()}`;
      }
      const response = await apiClient.get(endpoint);
      const apiBookings: Booking[] = response.data.bookings || [];

      // Apply filters on the server side when possible
      // Only apply client-side filters if needed
      let filteredBookings = apiBookings;
      
      if (status !== 'all') {
        // This filter is now redundant since we're passing status to the API
        // But keeping it for safety in case API doesn't filter properly
        filteredBookings = filteredBookings.filter(booking => booking.status.toLowerCase() === status.toLowerCase());
      }
      
      if (search) {
        const searchLower = search.toLowerCase();
        filteredBookings = filteredBookings.filter(booking => 
          booking.venueName.toLowerCase().includes(searchLower) ||
          booking.contactPerson.toLowerCase().includes(searchLower) ||
          booking.contactEmail.toLowerCase().includes(searchLower)
        );
      }
      
      setBookings(filteredBookings);
      setTotalBookings(filteredBookings.length);
      setError('');
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.role === 'ADMIN' || currentUser?.role === 'STAFF') {
      fetchBookings(statusFilter, searchTerm);
    }
  }, [statusFilter, currentUser, searchTerm, fetchBookings]);

  const handleSearchTermChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    fetchBookings(statusFilter, value);
  }, [statusFilter, fetchBookings]);

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
    fetchBookings(value, searchTerm);
  }, [searchTerm, fetchBookings]);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'PENDING':
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'CONFIRMED':
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'CANCELLED':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'REJECTED':
      case 'rejected':
        return <XCircle className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'PENDING':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'REJECTED':
      case 'rejected':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'PENDING':
      case 'pending':
        return 'Pending';
      case 'CONFIRMED':
      case 'confirmed':
        return 'Confirmed';
      case 'CANCELLED':
      case 'cancelled':
        return 'Cancelled';
      case 'REJECTED':
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  }, []);

  const getPaymentModeText = useCallback((paymentMode?: string) => {
    switch (paymentMode) {
      case 'CASH':
        return 'Cash';
      case 'ONLINE':
        return 'Online';
      default:
        return 'Not specified';
    }
  }, []);

  const getPaymentModeClass = useCallback((paymentMode?: string) => {
    switch (paymentMode) {
      case 'CASH':
        return 'bg-blue-100 text-blue-800';
      case 'ONLINE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getBookingTypeText = useCallback((bookingType?: string) => {
    switch (bookingType) {
      case 'CASH':
        return 'Cash Booking';
      case 'ONLINE':
        return 'Online Booking';
      default:
        return 'Not specified';
    }
  }, []);

  const getBookingTypeClass = useCallback((bookingType?: string) => {
    switch (bookingType) {
      case 'CASH':
        return 'bg-blue-100 text-blue-800';
      case 'ONLINE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const handlePaymentStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      const response = await apiClient.put(`/admin/bookings/${bookingId}/payment-status`, {
        paymentStatus: newStatus
      });
      
      // Update the booking in the state more efficiently
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, paymentStatus: response.data.booking.paymentStatus } 
            : booking
        )
      );
      
      toast.success('Payment status updated successfully');
      setEditingPaymentStatus(null);
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  };

  const renderPaymentStatusCell = useCallback((booking: Booking) => {
    const paymentStatusOptions = [
      { value: 'pending', label: 'Pending' },
      { value: 'paid', label: 'Paid' },
      { value: 'failed', label: 'Failed' },
      { value: 'refunded', label: 'Refunded' }
    ];
    
    const paymentStatus = booking.paymentStatus || 'pending';
    
    return (
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(paymentStatus)}`}>
            {getStatusIcon(paymentStatus)}
            <span className="ml-1">{getStatusText(paymentStatus)}</span>
          </span>
          <div className="relative">
            <button 
              className="text-gray-400 hover:text-gray-600"
              onClick={(e) => {
                e.stopPropagation();
                setEditingPaymentStatus(
                  editingPaymentStatus === booking.id ? null : booking.id
                );
              }}
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            
            {editingPaymentStatus === booking.id && (
              <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                {paymentStatusOptions.map(option => (
                  <button
                    key={option.value}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePaymentStatusUpdate(booking.id, option.value);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </td>
    );
  }, [editingPaymentStatus, getStatusColor, getStatusIcon, getStatusText]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingPaymentStatus && !(event.target as Element).closest('.relative')) {
        setEditingPaymentStatus(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingPaymentStatus]);

  if (!isLoading && !(currentUser?.role === 'ADMIN' || currentUser?.role === 'STAFF')) {
    return <div>Your session timed out. Please log in again.</div>;
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Bookings Overview
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Monitor all bookings across the platform
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="h-5 w-5 text-green-500" />
                  <span>Booking Management</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {pendingBookingsCount}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Confirmed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {confirmedBookingsCount}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <IndianRupee className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{totalRevenue.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="mb-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search by venue name or customer..."
                      value={searchTerm}
                      onChange={(e) => handleSearchTermChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => handleSearchTermChange('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Status Filter */}
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Search Results Info */}
          {!loading && !error && (searchTerm || statusFilter !== 'all') && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-red-600" />
                  <span className="text-red-800 font-medium">
                    {bookings.length} booking{bookings.length !== 1 ? 's' : ''} found
                    {searchTerm && ` for "${searchTerm}"`}
                    {statusFilter !== 'all' && ` with status "${getStatusText(statusFilter)}"`}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setCurrentPage(1);
                    fetchBookings('all', '');
                  }}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Clear filters
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Bookings Table */}
          {!loading && !error && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Booking
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Mode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Booking Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Guests
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <Image 
                                src={booking.venueImage || booking.serviceImage || '/placeholder-image.png'} 
                                alt={booking.venueName || booking.serviceName || 'Unknown Service'}
                                width={40}
                                height={40}
                                className="rounded-full object-cover"
                                style={{ width: 'auto', height: 'auto' }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {booking.venueName || booking.serviceName || 'Unknown Service'}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {booking.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.contactPerson}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.contactEmail}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.contactPhone}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(booking.date).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.time}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {getStatusIcon(booking.status)}
                            <span className="ml-1">{getStatusText(booking.status)}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {booking.paymentMode && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentModeClass(booking.paymentMode)}`}>
                              {getPaymentModeText(booking.paymentMode)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {booking.bookingType && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBookingTypeClass(booking.bookingType)}`}>
                              {getBookingTypeText(booking.bookingType)}
                            </span>
                          )}
                        </td>
                        {renderPaymentStatusCell(booking)}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.provider?.name || '—'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.provider?.email || ''}
                          </div>
                          {booking.provider?.phone && (
                            <div className="text-sm text-gray-500">{booking.provider?.phone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {booking.guestCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₹{booking.totalPrice.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {bookings.length > 0 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={true} // For mock data
                    >
                      Next
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">1</span> to{' '}
                        <span className="font-medium">{bookings.length}</span> of{' '}
                        <span className="font-medium">{bookings.length}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md"
                        >
                          Previous
                        </Button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          Page 1 of 1
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={true} // For mock data
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md"
                        >
                          Next
                        </Button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
