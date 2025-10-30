'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Flower, MapPin, Phone, Mail, PlusCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api';
import { AvailabilityCalendar } from '@/components/booking/AvailabilityCalendar';
import { BookingModal } from '@/components/booking/BookingModal';

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
    email: string;
  };
  basePrice: number;
  minGuests?: number;
  cancellationPolicy?: string;
  paymentTerms?: string;
  decorationTypes: string[];
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
  rating: number;
  reviewCount: number;
  images: Array<{
    url: string;
    alt: string;
    category: string;
    isPrimary: boolean;
  }>;
  provider: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export default function DecorationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [service, setService] = useState<DecorationService | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    const unwrapParams = async () => {
      const unwrappedParams = await params;
      setServiceId(unwrappedParams.id);
    };
    
    unwrapParams();
  }, [params]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setShowBookingModal(true);
  };

  const fetchDecorationService = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/decoration/${serviceId}`);
      setService(response.data.data);
    } catch (err: unknown) {
      let errorMessage = 'Failed to fetch decoration service';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (err as { response?: { data?: { error?: string } } }).response;
        if (response?.data?.error) {
          errorMessage = response.data.error;
        }
      }
      setError(errorMessage);
      console.error('Error fetching decoration service:', err);
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  useEffect(() => {
    if (serviceId) {
      fetchDecorationService();
    }
  }, [serviceId, fetchDecorationService]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.push('/vendors')}
              className="inline-flex items-center text-green-600 hover:text-green-800"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Vendors
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Decoration Service</h1>
            <div></div> {/* Spacer for alignment */}
          </div>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.push('/vendors')}
              className="inline-flex items-center text-green-600 hover:text-green-800"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Vendors
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Decoration Service</h1>
            <div></div> {/* Spacer for alignment */}
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.push('/vendors')}
              className="inline-flex items-center text-green-600 hover:text-green-800"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Vendors
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Decoration Service</h1>
            <div></div> {/* Spacer for alignment */}
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Flower className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Service not found</h3>
            <p className="text-gray-600 mb-6">
              The decoration service you are looking for does not exist or has been removed.
            </p>
            <button
              onClick={() => router.push('/vendors')}
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Back to Vendors
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/vendors')}
            className="inline-flex items-center text-green-600 hover:text-green-800"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Vendors
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Decoration Service</h1>
          <div></div> {/* Spacer for alignment */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
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
                <p className="text-2xl font-bold text-green-600">₹{service.basePrice.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Starting Price</p>
              </div>
            </div>
            
            {/* Rating */}
            <div className="flex items-center mt-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(service.rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="ml-2 text-gray-600">
                {service.rating.toFixed(1)} ({service.reviewCount} reviews)
              </span>
            </div>
          </div>

          {/* Image Gallery */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {service.images && service.images.map((image, index) => (
                <div key={index} className="relative h-64 rounded-lg overflow-hidden">
                  <Image
                    src={image.url}
                    alt={image.alt || service.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Service Details */}
          <div className="p-6">
            {/* Decoration Types */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Decoration Types</h3>
              <div className="flex flex-wrap gap-2">
                {service.decorationTypes.map((type, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
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
                      <span className="text-lg font-semibold text-green-600">₹{pkg.price.toLocaleString()}</span>
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
                        <span className="text-lg font-semibold text-green-600">₹{addon.price.toLocaleString()}</span>
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
          
          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/vendors')}
              >
                Back to Vendors
              </Button>
              <Button
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                onClick={() => window.open(`tel:${service.contact.phone}`)}
              >
                Contact Vendor
              </Button>
            </div>
          </div>
        </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Availability Calendar */}
            <AvailabilityCalendar
              serviceId={service._id}
              serviceType="decoration"
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
            />

            {/* Booking Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  ₹{service.basePrice.toLocaleString()}
                </div>
                <p className="text-gray-600">Starting Price</p>
              </div>

              {selectedDate ? (
                <Button
                  onClick={() => setShowBookingModal(true)}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                >
                  Book for {selectedDate}
                </Button>
              ) : (
                <div className="text-center">
                  <Flower className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-xs text-gray-600">Select an available date from the calendar above to start your booking</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          serviceId={service._id}
          serviceName={service.name}
          serviceType="decoration"
          basePrice={service.basePrice}
          pricePerGuest={0}
          preselectedDate={selectedDate}
        />
      </div>
    </div>
  );
}
