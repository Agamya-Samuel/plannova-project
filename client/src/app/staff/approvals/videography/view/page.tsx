'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Video, Edit3, ArrowLeft, MapPin, Phone, Mail, PlusCircle } from 'lucide-react';
import Image from 'next/image';
import apiClient from '@/lib/api';

interface VideographyService {
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
  videographyTypes: string[];
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

function ViewVideographyService() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('id');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [service, setService] = useState<VideographyService | null>(null);

  const fetchVideographyService = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/videography/${serviceId}`);
      setService(response.data.data);
    } catch (err: unknown) {
      let errorMessage = 'Failed to fetch videography service';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (err as { response?: { data?: { error?: string } } }).response;
        if (response?.data?.error) {
          errorMessage = response.data.error;
        }
      }
      setError(errorMessage);
      console.error('Error fetching videography service:', err);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    if (serviceId) {
      fetchVideographyService();
    } else {
      router.push('/staff/approvals/videography');
    }
  }, [serviceId, fetchVideographyService, router]);

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
      return '/staff/approvals/videography';
    }
    return '/provider/videography';
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => router.push(getDashboardUrl())}
                className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900">View Videography Service</h1>
              <div></div> {/* Spacer for alignment */}
            </div>
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => router.push(getDashboardUrl())}
                className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900">View Videography Service</h1>
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
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={() => router.push(getDashboardUrl())}
                className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900">View Videography Service</h1>
              <div></div> {/* Spacer for alignment */}
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Service not found</h3>
              <p className="text-gray-600 mb-6">
                The videography service you are looking for does not exist or has been removed.
              </p>
              <button
                onClick={() => router.push(getDashboardUrl())}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.push(getDashboardUrl())}
              className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">View Videography Service</h1>
            {user?.role === 'PROVIDER' && (
              <button
                onClick={() => router.push(`/provider/videography/edit?id=${serviceId}`)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </button>
            )}
          </div>

          {/* Service Status Banner */}
          <div className={`mb-6 px-4 py-3 rounded-lg ${getStatusColor(service.status)}`}>
            <div className="flex items-center">
              <span className="font-medium">Status:</span>
              <span className="ml-2">{getStatusText(service.status)}</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Service Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{service.name}</h2>
                  <p className="mt-2 text-gray-600">{service.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-600">₹{service.basePrice.toLocaleString()}</p>
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
              {/* Videography Types */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Videography Types</h3>
                <div className="flex flex-wrap gap-2">
                  {service.videographyTypes.map((type, index) => (
                    <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
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
                        <span className="text-lg font-semibold text-indigo-600">₹{pkg.price.toLocaleString()}</span>
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
                          <span className="text-lg font-semibold text-indigo-600">₹{addon.price.toLocaleString()}</span>
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
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function ViewVideographyServicePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ViewVideographyService />
    </Suspense>
  );
}
