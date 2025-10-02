'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, MapPin, Users, Star, Heart, Filter, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Venue as VenueType, VenueFilters, VenuesResponse } from '../../types/venue';
import apiClient from '../../lib/api';

interface Venue {
  id: string;
  name: string;
  location: string;
  price: string;
  rating: number;
  reviews: number;
  capacity: string;
  image: string;
  features: string[];
  type: string;
}

const sampleVenues: Venue[] = [
  {
    id: '1',
    name: 'Grand Ballroom Palace',
    location: 'Bandra, Mumbai',
    price: '₹2,50,000',
    rating: 4.8,
    reviews: 124,
    capacity: '500-800 guests',
    image: 'https://images.unsplash.com/photo-1542665952-14513db15293?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    features: ['AC Banquet Hall', 'Valet Parking', 'Bridal Room', 'DJ'],
    type: 'Banquet Hall'
  },
  {
    id: '2',
    name: 'The Luxury Garden Resort',
    location: 'Lonavala, Mumbai',
    price: '₹3,50,000',
    rating: 4.9,
    reviews: 89,
    capacity: '200-400 guests',
    image: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    features: ['Outdoor Lawn', 'Swimming Pool', 'Accommodation', 'Catering'],
    type: 'Resort'
  },
  {
    id: '3',
    name: 'Royal Heritage Hotel',
    location: 'Juhu, Mumbai',
    price: '₹4,00,000',
    rating: 4.7,
    reviews: 156,
    capacity: '300-600 guests',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    features: ['Sea View', 'Multiple Halls', 'Spa', 'Room Service'],
    type: 'Hotel'
  },
  {
    id: '4',
    name: 'Elegant Banquet House',
    location: 'Andheri, Mumbai',
    price: '₹1,80,000',
    rating: 4.6,
    reviews: 98,
    capacity: '150-300 guests',
    image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    features: ['Centralized AC', 'Stage Setup', 'Sound System', 'Decoration'],
    type: 'Banquet Hall'
  }
];

export default function VenuesPage() {
  const searchParams = useSearchParams();
  const [selectedFilters, setSelectedFilters] = useState({
    location: '',
    venueType: searchParams.get('type') || '',
    capacity: '',
    priceRange: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Update filters when URL parameters change
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam) {
      setSelectedFilters(prev => ({ ...prev, venueType: typeParam }));
      setShowFilters(true); // Show filters panel when filtering is applied
    }
  }, [searchParams]);

  const toggleFavorite = (venueId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(venueId)) {
      newFavorites.delete(venueId);
    } else {
      newFavorites.add(venueId);
    }
    setFavorites(newFavorites);
  };

  // Filter venues based on selected filters
  const filteredVenues = sampleVenues.filter((venue) => {
    if (selectedFilters.venueType && venue.type !== selectedFilters.venueType) {
      return false;
    }
    // Add more filter logic here as needed
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Wedding Venues in Mumbai</h1>
            <p className="text-xl text-pink-100 mb-8">
              Discover {sampleVenues.length}+ beautiful venues for your special day
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

        {/* Venues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredVenues.map((venue) => (
            <div key={venue.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="relative">
                <img 
                  src={venue.image} 
                  alt={venue.name}
                  className="w-full h-64 object-cover"
                />
                <button
                  onClick={() => toggleFavorite(venue.id)}
                  className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 ${
                    favorites.has(venue.id) 
                      ? 'bg-pink-600 text-white' 
                      : 'bg-white/80 text-gray-600 hover:bg-white'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${favorites.has(venue.id) ? 'fill-current' : ''}`} />
                </button>
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 text-pink-600 px-3 py-1 rounded-full text-sm font-semibold">
                    {venue.type}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{venue.name}</h3>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-semibold text-gray-900">{venue.rating}</span>
                    <span className="text-sm text-gray-500">({venue.reviews})</span>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-600 mb-3">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{venue.location}</span>
                </div>
                
                <div className="flex items-center text-gray-600 mb-4">
                  <Users className="h-4 w-4 mr-1" />
                  <span className="text-sm">{venue.capacity}</span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {venue.features.slice(0, 3).map((feature, index) => (
                    <span 
                      key={index}
                      className="bg-pink-50 text-pink-700 px-2 py-1 rounded-full text-xs font-medium"
                    >
                      {feature}
                    </span>
                  ))}
                  {venue.features.length > 3 && (
                    <span className="text-pink-600 text-xs font-medium">
                      +{venue.features.length - 3} more
                    </span>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">{venue.price}</span>
                    <span className="text-sm text-gray-500 ml-1">per event</span>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-xl"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button 
            variant="outline" 
            size="lg"
            className="border-pink-200 text-pink-600 hover:bg-pink-50 px-8 py-3 rounded-xl"
          >
            Load More Venues
          </Button>
        </div>
      </div>
    </div>
  );
}