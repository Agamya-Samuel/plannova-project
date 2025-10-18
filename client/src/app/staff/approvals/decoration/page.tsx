'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  MapPin,
  Star,
  Image as ImageIcon,
  Flower2,
  Trash2
} from 'lucide-react';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { sonnerConfirm } from '@/lib/sonner-confirm';
import Image from 'next/image';

interface ApiError extends Error {
  response?: {
    data?: {
      error?: string;
    };
  };
}

interface DecorationService {
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
  contact: {
    phone: string;
    email: string;
  };
  basePrice: number;
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  decorationTypes: string[];
  packages: Array<{
    name: string;
    description: string;
    price: number;
    isPopular: boolean;
  }>;
  addons: Array<{
    name: string;
    description: string;
    price: number;
  }>;
  cancellationPolicy: string;
  paymentTerms: string;
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
    phone: string;
  };
  pendingEdits?: Partial<DecorationService>;
}

function StaffDecorationApprovalsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<DecorationService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const fetchDecorationServices = async (status = 'PENDING', search = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (status !== 'ALL') {
        params.append('status', status);
      }
      
      if (search) {
        params.append('search', search);
      }

      const response = await apiClient.get(`/decoration/staff/pending?${params.toString()}`);
      setServices(response.data.data);
      setError('');
    } catch (error) {
      console.error('Error fetching decoration services:', error);
      const apiError = error as ApiError;
      setError(apiError.response?.data?.error || 'Failed to fetch decoration services');
      toast.error('Failed to fetch decoration services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'STAFF' || user?.role === 'ADMIN') {
      fetchDecorationServices(statusFilter, searchTerm);
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
    const confirmed = await sonnerConfirm('Are you sure you want to approve this decoration service?');
    if (!confirmed) {
      return;
    }
    
    try {
      await apiClient.put(`/decoration/staff/${serviceId}/approve`);
      toast.success('Decoration service approved successfully!');
      fetchDecorationServices(statusFilter, searchTerm);
    } catch (err: unknown) {
      console.error('Error approving decoration service:', err);
      let errorMessage = 'Failed to approve decoration service';
      const apiError = err as ApiError;
      if (apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      }
      toast.error(errorMessage);
    }
  };

  const handleReject = async (serviceId: string) => {
    const confirmed = await sonnerConfirm('Are you sure you want to reject this decoration service?');
    if (!confirmed) {
      return;
    }
    
    try {
      await apiClient.put(`/decoration/staff/${serviceId}/reject`);
      toast.success('Decoration service rejected successfully!');
      fetchDecorationServices(statusFilter, searchTerm);
    } catch (err: unknown) {
      console.error('Error rejecting decoration service:', err);
      let errorMessage = 'Failed to reject decoration service';
      const apiError = err as ApiError;
      if (apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      }
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (serviceId: string) => {
    const confirmed = await sonnerConfirm('Are you sure you want to delete this decoration service? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    try {
      await apiClient.delete(`/decoration/staff/${serviceId}`);
      toast.success('Decoration service deleted successfully!');
      fetchDecorationServices(statusFilter, searchTerm);
    } catch (err: unknown) {
      console.error('Error deleting decoration service:', err);
      let errorMessage = 'Failed to delete decoration service';
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
                    Decoration Service Approvals
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Review and approve provider decoration service submissions
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
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search by service name, provider, or location..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Filter */}
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="PENDING_EDIT">Pending Edit</option>
                  </select>
                </div>

                {/* Refresh Button */}
                <Button
                  onClick={() => fetchDecorationServices(statusFilter, searchTerm)}
                  disabled={loading}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Services List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-pink-500 mx-auto mb-4" />
                <p className="text-gray-600">Loading decoration services...</p>
              </div>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No decoration services found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'ALL' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'No decoration services have been submitted yet.'}
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
                            <Flower2 className="h-12 w-12 text-gray-400" />
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
                            <Flower2 className="h-4 w-4" />
                            <span className="text-sm">
                              {service.status === 'PENDING_EDIT' && service.pendingEdits?.decorationTypes
                                ? service.pendingEdits.decorationTypes.length
                                : service.decorationTypes.length}
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
                            <span className="text-sm">₹</span>
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
                            router.push(`/staff/approvals/decoration/view?id=${service._id}`);
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
                          <Button
                            size="sm"
                            onClick={() => router.push(`/staff/approvals/decoration/view?id=${service._id}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1"
                          >
                            <AlertCircle className="h-4 w-4" />
                            <span>Review Changes</span>
                          </Button>
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
      </div>
    </ProtectedRoute>
  );
}

export default function StaffDecorationApprovalsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <StaffDecorationApprovalsContent />
    </Suspense>
  );
}
