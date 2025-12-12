'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  MapPin, Users, Star, Heart, ArrowLeft, Phone, Mail, Shield, CheckCircle,
  DollarSign, User, Building, Navigation, ChefHat, Sparkles, Plus, Palette, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { BookingModal } from '@/components/booking/BookingModal';
import { BookingButton } from '@/components/booking/BookingButton';
import { BookingPayload } from '@/components/booking/AvailabilityCalendar';
import SocialShare from '@/components/ui/SocialShare';

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
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'PENDING_EDIT';
  address: {
    street: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
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
  // Add pendingEdits field
  pendingEdits?: Partial<Venue>;
}

export default function VenueDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [favorite, setFavorite] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Redirect to login if not authenticated (prevents direct URL access)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch venue data - must be called before any early returns to satisfy React hooks rules
  useEffect(() => {
    const fetchVenue = async () => {
      try {
        setLoading(true);
        
        // Use staff endpoint if user is staff/admin, otherwise use public endpoint
        const endpoint = (user?.role === 'STAFF' || user?.role === 'ADMIN') 
          ? `/venues/staff/${params.id}` 
          : `/venues/${params.id}`;
          
        const response = await apiClient.get(endpoint);
        setVenue(response.data);
        setError('');
      } catch (err) {
        console.error('Error fetching venue:', err);
        setError('Failed to fetch venue details');
      } finally {
        setLoading(false);
      }
    };

    // Check if venue is already favorited (only if user is authenticated)
    const checkIfFavorited = async () => {
      // Skip if user is not authenticated
      if (!user) {
        setFavorite(false);
        return;
      }
      
      try {
        const response = await apiClient.get('/venues/favorites');
        const favoriteIds = new Set(response.data.venues.map((venue: Venue) => venue._id));
        setFavorite(favoriteIds.has(params.id as string));
      } catch (err) {
        console.error('Error checking favorite status:', err);
        // If there's an error, assume it's not favorited
        setFavorite(false);
      }
    };

    // Only fetch if authenticated and params.id exists
    if (params.id && isAuthenticated && !authLoading) {
      fetchVenue();
      checkIfFavorited();
    }
  }, [params.id, user?.role, user, isAuthenticated, authLoading]);

  // Don't render content if not authenticated (while redirecting)
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Will redirect via useEffect, but show loading while redirecting
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  const toggleFavorite = async () => {
    // Check if user is authenticated
    if (!user) {
      toast.error('Please log in to add favorites');
      router.push('/auth/login');
      return;
    }
    
    try {
      console.log('Toggling favorite for venue:', params.id);
      if (favorite) {
        // Remove from favorites
        console.log('Removing from favorites');
        await apiClient.delete(`/venues/${params.id}/favorite`);
        setFavorite(false);
        toast.success('Removed from favorites');
      } else {
        // Add to favorites
        console.log('Adding to favorites');
        await apiClient.post(`/venues/${params.id}/favorite`);
        setFavorite(true);
        toast.success('Added to favorites');
      }
    } catch (err: unknown) {
      console.error('Error toggling favorite:', err);
      toast.error('Failed to update favorite. Please try again.');
    }
  };

  // Handle booking action from calendar
  const handleBook = (payload: BookingPayload) => {
    setSelectedDates(payload.dates);
    setSelectedDate(payload.dates[0] || '');
    setShowBookingModal(true);
  };

  // Optional: Track date selections before booking
  const handleDateSelect = (dates: string[]) => {
    // This is called when dates are selected but not yet booked
    // Useful for showing preview or updating UI
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
          <Button onClick={() => { if (typeof window !== 'undefined' && window.history.length > 1) { router.back(); } else { router.push('/venues'); } }} className="bg-pink-600 hover:bg-pink-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
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
              onClick={() => { if (typeof window !== 'undefined' && window.history.length > 1) { router.back(); } else { router.push('/venues'); } }}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
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
                <Image 
                  src={venue.images.length > 0 ? venue.images[selectedImageIndex]?.url : ''} 
                  alt={venue.name}
                  width={1170}
                  height={600}
                  className="w-full h-96 object-cover"
                  unoptimized={(venue.images.length > 0 ? venue.images[selectedImageIndex]?.url : '').includes('s3.tebi.io') || (venue.images.length > 0 ? venue.images[selectedImageIndex]?.url : '').includes('s3.')}
                />
                <div className="absolute top-4 left-4 flex space-x-2">
                  <span className="bg-white/90 text-pink-600 px-3 py-1 rounded-full text-sm font-semibold">
                    {venue.type}
                  </span>
                </div>
              </div>
              
              {/* Image Thumbnails - Only show if there are more than 1 image */}
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
                        <Image 
                          src={image.url} 
                          alt={image.alt || venue.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                          unoptimized={image.url.includes('s3.tebi.io') || image.url.includes('s3.')}
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
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {/* Show pending name if there are pending edits, otherwise show current name */}
                    {venue.status === 'PENDING_EDIT' && venue.pendingEdits?.name 
                      ? venue.pendingEdits.name 
                      : venue.name}
                  </h1>
                  <div className="flex items-center space-x-4 text-gray-600">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {/* Show pending address if there are pending edits, otherwise show current address */}
                        {venue.status === 'PENDING_EDIT' && venue.pendingEdits?.address
                          ? `${venue.pendingEdits.address.area}, ${venue.pendingEdits.address.city}, ${venue.pendingEdits.address.state}`
                          : `${venue.address.area}, ${venue.address.city}, ${venue.address.state}`}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span>{venue.averageRating || 0} ({venue.totalReviews || 0} reviews)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="prose max-w-none">
                <p className="text-gray-700 text-lg leading-relaxed">
                  {/* Show pending description if there are pending edits, otherwise show current description */}
                  {venue.status === 'PENDING_EDIT' && venue.pendingEdits?.description 
                    ? venue.pendingEdits.description 
                    : venue.description}
                </p>
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
                      <p className="text-gray-600">
                        {/* Show pending capacity if there are pending edits, otherwise show current capacity */}
                        {venue.status === 'PENDING_EDIT' && venue.pendingEdits?.capacity
                          ? `${venue.pendingEdits.capacity.min} - ${venue.pendingEdits.capacity.max} guests`
                          : `${venue.capacity.min} - ${venue.capacity.max} guests`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-pink-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Venue Type</p>
                      <p className="text-gray-600">
                        {/* Show pending type if there are pending edits, otherwise show current type */}
                        {venue.status === 'PENDING_EDIT' && venue.pendingEdits?.type
                          ? venue.pendingEdits.type
                          : venue.type}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Navigation className="h-5 w-5 text-pink-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Full Address</p>
                      <div className="text-gray-600">
                        {/* Show pending address if there are pending edits, otherwise show current address */}
                        {venue.status === 'PENDING_EDIT' && venue.pendingEdits?.address ? (
                          <>
                            <p>{venue.pendingEdits.address.street}, {venue.pendingEdits.address.area}</p>
                            <p>{venue.pendingEdits.address.city}, {venue.pendingEdits.address.state} - {venue.pendingEdits.address.pincode}</p>
                          </>
                        ) : (
                          <>
                            <p>{venue.address.street}, {venue.address.area}</p>
                            <p>{venue.address.city}, {venue.address.state} - {venue.address.pincode}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-pink-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Base Price</p>
                      <p className="text-gray-600">
                        {/* Show pending price if there are pending edits, otherwise show current price */}
                        ₹{(venue.status === 'PENDING_EDIT' && venue.pendingEdits?.basePrice
                          ? venue.pendingEdits.basePrice
                          : venue.basePrice).toLocaleString()} per event
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-pink-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Provider</p>
                      <p className="text-gray-600">{venue.providerId.firstName} {venue.providerId.lastName}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            {(venue.features && venue.features.length > 0) && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Sparkles className="h-6 w-6 text-pink-600 mr-2" />
                  Features
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Show pending features if there are pending edits, otherwise show current features */}
                  {(venue.status === 'PENDING_EDIT' && venue.pendingEdits?.features 
                    ? venue.pendingEdits.features 
                    : venue.features).map((feature: string, index: number) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-pink-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-pink-600 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Food Options */}
            {(venue.foodOptions && venue.foodOptions.length > 0) && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <ChefHat className="h-6 w-6 text-orange-600 mr-2" />
                  Food Options
                </h2>
                <div className="space-y-6">
                  {/* Show pending food options if there are pending edits, otherwise show current food options */}
                  {(venue.status === 'PENDING_EDIT' && venue.pendingEdits?.foodOptions 
                    ? venue.pendingEdits.foodOptions 
                    : venue.foodOptions).map((food: FoodOption, index: number) => (
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
                          {food.cuisine.map((cuisine: string, cuisineIndex: number) => (
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
            {(venue.amenities && venue.amenities.length > 0) && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                  Amenities
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Show pending amenities if there are pending edits, otherwise show current amenities */}
                  {(venue.status === 'PENDING_EDIT' && venue.pendingEdits?.amenities 
                    ? venue.pendingEdits.amenities 
                    : venue.amenities).map((amenity: Amenity, index: number) => (
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
            {(venue.decorationOptions && venue.decorationOptions.length > 0) && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Palette className="h-6 w-6 text-purple-600 mr-2" />
                  Decoration Options
                </h2>
                <div className="space-y-6">
                  {/* Show pending decoration options if there are pending edits, otherwise show current decoration options */}
                  {(venue.status === 'PENDING_EDIT' && venue.pendingEdits?.decorationOptions 
                    ? venue.pendingEdits.decorationOptions 
                    : venue.decorationOptions).map((decoration: DecorationOption, index: number) => (
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
                            {decoration.includes.map((item: string, itemIndex: number) => (
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
            {(venue.addonServices && venue.addonServices.length > 0) && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Plus className="h-6 w-6 text-blue-600 mr-2" />
                  Additional Services
                </h2>
                <div className="space-y-6">
                  {/* Show pending addon services if there are pending edits, otherwise show current addon services */}
                  {(venue.status === 'PENDING_EDIT' && venue.pendingEdits?.addonServices 
                    ? venue.pendingEdits.addonServices 
                    : venue.addonServices).map((service: AddonService, index: number) => (
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
                            {service.includes.map((item: string, itemIndex: number) => (
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
            {((venue.cancellationPolicy || venue.advancePayment) || 
              (venue.status === 'PENDING_EDIT' && 
               (venue.pendingEdits?.cancellationPolicy || venue.pendingEdits?.advancePayment))) && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Shield className="h-6 w-6 text-blue-600 mr-2" />
                  Policies
                </h2>
                <div className="space-y-4">
                  {/* Show pending advance payment if there are pending edits, otherwise show current advance payment */}
                  {(venue.status === 'PENDING_EDIT' && venue.pendingEdits?.advancePayment 
                    ? venue.pendingEdits.advancePayment 
                    : venue.advancePayment) && (
                    <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                      <DollarSign className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Advance Payment</h3>
                        <p className="text-gray-700">
                          {(venue.status === 'PENDING_EDIT' && venue.pendingEdits?.advancePayment 
                            ? venue.pendingEdits.advancePayment 
                            : venue.advancePayment)}% of total amount required as advance
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Show pending cancellation policy if there are pending edits, otherwise show current cancellation policy */}
                  {(venue.status === 'PENDING_EDIT' && venue.pendingEdits?.cancellationPolicy 
                    ? venue.pendingEdits.cancellationPolicy 
                    : venue.cancellationPolicy) && (
                    <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg">
                      <Shield className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900">Cancellation Policy</h3>
                        <p className="text-gray-700">
                          {venue.status === 'PENDING_EDIT' && venue.pendingEdits?.cancellationPolicy 
                            ? venue.pendingEdits.cancellationPolicy 
                            : venue.cancellationPolicy}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Button - Replaces initial calendar */}
            <BookingButton
              serviceId={venue._id}
              serviceType="venue"
              basePrice={venue.basePrice}
              onBook={handleBook}
              onDateSelect={handleDateSelect}
            />

            {/* Booking Information */}
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              {/* Show a note when there are pending edits */}
              {venue.status === 'PENDING_EDIT' && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-blue-600 mr-2" />
                    <p className="text-sm text-blue-800">
                      This venue has pending edits awaiting approval. The displayed information reflects the proposed changes.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="text-center">
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
                  <a href={`mailto:${venue.contact?.email || venue.providerId.email}`} className="text-pink-600 hover:text-pink-700">
                    {venue.contact?.email || venue.providerId.email}
                  </a>
                </div>
                
                {/* Show venue contact phone first, fallback to provider phone */}
                {(venue.contact?.phone || venue.providerId.phone) && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-pink-600" />
                    <a href={`tel:${venue.contact?.phone || venue.providerId.phone}`} className="text-pink-600 hover:text-pink-700">
                      {venue.contact?.phone || venue.providerId.phone}
                    </a>
                  </div>
                )}
                
                {/* Show WhatsApp if available */}
                {venue.contact?.whatsapp && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-green-600" />
                    <a href={`https://wa.me/${venue.contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello! I'm interested in ${venue.name}`)}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:text-green-700">
                      WhatsApp: {venue.contact.whatsapp}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Social Sharing */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Share this venue</h3>
              <SocialShare
                title={venue.status === 'PENDING_EDIT' && venue.pendingEdits?.name 
                  ? venue.pendingEdits.name 
                  : venue.name}
                description={venue.status === 'PENDING_EDIT' && venue.pendingEdits?.description 
                  ? venue.pendingEdits.description 
                  : venue.description}
                imageUrl={venue.images.length > 0 ? venue.images[0]?.url : undefined}
                variant="button"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {venue && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          serviceId={venue._id}
          serviceName={venue.name}
          serviceType="venue"
          basePrice={venue.basePrice}
          pricePerGuest={venue.pricePerGuest || 0}
          preselectedDate={selectedDate}
          preselectedDates={selectedDates}
        />
      )}
    </div>
  );
}