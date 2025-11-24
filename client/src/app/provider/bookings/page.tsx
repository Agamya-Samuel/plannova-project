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
  IndianRupee
} from 'lucide-react';
import type { Booking } from '@/types/booking';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

export default function ProviderBookingsPage() {
  const { user: currentUser, isLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentModeFilter, setPaymentModeFilter] = useState('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [totalBookings, setTotalBookings] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);
  const [itemsPerPage] = useState(20);

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

  // Fetch bookings from API
  const fetchBookings = useCallback(async (
    status: string = 'all', 
    paymentMode: string = 'all',
    serviceType: string = 'all',
    search: string = '', 
    page: string = '1'
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ 
        page, 
        limit: itemsPerPage.toString()
      });
      
      // Add filters to params - backend expects paymentStatus, paymentType, serviceType
      if (status !== 'all') params.append('paymentStatus', status);
      if (paymentMode !== 'all') params.append('paymentType', paymentMode);
      if (serviceType !== 'all') params.append('serviceType', serviceType);
      if (search) params.append('search', search);
      
      const response = await apiClient.get(`/provider/bookings?${params.toString()}`);
      const apiBookings: Booking[] = response.data.bookings || [];
      const pagination = response.data.pagination || { total: 0, pages: 1 };

      setBookings(apiBookings);
      setTotalBookings(pagination.total);
      setTotalPages(pagination.pages);
      setError('');
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  useEffect(() => {
    if (currentUser?.role === 'PROVIDER') {
      fetchBookings(statusFilter, paymentModeFilter, serviceTypeFilter, searchTerm, currentPage.toString());
    }
  }, [statusFilter, paymentModeFilter, serviceTypeFilter, currentUser, searchTerm, fetchBookings, currentPage]);

  const handleSearchTermChange = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    fetchBookings(statusFilter, paymentModeFilter, serviceTypeFilter, value, '1');
  }, [statusFilter, paymentModeFilter, serviceTypeFilter, fetchBookings]);

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
    fetchBookings(value, paymentModeFilter, serviceTypeFilter, searchTerm, '1');
  }, [paymentModeFilter, serviceTypeFilter, searchTerm, fetchBookings]);

  const handlePaymentModeFilterChange = useCallback((value: string) => {
    setPaymentModeFilter(value);
    setCurrentPage(1);
    fetchBookings(statusFilter, value, serviceTypeFilter, searchTerm, '1');
  }, [statusFilter, serviceTypeFilter, searchTerm, fetchBookings]);

  const handleServiceTypeFilterChange = useCallback((value: string) => {
    setServiceTypeFilter(value);
    setCurrentPage(1);
    fetchBookings(statusFilter, paymentModeFilter, value, searchTerm, '1');
  }, [statusFilter, paymentModeFilter, searchTerm, fetchBookings]);

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


  const getServiceTypeLabel = useCallback((serviceType: string) => {
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
      case 'entertainment':
        return 'Entertainment';
      default:
        return serviceType;
    }
  }, []);

  const getPaymentStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'refunded':
        return <IndianRupee className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  }, []);

  const getPaymentStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getPaymentStatusText = useCallback((status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'paid':
        return 'Paid';
      case 'failed':
        return 'Failed';
      case 'refunded':
        return 'Refunded';
      default:
        return status;
    }
  }, []);

  // Handle booking actions (accept/reject/complete)
  const handleAcceptBooking = async (bookingId: string) => {
    if (processingBookingId) return;
    
    try {
      setProcessingBookingId(bookingId);
      await apiClient.put(`/bookings/${bookingId}/accept`);
      toast.success('Booking accepted successfully');
      // Refresh bookings
      await fetchBookings(statusFilter, paymentModeFilter, serviceTypeFilter, searchTerm, currentPage.toString());
    } catch (err: unknown) {
      console.error('Error accepting booking:', err);
      const apiError = err as { response?: { data?: { error?: string } } };
      toast.error(apiError.response?.data?.error || 'Failed to accept booking');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    if (processingBookingId) return;
    
    try {
      setProcessingBookingId(bookingId);
      await apiClient.put(`/bookings/${bookingId}/reject`);
      toast.success('Booking rejected successfully');
      // Refresh bookings
      await fetchBookings(statusFilter, paymentModeFilter, serviceTypeFilter, searchTerm, currentPage.toString());
    } catch (err: unknown) {
      console.error('Error rejecting booking:', err);
      const apiError = err as { response?: { data?: { error?: string } } };
      toast.error(apiError.response?.data?.error || 'Failed to reject booking');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    if (processingBookingId) return;
    
    if (!confirm('Are you sure you want to mark this booking as completed?')) {
      return;
    }
    
    try {
      setProcessingBookingId(bookingId);
      await apiClient.put(`/bookings/${bookingId}/complete`);
      toast.success('Booking marked as completed');
      // Refresh bookings
      await fetchBookings(statusFilter, paymentModeFilter, serviceTypeFilter, searchTerm, currentPage.toString());
    } catch (err: unknown) {
      console.error('Error completing booking:', err);
      const apiError = err as { response?: { data?: { error?: string } } };
      toast.error(apiError.response?.data?.error || 'Failed to complete booking');
    } finally {
      setProcessingBookingId(null);
    }
  };

  if (!isLoading && currentUser?.role !== 'PROVIDER') {
    return <div>Your session timed out. Please log in again.</div>;
  }

  return (
    <ProtectedRoute allowedRoles={['PROVIDER']}>
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    My Bookings
                  </h1>
                  <p className="text-gray-600 text-lg">
                    View and manage all your bookings
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
                      placeholder="Search by service name or customer..."
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
                
                {/* Payment Mode Filter */}
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <select
                    value={paymentModeFilter}
                    onChange={(e) => handlePaymentModeFilterChange(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="all">All Payment Modes</option>
                    <option value="ONLINE">Online</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
                
                {/* Service Type Filter */}
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <select
                    value={serviceTypeFilter}
                    onChange={(e) => handleServiceTypeFilterChange(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="all">All Services</option>
                    <option value="venue">Venues</option>
                    <option value="catering">Catering</option>
                    <option value="photography">Photography</option>
                    <option value="videography">Videography</option>
                    <option value="bridal-makeup">Bridal Makeup</option>
                    <option value="decoration">Decoration</option>
                    <option value="entertainment">Entertainment</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Search Results Info */}
          {!loading && !error && (searchTerm || statusFilter !== 'all' || paymentModeFilter !== 'all' || serviceTypeFilter !== 'all') && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-red-600" />
                  <span className="text-red-800 font-medium">
                    {bookings.length} booking{bookings.length !== 1 ? 's' : ''} found
                    {searchTerm && ` for "${searchTerm}"`}
                    {statusFilter !== 'all' && ` with status "${getStatusText(statusFilter)}"`}
                    {paymentModeFilter !== 'all' && ` with payment mode "${paymentModeFilter === 'ONLINE' ? 'Online' : 'Cash'}"`}
                    {serviceTypeFilter !== 'all' && ` for service type "${getServiceTypeLabel(serviceTypeFilter)}"`}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setPaymentModeFilter('all');
                    setServiceTypeFilter('all');
                    setCurrentPage(1);
                    fetchBookings('all', 'all', 'all', '', '1');
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
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Mode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Guests
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                          No bookings found
                        </td>
                      </tr>
                    ) : (
                      bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <Image 
                                  src={booking.serviceImage || '/placeholder-image.png'} 
                                  alt={booking.serviceName || 'Unknown Service'}
                                  width={40}
                                  height={40}
                                  className="rounded-full object-cover"
                                  style={{ width: 'auto', height: 'auto' }}
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {booking.serviceName || 'Unknown Service'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {getServiceTypeLabel(booking.serviceType || '')}
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
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.paymentStatus || 'pending')}`}>
                              {getPaymentStatusIcon(booking.paymentStatus || 'pending')}
                              <span className="ml-1">{getPaymentStatusText(booking.paymentStatus || 'pending')}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {booking.guestCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₹{booking.totalPrice.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              {booking.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleAcceptBooking(booking.id)}
                                    disabled={processingBookingId === booking.id}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRejectBooking(booking.id)}
                                    disabled={processingBookingId === booking.id}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                              {booking.status === 'confirmed' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleCompleteBooking(booking.id)}
                                  disabled={processingBookingId === booking.id}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  Complete
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {bookings.length > 0 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, totalBookings)}</span> to{' '}
                        <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalBookings)}</span> of{' '}
                        <span className="font-medium">{totalBookings}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md"
                        >
                          Previous
                        </Button>
                        {[...Array(totalPages)].map((_, i) => {
                          const pageNum = i + 1;
                          // Only show first, last, current, and nearby pages
                          if (pageNum === 1 || pageNum === totalPages || 
                              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                                  currentPage === pageNum 
                                    ? 'z-10 bg-red-600 text-white border-red-600' 
                                    : 'border-gray-300'
                                }`}
                              >
                                {pageNum}
                              </Button>
                            );
                          } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                            // Show ellipsis for skipped pages
                            return (
                              <span 
                                key={`ellipsis-${pageNum}`}
                                className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700"
                              >
                                ...
                              </span>
                            );
                          }
                          return null;
                        })}
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
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
