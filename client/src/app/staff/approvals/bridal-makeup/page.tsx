'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import { Button } from '../../../../components/ui/button';
import { 
  Eye, 
  Heart, 
  MapPin, 
  IndianRupee, 
  Star, 
  CheckCircle, 
  XCircle,
  Filter,
  Search,
  X,
  Loader2,
  Trash2
} from 'lucide-react';
import apiClient from '../../../../lib/api';
import { toast } from 'sonner';
import { sonnerConfirm } from '../../../../lib/sonner-confirm';
import { sonnerPrompt } from '../../../../lib/sonner-prompt';

interface ApiError extends Error {
  response?: {
    data?: {
      error?: string;
    };
  };
}

interface BridalMakeupService {
  _id: string;
  name: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PENDING_EDIT';
  serviceLocation: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  basePrice: number;
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  makeupTypes: string[];
  packages: Array<{
    name: string;
    description: string;
    price: number;
    isPopular: boolean;
  }>;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  provider: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  pendingEdits?: Partial<BridalMakeupService>;
}

export default function StaffBridalMakeupApprovalsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<BridalMakeupService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const fetchBridalMakeupServices = async (status = 'PENDING', search = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (status !== 'ALL') {
        params.append('status', status);
      }
      
      if (search) {
        params.append('search', search);
      }

      const response = await apiClient.get(`/bridal-makeup/staff/pending?${params.toString()}`);
      setServices(response.data.data);
      setError('');
    } catch (error) {
      console.error('Error fetching bridal makeup services:', error);
      const apiError = error as ApiError;
      setError(apiError.response?.data?.error || 'Failed to fetch bridal makeup services');
      toast.error('Failed to fetch bridal makeup services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'STAFF' || user?.role === 'ADMIN') {
      fetchBridalMakeupServices(statusFilter, searchTerm);
    }
  }, [user, statusFilter, searchTerm]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      setIsSearching(false);
    }, 500);
    
    setSearchTimeout(timeout);
    setIsSearching(true);
  };

  const handleApprove = async (serviceId: string) => {
    const confirmed = await sonnerConfirm('Are you sure you want to approve this bridal makeup service?');
    if (!confirmed) {
      return;
    }

    try {
      await apiClient.put(`/bridal-makeup/staff/${serviceId}/approve`);
      toast.success('Bridal makeup service approved successfully!');
      fetchBridalMakeupServices(statusFilter, searchTerm);
    } catch (err: unknown) {
      console.error('Error approving bridal makeup service:', err);
      let errorMessage = 'Failed to approve bridal makeup service';
      const apiError = err as ApiError;
      if (apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      }
      toast.error(errorMessage);
    }
  };

  const handleReject = async (serviceId: string) => {
    const reason = await sonnerPrompt('Please provide a reason for rejection:', {
      placeholder: 'Enter rejection reason...'
    });
    
    if (!reason || reason.trim() === '') {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      await apiClient.put(`/bridal-makeup/staff/${serviceId}/reject`, { rejectionReason: reason.trim() });
      toast.success('Bridal makeup service rejected successfully!');
      fetchBridalMakeupServices(statusFilter, searchTerm);
    } catch (err: unknown) {
      console.error('Error rejecting bridal makeup service:', err);
      let errorMessage = 'Failed to reject bridal makeup service';
      const apiError = err as ApiError;
      if (apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      }
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (serviceId: string) => {
    const confirmed = await sonnerConfirm('Are you sure you want to delete this bridal makeup service? The service will be moved to the trash where it can be restored later.');
    if (!confirmed) {
      return;
    }

    try {
      await apiClient.delete(`/bridal-makeup/staff/${serviceId}`);
      toast.success('Bridal makeup service moved to trash successfully!');
      fetchBridalMakeupServices(statusFilter, searchTerm);
    } catch (err: unknown) {
      console.error('Error deleting bridal makeup service:', err);
      let errorMessage = 'Failed to delete bridal makeup service';
      const apiError = err as ApiError;
      if (apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      }
      toast.error(errorMessage);
    }
  };

  const handleApproveEdit = async (serviceId: string) => {
    const confirmed = await sonnerConfirm('Are you sure you want to approve these bridal makeup service edits?');
    if (!confirmed) {
      return;
    }

    try {
      await apiClient.post(`/bridal-makeup/${serviceId}/approve-edit`);
      toast.success('Bridal makeup service edits approved successfully!');
      fetchBridalMakeupServices(statusFilter, searchTerm);
    } catch (err: unknown) {
      console.error('Error approving bridal makeup service edits:', err);
      let errorMessage = 'Failed to approve bridal makeup service edits';
      const apiError = err as ApiError;
      if (apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      }
      toast.error(errorMessage);
    }
  };

  const handleRejectEdit = async (serviceId: string) => {
    const reason = await sonnerPrompt('Please provide a reason for rejecting these edits:', {
      placeholder: 'Enter rejection reason...'
    });
    
    if (!reason || reason.trim() === '') {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      await apiClient.post(`/bridal-makeup/${serviceId}/reject-edit`, { reason: reason.trim() });
      toast.success('Bridal makeup service edits rejected successfully!');
      fetchBridalMakeupServices(statusFilter, searchTerm);
    } catch (err: unknown) {
      console.error('Error rejecting bridal makeup service edits:', err);
      let errorMessage = 'Failed to reject bridal makeup service edits';
      const apiError = err as ApiError;
      if (apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      }
      toast.error(errorMessage);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING_EDIT':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  if (user?.role !== 'STAFF' && user?.role !== 'ADMIN') {
    return <div>Access denied. Staff access required.</div>;
  }

  return (
    <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Bridal Makeup Service Approvals
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Review and approve bridal makeup service submissions
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Heart className="h-5 w-5 text-pink-500" />
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
                      placeholder="Search by service name, provider, or location..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {isSearching ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
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
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-black"
                  >
                    <option value="PENDING">Pending Approval</option>
                    <option value="PENDING_EDIT">Pending Edits</option>
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
            <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-pink-600" />
                  <span className="text-pink-800 font-medium">
                    {services.length} service{services.length !== 1 ? 's' : ''} found
                    {searchTerm && ` for "${searchTerm}"`}
                    {statusFilter !== 'PENDING' && statusFilter !== 'PENDING_EDIT' && ` with status "${statusFilter}"`}
                    {statusFilter === 'PENDING_EDIT' && ' with pending edits'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('PENDING');
                    fetchBridalMakeupServices('PENDING', '');
                  }}
                  className="text-pink-600 hover:text-pink-800 text-sm font-medium"
                >
                  Clear filters
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-pink-600" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Services Grid */}
          {!loading && !error && (
            <div className="space-y-6">
              {services.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No bridal makeup services found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm && statusFilter !== 'PENDING' && statusFilter !== 'PENDING_EDIT'
                      ? `No bridal makeup services found matching "${searchTerm}" with status "${statusFilter}".`
                      : searchTerm
                      ? `No bridal makeup services found matching "${searchTerm}".`
                      : statusFilter !== 'PENDING' && statusFilter !== 'PENDING_EDIT'
                      ? `No bridal makeup services found with status "${statusFilter}".`
                      : statusFilter === 'PENDING_EDIT'
                      ? "No bridal makeup services have pending edits for review."
                      : "No bridal makeup services are currently pending approval."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {services.map((service) => (
                    <div key={service._id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                      <div className="md:flex">
                        {/* Image */}
                        <div className="md:w-1/3">
                          <div className="h-64 md:h-full">
                            {service.images && service.images.length > 0 ? (
                              <Image
                                src={service.images.find(img => img.isPrimary)?.url || service.images[0]?.url || '/placeholder-image.jpg'}
                                alt={service.name}
                                width={800}
                                height={600}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <Heart className="h-12 w-12 text-gray-400" />
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
                                <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(service.status)}`}>
                                  <span>{service.status === 'PENDING_EDIT' ? 'Pending Edit' : service.status}</span>
                                </span>
                              </div>
                              <p className="text-gray-600 mb-2">
                                <MapPin className="h-4 w-4 inline mr-1" />
                                {service.serviceLocation.city}, {service.serviceLocation.state}
                              </p>
                              <p className="text-sm text-gray-500 mb-2">
                                <strong>Provider:</strong> {service.provider?.firstName || 'Unknown'} {service.provider?.lastName || 'Provider'} ({service.provider?.email || 'No email'})
                              </p>
                              <p className="text-sm text-gray-500 line-clamp-2">
                                {service.status === 'PENDING_EDIT' && service.pendingEdits?.description
                                  ? service.pendingEdits.description
                                  : service.description}
                              </p>
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-1 text-gray-600">
                                <Heart className="h-4 w-4" />
                                <span className="text-sm">
                                  {service.status === 'PENDING_EDIT' && service.pendingEdits?.makeupTypes
                                    ? service.pendingEdits.makeupTypes.length
                                    : service.makeupTypes.length}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">Types</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-1 text-gray-600">
                                <Star className="h-4 w-4" />
                                <span className="text-sm">{service.rating || 0}</span>
                              </div>
                              <p className="text-xs text-gray-500">{service.reviewCount} Reviews</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-1 text-gray-600">
                                <IndianRupee className="h-4 w-4" />
                                <span className="text-sm">
                                  {service.status === 'PENDING_EDIT' && service.pendingEdits?.basePrice
                                    ? service.pendingEdits.basePrice
                                    : service.basePrice}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">Base Price</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-1 text-gray-600">
                                <span className="text-sm">
                                  {service.status === 'PENDING_EDIT' && service.pendingEdits?.packages
                                    ? service.pendingEdits.packages.length
                                    : service.packages.length}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">Packages</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              // View service details in same tab
                              router.push(`/staff/approvals/bridal-makeup/view?id=${service._id}`);
                            }}
                            className="flex items-center space-x-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View Details</span>
                          </Button>
                          
                          {service.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(service._id)}
                                className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-1"
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span>Approve</span>
                              </Button>
                              
                              <Button
                                size="sm"
                                onClick={() => handleReject(service._id)}
                                className="bg-red-600 hover:bg-red-700 text-white flex items-center space-x-1"
                              >
                                <XCircle className="h-4 w-4" />
                                <span>Reject</span>
                              </Button>
                            </>
                          )}
                          
                          {service.status === 'PENDING_EDIT' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApproveEdit(service._id)}
                                className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-1"
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span>Approve Edit</span>
                              </Button>
                              
                              <Button
                                size="sm"
                                onClick={() => handleRejectEdit(service._id)}
                                className="bg-red-600 hover:bg-red-700 text-white flex items-center space-x-1"
                              >
                                <XCircle className="h-4 w-4" />
                                <span>Reject Edit</span>
                              </Button>
                            </>
                          )}
                          
                          <Button
                            size="sm"
                            onClick={() => handleDelete(service._id)}
                            className="bg-gray-600 hover:bg-gray-700 text-white flex items-center space-x-1"
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
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
