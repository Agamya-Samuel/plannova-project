'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Star, Heart, SlidersHorizontal, Camera, Music, Utensils, Flower, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import apiClient from '@/lib/api';

interface Vendor {
  id: string;
  name: string;
  category: string;
  location: string;
  rating: number;
  reviews: number;
  startingPrice: string;
  image: string;
  services: string[];
  isVerified: boolean;
}

// Define the CateringService interface to match the backend model
interface CateringService {
  _id: string;
  name: string;
  description: string;
  serviceLocation: {
    city: string;
    state: string;
  };
  basePrice: number;
  cuisineTypes: string[];
  rating: number;
  reviewCount: number;
  images: Array<{
    url: string;
    isPrimary: boolean;
  }>;
  provider: {
    firstName: string;
    lastName: string;
  };
}

// Define the PhotographyService interface to match the backend model
interface PhotographyService {
  _id: string;
  name: string;
  description: string;
  serviceLocation: {
    city: string;
    state: string;
  };
  basePrice: number;
  photographyTypes: string[];
  rating: number;
  reviewCount: number;
  images: Array<{
    url: string;
    isPrimary: boolean;
  }>;
  provider: {
    firstName: string;
    lastName: string;
  };
  status?: string; // Add status field
}

const categories = [
  { name: 'Photography', icon: <Camera className="h-5 w-5" />, count: 245 },
  { name: 'Catering', icon: <Utensils className="h-5 w-5" />, count: 189 },
  { name: 'Decoration', icon: <Flower className="h-5 w-5" />, count: 156 },
  { name: 'Music & Entertainment', icon: <Music className="h-5 w-5" />, count: 98 },
  { name: 'Videography', icon: <Camera className="h-5 w-5" />, count: 134 },
  { name: 'Makeup & Beauty', icon: <Heart className="h-5 w-5" />, count: 167 }
];

export default function VendorsPage() {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cateringServices, setCateringServices] = useState<CateringService[]>([]);
  const [photographyServices, setPhotographyServices] = useState<PhotographyService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch approved catering services
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch catering services
        const cateringResponse = await apiClient.get('/catering');
        setCateringServices(cateringResponse.data.data);
        
        // Fetch photography services
        const photographyResponse = await apiClient.get('/photography');
        setPhotographyServices(photographyResponse.data.data);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Failed to load services');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleFavorite = (vendorId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(vendorId)) {
      newFavorites.delete(vendorId);
    } else {
      newFavorites.add(vendorId);
    }
    setFavorites(newFavorites);
  };

  // Transform catering services to vendor format for display
  const cateringVendors: Vendor[] = cateringServices.map(service => ({
    id: service._id,
    name: service.name,
    category: 'Catering',
    location: `${service.serviceLocation.city}, ${service.serviceLocation.state}`,
    rating: service.rating,
    reviews: service.reviewCount,
    startingPrice: `₹${service.basePrice.toLocaleString()}/plate`,
    image: service.images.find(img => img.isPrimary)?.url || service.images[0]?.url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    services: service.cuisineTypes.slice(0, 3),
    isVerified: true
  }));

  // Transform photography services to vendor format for display
  const photographyVendors: Vendor[] = photographyServices.map(service => ({
    id: service._id,
    name: service.name || 'Untitled Service',
    category: 'Photography',
    location: `${service.serviceLocation?.city || ''}, ${service.serviceLocation?.state || ''}`,
    rating: service.rating || 0,
    reviews: service.reviewCount || 0,
    startingPrice: `₹${service.basePrice ? service.basePrice.toLocaleString() : '0'}`,
    image: service.images && service.images.length > 0 
      ? (service.images.find(img => img.isPrimary)?.url || service.images[0]?.url) 
      : 'https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    services: service.photographyTypes ? service.photographyTypes.slice(0, 3) : [],
    isVerified: true
  }));

  // Combine all vendors
  const allVendors: Vendor[] = useMemo(() => [...cateringVendors, ...photographyVendors], [cateringVendors, photographyVendors]);

  const filteredVendors = selectedCategory === 'All' 
    ? allVendors 
    : allVendors.filter(vendor => vendor.category === selectedCategory);

  // Debug log to check if photography services are being fetched
  useEffect(() => {
    console.log('Catering services count:', cateringServices.length);
    console.log('Photography services count:', photographyServices.length);
    console.log('Photography services:', photographyServices);
    console.log('Photography vendors:', photographyVendors);
    console.log('All vendors count:', allVendors.length);
  }, [cateringServices, photographyServices, photographyVendors, allVendors]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Wedding Vendors</h1>
            <p className="text-xl text-pink-100 mb-8">
              Connect with the best wedding professionals in your city
            </p>
            
            {/* Search Bar */}
            <div className="max-w-4xl mx-auto bg-white rounded-2xl p-4 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Search vendors..."
                    className="pl-10 h-12 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <select className="w-full pl-10 pr-4 h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-700 bg-white">
                    <option>Select city</option>
                    <option>Mumbai</option>
                    <option>Delhi</option>
                    <option>Bangalore</option>
                    <option>Chennai</option>
                    <option>Pune</option>
                  </select>
                </div>
                
                <div className="relative">
                  <select className="w-full px-4 h-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-700 bg-white">
                    <option>Category</option>
                    <option>Photography</option>
                    <option>Catering</option>
                    <option>Decoration</option>
                    <option>Music & Entertainment</option>
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

      {/* Categories */}
      <div className="bg-white py-8 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                selectedCategory === 'All'
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-pink-50 hover:text-pink-600'
              }`}
            >
              <span>All Categories</span>
            </button>
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => setSelectedCategory(category.name)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                  selectedCategory === category.name
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-pink-50 hover:text-pink-600'
                }`}
              >
                {category.icon}
                <span>{category.name}</span>
                <span className="text-xs opacity-75">({category.count})</span>
              </button>
            ))}
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
              Showing {filteredVendors.length} vendors
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
                <div className="space-y-2">
                  {['Under ₹50K', '₹50K - ₹1L', '₹1L - ₹2L', 'Above ₹2L'].map((price) => (
                    <label key={price} className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                      <span className="ml-2 text-sm text-gray-700">{price}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Rating</h3>
                <div className="space-y-2">
                  {['4.5 & above', '4.0 & above', '3.5 & above', '3.0 & above'].map((rating) => (
                    <label key={rating} className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                      <span className="ml-2 text-sm text-gray-700">{rating}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Verification</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                    <span className="ml-2 text-sm text-gray-700">Verified Vendors Only</span>
                  </label>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Availability</h3>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                    <span className="ml-2 text-sm text-gray-700">Available This Month</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                    <span className="ml-2 text-sm text-gray-700">Quick Response</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Vendors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredVendors.map((vendor) => (
            <div key={vendor.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="relative">
                <Image 
                  src={vendor.image} 
                  alt={vendor.name}
                  width={400}
                  height={256}
                  className="w-full h-64 object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <button
                  onClick={() => toggleFavorite(vendor.id)}
                  className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 ${
                    favorites.has(vendor.id) 
                      ? 'bg-pink-600 text-white' 
                      : 'bg-white/80 text-gray-600 hover:bg-white'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${favorites.has(vendor.id) ? 'fill-current' : ''}`} />
                </button>
                <div className="absolute top-4 left-4 flex space-x-2">
                  <span className="bg-white/90 text-pink-600 px-3 py-1 rounded-full text-sm font-semibold">
                    {vendor.category}
                  </span>
                  {vendor.isVerified && (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      ✓ Verified
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{vendor.name}</h3>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-semibold text-gray-900">{vendor.rating}</span>
                    <span className="text-sm text-gray-500">({vendor.reviews})</span>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{vendor.location}</span>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {vendor.services.slice(0, 2).map((service, index) => (
                    <span 
                      key={index}
                      className="bg-pink-50 text-pink-700 px-2 py-1 rounded-full text-xs font-medium"
                    >
                      {service}
                    </span>
                  ))}
                  {vendor.services.length > 2 && (
                    <span className="text-pink-600 text-xs font-medium">
                      +{vendor.services.length - 2} more
                    </span>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-lg font-bold text-gray-900">{vendor.startingPrice}</span>
                    <span className="text-sm text-gray-500 ml-1">onwards</span>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-xl"
                    onClick={() => router.push(`/photography/${vendor.id}`)}
                  >
                    View Profile
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
            Load More Vendors
          </Button>
        </div>
      </div>
    </div>
  );
}