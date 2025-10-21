'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../../../contexts/AuthContext';
import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import { Button } from '../../../../../components/ui/button';
import { 
  ArrowLeft,
  MapPin, 
  IndianRupee, 
  Star, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  Trash2,
  User,
  Mail,
  Phone
} from 'lucide-react';
import apiClient from '../../../../../lib/api';
import { toast } from 'sonner';
import { sonnerConfirm } from '../../../../../lib/sonner-confirm';
import { sonnerPrompt } from '../../../../../lib/sonner-prompt';

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
  makeupTypes: string[];
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
  minGuests: number;
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
  } | null;
  pendingEdits?: Partial<BridalMakeupService>;
}

function StaffBridalMakeupViewContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('id');
  
  const [service, setService] = useState<BridalMakeupService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBridalMakeupService = useCallback(async () => {
    if (!serviceId) return;
    
    try {
      setLoading(true);
      const response = await apiClient.get(`/bridal-makeup/${serviceId}`);
      setService(response.data.data);
      setError('');
    } catch (error) {
      console.error('Error fetching bridal makeup service:', error);
      const apiError = error as ApiError;
      setError(apiError.response?.data?.error || 'Failed to fetch bridal makeup service');
      toast.error('Failed to fetch bridal makeup service');
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    if (user?.role === 'STAFF' || user?.role === 'ADMIN') {
      fetchBridalMakeupService();
    }
  }, [user, serviceId, fetchBridalMakeupService]);

  const handleApprove = async () => {
    if (!service) return;
    
    const confirmed = await sonnerConfirm('Are you sure you want to approve this bridal makeup service?');
    if (!confirmed) {
      return;
    }
    
    try {
      await apiClient.put(`/bridal-makeup/staff/${service._id}/approve`);
      toast.success('Bridal makeup service approved successfully!');
      fetchBridalMakeupService();
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

  const handleReject = async () => {
    if (!service) return;
    
    const reason = await sonnerPrompt('Please provide a reason for rejection:', {
      placeholder: 'Enter rejection reason...'
    });
    
    if (!reason || reason.trim() === '') {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      await apiClient.put(`/bridal-makeup/staff/${service._id}/reject`, { rejectionReason: reason.trim() });
      toast.success('Bridal makeup service rejected successfully!');
      fetchBridalMakeupService();
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

  const handleDelete = async () => {
    if (!service) return;
    
    const confirmed = await sonnerConfirm('Are you sure you want to delete this bridal makeup service? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    try {
      await apiClient.delete(`/bridal-makeup/staff/${service._id}`);
      toast.success('Bridal makeup service deleted successfully!');
      router.push('/staff/approvals/bridal-makeup');
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

  const handleApproveEdit = async () => {
    if (!service) return;
    
    const confirmed = await sonnerConfirm('Are you sure you want to approve these bridal makeup service edits?');
    if (!confirmed) {
      return;
    }
    
    try {
      await apiClient.post(`/bridal-makeup/${service._id}/approve-edit`);
      toast.success('Bridal makeup service edits approved successfully!');
      fetchBridalMakeupService();
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

  const handleRejectEdit = async () => {
    if (!service) return;
    
    const reason = await sonnerPrompt('Please provide a reason for rejecting these edits:', {
      placeholder: 'Enter rejection reason...'
    });
    
    if (!reason || reason.trim() === '') {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      await apiClient.post(`/bridal-makeup/${service._id}/reject-edit`, { reason: reason.trim() });
      toast.success('Bridal makeup service edits rejected successfully!');
      fetchBridalMakeupService();
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Approved';
      case 'PENDING':
        return 'Pending';
      case 'REJECTED':
        return 'Rejected';
      case 'PENDING_EDIT':
        return 'Pending Edit';
      default:
        return status;
    }
  };

  if (user?.role !== 'STAFF' && user?.role !== 'ADMIN') {
    return <div>Access denied. Staff access required.</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading bridal makeup service details...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Bridal makeup service not found'}</p>
          <Button onClick={() => router.push('/staff/approvals/bridal-makeup')}>
            Back to Approvals
          </Button>
        </div>
      </div>
    );
  }

  const displayData = service.status === 'PENDING_EDIT' && service.pendingEdits ? {
    ...service,
    ...service.pendingEdits
  } : service;

  return (
    <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-4">
                <Button
                  onClick={() => router.push('/staff/approvals/bridal-makeup')}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Approvals</span>
                </Button>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(service.status)}`}>
                    {getStatusText(service.status)}
                  </span>
                </div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{displayData.name}</h1>
              <p className="text-gray-600 text-lg">{displayData.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Images */}
              {displayData.images && displayData.images.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Images</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {displayData.images.map((image, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                        <Image
                          src={image.url}
                          alt={image.alt || `${displayData.name} image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Makeup Types */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Makeup Types</h2>
                <div className="flex flex-wrap gap-2">
                  {displayData.makeupTypes.map((type, index) => (
                    <span key={index} className="px-3 py-1 bg-pink-100 text-pink-800 text-sm rounded-full">
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Packages */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Packages</h2>
                <div className="space-y-4">
                  {displayData.packages.map((pkg, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                        {pkg.isPopular && (
                          <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{pkg.description}</p>
                      <div className="flex items-center space-x-1 text-lg font-bold text-gray-900">
                        <IndianRupee className="h-5 w-5" />
                        <span>{pkg.price.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add-ons */}
              {displayData.addons && displayData.addons.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Add-ons</h2>
                  <div className="space-y-3">
                    {displayData.addons.map((addon, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-900">{addon.name}</h3>
                          <p className="text-sm text-gray-600">{addon.description}</p>
                        </div>
                        <div className="flex items-center space-x-1 text-lg font-bold text-gray-900">
                          <IndianRupee className="h-5 w-5" />
                          <span>{addon.price.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Details */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Starting Price</h3>
                    <div className="flex items-center space-x-1 text-xl font-bold text-gray-900">
                      <IndianRupee className="h-6 w-6" />
                      <span>{displayData.basePrice.toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Minimum Guests</h3>
                    <p className="text-lg text-gray-600">{displayData.minGuests}</p>
                  </div>
                </div>
              </div>

              {/* Policies */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Policies</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Cancellation Policy</h3>
                    <p className="text-gray-600">{displayData.cancellationPolicy}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Payment Terms</h3>
                    <p className="text-gray-600">{displayData.paymentTerms}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Provider Info */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Provider Information</h2>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">
                      {service.provider?.firstName} {service.provider?.lastName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-600">{service.provider?.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-600">{service.contact.phone}</span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Service Location</h2>
                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-900">{displayData.serviceLocation.address}</p>
                      <p className="text-gray-600">
                        {displayData.serviceLocation.city}, {displayData.serviceLocation.state} - {displayData.serviceLocation.pincode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Stats */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Service Statistics</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating</span>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="font-medium">{service.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reviews</span>
                    <span className="font-medium">{service.reviewCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created</span>
                    <span className="font-medium">
                      {new Date(service.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated</span>
                    <span className="font-medium">
                      {new Date(service.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
                <div className="space-y-3">
                  {service.status === 'PENDING' && (
                    <>
                      <Button
                        onClick={handleApprove}
                        className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="h-5 w-5" />
                        <span>Approve Service</span>
                      </Button>
                      <Button
                        onClick={handleReject}
                        variant="outline"
                        className="w-full border-red-300 text-red-600 hover:bg-red-50 flex items-center justify-center space-x-2"
                      >
                        <XCircle className="h-5 w-5" />
                        <span>Reject Service</span>
                      </Button>
                    </>
                  )}

                  {service.status === 'PENDING_EDIT' && (
                    <>
                      <Button
                        onClick={handleApproveEdit}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="h-5 w-5" />
                        <span>Approve Edit</span>
                      </Button>
                      <Button
                        onClick={handleRejectEdit}
                        variant="outline"
                        className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 flex items-center justify-center space-x-2"
                      >
                        <XCircle className="h-5 w-5" />
                        <span>Reject Edit</span>
                      </Button>
                    </>
                  )}

                  <Button
                    onClick={handleDelete}
                    variant="outline"
                    className="w-full border-red-300 text-red-600 hover:bg-red-50 flex items-center justify-center space-x-2"
                  >
                    <Trash2 className="h-5 w-5" />
                    <span>Delete Service</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function StaffBridalMakeupViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <StaffBridalMakeupViewContent />
    </Suspense>
  );
}
