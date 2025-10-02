'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../../contexts/AuthContext';
import ProtectedRoute from '../../../../../components/auth/ProtectedRoute';
import { Button } from '../../../../../components/ui/button';
import { 
  MapPin, 
  Users, 
  DollarSign, 
  Star, 
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  Calendar,
  CheckCircle,
  XCircle,
  Edit3
} from 'lucide-react';
import apiClient from '../../../../../lib/api';

interface Venue {
  _id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  address: {
    street: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  contact: {
    phone: string;
    email: string;
    whatsapp?: string;
    website?: string;
  };
  capacity: {
    min: number;
    max: number;
  };
  basePrice: number;
  pricePerGuest?: number;
  advancePayment: number;
  cancellationPolicy: string;
  images: Array<{
    url: string;
    alt: string;
    category: string;
    isPrimary: boolean;
  }>;
  amenities: Array<{
    name: string;
    description?: string;
    included: boolean;
    additionalCost?: number;
  }>;
  features: string[];
  foodOptions: Array<{
    name: string;
    description: string;
    price: number;
    cuisine: string[];
    isVeg: boolean;
    servingSize: string;
  }>;
  decorationOptions: Array<{
    name: string;
    description: string;
    price: number;
    theme: string;
    includes: string[];
    duration: string;
  }>;
  addonServices: Array<{
    name: string;
    description: string;
    price: number;
    category: string;
    includes: string[];
    duration?: string;
  }>;
  averageRating: number;
  totalReviews: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ProviderVenueViewPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const venueId = params.id as string;

  useEffect(() => {
    if (venueId) {
      fetchVenue();
    }
  }, [venueId]);

  const fetchVenue = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/venues/provider/${venueId}`);
      setVenue(response.data);
    } catch (err: any) {
      console.error('Error fetching venue:', err);
      setError('Failed to load venue details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'SUSPENDED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (user?.role !== 'PROVIDER') {
    return <div>Access denied. Provider access required.</div>;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/provider/venues')}
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Venues</span>
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {venue?.name || 'Venue Details'}
                    </h1>
                    <p className="text-gray-600">
                      View and manage your venue details
                    </p>
                  </div>
                </div>
                {venue && (
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(venue.status)}`}>
                      {venue.status}
                    </span>
                    <Button
                      onClick={() => router.push(`/provider/venues/edit/${venue._id}`)}
                      className="bg-pink-600 hover:bg-pink-700 text-white"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Venue
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Venue Details */}
          {venue && !loading && !error && (
            <div className="space-y-6">
              {/* Images Gallery */}
              {venue.images.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Venue Images</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {venue.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.url}
                          alt={image.alt}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        {image.isPrimary && (
                          <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                            Primary
                          </span>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent rounded-b-lg p-2">
                          <p className="text-white text-sm">{image.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Basic Information */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Venue Details</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Name</label>
                        <p className="text-gray-900">{venue.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Type</label>
                        <p className="text-gray-900">{venue.type}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Description</label>
                        <p className="text-gray-900">{venue.description}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Capacity & Pricing</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-900">
                          {venue.capacity.min} - {venue.capacity.max} guests
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-900">
                          ₹{venue.basePrice.toLocaleString()} base price
                        </span>
                      </div>
                      {venue.pricePerGuest && (
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-900">
                            ₹{venue.pricePerGuest} per guest
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-900">
                          {venue.advancePayment}% advance payment required
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address & Contact */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Address & Contact</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Address</h3>
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <p className="text-gray-900">{venue.address.street}</p>
                        <p className="text-gray-900">{venue.address.area}</p>
                        <p className="text-gray-900">
                          {venue.address.city}, {venue.address.state} - {venue.address.pincode}
                        </p>
                        {venue.address.landmark && (
                          <p className="text-gray-600 text-sm">Near: {venue.address.landmark}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-900">{venue.contact.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-900">{venue.contact.email}</span>
                      </div>
                      {venue.contact.website && (
                        <div className="flex items-center space-x-2">
                          <Globe className="h-5 w-5 text-gray-400" />
                          <a 
                            href={venue.contact.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-pink-600 hover:text-pink-700"
                          >
                            {venue.contact.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Features & Amenities */}
              {(venue.features.length > 0 || venue.amenities.length > 0) && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Features & Amenities</h2>
                  
                  {venue.features.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Features</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {venue.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-gray-900 text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {venue.amenities.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h3>
                      <div className="space-y-2">
                        {venue.amenities.map((amenity, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              {amenity.included ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <div>
                                <span className="text-gray-900 font-medium">{amenity.name}</span>
                                {amenity.description && (
                                  <p className="text-gray-600 text-sm">{amenity.description}</p>
                                )}
                              </div>
                            </div>
                            {amenity.additionalCost && amenity.additionalCost > 0 && (
                              <span className="text-gray-600 text-sm">
                                +₹{amenity.additionalCost}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Food Options */}
              {venue.foodOptions.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Food Options</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {venue.foodOptions.map((food, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900">{food.name}</h3>
                          <span className="text-pink-600 font-semibold">₹{food.price}</span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{food.description}</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {food.cuisine.map((c, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {c}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className={food.isVeg ? 'text-green-600' : 'text-red-600'}>
                            {food.isVeg ? '🟢 Vegetarian' : '🔴 Non-Vegetarian'}
                          </span>
                          <span className="text-gray-600">{food.servingSize}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Policies */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Policies</h2>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Cancellation Policy</h3>
                  <p className="text-gray-700">{venue.cancellationPolicy}</p>
                </div>
              </div>

              {/* Venue Stats */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Venue Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1 mb-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <span className="text-2xl font-bold text-gray-900">
                        {venue.averageRating || 0}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">Average Rating</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {venue.totalReviews}
                    </div>
                    <p className="text-gray-600 text-sm">Total Reviews</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {new Date(venue.createdAt).toLocaleDateString()}
                    </div>
                    <p className="text-gray-600 text-sm">Created Date</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {new Date(venue.updatedAt).toLocaleDateString()}
                    </div>
                    <p className="text-gray-600 text-sm">Last Updated</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}