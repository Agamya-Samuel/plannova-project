'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Music, ArrowLeft, MapPin, Phone, Mail, PlusCircle, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { AvailabilityCalendar } from '@/components/booking/AvailabilityCalendar';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { sonnerConfirm } from '@/lib/sonner-confirm';
import { sonnerPrompt } from '@/lib/sonner-prompt';

interface EntertainmentService {
  _id: string;
  name: string;
  description: string;
  serviceLocation: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  contact: {
    phone: string;
    whatsapp?: string;
    email: string;
  };
  basePrice: number;
  minGuests?: number;
  cancellationPolicy?: string;
  paymentTerms?: string;
  entertainmentTypes: string[];
  packages: Array<{
    name: string;
    description: string;
    includes: string[];
    duration?: string;
    price: number;
    isPopular: boolean;
  }>;
  addons: Array<{
    name: string;
    description: string;
    price: number;
  }>;
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PENDING_EDIT';
  createdAt: string;
  updatedAt: string;
}

function ViewEntertainmentService() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('id');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [service, setService] = useState<EntertainmentService | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const fetchEntertainmentService = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/entertainment/${serviceId}`);
      setService(response.data.data);
    } catch (err: unknown) {
      let errorMessage = 'Failed to fetch entertainment service';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (err as { response?: { data?: { error?: string } } }).response;
        if (response?.data?.error) {
          errorMessage = response.data.error;
        }
      }
      setError(errorMessage);
      console.error('Error fetching entertainment service:', err);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    if (serviceId) {
      fetchEntertainmentService();
    } else {
      router.push('/staff/approvals/entertainment');
    }
  }, [serviceId, fetchEntertainmentService, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PENDING_EDIT':
        return 'bg-blue-100 text-blue-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Approved';
      case 'PENDING':
        return 'Pending Approval';
      case 'PENDING_EDIT':
        return 'Edit Pending';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  };

  const getDashboardUrl = () => {
    if (user?.role === 'STAFF' || user?.role === 'ADMIN') {
      return '/staff/approvals/entertainment';
    }
    return '/provider/entertainment';
  };

  const handleApprove = async () => {
    const confirmed = await sonnerConfirm('Are you sure you want to approve this entertainment service?');
    if (!confirmed) return;

    try {
      setApproving(true);
      await apiClient.put(`/entertainment/staff/${serviceId}/approve`);
      toast.success('Entertainment service approved successfully!');
      fetchEntertainmentService();
    } catch (err: unknown) {
      console.error('Error approving service:', err);
      toast.error('Failed to approve entertainment service');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    const reason = await sonnerPrompt('Please provide a reason for rejection:', {
      placeholder: 'Enter rejection reason...'
    });
    
    if (!reason || reason.trim() === '') {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      setRejecting(true);
      await apiClient.put(`/entertainment/staff/${serviceId}/reject`, { rejectionReason: reason.trim() });
      toast.success('Entertainment service rejected successfully!');
      fetchEntertainmentService();
    } catch (err: unknown) {
      console.error('Error rejecting service:', err);
      toast.error('Failed to reject entertainment service');
    } finally {
      setRejecting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await sonnerConfirm('Are you sure you want to delete this entertainment service? This action cannot be undone.');
    if (!confirmed) return;

    try {
      setDeleting(true);
      await apiClient.delete(`/entertainment/staff/${serviceId}`);
      toast.success('Entertainment service deleted successfully!');
      router.push('/staff/approvals/entertainment');
    } catch (err: unknown) {
      console.error('Error deleting service:', err);
      toast.error('Failed to delete entertainment service');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => router.push(getDashboardUrl())}
                className="inline-flex items-center text-yellow-600 hover:text-yellow-800"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900">View Entertainment Service</h1>
              <div></div> {/* Spacer for alignment */}
            </div>
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-600"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => router.push(getDashboardUrl())}
                className="inline-flex items-center text-yellow-600 hover:text-yellow-800"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900">View Entertainment Service</h1>
              <div></div> {/* Spacer for alignment */}
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
              {error}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!service) {
    return (
      <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => router.push(getDashboardUrl())}
                className="inline-flex items-center text-yellow-600 hover:text-yellow-800"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900">View Entertainment Service</h1>
              <div></div> {/* Spacer for alignment */}
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Service not found</h3>
              <p className="text-gray-600 mb-6">
                The entertainment service you are looking for does not exist or has been removed.
              </p>
              <button
                onClick={() => router.push(getDashboardUrl())}
                className="inline-flex items-center px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.push(getDashboardUrl())}
              className="inline-flex items-center text-yellow-600 hover:text-yellow-800"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">View Entertainment Service</h1>
            <div className="flex items-center gap-2">
              {service.status === 'PENDING' && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={approving}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {approving ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={rejecting}
                    className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {rejecting ? 'Rejecting...' : 'Reject'}
                  </button>
                </>
              )}
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>

          {/* Service Status Banner */}
          <div className={`mb-6 px-4 py-3 rounded-lg ${getStatusColor(service.status)}`}>
            <div className="flex items-center">
              <span className="font-medium">Status:</span>
              <span className="ml-2">{getStatusText(service.status)}</span>
            </div>
          </div>

          {/* Main Content with sidebar calendar like Venues */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Service Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{service.name}</h2>
                  <p className="mt-2 text-gray-600">{service.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-600">₹{service.basePrice.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Starting Price</p>
                </div>
              </div>
            </div>

            {/* Image Gallery */}
            {service.images && service.images.length > 0 && (
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Images</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {service.images.map((image, index) => (
                    <div key={index} className="relative h-64 rounded-lg overflow-hidden">
                      <Image
                        src={image.url}
                        alt={image.alt || service.name}
                        fill
                        className="object-cover"
                      />
                      {image.isPrimary && (
                        <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          Primary
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Service Details */}
            <div className="p-6">
              {/* Entertainment Types */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Entertainment Types</h3>
                <div className="flex flex-wrap gap-2">
                  {service.entertainmentTypes.map((type, index) => (
                    <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Location Information */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-gray-900">{service.serviceLocation.address}</p>
                    <p className="text-gray-600">
                      {service.serviceLocation.city}, {service.serviceLocation.state} {service.serviceLocation.pincode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-900">{service.contact.phone}</span>
                  </div>
                  {service.contact.whatsapp && (
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-900">WhatsApp: {service.contact.whatsapp}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-900">{service.contact.email}</span>
                  </div>
                </div>
              </div>

              {/* Packages */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Packages</h3>
                  <span className="text-sm text-gray-500">{service.packages.length} packages</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {service.packages.map((pkg, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{pkg.name}</h4>
                        {pkg.isPopular && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-yellow-600">₹{pkg.price.toLocaleString()}</span>
                        {pkg.duration && (
                          <span className="text-sm text-gray-500">{pkg.duration}</span>
                        )}
                      </div>
                      {pkg.includes.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <h5 className="text-xs font-medium text-gray-500 uppercase mb-2">Includes</h5>
                          <ul className="space-y-1">
                            {pkg.includes.map((include, includeIndex) => (
                              <li key={includeIndex} className="text-sm text-gray-600 flex items-start">
                                <PlusCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                <span>{include}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Addons */}
              {service.addons.length > 0 && (
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Add-ons</h3>
                    <span className="text-sm text-gray-500">{service.addons.length} add-ons</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.addons.map((addon, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900">{addon.name}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{addon.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-yellow-600">₹{addon.price.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Policies */}
              {(service.cancellationPolicy || service.paymentTerms) && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Policies</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {service.cancellationPolicy && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Cancellation Policy</h4>
                        <p className="text-gray-600 text-sm">{service.cancellationPolicy}</p>
                      </div>
                    )}
                    {service.paymentTerms && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Payment Terms</h4>
                        <p className="text-gray-600 text-sm">{service.paymentTerms}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex justify-between text-sm text-gray-500">
                  <div>
                    <span>Created: </span>
                    <span>{new Date(service.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span>Updated: </span>
                    <span>{new Date(service.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* Sidebar - Availability (read-only for staff) */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Check Availability</h3>
                <AvailabilityCalendar
                  serviceId={service._id}
                  serviceType="entertainment"
                  onDateSelect={() => { /* read-only for staff */ }}
                  selectedDate={''}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function ViewEntertainmentServicePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ViewEntertainmentService />
    </Suspense>
  );
}

