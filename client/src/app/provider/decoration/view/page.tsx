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

interface DecorationService {
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
  decorationTypes: string[];
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
  pendingEdits?: Partial<DecorationService>;
  pendingEditSubmittedAt?: string;
}

function ViewDecorationServiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [service, setService] = useState<DecorationService | null>(null);
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
        const response = await apiClient.get(`/decoration/${serviceId}`);
        setService(response.data.data);
      } catch (err) {
        console.error('Error fetching decoration service:', err);
        setError('Failed to load decoration service');
      } finally {
        setLoading(false);
      }
    };

    if (serviceId) {
      fetchService();
    }
  }, [serviceId]);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'PENDING_EDIT':
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
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
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <div className="mx-auto bg-gradient-to-br from-red-100 to-rose-100 rounded-full p-4 w-24 h-24 flex items-center justify-center mb-6">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Service Not Found</h2>
          <p className="text-gray-600 mb-6">
            {error || 'The decoration service you are looking for does not exist.'}
          </p>
          <Button 
            onClick={() => router.push('/provider/decoration')}
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
            <div className="flex items-center space-x-4 mb-6">
              <BackToServicesButton serviceType="decoration" />
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
                <p className="text-gray-600 mt-1">Decoration Service Details</p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(service.status)}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(service.status)}`}>
                  {getStatusText(service.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Service Status Alert */}
          {service.status === 'PENDING_EDIT' && service.pendingEditSubmittedAt && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Edit Pending Approval</h3>
                  <p className="text-sm text-blue-700">
                    Your changes were submitted on {new Date(service.pendingEditSubmittedAt).toLocaleDateString()} and are awaiting approval.
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
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Portfolio Images</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.images.map((image, index) => (
                      <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                        <Image
                          src={image.url}
                          alt={image.alt || `Decoration image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        {image.isPrimary && (
                          <div className="absolute top-2 right-2 bg-pink-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                            Primary
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Description */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Service Description</h2>
                <p className="text-gray-700 leading-relaxed">{service.description}</p>
              </div>

              {/* Decoration Types */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Decoration Types</h2>
                <div className="flex flex-wrap gap-2">
                  {service.decorationTypes.map((type, index) => (
                    <span key={index} className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium">
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Packages */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Packages</h2>
                <div className="space-y-4">
                  {service.packages.map((pkg, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                        {pkg.isPopular && (
                          <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded-full text-xs font-medium">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{pkg.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold text-gray-900">
                          ₹{pkg.price.toLocaleString()}
                        </span>
                        {pkg.duration && (
                          <span className="text-sm text-gray-500">{pkg.duration}</span>
                        )}
                      </div>
                      {pkg.includes && pkg.includes.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Includes:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {pkg.includes.map((item, itemIndex) => (
                              <li key={itemIndex} className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Add-ons */}
              {service.addons && service.addons.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Add-ons</h2>
                  <div className="space-y-3">
                    {service.addons.map((addon, index) => (
                      <div key={index} className="flex justify-between items-center border border-gray-200 rounded-lg p-3">
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
              {(service.cancellationPolicy || service.paymentTerms) && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Policies</h2>
                  <div className="space-y-4">
                    {service.cancellationPolicy && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Cancellation Policy</h3>
                        <p className="text-gray-600">{service.cancellationPolicy}</p>
                      </div>
                    )}
                    {service.paymentTerms && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Payment Terms</h3>
                        <p className="text-gray-600">{service.paymentTerms}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button
                    onClick={() => router.push(`/provider/decoration/edit?id=${service._id}`)}
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Service
                  </Button>
                </div>
              </div>

              {/* Service Info */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Information</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Starting Price</h4>
                    <p className="text-2xl font-bold text-gray-900">₹{service.basePrice.toLocaleString()}</p>
                  </div>
                  
                  {service.minGuests && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Minimum Guests</h4>
                      <p className="text-lg font-semibold text-gray-900">{service.minGuests}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Rating</h4>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(service.rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {service.rating.toFixed(1)} ({service.reviewCount} reviews)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{service.contact.phone}</span>
                  </div>
                  
                  {service.contact.whatsapp && (
                    <div className="flex items-center space-x-3">
                      <MessageCircle className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">{service.contact.whatsapp}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{service.contact.email}</span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Location</h3>
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                  <div>
                    <p className="text-gray-700">{service.serviceLocation.address}</p>
                    <p className="text-gray-600">
                      {service.serviceLocation.city}, {service.serviceLocation.state} - {service.serviceLocation.pincode}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Blocked Dates Management - Only for approved services */}
          {(service.status === 'APPROVED' || service.status === 'PENDING_EDIT') && (
            <BlockedDatesManager 
              serviceId={service._id}
              serviceType="decoration"
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

export default function ViewDecorationServicePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ViewDecorationServiceContent />
    </Suspense>
  );
}
