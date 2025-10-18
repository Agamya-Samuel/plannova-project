'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Search,
  X,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { sonnerConfirm } from '@/lib/sonner-confirm';
import Link from 'next/link';

interface ApiError extends Error {
  response?: {
    data?: {
      error?: string;
    };
  };
}

interface Venue {
  _id: string;
  name: string;
  description: string;
  address: {
    street: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PENDING_EDIT';
  isActive: boolean;
  basePrice: number;
  capacity: {
    min: number;
    max: number;
  };
  providerId: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface VenuesResponse {
  venues: Venue[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function AdminVenuesPage() {
  const { user: currentUser } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const fetchVenues = async (page = 1, status = 'ALL', search = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (status !== 'ALL') {
        params.append('status', status);
      }
      
      if (search) {
        params.append('search', search);
      }

      // Using the staff endpoint as it provides access to all venues
      const response = await apiClient.get<VenuesResponse>(`/venues/staff/pending?${params}`);
      setVenues(response.data.venues);
      setPagination(response.data.pagination);
      setError('');
    } catch (err) {
      console.error('Error fetching venues:', err);
      setError('Failed to fetch venues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      fetchVenues(currentPage, statusFilter, searchTerm);
    }
  }, [currentPage, statusFilter, currentUser, searchTerm]);

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (value.trim() === '') {
      setCurrentPage(1);
      fetchVenues(1, statusFilter, '');
      return;
    }
    
    setIsSearching(true);
    
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      fetchVenues(1, statusFilter, value.trim()).finally(() => {
        setIsSearching(false);
      });
    }, 300);
    
    setSearchTimeout(timeout);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
    fetchVenues(1, value, searchTerm);
  };

  const handleApproveVenue = async (venueId: string, venueName: string) => {
    const confirmed = await sonnerConfirm(`Are you sure you want to approve venue "${venueName}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await apiClient.post(`/venues/staff/${venueId}/approve`);
      toast.success('Venue approved successfully!');
      fetchVenues(currentPage, statusFilter, searchTerm);
    } catch (err: unknown) {
      console.error('Error approving venue:', err);
      let errorMessage = 'Failed to approve venue';
      const apiError = err as ApiError;
      if (apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      }
      toast.error(errorMessage);
    }
  };

  const handleRejectVenue = async (venueId: string, venueName: string) => {
    const reason = await sonnerPrompt('Please provide a reason for rejection:');
    if (!reason) {
      return;
    }

    try {
      await apiClient.post(`/venues/staff/${venueId}/reject`, { reason });
      toast.success('Venue rejected successfully!');
      fetchVenues(currentPage, statusFilter, searchTerm);
    } catch (err: unknown) {
      console.error('Error rejecting venue:', err);
      let errorMessage = 'Failed to reject venue';
      const apiError = err as ApiError;
      if (apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      }
      toast.error(errorMessage);
    }
  };

  const handleDeleteVenue = async (venueId: string, venueName: string) => {
    const confirmed = await sonnerConfirm(`Are you sure you want to delete venue "${venueName}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    try {
      await apiClient.delete(`/venues/staff/${venueId}`);
      toast.success('Venue deleted successfully!');
      fetchVenues(currentPage, statusFilter, searchTerm);
    } catch (err: unknown) {
      console.error('Error deleting venue:', err);
      let errorMessage = 'Failed to delete venue';
      const apiError = err as ApiError;
      if (apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      }
      toast.error(errorMessage);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PENDING_EDIT':
        return <Edit className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING_EDIT':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending Approval';
      case 'APPROVED':
        return 'Approved';
      case 'REJECTED':
        return 'Rejected';
      case 'PENDING_EDIT':
        return 'Pending Edit';
      default:
        return status;
    }
  };

  const sonnerPrompt = (message: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const result = window.prompt(message);
      resolve(result || null);
    });
  };

  if (currentUser?.role !== 'ADMIN') {
    return <div>Access denied. Admin access required.</div>;
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
                    Venue Management
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Review, approve, and manage venue listings
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <MapPin className="h-5 w-5 text-pink-500" />
                  <span>Venue Administration</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <MapPin className="h-6 w-6 text-pink-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Venues</p>
                  <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
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
                    {venues.filter(v => v.status === 'PENDING').length}
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
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {venues.filter(v => v.status === 'APPROVED').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {venues.filter(v => v.status === 'REJECTED').length}
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
                      placeholder="Search by venue name or location..."
                      value={searchTerm}
                      onChange={(e) => handleSearchTermChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => handleSearchTermChange('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {isSearching ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                        ) : (
                          <X className="h-4 w-4" />
                        )}
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
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="PENDING_EDIT">Pending Edit</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Search Results Info */}
          {!loading && !error && (searchTerm || statusFilter !== 'ALL') && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-red-600" />
                  <span className="text-red-800 font-medium">
                    {venues.length} venue{venues.length !== 1 ? 's' : ''} found
                    {searchTerm && ` for "${searchTerm}"`}
                    {statusFilter !== 'ALL' && ` with status "${getStatusText(statusFilter)}"`}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('ALL');
                    setCurrentPage(1);
                    fetchVenues(1, 'ALL', '');
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

          {/* Venues Table */}
          {!loading && !error && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Venue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {venues.map((venue) => (
                      <tr key={venue._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <MapPin className="h-6 w-6 text-pink-500" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {venue.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                Capacity: {venue.capacity.min} - {venue.capacity.max}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {venue.providerId.firstName} {venue.providerId.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {venue.providerId.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {venue.address.city}, {venue.address.state}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(venue.status)}`}>
                            {getStatusIcon(venue.status)}
                            <span className="ml-1">{getStatusText(venue.status)}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₹{venue.basePrice.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col space-y-2">
                            <div className="flex space-x-2">
                              <Link href={`/venues/${venue._id}`} target="_blank">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </Link>
                              
                              {venue.status === 'PENDING' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleApproveVenue(venue._id, venue.name)}
                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRejectVenue(venue._id, venue.name)}
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              
                              {venue.status === 'PENDING_EDIT' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleApproveVenue(venue._id, venue.name)}
                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRejectVenue(venue._id, venue.name)}
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject Edit
                                  </Button>
                                </>
                              )}
                            </div>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteVenue(venue._id, venue.name)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {pagination.pages > 1 && (
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
                      disabled={currentPage === pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                        <span className="font-medium">{pagination.total}</span> results
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
                          Page {pagination.page} of {pagination.pages}
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === pagination.pages}
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
