'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  MapPin, 
  Search
} from 'lucide-react';
import StatsOverview from '@/components/ui/StatsOverview';
import ServiceCard from '@/components/ui/ServiceCard';
import SearchFilter from '@/components/ui/SearchFilter';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { sonnerConfirm } from '@/lib/sonner-confirm';

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
  const [submitLoading] = useState<string | null>(null);

  // Calculate stats
  const totalVenues = venues.length;
  const approvedVenues = venues.filter(venue => venue.status === 'APPROVED').length;
  const pendingVenues = venues.filter(venue => venue.status === 'PENDING').length;
  const averagePrice = venues.length > 0 ? venues.reduce((sum, venue) => sum + venue.basePrice, 0) / venues.length : 0;

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
    
    // Set new timeout for debounced search with shorter delay
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      fetchVenues(1, statusFilter, value.trim());
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
            You have not selected venue as your service category.
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
          <div className="flex justify-between items-center mb-8">
                <div>
              <h1 className="text-3xl font-bold text-gray-900">My Venues</h1>
              <p className="mt-2 text-gray-600">
                    Manage your wedding venues and track their performance
                  </p>
                </div>
            <Button
              onClick={() => router.push('/provider/venues/create')}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Venue
                  </Button>
          </div>

          {/* Stats Overview */}
          <StatsOverview
            totalServices={totalVenues}
            approvedServices={approvedVenues}
            pendingServices={pendingVenues}
            averagePrice={averagePrice}
            serviceType="venues"
          />

          {/* Search and Filter */}
          <div className="mb-6">
            <SearchFilter
              searchValue={searchTerm}
              onSearchChange={handleSearchTermChange}
              onSearch={handleSearch}
              onClear={() => {
                        setSearchTerm('');
                        setStatusFilter('ALL');
                        setCurrentPage(1);
                        fetchVenues(1, 'ALL', '');
                      }}
              statusValue={statusFilter}
              onStatusChange={handleStatusFilterChange}
              statusOptions={[
                { value: 'ALL', label: 'All Status' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'REJECTED', label: 'Rejected' },
                { value: 'SUSPENDED', label: 'Suspended' }
              ]}
              placeholder="Search by venue name, location, or description..."
            />
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {venues.map((venue) => (
                    <ServiceCard
                      key={venue._id}
                      id={venue._id}
                      name={venue.name}
                      description={venue.description}
                      status={venue.status}
                      location={`${venue.address.area}, ${venue.address.city}`}
                      price={venue.basePrice}
                      rating={venue.averageRating || 0}
                      reviewCount={venue.totalReviews}
                      tags={[venue.type]}
                      onEdit={(id) => router.push(`/provider/venues/edit/${id}`)}
                      onView={(id) => router.push(`/provider/venues/view/${id}`)}
                      onDelete={handleDeleteVenue}
                      onSubmitForApproval={handleSubmitForApproval}
                      loading={loading}
                      submitLoading={submitLoading === venue._id}
                    />
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