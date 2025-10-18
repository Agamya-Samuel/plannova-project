'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Utensils, MapPin, Phone, Mail, PlusCircle, Star, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api';

interface CateringService {
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
  cuisineTypes: string[];
  serviceTypes: string[];
  dietaryOptions: string[];
  addons: Array<{
    name: string;
    description: string;
    price: number;
  }>;
  rating: number;
  reviewCount: number;
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  provider: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export default function CateringDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [service, setService] = useState<CateringService | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    const unwrapParams = async () => {
      const unwrappedParams = await params;
      setServiceId(unwrappedParams.id);
    };
    
    unwrapParams();
  }, [params]);

  const fetchCateringService = React.useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching public catering service with ID:', serviceId);
      const response = await apiClient.get(`/catering/${serviceId}`);
      console.log('🔍 Catering service response:', response.data);
      setService(response.data.data);
    } catch (err: unknown) {
      let errorMessage = 'Failed to fetch catering service';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (err as { response?: { data?: { error?: string } } }).response;
        if (response?.data?.error) {
          errorMessage = response.data.error;
        }
      }
      setError(errorMessage);
      console.error('❌ Error fetching catering service:', err);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    if (serviceId) {
      fetchCateringService();
    }
  }, [serviceId, fetchCateringService]);

  // Handle keyboard navigation for image modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedImageIndex !== null && service?.images) {
        if (event.key === 'Escape') {
          setSelectedImageIndex(null);
        } else if (event.key === 'ArrowLeft') {
          setSelectedImageIndex(prev => 
            prev !== null ? (prev > 0 ? prev - 1 : service.images.length - 1) : null
          );
        } else if (event.key === 'ArrowRight') {
          setSelectedImageIndex(prev => 
            prev !== null ? (prev < service.images.length - 1 ? prev + 1 : 0) : null
          );
        }
      }
    };

    if (selectedImageIndex !== null) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedImageIndex, service?.images]);

  const openImageModal = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeImageModal = () => {
    setSelectedImageIndex(null);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedImageIndex !== null && service?.images) {
      if (direction === 'prev') {
        setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : service.images.length - 1);
      } else {
        setSelectedImageIndex(selectedImageIndex < service.images.length - 1 ? selectedImageIndex + 1 : 0);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading catering service...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <Utensils className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Service Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The catering service you are looking for does not exist.'}</p>
            <Button 
              onClick={() => router.push('/vendors')}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vendors
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/vendors')}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Vendors</span>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 px-3 py-1 rounded-full">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-bold ml-1">{service.rating || 0}</span>
                    <span className="text-xs ml-1">({service.reviewCount || 0} reviews)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Service Details */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center text-gray-600">
                  <span className="text-lg font-semibold">₹{service.basePrice.toLocaleString()}/person</span>
                </div>
              </div>
              <p className="text-gray-600 text-lg">{service.description}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Utensils className="h-6 w-6 text-pink-600 mr-2" />
                Service Gallery
              </h2>
              {service.images && service.images.length > 0 ? (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto">
                  {service.images.map((image, index) => (
                    <div 
                      key={`${service._id}-image-${index}`} 
                      className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 rounded-lg overflow-hidden shadow-sm max-w-32 max-h-32 cursor-pointer hover:shadow-lg transition-all duration-300"
                      onClick={() => openImageModal(index)}
                    >
                      {image.url ? (
                        <Image
                          src={image.url}
                          alt={image.alt || `Image ${index + 1}`}
                          width={128}
                          height={128}
                          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                          className="transition-transform duration-300 hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <span className="text-gray-500 text-xs">{image.alt || `Gallery Image ${index + 1}`}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Utensils className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">No images available for this service</p>
                </div>
              )}
            </div>

            {/* Service Details */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Utensils className="h-6 w-6 text-pink-600 mr-2" />
                Service Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-pink-50 to-white rounded-xl p-4 border border-pink-100 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                    <Utensils className="h-5 w-5 text-pink-600 mr-2" />
                    Cuisine Types
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {service.cuisineTypes.map((cuisine, index) => (
                      <span 
                        key={`${service._id}-cuisine-${index}`} 
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-sm"
                      >
                        {cuisine}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-100 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                    <Utensils className="h-5 w-5 text-blue-600 mr-2" />
                    Service Types
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {service.serviceTypes.map((type, index) => (
                      <span 
                        key={`${service._id}-service-${index}`} 
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
                
                {service.dietaryOptions && service.dietaryOptions.length > 0 && (
                  <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-4 border border-green-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                      <Star className="h-5 w-5 text-green-600 mr-2" />
                      Dietary Options
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {service.dietaryOptions.map((option, index) => (
                        <span 
                          key={`${service._id}-dietary-${index}`} 
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-sm"
                        >
                          {option}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Addons */}
            {service.addons && service.addons.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <PlusCircle className="h-6 w-6 text-pink-600 mr-2" />
                  Add-on Services
                </h2>
                
                <div className="space-y-4">
                  {service.addons.map((addon, index) => (
                    <div key={`${service._id}-addon-${index}`} className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white shadow-sm hover:shadow-md transition-shadow duration-300">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-lg">{addon.name}</h3>
                          <p className="text-gray-700 text-sm mt-2">{addon.description}</p>
                        </div>
                        <div className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-lg shadow">
                          ₹{addon.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Phone className="h-6 w-6 text-blue-600 mr-2" />
                Contact Information
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start py-2">
                  <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm font-bold text-gray-900">Service Location</p>
                    <p className="text-sm text-gray-700 mt-1">{service.serviceLocation.address}</p>
                    <p className="text-sm text-gray-700">
                      {service.serviceLocation.city}, {service.serviceLocation.state} {service.serviceLocation.pincode}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start py-2">
                  <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm font-bold text-gray-900">Phone</p>
                    <p className="text-sm text-gray-700">{service.contact.phone}</p>
                  </div>
                </div>
                
                {service.contact.whatsapp && (
                  <div className="flex items-start py-2">
                    <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div className="ml-3">
                      <p className="text-sm font-bold text-gray-900">WhatsApp</p>
                      <p className="text-sm text-gray-700">{service.contact.whatsapp}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start py-2">
                  <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm font-bold text-gray-900">Email</p>
                    <p className="text-sm text-gray-700">{service.contact.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <Button className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                  Contact Service Provider
                </Button>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <span className="text-green-600 mr-2">₹</span>
                Pricing
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700 font-medium">Base Price</span>
                  <span className="text-xl font-bold text-gray-900">₹{service.basePrice.toLocaleString()}/plate</span>
                </div>
                
                {service.minGuests && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-700 font-medium">Minimum Guests</span>
                    <span className="text-lg font-semibold text-gray-900">{service.minGuests} guests</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-4 mt-2">
                  <span className="font-bold text-gray-900">Starting From</span>
                  <span className="text-2xl font-bold text-green-700">₹{service.basePrice.toLocaleString()}/plate</span>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800 font-medium">* Prices may vary based on event size, menu customization, and additional services.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImageIndex !== null && service?.images && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/30">
          <div className="relative max-w-7xl max-h-full p-4">
            {/* Close Button */}
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-10 bg-white/20 backdrop-blur-sm text-white rounded-full p-3 hover:bg-white/30 transition-all duration-300 border border-white/30 hover:border-white/50"
              aria-label="Close image modal"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Navigation Buttons */}
            {service.images.length > 1 && (
              <>
                <button
                  onClick={() => navigateImage('prev')}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/20 backdrop-blur-sm text-white rounded-full p-3 hover:bg-white/30 transition-all duration-300 border border-white/30 hover:border-white/50"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => navigateImage('next')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/20 backdrop-blur-sm text-white rounded-full p-3 hover:bg-white/30 transition-all duration-300 border border-white/30 hover:border-white/50"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Main Image */}
            <div className="relative max-w-full max-h-[90vh] flex items-center justify-center">
              <Image
                src={service.images[selectedImageIndex].url}
                alt={service.images[selectedImageIndex].alt || `Image ${selectedImageIndex + 1}`}
                width={1200}
                height={800}
                style={{ 
                  objectFit: 'contain', 
                  maxWidth: '100%', 
                  maxHeight: '90vh',
                  borderRadius: '8px'
                }}
                className="shadow-2xl"
              />
            </div>

            {/* Image Counter */}
            {service.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm border border-white/30">
                {selectedImageIndex + 1} / {service.images.length}
              </div>
            )}

            {/* Thumbnail Strip */}
            {service.images.length > 1 && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-2 max-w-full overflow-x-auto">
                {service.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                      index === selectedImageIndex 
                        ? 'border-white shadow-lg' 
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt || `Thumbnail ${index + 1}`}
                      width={64}
                      height={64}
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
