'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import { Button } from '../../../components/ui/button';
import { 
  Eye, 
  Upload, 
  MapPin, 
  Users, 
  DollarSign, 
  Star, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Filter,
  Search,
  X
} from 'lucide-react';
import apiClient from '../../../lib/api';
import { toast } from 'sonner';
import { sonnerConfirm } from '../../../lib/sonner-confirm';

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
  type: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  address: {
    street: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
  };
  capacity: {
    min: number;
    max: number;
  };
  basePrice: number;
  images: Array<{
    url: string;
    alt: string;
    category: string;
    isPrimary: boolean;
  }>;
  averageRating: number;
  totalReviews: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  providerId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
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

export default function StaffApprovalsPage() {
  const { user } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING');
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

  const fetchVenues = async (page = 1, status = 'PENDING', search = '') => {
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
    fetchVenues(currentPage, statusFilter, searchTerm);
  }, [currentPage, statusFilter]);

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

  const handleApproveVenue = async (venueId: string) => {
    const confirmed = await sonnerConfirm('Are you sure you want to approve this venue?');
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

  const handleRejectVenue = async (venueId: string) => {
    const reason = await sonnerPrompt('Please provide a reason for rejection:', {
      placeholder: 'Enter rejection reason...'
    });
    
    if (!reason || reason.trim() === '') {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      await apiClient.post(`/venues/staff/${venueId}/reject`, { reason: reason.trim() });
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'SUSPENDED':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'SUSPENDED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (user?.role !== 'STAFF' && user?.role !== 'ADMIN') {
    return <div>Access denied. Staff access required.</div>;
  }

  return (
    <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Venue Approvals
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Review and approve provider venue submissions
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Staff Portal</span>
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
                      placeholder="Search by venue name, provider, or location..."
                      value={searchTerm}
                      onChange={(e) => handleSearchTermChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
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
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="PENDING">Pending Approval</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="ALL">All Status</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Search Results Info */}
          {!loading && !error && (searchTerm || statusFilter !== 'PENDING') && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-blue-600" />
                  <span className="text-blue-800 font-medium">
                    {venues.length} venue{venues.length !== 1 ? 's' : ''} found
                    {searchTerm && ` for "${searchTerm}"`}
                    {statusFilter !== 'PENDING' && ` with status "${statusFilter}"`}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('PENDING');
                    setCurrentPage(1);
                    fetchVenues(1, 'PENDING', '');
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Clear filters
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Venues Grid */}
          {!loading && !error && (
            <div className="space-y-6">
              {venues.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No venues found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm && statusFilter !== 'PENDING'
                      ? `No venues found matching "${searchTerm}" with status "${statusFilter}".`
                      : searchTerm
                      ? `No venues found matching "${searchTerm}".`
                      : statusFilter !== 'PENDING'
                      ? `No venues found with status "${statusFilter}".`
                      : "No venues are currently pending approval."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {venues.map((venue) => (
                    <div key={venue._id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                      <div className="md:flex">
                        {/* Image */}
                        <div className="md:w-1/3">
                          <div className="h-64 md:h-full">
                            {venue.images.length > 0 ? (
                              <Image
                                src={venue.images.find(img => img.isPrimary)?.url || venue.images[0]?.url}
                                alt={venue.name}
                                width={800}
                                height={600}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <Upload className="h-12 w-12 text-gray-400" />
                                <span className="ml-2 text-gray-500">No Image</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="md:w-2/3 p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="text-xl font-bold text-gray-900">{venue.name}</h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(venue.status)}`}>
                                  {getStatusIcon(venue.status)}
                                  <span>{venue.status}</span>
                                </span>
                              </div>
                              <p className="text-gray-600 mb-2">
                                <MapPin className="h-4 w-4 inline mr-1" />
                                {venue.address.area}, {venue.address.city}, {venue.address.state}
                              </p>
                              <p className="text-sm text-gray-500 mb-2">
                                <strong>Provider:</strong> {venue.providerId.firstName} {venue.providerId.lastName} ({venue.providerId.email})
                              </p>
                              <p className="text-sm text-gray-500 line-clamp-2">{venue.description}</p>
                            </div>
                          </div>
                          
                          {/* Stats */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-1 text-gray-600">
                                <Users className="h-4 w-4" />
                                <span className="text-sm">{venue.capacity.min}-{venue.capacity.max}</span>
                              </div>
                              <p className="text-xs text-gray-500">Capacity</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-1 text-gray-600">
                                <DollarSign className="h-4 w-4" />
                                <span className="text-sm">₹{venue.basePrice.toLocaleString()}</span>
                              </div>
                              <p className="text-xs text-gray-500">Base Price</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-1 text-gray-600">
                                <Star className="h-4 w-4" />
                                <span className="text-sm">{venue.averageRating || 0}</span>
                              </div>
                              <p className="text-xs text-gray-500">{venue.totalReviews} Reviews</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-1 text-gray-600">
                                <span className="text-sm">{venue.type}</span>
                              </div>
                              <p className="text-xs text-gray-500">Type</p>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                // View venue details
                                window.open(`/venues/${venue._id}`, '_blank');
                              }}
                              className="flex items-center space-x-1"
                            >
                              <Eye className="h-4 w-4" />
                              <span>View Details</span>
                            </Button>
                            
                            {venue.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveVenue(venue._id)}
                                  className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-1"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Approve</span>
                                </Button>
                                
                                <Button
                                  size="sm"
                                  onClick={() => handleRejectVenue(venue._id)}
                                  className="bg-red-600 hover:bg-red-700 text-white flex items-center space-x-1"
                                >
                                  <XCircle className="h-4 w-4" />
                                  <span>Reject</span>
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-700">
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} venues
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="px-4 py-2 text-sm text-gray-700">
                        Page {pagination.page} of {pagination.pages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === pagination.pages}
                      >
                        Next
                      </Button>
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
