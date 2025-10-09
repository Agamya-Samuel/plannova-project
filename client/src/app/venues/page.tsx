'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, MapPin, Users, Star, Heart, SlidersHorizontal, Clock, Edit3 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import apiClient from '../../lib/api';
import useFavorites from '../../hooks/useFavorites';

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
  };
  // Add pendingEdits field to handle pending edits
  pendingEdits?: any;
}

function VenuesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    location: '',
    venueType: searchParams.get('type') || '',
    capacity: '',
    priceRange: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Use the favorites hook
  const { favorites, toggleFavorite, loading: favoritesLoading, error: favoritesError } = useFavorites();

  // Fetch approved venues from API
  const fetchVenues = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/venues');
      setVenues(response.data.venues || []);
      setError('');
    } catch (err) {
      console.error('Error fetching venues:', err);
      setError('Failed to fetch venues');
    } finally {
      setLoading(false);
    }
  };

  // Fetch venues on component mount
  useEffect(() => {
    fetchVenues();
  }, []);

  // Update filters when URL parameters change
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam) {
      setSelectedFilters(prev => ({ ...prev, venueType: typeParam }));
      setShowFilters(true); // Show filters panel when filtering is applied
    }
  }, [searchParams]);

  // Filter venues based on selected filters
  const filteredVenues = venues.filter((venue) => {
    if (selectedFilters.venueType && venue.type !== selectedFilters.venueType) {
      return false;
    }
    // Add more filter logic here as needed
    return true;
  });

  // Handle favorite toggle with error feedback
  const handleToggleFavorite = async (venueId: string) => {
    const success = await toggleFavorite(venueId);
    
    if (!success) {
      // Show error message to user
      setError('Failed to update favorite. Please try again.');
      // Clear error after 3 seconds
      setTimeout(() => setError(''), 3000);
    }
  };

  // Loading component for Suspense fallback
  if (loading || favoritesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Wedding Venues in Mumbai</h1>
              <p className="text-xl text-pink-100 mb-8">
                Loading venues...
              </p>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="w-full h-64 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Wedding Venues in Mumbai</h1>
            <p className="text-xl text-pink-100 mb-8">
              Discover {venues.length}+ beautiful venues for your special day
            </p>
            
            {/* Search Bar */}
            <div className="max-w-4xl mx-auto bg-white rounded-2xl p-4 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Search location..."
                    className="pl-10 h-12 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <select 
                    className="w-full pl-10 pr-4 h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-700 bg-white"
                    value={selectedFilters.venueType}
                    onChange={(e) => setSelectedFilters(prev => ({ ...prev, venueType: e.target.value }))}
                  >
                    <option value="">Venue type</option>
                    <option value="Banquet Hall">Banquet Hall</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Resort">Resort</option>
                    <option value="Outdoor">Outdoor</option>
                  </select>
                </div>
                
                <div className="relative">
                  <select className="w-full px-4 h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-700 bg-white">
                    <option>Guest capacity</option>
                    <option>50-100</option>
                    <option>100-200</option>
                    <option>200-500</option>
                    <option>500+</option>
                  </select>
                </div>
                
                <Button className="h-12 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-xl font-semibold">
                  <Search className="mr-2 h-5 w-5" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Sort */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 border-gray-300"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filters</span>
            </Button>
            
            <div className="text-sm text-gray-600">
              Showing {filteredVenues.length} venues
              {selectedFilters.venueType && (
                <span className="ml-2 text-pink-600">
                  • Filtered by: {selectedFilters.venueType}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent">
              <option>Popularity</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Rating</option>
              <option>Reviews</option>
            </select>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              {(selectedFilters.venueType || selectedFilters.location || selectedFilters.capacity || selectedFilters.priceRange) && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedFilters({ location: '', venueType: '', capacity: '', priceRange: '' })}
                  className="text-pink-600 border-pink-200 hover:bg-pink-50"
                >
                  Clear All
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Location</h3>
                <div className="space-y-2">
                  {['Bandra', 'Andheri', 'Juhu', 'Powai', 'Worli'].map((location) => (
                    <label key={location} className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                      <span className="ml-2 text-sm text-gray-700">{location}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Venue Type</h3>
                <div className="space-y-2">
                  {['Banquet Hall', 'Hotel', 'Resort', 'Outdoor'].map((type) => (
                    <label key={type} className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="rounded border-gray-300 text-pink-600 focus:ring-pink-500" 
                        checked={selectedFilters.venueType === type}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFilters(prev => ({ ...prev, venueType: type }));
                          } else {
                            setSelectedFilters(prev => ({ ...prev, venueType: '' }));
                          }
                        }}
                      />
                      <span className="ml-2 text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
                <div className="space-y-2">
                  {['Under ₹2L', '₹2L - ₹5L', '₹5L - ₹10L', 'Above ₹10L'].map((price) => (
                    <label key={price} className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                      <span className="ml-2 text-sm text-gray-700">{price}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Capacity</h3>
                <div className="space-y-2">
                  {['50-100', '100-200', '200-500', '500+'].map((capacity) => (
                    <label key={capacity} className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                      <span className="ml-2 text-sm text-gray-700">{capacity} guests</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {(error || favoritesError) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800">{error || favoritesError}</p>
          </div>
        )}

        {/* Venues Grid */}
        {!error && !favoritesError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVenues.map((venue) => (
            <div key={venue._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="relative">
                <Image 
                  src={venue.images.length > 0 ? venue.images.find(img => img.isPrimary)?.url || venue.images[0]?.url : 'https://images.unsplash.com/photo-1542665952-14513db15293?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'} 
                  alt={venue.name}
                  width={800}
                  height={256}
                  className="w-full h-64 object-cover"
                  priority={venue._id === venues[0]?._id} // Prioritize loading the first image
                />
                <button
                  onClick={() => handleToggleFavorite(venue._id)}
                  className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 ${
                    favorites.has(venue._id) 
                      ? 'bg-pink-600 text-white' 
                      : 'bg-white/80 text-gray-600 hover:bg-white'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${favorites.has(venue._id) ? 'fill-current' : ''}`} />
                </button>
                <div className="absolute top-4 left-4 flex space-x-2">
                  <span className="bg-white/90 text-pink-600 px-3 py-1 rounded-full text-sm font-semibold">
                    {venue.type}
                  </span>
                  {/* Show a badge when there are pending edits */}
                  {venue.status === 'PENDING_EDIT' && (
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Edit Pending
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{venue.name}</h3>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-semibold text-gray-900">{venue.averageRating || 0}</span>
                    <span className="text-sm text-gray-500">({venue.totalReviews || 0})</span>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-600 mb-3">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{venue.address.area}, {venue.address.city}, {venue.address.state}</span>
                </div>
                
                <div className="flex items-center text-gray-600 mb-4">
                  <Users className="h-4 w-4 mr-1" />
                  <span className="text-sm">{venue.capacity.min}-{venue.capacity.max} guests</span>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {/* Show pending description if there are pending edits, otherwise show current description */}
                    {venue.status === 'PENDING_EDIT' && venue.pendingEdits?.description 
                      ? venue.pendingEdits.description 
                      : venue.description}
                  </p>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">
                      {/* Show pending price if there are pending edits, otherwise show current price */}
                      ₹{(venue.status === 'PENDING_EDIT' && venue.pendingEdits?.basePrice 
                        ? venue.pendingEdits.basePrice 
                        : venue.basePrice).toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">per event</span>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => router.push(`/venues/${venue._id}`)}
                    className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-xl"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}

        {/* No Venues Message */}
        {!error && !favoritesError && filteredVenues.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No venues found</h3>
            <p className="text-gray-600">
              {selectedFilters.venueType 
                ? `No venues found for "${selectedFilters.venueType}". Try adjusting your filters.`
                : "No approved venues are available at the moment. Please check back later."
              }
            </p>
          </div>
        )}

        {/* Load More */}
        {!error && !favoritesError && filteredVenues.length > 0 && (
          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              size="lg"
              className="border-pink-200 text-pink-600 hover:bg-pink-50 px-8 py-3 rounded-xl"
            >
              Load More Venues
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VenuesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Wedding Venues in Mumbai</h1>
              <p className="text-xl text-pink-100 mb-8">
                Loading venues...
              </p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="w-full h-64 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <VenuesContent />
    </Suspense>
  );
}