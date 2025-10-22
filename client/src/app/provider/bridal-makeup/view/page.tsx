'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import BackToServicesButton from '@/components/ui/BackToServicesButton';
import { 
  Heart, 
  Edit, 
  Star, 
  IndianRupee, 
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react';
import apiClient from '@/lib/api';
import { BlockedDatesManager } from '@/components/booking/BlockedDatesManager';

interface BridalMakeupService {
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
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  makeupTypes: string[];
  packages: Array<{
    name: string;
    description: string;
    includes: string[];
    duration: string;
    price: number;
    isPopular: boolean;
  }>;
  addons: Array<{
    name: string;
    description: string;
    price: number;
  }>;
  basePrice: number;
  minGuests: number;
  cancellationPolicy: string;
  paymentTerms: string;
  rating: number;
  reviewCount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PENDING_EDIT';
  createdAt: string;
  updatedAt: string;
  pendingEdits?: Partial<BridalMakeupService>;
  pendingEditSubmittedAt?: string;
}

function ViewBridalMakeupServiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [service, setService] = useState<BridalMakeupService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const serviceId = searchParams.get('id');

  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId) {
        setError('Service ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await apiClient.get(`/bridal-makeup/${serviceId}`);
        setService(response.data.data);
      } catch (err: unknown) {
        console.error('Error fetching bridal makeup service:', err);
        setError((err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to load bridal makeup service');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchService();
    }
  }, [serviceId, user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'PENDING_EDIT':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PENDING_EDIT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!user || user.role !== 'PROVIDER') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <div className="mx-auto bg-gradient-to-br from-pink-100 to-rose-100 rounded-full p-4 w-24 h-24 flex items-center justify-center mb-6">
            <Heart className="h-12 w-12 text-pink-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You must be logged in as a provider to access this page.
          </p>
          <Button 
            onClick={() => router.push('/auth/login')}
            className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white"
          >
            Login
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading bridal makeup service...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <div className="mx-auto bg-gradient-to-br from-red-100 to-red-100 rounded-full p-4 w-24 h-24 flex items-center justify-center mb-6">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Bridal makeup service not found'}</p>
          <Button 
            onClick={() => router.push('/provider/bridal-makeup')}
            className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white"
          >
            Back to Services
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <BackToServicesButton serviceType="bridal-makeup" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(service.status)}`}>
                      {getStatusIcon(service.status)}
                      <span className="text-sm font-medium">{service.status}</span>
                    </div>
                    <div className="flex items-center bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 px-3 py-1 rounded-full">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm font-bold ml-1">{service.rating || 0}</span>
                      <span className="text-xs ml-1">({service.reviewCount || 0} reviews)</span>
                    </div>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => router.push(`/provider/bridal-makeup/edit?id=${service._id}`)}
                className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Service
              </Button>
            </div>
          </div>

          {/* Pending Edit Notice */}
          {service.status === 'PENDING_EDIT' && service.pendingEditSubmittedAt && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Edits Pending Approval</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Your edits were submitted on {new Date(service.pendingEditSubmittedAt).toLocaleDateString()} and are currently under review by our staff.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Images */}
              {service.images && service.images.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Portfolio Images</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={image.url}
                          alt={image.alt || `Bridal makeup portfolio ${index + 1}`}
                          width={400}
                          height={256}
                          className="w-full h-64 object-cover rounded-lg shadow-md group-hover:shadow-lg transition-shadow duration-300"
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

              {/* Description */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Service</h2>
                <p className="text-gray-700 leading-relaxed">{service.description}</p>
              </div>

              {/* Makeup Types */}
              {service.makeupTypes && service.makeupTypes.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Services Offered</h2>
                  <div className="flex flex-wrap gap-3">
                    {service.makeupTypes.map((type, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-sm"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Packages */}
              {service.packages && service.packages.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Packages</h2>
                  <div className="space-y-4">
                    {service.packages.map((pkg, index) => (
                      <div key={index} className={`border rounded-lg p-4 ${pkg.isPopular ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                          <div className="flex items-center space-x-2">
                            {pkg.isPopular && (
                              <span className="px-2 py-1 bg-pink-600 text-white text-xs font-medium rounded-full">
                                Popular
                              </span>
                            )}
                            <span className="text-lg font-bold text-gray-900">₹{pkg.price.toLocaleString()}</span>
                          </div>
                        </div>
                        {pkg.duration && (
                          <p className="text-sm text-gray-600 mb-2">Duration: {pkg.duration}</p>
                        )}
                        <p className="text-gray-700 mb-3">{pkg.description}</p>
                        {pkg.includes && pkg.includes.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 mb-2">What&apos;s Included:</h4>
                            <ul className="list-disc list-inside space-y-1">
                              {pkg.includes.map((include, includeIndex) => (
                                <li key={includeIndex} className="text-sm text-gray-600">{include}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Policies */}
              {(service.cancellationPolicy || service.paymentTerms) && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Policies & Terms</h2>
                  <div className="space-y-4">
                    {service.cancellationPolicy && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancellation Policy</h3>
                        <p className="text-gray-700">{service.cancellationPolicy}</p>
                      </div>
                    )}
                    {service.paymentTerms && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Terms</h3>
                        <p className="text-gray-700">{service.paymentTerms}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Service Info */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Service Information</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <IndianRupee className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Starting Price</p>
                      <p className="text-lg font-semibold text-gray-900">₹{service.basePrice.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="text-sm text-gray-900">{service.serviceLocation.city}, {service.serviceLocation.state}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Heart className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Minimum Guests</p>
                      <p className="text-sm text-gray-900">{service.minGuests}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="text-sm text-gray-900">{service.contact.phone}</p>
                    </div>
                  </div>
                  {service.contact.whatsapp && (
                    <div className="flex items-center space-x-3">
                      <MessageCircle className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">WhatsApp</p>
                        <p className="text-sm text-gray-900">{service.contact.whatsapp}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="text-sm text-gray-900">{service.contact.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Service Details</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Created:</span>
                    <span className="text-sm text-gray-900">{new Date(service.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Updated:</span>
                    <span className="text-sm text-gray-900">{new Date(service.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                      {getStatusIcon(service.status)}
                      <span>{service.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Blocked Dates Management - Only for approved services */}
          {(service.status === 'APPROVED' || service.status === 'PENDING_EDIT') && (
            <BlockedDatesManager 
              serviceId={service._id}
              serviceType="bridal-makeup"
              onUpdate={() => {
                // Optional: Refresh service data or show notification
                console.log('Blocked dates updated');
              }}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function ViewBridalMakeupServicePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ViewBridalMakeupServiceContent />
    </Suspense>
  );
}

