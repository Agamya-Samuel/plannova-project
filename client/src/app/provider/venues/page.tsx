'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../../../contexts/AuthContext';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import { Button } from '../../../components/ui/button';
import { 
  Plus, 
  Edit3, 
  Eye, 
  Trash2, 
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
    status?: number;
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

export default function ProviderVenuesPage() {
  const { user } = useAuth();
  const router = useRouter();
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

      const response = await apiClient.get<VenuesResponse>(`/venues/provider/my-venues?${params}`);
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
  }, [currentPage, statusFilter, searchTerm]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchVenues(1, statusFilter, searchTerm);
  };

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // If search is empty, search immediately
    if (value.trim() === '') {
      setCurrentPage(1);
      fetchVenues(1, statusFilter, '');
      return;
    }
    
    // Set searching state
    setIsSearching(true);
    
    // Set new timeout for debounced search with shorter delay
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      fetchVenues(1, statusFilter, value.trim()).finally(() => {
        setIsSearching(false);
      });
    }, 300); // Reduced to 300ms for faster response
    
    setSearchTimeout(timeout);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
    fetchVenues(1, value, searchTerm);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handleDeleteVenue = async (venueId: string) => {
    const confirmed = await sonnerConfirm('Are you sure you want to delete this venue? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    try {
      console.log('Deleting venue:', venueId);
      await apiClient.delete(`/venues/${venueId}`);
      toast.success('Venue deleted successfully!');
      fetchVenues(currentPage, statusFilter, searchTerm);
    } catch (err: unknown) {
      console.error('Error deleting venue:', err);
      
      let errorMessage = 'Failed to delete venue';
      const apiError = err as ApiError;
      
      if (apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      } else if (apiError.response?.status === 404) {
        errorMessage = 'Venue not found';
      } else if (apiError.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this venue';
      }
      
      toast.error(errorMessage);
    }
  };

  const handleSubmitForApproval = async (venueId: string) => {
    const confirmed = await sonnerConfirm('Are you sure you want to submit this venue for approval?');
    if (!confirmed) {
      return;
    }

    try {
      console.log('Submitting venue for approval:', venueId);
      console.log('API endpoint:', `${apiClient.defaults.baseURL}/venues/${venueId}/submit`);
      
      const response = await apiClient.post(`/venues/${venueId}/submit`);
      console.log('Submit response:', response.data);
      
      toast.success('Venue submitted for approval successfully!');
      fetchVenues(currentPage, statusFilter, searchTerm);
    } catch (err: unknown) {
      console.error('Error submitting venue:', err);
      
      let errorMessage = 'Failed to submit venue for approval';
      const apiError = err as ApiError;
      
      if (apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      } else if (apiError.response?.status === 404) {
        errorMessage = 'Venue not found or submit endpoint not available';
      } else if (apiError.response?.status === 400) {
        errorMessage = 'Invalid venue data for submission';
      }
      
      toast.error(errorMessage);
    }
  };

  const getStatusIcon = (status: string) => {
    // Hide PENDING_EDIT status from providers by showing it as APPROVED
    const displayStatus = status === 'PENDING_EDIT' ? 'APPROVED' : status;
    
    switch (displayStatus) {
      case 'DRAFT':
        return <Edit3 className="h-4 w-4 text-gray-500" />;
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
    // Hide PENDING_EDIT status from providers by showing it as APPROVED
    const displayStatus = status === 'PENDING_EDIT' ? 'APPROVED' : status;
    
    switch (displayStatus) {
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

  if (user?.role !== 'PROVIDER') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <div className="mx-auto bg-gradient-to-br from-pink-100 to-purple-100 rounded-full p-4 w-24 h-24 flex items-center justify-center mb-6">
            <MapPin className="h-12 w-12 text-pink-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
          <p className="text-gray-600 mb-6">You must be logged in as a provider to access this page.</p>
          <Button 
            onClick={() => router.push('/auth/login')}
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white"
          >
            Login
          </Button>
        </div>
      </div>
    );
  }

  // Check if the user has selected venue as their service category
  const hasVenueCategory = user.serviceCategories?.includes('venue');
  
  if (!hasVenueCategory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <div className="mx-auto bg-gradient-to-br from-pink-100 to-purple-100 rounded-full p-4 w-24 h-24 flex items-center justify-center mb-6">
            <MapPin className="h-12 w-12 text-pink-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Service Not Available</h2>
          <p className="text-gray-600 mb-6">
            You haven't selected venue as your service category. 
            Please update your profile to access venue services.
          </p>
          <Button 
            onClick={() => router.push('/provider/onboarding')}
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white"
          >
            Update Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    My Venues
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Manage your wedding venues and track their performance
                  </p>
                </div>
                <Link href="/provider/venues/create">
                  <Button className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl flex items-center space-x-2">
                    <Plus className="h-5 w-5" />
                    <span>Add New Venue</span>
                  </Button>
                </Link>
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
                      placeholder="Search by venue name, location, or description..."
                      value={searchTerm}
                      onChange={(e) => handleSearchTermChange(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder-gray-500"
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
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="ALL">All Status</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSearch}
                    className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-xl"
                  >
                    Search
                  </Button>
                  {(searchTerm || statusFilter !== 'ALL') && (
                    <Button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('ALL');
                        setCurrentPage(1);
                        fetchVenues(1, 'ALL', '');
                      }}
                      variant="outline"
                      className="px-6 py-3 rounded-xl border-gray-200 hover:bg-gray-50"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Search Results Info */}
          {!loading && !error && (searchTerm || statusFilter !== 'ALL') && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-blue-600" />
                  <span className="text-blue-800 font-medium">
                    {venues.length} venue{venues.length !== 1 ? 's' : ''} found
                    {searchTerm && ` for "${searchTerm}"`}
                    {statusFilter !== 'ALL' && ` with status "${statusFilter}"`}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('ALL');
                    setCurrentPage(1);
                    fetchVenues(1, 'ALL', '');
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Clear filters
                </button>
              </div>
            </div>
          )}

          {/* Venues Grid */}
          {!loading && !error && (
            <div className="space-y-6">
              {venues.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No venues found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm && statusFilter !== 'ALL'
                      ? `No venues found matching "${searchTerm}" with status "${statusFilter}".`
                      : searchTerm
                      ? `No venues found matching "${searchTerm}".`
                      : statusFilter !== 'ALL'
                      ? `No venues found with status "${statusFilter}".`
                      : "You haven't created any venues yet."}
                  </p>
                  {statusFilter === 'ALL' && !searchTerm && (
                    <Link href="/provider/venues/create">
                      <Button className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white">
                        <Plus className="h-5 w-5 mr-2" />
                        Create Your First Venue
                      </Button>
                    </Link>
                  )}
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
                                // Redirect to create page with venue data for editing
                                router.push(`/provider/venues/edit/${venue._id}`);
                              }}
                              className="flex items-center space-x-1"
                            >
                              <Edit3 className="h-4 w-4" />
                              <span>Edit</span>
                            </Button>
                            
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                // View venue details in provider context
                                router.push(`/provider/venues/view/${venue._id}`);
                              }}
                              className="flex items-center space-x-1"
                            >
                              <Eye className="h-4 w-4" />
                              <span>View</span>
                            </Button>
                            
                            {venue.status === 'DRAFT' && (
                              <Button
                                size="sm"
                                onClick={() => handleSubmitForApproval(venue._id)}
                                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1"
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span>Submit</span>
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteVenue(venue._id)}
                              className="text-red-600 border-red-200 hover:bg-red-50 flex items-center space-x-1"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Delete</span>
                            </Button>
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