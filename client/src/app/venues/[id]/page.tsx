'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  MapPin, Users, Star, Heart, ArrowLeft, Calendar, Phone, Mail, 
  Clock, Wifi, Car, Utensils, Music, Camera, Shield, CheckCircle,
  DollarSign, User, Building, Navigation, ChefHat, Sparkles, Plus
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import apiClient from '../../../lib/api';

interface FoodOption {
  name: string;
  description: string;
  price: number;
  cuisine: string[];
  isVeg: boolean;
  isVegan?: boolean;
  servingSize: string;
}

interface DecorationOption {
  name: string;
  description: string;
  price: number;
  theme: string;
  includes: string[];
  duration: string;
}

interface AddonService {
  name: string;
  description: string;
  price: number;
  category: string;
  includes: string[];
  duration: string;
}

interface Amenity {
  name: string;
  description: string;
  icon?: string;
  additionalCost?: number;
}

interface Venue {
  _id: string;
  name: string;
  description: string;
  type: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  address: {
    street: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
  };
  capacity: {
    min: number;
    max: number;
  };
  basePrice: number;
  images: Array<{
    url: string;
    alt: string;
    category: string;
    isPrimary: boolean;
  }>;
  averageRating: number;
  totalReviews: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  providerId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  amenities?: Amenity[];
  features?: string[];
  foodOptions?: FoodOption[];
  decorationOptions?: DecorationOption[];
  addonServices?: AddonService[];
  cancellationPolicy?: string;
  advancePayment?: number;
}

export default function VenueDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [favorite, setFavorite] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    eventDate: '',
    guestCount: '',
    eventType: '',
    specialRequests: ''
  });

  const fetchVenue = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/venues/${params.id}`);
      setVenue(response.data);
      setError('');
    } catch (err: any) {
      console.error('Error fetching venue:', err);
      setError('Failed to fetch venue details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchVenue();
    }
  }, [params.id]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!venue) return;

    try {
      // For now, just show an alert. In a real app, this would create a booking
      alert(`Booking request submitted for ${venue.name}!\n\nEvent Date: ${bookingData.eventDate}\nGuest Count: ${bookingData.guestCount}\nEvent Type: ${bookingData.eventType}\n\nWe'll contact you soon to confirm the booking.`);
      
      // Reset form
      setBookingData({
        eventDate: '',
        guestCount: '',
        eventType: '',
        specialRequests: ''
      });
      setShowBookingForm(false);
    } catch (err: any) {
      console.error('Error submitting booking:', err);
      alert('Failed to submit booking request. Please try again.');
    }
  };

  const toggleFavorite = () => {
    setFavorite(!favorite);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Venue Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The venue you are looking for does not exist.'}</p>
          <Button onClick={() => router.push('/venues')} className="bg-pink-600 hover:bg-pink-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Venues
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={() => router.push('/venues')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Venues</span>
            </Button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleFavorite}
                className={`p-2 rounded-full transition-all duration-300 ${
                  favorite 
                    ? 'bg-pink-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Heart className={`h-5 w-5 ${favorite ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="relative">
                <img 
                  src={venue.images.length > 0 ? venue.images[selectedImageIndex]?.url : 'https://images.unsplash.com/photo-1542665952-14513db15293?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'} 
                  alt={venue.name}
                  className="w-full h-96 object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 text-pink-600 px-3 py-1 rounded-full text-sm font-semibold">
                    {venue.type}
                  </span>
                </div>
              </div>
              
              {/* Image Thumbnails */}
              {venue.images.length > 1 && (
                <div className="p-4">
                  <div className="flex space-x-2 overflow-x-auto">
                    {venue.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                          selectedImageIndex === index ? 'border-pink-500' : 'border-gray-200'
                        }`}
                      >
                        <img 
                          src={image.url} 
                          alt={image.alt || venue.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Venue Information */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{venue.name}</h1>
                  <div className="flex items-center space-x-4 text-gray-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{venue.address.area}, {venue.address.city}, {venue.address.state}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span>{venue.averageRating || 0} ({venue.totalReviews || 0} reviews)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="prose max-w-none">
                <p className="text-gray-700 text-lg leading-relaxed">{venue.description}</p>
              </div>
            </div>

            {/* Venue Details */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Venue Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-pink-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Capacity</p>
                      <p className="text-gray-600">{venue.capacity.min} - {venue.capacity.max} guests</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-pink-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Venue Type</p>
                      <p className="text-gray-600">{venue.type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Navigation className="h-5 w-5 text-pink-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Full Address</p>
                      <p className="text-gray-600">
                        {venue.address.street}, {venue.address.area}<br />
                        {venue.address.city}, {venue.address.state} - {venue.address.pincode}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-pink-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Base Price</p>
                      <p className="text-gray-600">₹{venue.basePrice.toLocaleString()} per event</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-pink-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Provider</p>
                      <p className="text-gray-600">{venue.providerId.firstName} {venue.providerId.lastName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Status</p>
                      <p className="text-green-600 font-medium">{venue.status}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            {venue.features && venue.features.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Sparkles className="h-6 w-6 text-pink-600 mr-2" />
                  Features
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {venue.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-pink-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-pink-600 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Food Options */}
            {venue.foodOptions && venue.foodOptions.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <ChefHat className="h-6 w-6 text-orange-600 mr-2" />
                  Food Options
                </h2>
                <div className="space-y-6">
                  {venue.foodOptions.map((food, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{food.name}</h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              food.isVeg ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {food.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                            </span>
                            {food.isVegan && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Vegan
                              </span>
                            )}
                            <span className="text-sm text-gray-600">{food.servingSize}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">₹{food.price.toLocaleString()}</div>
                          <div className="text-sm text-gray-500">per serving</div>
                        </div>
                      </div>
                      
                      {food.description && (
                        <p className="text-gray-700 mb-3">{food.description}</p>
                      )}
                      
                      {food.cuisine && food.cuisine.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {food.cuisine.map((cuisine, cuisineIndex) => (
                            <span key={cuisineIndex} className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                              {cuisine}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities */}
            {venue.amenities && venue.amenities.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                  Amenities
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {venue.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900 font-medium">{amenity.name}</span>
                          {amenity.additionalCost && amenity.additionalCost > 0 && (
                            <span className="text-sm text-orange-600 font-medium">
                              +₹{amenity.additionalCost.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {amenity.description && (
                          <p className="text-sm text-gray-600 mt-1">{amenity.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decoration Options */}
            {venue.decorationOptions && venue.decorationOptions.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Sparkles className="h-6 w-6 text-purple-600 mr-2" />
                  Decoration Options
                </h2>
                <div className="space-y-6">
                  {venue.decorationOptions.map((decoration, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{decoration.name}</h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              {decoration.theme}
                            </span>
                            <span className="text-sm text-gray-600">{decoration.duration}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">₹{decoration.price.toLocaleString()}</div>
                          <div className="text-sm text-gray-500">per package</div>
                        </div>
                      </div>
                      
                      {decoration.description && (
                        <p className="text-gray-700 mb-3">{decoration.description}</p>
                      )}
                      
                      {decoration.includes && decoration.includes.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Includes:</h4>
                          <div className="flex flex-wrap gap-2">
                            {decoration.includes.map((item, itemIndex) => (
                              <span key={itemIndex} className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Addon Services */}
            {venue.addonServices && venue.addonServices.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Plus className="h-6 w-6 text-blue-600 mr-2" />
                  Additional Services
                </h2>
                <div className="space-y-6">
                  {venue.addonServices.map((service, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                              {service.category}
                            </span>
                            <span className="text-sm text-gray-600">{service.duration}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">₹{service.price.toLocaleString()}</div>
                          <div className="text-sm text-gray-500">per service</div>
                        </div>
                      </div>
                      
                      {service.description && (
                        <p className="text-gray-700 mb-3">{service.description}</p>
                      )}
                      
                      {service.includes && service.includes.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Includes:</h4>
                          <div className="flex flex-wrap gap-2">
                            {service.includes.map((item, itemIndex) => (
                              <span key={itemIndex} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Policies */}
            {(venue.cancellationPolicy || venue.advancePayment) && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Shield className="h-6 w-6 text-blue-600 mr-2" />
                  Policies
                </h2>
                <div className="space-y-4">
                  {venue.advancePayment && (
                    <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                      <DollarSign className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Advance Payment</h3>
                        <p className="text-gray-700">{venue.advancePayment}% of total amount required as advance</p>
                      </div>
                    </div>
                  )}
                  
                  {venue.cancellationPolicy && (
                    <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg">
                      <Shield className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Cancellation Policy</h3>
                        <p className="text-gray-700">{venue.cancellationPolicy}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  ₹{venue.basePrice.toLocaleString()}
                </div>
                <p className="text-gray-600">per event</p>
              </div>

              <Button 
                onClick={() => setShowBookingForm(true)}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-xl py-3 text-lg font-semibold"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Book Now
              </Button>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  Contact provider for custom pricing
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Provider</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-pink-600" />
                  <span className="text-gray-700">{venue.providerId.firstName} {venue.providerId.lastName}</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-pink-600" />
                  <a href={`mailto:${venue.providerId.email}`} className="text-pink-600 hover:text-pink-700">
                    {venue.providerId.email}
                  </a>
                </div>
                
                {venue.providerId.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-pink-600" />
                    <a href={`tel:${venue.providerId.phone}`} className="text-pink-600 hover:text-pink-700">
                      {venue.providerId.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Book {venue.name}</h2>
                <button
                  onClick={() => setShowBookingForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Date
                  </label>
                  <Input
                    type="date"
                    value={bookingData.eventDate}
                    onChange={(e) => setBookingData(prev => ({ ...prev, eventDate: e.target.value }))}
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guest Count
                  </label>
                  <Input
                    type="number"
                    min={venue.capacity.min}
                    max={venue.capacity.max}
                    value={bookingData.guestCount}
                    onChange={(e) => setBookingData(prev => ({ ...prev, guestCount: e.target.value }))}
                    placeholder={`${venue.capacity.min} - ${venue.capacity.max} guests`}
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type
                  </label>
                  <select
                    value={bookingData.eventType}
                    onChange={(e) => setBookingData(prev => ({ ...prev, eventType: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="">Select event type</option>
                    <option value="Wedding">Wedding</option>
                    <option value="Birthday Party">Birthday Party</option>
                    <option value="Corporate Event">Corporate Event</option>
                    <option value="Anniversary">Anniversary</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requests
                  </label>
                  <textarea
                    value={bookingData.specialRequests}
                    onChange={(e) => setBookingData(prev => ({ ...prev, specialRequests: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Any special requirements or requests..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowBookingForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700"
                  >
                    Submit Booking
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
