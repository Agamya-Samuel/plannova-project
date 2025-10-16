'use client';

import React, { useState, useEffect } from 'react';
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

export default function ViewVideographyService() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('id');
  
  const [service, setService] = useState<VideographyService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchVideographyService = React.useCallback(async () => {
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
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    if (serviceId) {
      fetchVideographyService();
    } else {
      router.push('/provider/videography');
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

  const getPrimaryImage = () => {
    if (!service?.images || service.images.length === 0) return null;
    const primaryImage = service.images.find(img => img.isPrimary);
    return primaryImage || service.images[0];
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !service) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'The videography service you are looking for does not exist.'}</p>
            <button
              onClick={() => router.push('/provider/videography')}
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Videography Services
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button variant="outline" onClick={() => router.back()} className="flex items-center space-x-2">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
                    <p className="text-gray-600">Videography Service Details</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(service.status)}`}>
                    {service.status}
                  </span>
                  <Button 
                    onClick={() => router.push(`/provider/videography/edit?id=${service._id}`)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Service
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Service Overview */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Overview</h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-6">{service.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Price:</span>
                        <span className="font-semibold">₹{service.basePrice.toLocaleString()}</span>
                      </div>
                      {service.minGuests && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Min. Guests:</span>
                          <span className="font-semibold">{service.minGuests}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-semibold">{new Date(service.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="font-semibold">{new Date(service.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Videography Types</h3>
                    <div className="flex flex-wrap gap-2">
                      {service.videographyTypes.map((type, index) => (
                        <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Images */}
              {service.images && service.images.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Portfolio Images</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {service.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="relative h-48 rounded-lg overflow-hidden">
                          <Image
                            src={image.url}
                            alt={image.alt}
                            fill
                            className="object-cover"
                          />
                          {image.isPrimary && (
                            <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                              Primary
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Packages */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Packages & Pricing</h2>
                <div className="space-y-4">
                  {service.packages.map((pkg, index) => (
                    <div key={index} className={`border rounded-xl p-6 ${pkg.isPopular ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                          {pkg.description && (
                            <p className="text-gray-600 mt-1">{pkg.description}</p>
                          )}
                          {pkg.duration && (
                            <div className="flex items-center text-gray-500 mt-2">
                              <span className="text-sm">{pkg.duration}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">₹{pkg.price.toLocaleString()}</div>
                          {pkg.isPopular && (
                            <span className="inline-block bg-purple-500 text-white text-xs px-2 py-1 rounded-full mt-1">
                              Popular
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {pkg.includes.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Includes:</h4>
                          <ul className="space-y-1">
                            {pkg.includes.map((item, itemIndex) => (
                              <li key={itemIndex} className="flex items-center text-gray-600">
                                <span className="text-sm">• {item}</span>
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
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Services</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.addons.map((addon, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{addon.name}</h4>
                          <span className="text-lg font-bold text-gray-900">₹{addon.price.toLocaleString()}</span>
                        </div>
                        {addon.description && (
                          <p className="text-gray-600 text-sm">{addon.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Policies */}
              {(service.cancellationPolicy || service.paymentTerms) && (
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Policies</h2>
                  <div className="space-y-4">
                    {service.cancellationPolicy && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Cancellation Policy</h3>
                        <p className="text-gray-600">{service.cancellationPolicy}</p>
                      </div>
                    )}
                    {service.paymentTerms && (
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Payment Terms</h3>
                        <p className="text-gray-600">{service.paymentTerms}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-900">{service.contact.phone}</span>
                  </div>
                  {service.contact.whatsapp && (
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-gray-900">{service.contact.whatsapp}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-900">{service.contact.email}</span>
                  </div>
                </div>
              </div>

              {/* Location Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Service Location</h3>
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-900 font-medium">{service.serviceLocation.address}</p>
                    <p className="text-gray-600">
                      {service.serviceLocation.city}, {service.serviceLocation.state} - {service.serviceLocation.pincode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button 
                    onClick={() => router.push(`/provider/videography/edit?id=${service._id}`)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Service
                  </Button>
                  <Button 
                    onClick={() => router.push('/provider/videography/create')}
                    variant="outline"
                    className="w-full"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create New Service
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
