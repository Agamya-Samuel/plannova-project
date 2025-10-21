'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  MapPin,
  Phone,
  Mail,
  User
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

function StaffDecorationViewContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('id');
  
  const [service, setService] = useState<DecorationService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDecorationService = useCallback(async () => {
    if (!serviceId) return;
    
    try {
      setLoading(true);
      const response = await apiClient.get(`/decoration/${serviceId}`);
      setService(response.data.data);
      setError('');
    } catch (error) {
      console.error('Error fetching decoration service:', error);
      const apiError = error as ApiError;
      setError(apiError.response?.data?.error || 'Failed to fetch decoration service');
      toast.error('Failed to fetch decoration service');
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    if (user?.role === 'STAFF' || user?.role === 'ADMIN') {
      fetchDecorationService();
    }
  }, [user, serviceId, fetchDecorationService]);

  const handleApprove = async () => {
    if (!service) return;
    
    const confirmed = await sonnerConfirm('Are you sure you want to approve this decoration service?');
    if (!confirmed) {
      return;
    }
    
    try {
      await apiClient.put(`/decoration/staff/${service._id}/approve`);
      toast.success('Decoration service approved successfully!');
      fetchDecorationService();
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

  const handleReject = async () => {
    if (!service) return;
    
    const confirmed = await sonnerConfirm('Are you sure you want to reject this decoration service?');
    if (!confirmed) {
      return;
    }
    
    try {
      await apiClient.put(`/decoration/staff/${service._id}/reject`);
      toast.success('Decoration service rejected successfully!');
      fetchDecorationService();
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

  const handleApproveEdit = async () => {
    if (!service) return;
    
    const confirmed = await sonnerConfirm('Are you sure you want to approve these changes?');
    if (!confirmed) {
      return;
    }
    
    try {
      await apiClient.post(`/decoration/${service._id}/approve-edit`);
      toast.success('Decoration service changes approved successfully!');
      fetchDecorationService();
    } catch (err: unknown) {
      console.error('Error approving decoration service changes:', err);
      let errorMessage = 'Failed to approve decoration service changes';
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
      await apiClient.post(`/decoration/${service._id}/reject-edit`, { reason: reason.trim() });
      toast.success('Decoration service changes rejected successfully!');
      fetchDecorationService();
    } catch (err: unknown) {
      console.error('Error rejecting decoration service changes:', err);
      let errorMessage = 'Failed to reject decoration service changes';
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
          <p className="text-gray-600">Loading decoration service details...</p>
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
          <p className="text-gray-600 mb-4">{error || 'Decoration service not found'}</p>
          <Button onClick={() => router.push('/staff/approvals/decoration')}>
            Back to Approvals
          </Button>
        </div>
      </div>
    );
  }

  const displayData = service.status === 'PENDING_EDIT' && service.pendingEdits
    ? { ...service, ...service.pendingEdits }
    : service;

  return (
    <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <Button
                onClick={() => router.push('/staff/approvals/decoration')}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Approvals</span>
              </Button>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{displayData.name}</h1>
                <div className="flex items-center space-x-4">
                  <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(displayData.status)}`}>
                    <span>{getStatusText(displayData.status)}</span>
                  </div>
                  {displayData.status === 'PENDING_EDIT' && (
                    <div className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <AlertCircle className="h-4 w-4" />
                      <span>Has Pending Changes</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                {displayData.status === 'PENDING' && (
                  <>
                    <Button
                      onClick={handleApprove}
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Approve</span>
                    </Button>
                    <Button
                      onClick={handleReject}
                      variant="destructive"
                      className="flex items-center space-x-2"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject</span>
                    </Button>
                  </>
                )}

                {displayData.status === 'PENDING_EDIT' && (
                  <>
                    <Button
                      onClick={handleApproveEdit}
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Approve Changes</span>
                    </Button>
                    <Button
                      onClick={handleRejectEdit}
                      variant="destructive"
                      className="flex items-center space-x-2"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject Changes</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Service Images */}
              {displayData.images.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Service Images</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {displayData.images.map((image, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                        <Image
                          src={image.url}
                          alt={image.alt}
                          fill
                          className="object-cover"
                        />
                        {image.isPrimary && (
                          <div className="absolute top-2 left-2 bg-pink-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                            Primary
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Description */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed">{displayData.description}</p>
              </div>

              {/* Decoration Types */}
              {displayData.decorationTypes.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Decoration Types</h2>
                  <div className="flex flex-wrap gap-2">
                    {displayData.decorationTypes.map((type, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Packages */}
              {displayData.packages.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Packages</h2>
                  <div className="space-y-4">
                    {displayData.packages.map((pkg, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-gray-900">₹{pkg.price.toLocaleString()}</span>
                            {pkg.isPopular && (
                              <span className="px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-xs font-medium">
                                Popular
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm">{pkg.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons */}
              {displayData.addons.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Add-ons</h2>
                  <div className="space-y-3">
                    {displayData.addons.map((addon, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div>
                          <h3 className="font-medium text-gray-900">{addon.name}</h3>
                          <p className="text-sm text-gray-600">{addon.description}</p>
                        </div>
                        <span className="font-semibold text-gray-900">₹{addon.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Policies */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Policies</h2>
                <div className="space-y-4">
                  {displayData.cancellationPolicy && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Cancellation Policy</h3>
                      <p className="text-gray-700">{displayData.cancellationPolicy}</p>
                    </div>
                  )}
                  {displayData.paymentTerms && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Payment Terms</h3>
                      <p className="text-gray-700">{displayData.paymentTerms}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Provider Information */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Provider Information</h2>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="text-sm text-gray-900">{displayData.provider.firstName} {displayData.provider.lastName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="text-sm text-gray-900">{displayData.provider.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-sm text-gray-900">{displayData.provider.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Service Details</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Base Price:</span>
                    <span className="text-sm font-semibold text-gray-900">₹{displayData.basePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Created:</span>
                    <span className="text-sm text-gray-900">{new Date(displayData.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Updated:</span>
                    <span className="text-sm text-gray-900">{new Date(displayData.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(displayData.status)}`}>
                      <span>{getStatusText(displayData.status)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Service Location</h2>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="text-sm text-gray-900">{displayData.serviceLocation.address}</p>
                      <p className="text-sm text-gray-900">
                        {displayData.serviceLocation.city}, {displayData.serviceLocation.state} - {displayData.serviceLocation.pincode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="text-sm text-gray-900">{displayData.contact.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-sm text-gray-900">{displayData.contact.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function StaffDecorationViewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <StaffDecorationViewContent />
    </Suspense>
  );
}
