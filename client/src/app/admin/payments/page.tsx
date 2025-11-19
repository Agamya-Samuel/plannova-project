'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { 
  Search,
  X,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  IndianRupee,
  Calendar,
  Download
} from 'lucide-react';
import type { Booking } from '@/types/booking';
import apiClient from '@/lib/api';

interface Payment {
  id: string;
  paymentId: string;
  orderId: string;
  serviceType: string;
  serviceName: string;
  serviceImage: string;
  providerName: string;
  customerName: string;
  amount: number;
  status: string;
  date: string;
}

export default function AdminPaymentsPage() {
  const { user: currentUser, isLoading } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentModeFilter, setPaymentModeFilter] = useState('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [totalPayments, setTotalPayments] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [onlineRevenue, setOnlineRevenue] = useState(0);
  const [cashRevenue, setCashRevenue] = useState(0);

  // Fetch payments from API
  const fetchPayments = useCallback(async (status: string = 'all', paymentMode: string = 'all', serviceType: string = 'all', search: string = '') => {
    try {
      setLoading(true);
      
      // Fetch payments with filters
      const params = new URLSearchParams();
      if (paymentMode !== 'all') params.append('paymentMode', paymentMode);
      if (serviceType !== 'all') params.append('serviceType', serviceType);
      
      const response = await apiClient.get(`/admin/payments?${params.toString()}`);
      const apiPayments: Payment[] = response.data.payments || [];
      
      // Fetch revenue statistics
      const revenueResponse = await apiClient.get('/admin/revenue');
      const revenueData = revenueResponse.data;
      
      setTotalRevenue(revenueData.summary.totalPlatformRevenue || 0);
      setOnlineRevenue(revenueData.summary.totalOnlineRevenue || 0);
      setCashRevenue(revenueData.summary.totalCashRevenue || 0);

      // Apply filters on frontend as well (for consistency)
      let filteredPayments = apiPayments;
      
      if (status !== 'all') {
        filteredPayments = filteredPayments.filter(payment => payment.status.toLowerCase() === status.toLowerCase());
      }
      
      if (search) {
        const searchLower = search.toLowerCase();
        filteredPayments = filteredPayments.filter(payment => 
          payment.serviceName.toLowerCase().includes(searchLower) ||
          payment.providerName.toLowerCase().includes(searchLower) ||
          payment.customerName.toLowerCase().includes(searchLower)
        );
      }
      
      setPayments(filteredPayments);
      setTotalPayments(filteredPayments.length);
      setError('');
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      fetchPayments(statusFilter, paymentModeFilter, serviceTypeFilter, searchTerm);
    }
  }, [statusFilter, paymentModeFilter, serviceTypeFilter, currentUser, searchTerm, fetchPayments]);

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    fetchPayments(statusFilter, paymentModeFilter, serviceTypeFilter, value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
    fetchPayments(value, paymentModeFilter, serviceTypeFilter, searchTerm);
  };

  const handlePaymentModeFilterChange = (value: string) => {
    setPaymentModeFilter(value);
    setCurrentPage(1);
    fetchPayments(statusFilter, value, serviceTypeFilter, searchTerm);
  };

  const handleServiceTypeFilterChange = (value: string) => {
    setServiceTypeFilter(value);
    setCurrentPage(1);
    fetchPayments(statusFilter, paymentModeFilter, value, searchTerm);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'PENDING':
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'FAILED':
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'REFUNDED':
      case 'refunded':
        return <XCircle className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'REFUNDED':
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'paid':
        return 'Paid';
      case 'PENDING':
      case 'pending':
        return 'Pending';
      case 'FAILED':
      case 'failed':
        return 'Failed';
      case 'REFUNDED':
      case 'refunded':
        return 'Refunded';
      default:
        return status;
    }
  };

  const getServiceTypeLabel = (serviceType: string) => {
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
  };

  const handleExport = () => {
    // In a real implementation, this would call an API endpoint to export data
    alert('Export functionality would be implemented here');
  };

  if (!isLoading && currentUser?.role !== 'ADMIN') {
    return <div>Your session timed out. Please log in again.</div>;
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Payment Management
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Track all payments and revenue across the platform
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <IndianRupee className="h-5 w-5 text-green-500" />
                  <span>Revenue Tracking</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <IndianRupee className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <IndianRupee className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Online Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹{onlineRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <IndianRupee className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cash Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹{cashRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{totalPayments}</p>
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
                      placeholder="Search by service name, provider, or customer..."
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
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
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
                
                {/* Export Button */}
                <div>
                  <Button 
                    onClick={handleExport}
                    className="flex items-center space-x-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </Button>
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
                    {payments.length} payment{payments.length !== 1 ? 's' : ''} found
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
                    fetchPayments('all', 'all', 'all', '');
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

          {/* Payments Table */}
          {!loading && !error && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {payment.serviceName}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {payment.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {payment.customerName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {payment.providerName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {getServiceTypeLabel(payment.serviceType)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(payment.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {getStatusIcon(payment.status)}
                            <span className="ml-1">{getStatusText(payment.status)}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₹{payment.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {payments.length > 0 && (
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
                        <span className="font-medium">{payments.length}</span> of{' '}
                        <span className="font-medium">{payments.length}</span> results
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
              
              {/* Empty State */}
              {payments.length === 0 && !loading && !error && (
                <div className="text-center py-12">
                  <IndianRupee className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No payments match your current filters.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}