'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Star, MapPin, Users, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api';
import useFavorites from '@/hooks/useFavorites';

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
  };
}

export default function FavoritesPage() {
  const router = useRouter();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Use the favorites hook
  const { toggleFavorite, loading: favoritesLoading } = useFavorites();

  // Fetch favorite venues from API
  const fetchFavoriteVenues = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/venues/favorites');
      setVenues(response.data.venues || []);
      setError('');
    } catch (err) {
      console.error('Error fetching favorite venues:', err);
      setError('Failed to fetch favorite venues');
    } finally {
      setLoading(false);
    }
  };

  // Fetch venues on component mount
  useEffect(() => {
    fetchFavoriteVenues();
  }, []);

  // Loading state
  if (loading || favoritesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">My Favorite Venues</h1>
              <p className="text-xl text-pink-100">Loading your favorite venues...</p>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
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
            <h1 className="text-4xl font-bold mb-4">My Favorite Venues</h1>
            <p className="text-xl text-pink-100">
              {venues.length} venue{venues.length !== 1 ? 's' : ''} saved for later
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* No Favorites Message */}
        {!error && venues.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorite venues yet</h3>
            <p className="text-gray-600 mb-6">
              Start exploring venues and save your favorites by clicking the heart icon.
            </p>
            <Button 
              onClick={() => router.push('/venues')}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-xl"
            >
              Browse Venues
            </Button>
          </div>
        )}

        {/* Venues Grid */}
        {!error && venues.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {venues.map((venue) => (
              <div key={venue._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                <div className="relative">
                  <Image 
                    src={venue.images.length > 0 ? venue.images.find(img => img.isPrimary)?.url || venue.images[0]?.url : 'https://images.unsplash.com/photo-1542665952-14513db15293?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'} 
                    alt={venue.name}
                    width={800}
                    height={256}
                    className="w-full h-64 object-cover"
                  />
                  <button
                    onClick={() => toggleFavorite(venue._id)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-pink-600 text-white transition-all duration-300"
                  >
                    <Heart className="h-5 w-5 fill-current" />
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
                    <p className="text-sm text-gray-600 line-clamp-2">{venue.description}</p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-2xl font-bold text-gray-900">₹{venue.basePrice.toLocaleString()}</span>
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
      </div>
    </div>
  );
}