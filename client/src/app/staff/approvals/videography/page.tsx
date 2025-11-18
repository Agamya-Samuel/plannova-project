'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { 
  Eye, 
  Video, 
  MapPin, 
  IndianRupee, 
  Star, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Filter,
  Search,
  X,
  Loader2,
  Trash2
} from 'lucide-react';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { sonnerConfirm } from '@/lib/sonner-confirm';
import { sonnerPrompt } from '@/lib/sonner-prompt';

interface ApiError extends Error {
  response?: {
    data?: {
      error?: string;
    };
  };
}

interface VideographyService {
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
    category: string;
    isPrimary: boolean;
  }>;
  videographyTypes: string[];
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
  pendingEdits?: Partial<VideographyService>;
}

export default function StaffVideographyApprovalsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<VideographyService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const fetchVideographyServices = async (status = 'PENDING', search = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (status !== 'ALL') {
        params.append('status', status);
      }
      
      if (search) {
        params.append('search', search);
      }

      const response = await apiClient.get<{ data: VideographyService[] }>(`/videography/staff/pending?${params}`);
      setServices(response.data.data);
      setError('');
    } catch (err) {
      console.error('Error fetching videography services:', err);
      setError('Failed to fetch videography services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideographyServices(statusFilter, searchTerm);
  }, [statusFilter, searchTerm]);

  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (value.trim() === '') {
      fetchVideographyServices(statusFilter, '');
      return;
    }
    
    setIsSearching(true);
    
    const timeout = setTimeout(() => {
      fetchVideographyServices(statusFilter, value.trim()).finally(() => {
        setIsSearching(false);
      });
    }, 300);
    
    setSearchTimeout(timeout);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    fetchVideographyServices(value, searchTerm);
  };

  const handleApproveService = async (serviceId: string) => {
    const confirmed = await sonnerConfirm('Are you sure you want to approve this videography service?');
    if (!confirmed) {
      return;
    }

    try {
      await apiClient.put(`/videography/staff/${serviceId}/approve`);
      toast.success('Videography service approved successfully!');
      fetchVideographyServices(statusFilter, searchTerm);
    } catch (err: unknown) {
      console.error('Error approving videography service:', err);
      let errorMessage = 'Failed to approve videography service';
      const apiError = err as ApiError;
      if (apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      }
      toast.error(errorMessage);
    }
  };

  const handleRejectService = async (serviceId: string) => {
    const reason = await sonnerPrompt('Please provide a reason for rejection:', {
      placeholder: 'Enter rejection reason...'
    });
    
    if (!reason || reason.trim() === '') {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      await apiClient.put(`/videography/staff/${serviceId}/reject`, { rejectionReason: reason.trim() });
      toast.success('Videography service rejected successfully!');
      fetchVideographyServices(statusFilter, searchTerm);
    } catch (err: unknown) {
      console.error('Error rejecting videography service:', err);
      let errorMessage = 'Failed to reject videography service';
      const apiError = err as ApiError;
      if (apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      }
      toast.error(errorMessage);
    }
  };

  // New function to approve videography service edits
  const handleApproveServiceEdit = async (serviceId: string) => {
    const confirmed = await sonnerConfirm('Are you sure you want to approve these videography service edits?');
    if (!confirmed) {
      return;
    }

    try {
      await apiClient.post(`/videography/${serviceId}/approve-edit`);
      toast.success('Videography service edits approved successfully!');
      fetchVideographyServices(statusFilter, searchTerm);
    } catch (err: unknown) {
      console.error('Error approving videography service edits:', err);
      let errorMessage = 'Failed to approve videography service edits';
      const apiError = err as ApiError;
      if (apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      }
      toast.error(errorMessage);
    }
  };

  // New function to reject videography service edits
  const handleRejectServiceEdit = async (serviceId: string) => {
    const reason = await sonnerPrompt('Please provide a reason for rejecting these edits:', {
      placeholder: 'Enter rejection reason...'
    });
    
    if (!reason || reason.trim() === '') {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      await apiClient.post(`/videography/${serviceId}/reject-edit`, { reason: reason.trim() });
      toast.success('Videography service edits rejected successfully!');
      fetchVideographyServices(statusFilter, searchTerm);
    } catch (err: unknown) {
      console.error('Error rejecting videography service edits:', err);
      let errorMessage = 'Failed to reject videography service edits';
      const apiError = err as ApiError;
      if (apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      }
      toast.error(errorMessage);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    const confirmed = await sonnerConfirm('Are you sure you want to delete this videography service? The service will be moved to the trash where it can be restored later.');
    if (!confirmed) {
      return;
    }

    try {
      await apiClient.delete(`/videography/staff/${serviceId}`);
      toast.success('Videography service moved to trash successfully!');
      fetchVideographyServices(statusFilter, searchTerm);
    } catch (err: unknown) {
      console.error('Error deleting videography service:', err);
      let errorMessage = 'Failed to delete videography service';
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
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
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

  if (user?.role !== 'STAFF' && user?.role !== 'ADMIN') {
    return <div>Access denied. Staff access required.</div>;
  }

  return (
    <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Videography Service Approvals
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Review and approve provider videography service submissions
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Video className="h-5 w-5 text-indigo-500" />
                  <span>Videography Services</span>
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
                      onChange={(e) => handleSearchTermChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => handleSearchTermChange('')}
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
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-black"
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
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-indigo-600" />
                  <span className="text-indigo-800 font-medium">
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
                    fetchVideographyServices('PENDING', '');
                  }}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  Clear filters
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
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
                    <Video className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No videography services found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm && statusFilter !== 'PENDING' && statusFilter !== 'PENDING_EDIT'
                      ? `No videography services found matching "${searchTerm}" with status "${statusFilter}".`
                      : searchTerm
                      ? `No videography services found matching "${searchTerm}".`
                      : statusFilter !== 'PENDING' && statusFilter !== 'PENDING_EDIT'
                      ? `No videography services found with status "${statusFilter}".`
                      : statusFilter === 'PENDING_EDIT'
                      ? "No videography services have pending edits for review."
                      : "No videography services are currently pending approval."}
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
                            {service.images.length > 0 ? (
                              <Image
                                src={service.images.find(img => img.isPrimary)?.url || service.images[0]?.url || '/placeholder-image.jpg'}
                                alt={service.name}
                                width={800}
                                height={600}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <Video className="h-12 w-12 text-gray-400" />
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
                                  {getStatusIcon(service.status)}
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
                                <Video className="h-4 w-4" />
                                <span className="text-sm">
                                  {service.status === 'PENDING_EDIT' && service.pendingEdits?.videographyTypes
                                    ? service.pendingEdits.videographyTypes.length
                                    : service.videographyTypes.length}
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
                                router.push(`/staff/approvals/videography/view?id=${service._id}`);
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
                                  onClick={() => handleApproveService(service._id)}
                                  className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-1"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Approve</span>
                                </Button>
                                
                                <Button
                                  size="sm"
                                  onClick={() => handleRejectService(service._id)}
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
                                  onClick={() => handleApproveServiceEdit(service._id)}
                                  className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-1"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Approve Edit</span>
                                </Button>
                                
                                <Button
                                  size="sm"
                                  onClick={() => handleRejectServiceEdit(service._id)}
                                  className="bg-red-600 hover:bg-red-700 text-white flex items-center space-x-1"
                                >
                                  <XCircle className="h-4 w-4" />
                                  <span>Reject Edit</span>
                                </Button>
                              </>
                            )}
                            
                            <Button
                              size="sm"
                              onClick={() => handleDeleteService(service._id)}
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
