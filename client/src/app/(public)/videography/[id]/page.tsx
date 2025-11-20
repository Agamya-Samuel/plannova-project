'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Video, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  MessageCircle,
  Clock,
  CheckCircle,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import apiClient from '@/lib/api';
import { AvailabilityCalendar } from '@/components/booking/AvailabilityCalendar';
import { BookingModal } from '@/components/booking/BookingModal';
import { useAuth } from '@/contexts/AuthContext';

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
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  videographyTypes: string[];
  packages: Array<{
    name: string;
    description: string;
    includes: string[];
    duration?: string;
    price: number;
    isPopular?: boolean;
  }>;
  addons: Array<{
    name: string;
    description: string;
    price: number;
  }>;
  basePrice: number;
  pricePerGuest?: number;
  minGuests?: number;
  cancellationPolicy?: string;
  paymentTerms?: string;
  rating: number;
  reviewCount: number;
  provider: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface VideographyResponse {
  message: string;
  data: VideographyService;
}

export default function VideographyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [service, setService] = useState<VideographyService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]); // For multi-date selection
  const [selectionMode, setSelectionMode] = useState<'single' | 'range' | 'multiple'>('single'); // Selection mode

  useEffect(() => {
    if (params.id) {
      fetchVideographyService(params.id as string);
    }
  }, [params.id]);

  const fetchVideographyService = async (id: string) => {
    try {
      setLoading(true);
      const response = await apiClient.get<VideographyResponse>(`/videography/${id}`);
      setService(response.data.data);
      setError('');
    } catch (err) {
      console.error('Error fetching videography service:', err);
      setError('Failed to load videography service details');
    } finally {
      setLoading(false);
    }
  };

  const handleContact = (type: 'phone' | 'whatsapp' | 'email') => {
    if (!service) return;

    switch (type) {
      case 'phone':
        window.open(`tel:${service.contact.phone}`);
        break;
      case 'whatsapp':
        const whatsappNumber = service.contact.whatsapp || service.contact.phone;
        const cleanNumber = whatsappNumber.replace(/\D/g, '');
        const message = encodeURIComponent(`Hello! I'm interested in ${service.name}`);
        window.open(`https://wa.me/${cleanNumber}?text=${message}`);
        break;
      case 'email':
        window.open(`mailto:${service.contact.email}`);
        break;
    }
  };

  const handleDateSelect = (date: string | string[]) => {
    if (typeof date === 'string') {
      // Single date selection
      setSelectedDate(date);
      setSelectedDates([date]); // Also set the array for consistency
      setShowBookingModal(true);
    } else if (date.length > 0) {
      // Multiple dates selection
      setSelectedDates(date);
      setSelectedDate(date[0]); // Set first date as primary
      setShowBookingModal(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading videography service...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The videography service you are looking for does not exist.'}</p>
          <button
            onClick={() => router.push('/videography')}
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Videography Services
          </button>
        </div>
      </div>
    );
  }

  const primaryImage = service.images.find(img => img.isPrimary) || service.images[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.push('/videography')}
          className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Videography Services
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{service.name}</h1>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-500 fill-current mr-1" />
                      <span className="font-semibold">{service.rating.toFixed(1)}</span>
                      <span className="text-gray-500 ml-1">({service.reviewCount} reviews)</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{service.serviceLocation.city}, {service.serviceLocation.state}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    ₹{service.basePrice.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">starting price</div>
                </div>
              </div>

              <p className="text-gray-600 text-lg leading-relaxed">{service.description}</p>

              {/* Videography Types */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Services Offered</h3>
                <div className="flex flex-wrap gap-2">
                  {service.videographyTypes.map((type, index) => (
                    <span key={index} className="px-3 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Images */}
            {service.images.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Portfolio</h3>
                
                {/* Main Image */}
                <div className="relative h-96 mb-4 rounded-xl overflow-hidden">
                  <Image
                    src={service.images[selectedImageIndex]?.url || primaryImage?.url}
                    alt={service.images[selectedImageIndex]?.alt || primaryImage?.alt || service.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Thumbnail Images */}
                {service.images.length > 1 && (
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {service.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative h-20 rounded-lg overflow-hidden ${
                          selectedImageIndex === index ? 'ring-2 ring-purple-500' : ''
                        }`}
                      >
                        <Image
                          src={image.url}
                          alt={image.alt}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Packages */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Packages & Pricing</h3>
              <div className="space-y-4">
                {service.packages.map((pkg, index) => (
                  <div key={index} className={`border rounded-xl p-6 ${pkg.isPopular ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{pkg.name}</h4>
                        {pkg.description && (
                          <p className="text-gray-600 mt-1">{pkg.description}</p>
                        )}
                        {pkg.duration && (
                          <div className="flex items-center text-gray-500 mt-2">
                            <Clock className="h-4 w-4 mr-1" />
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
                        <h5 className="font-medium text-gray-900 mb-2">Includes:</h5>
                        <ul className="space-y-1">
                          {pkg.includes.map((item, itemIndex) => (
                            <li key={itemIndex} className="flex items-center text-gray-600">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                              <span className="text-sm">{item}</span>
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
            {service.addons.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Additional Services</h3>
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
                <h3 className="text-xl font-bold text-gray-900 mb-6">Policies</h3>
                <div className="space-y-4">
                  {service.cancellationPolicy && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Cancellation Policy</h4>
                      <p className="text-gray-600">{service.cancellationPolicy}</p>
                    </div>
                  )}
                  {service.paymentTerms && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Payment Terms</h4>
                      <p className="text-gray-600">{service.paymentTerms}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Availability Calendar */}
            <AvailabilityCalendar
              serviceId={service._id}
              serviceType="videography"
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
              selectedDates={selectedDates}
              selectionMode={selectionMode}
              onSelectionModeChange={setSelectionMode}
            />

            {/* Booking Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  ₹{service.basePrice.toLocaleString()}
                </div>
                <p className="text-gray-600">Starting Price</p>
              </div>

              {/* Only show booking button if user is not a provider - providers can only view, not book */}
              {user?.role !== 'PROVIDER' && selectedDate ? (
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-colors mb-4"
                >
                  {selectedDates.length > 1 
                    ? `Book for ${selectedDates.length} dates` 
                    : `Book for ${selectedDate}`}
                </button>
              ) : user?.role !== 'PROVIDER' ? (
                <div className="text-center mb-4">
                  <Video className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-xs text-gray-600">Select an available date from the calendar above to start your booking</p>
                </div>
              ) : (
                <div className="text-center mb-4">
                  <Video className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-xs text-gray-600">Providers can view service details but cannot make bookings</p>
                </div>
              )}
              
              <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Videographer</h3>
              
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => handleContact('phone')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Now
                </button>
                
                {service.contact.whatsapp && (
                  <button
                    onClick={() => handleContact('whatsapp')}
                    className="w-full flex items-center justify-center px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </button>
                )}
                
                <button
                  onClick={() => handleContact('email')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </button>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Videographer Details</h4>
                <p className="text-gray-600 text-sm">
                  {service.provider.firstName} {service.provider.lastName}
                </p>
                <p className="text-gray-500 text-sm">{service.contact.email}</p>
                <p className="text-gray-500 text-sm">{service.contact.phone}</p>
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

            {/* Quick Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Info</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Starting Price</span>
                  <span className="font-semibold">₹{service.basePrice.toLocaleString()}</span>
                </div>
                {service.minGuests && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Min. Guests</span>
                    <span className="font-semibold">{service.minGuests}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Rating</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                    <span className="font-semibold">{service.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Reviews</span>
                  <span className="font-semibold">{service.reviewCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          serviceId={service._id}
          serviceName={service.name}
          serviceType="videography"
          basePrice={service.basePrice}
          pricePerGuest={service.pricePerGuest || 0}
          preselectedDate={selectedDate}
          preselectedDates={selectedDates}
        />
      </div>
    </div>
  );
}
