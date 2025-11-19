'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin, Star, Heart, SlidersHorizontal, Camera, Music, Utensils, Flower, Video, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import apiClient from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

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

// Define the VideographyService interface to match the backend model
interface VideographyService {
  _id: string;
  name: string;
  description: string;
  serviceLocation: {
    city: string;
    state: string;
  };
  basePrice: number;
  videographyTypes: string[];
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

// Define the BridalMakeupService interface to match the backend model
interface BridalMakeupService {
  _id: string;
  name: string;
  description: string;
  serviceLocation: {
    city: string;
    state: string;
  };
  basePrice: number;
  makeupTypes: string[];
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
  status?: string;
}

// Define the DecorationService interface to match the backend model
interface DecorationService {
  _id: string;
  name: string;
  description: string;
  serviceLocation: {
    city: string;
    state: string;
  };
  basePrice: number;
  decorationTypes: string[];
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
  status?: string;
}

// Define the EntertainmentService interface to match the backend model
interface EntertainmentService {
  _id: string;
  name: string;
  description: string;
  serviceLocation: {
    city: string;
    state: string;
  };
  basePrice: number;
  entertainmentTypes: string[];
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
  status?: string;
}

// Category chip config (icons). Counts are computed from live data below
const categoryIconMap: Record<string, React.ReactNode> = {
  'Photography': <Camera className="h-5 w-5" />,
  'Catering': <Utensils className="h-5 w-5" />,
  'Videography': <Video className="h-5 w-5" />,
  'Decoration': <Flower className="h-5 w-5" />,
  'Music & Entertainment': <Music className="h-5 w-5" />,
  'Makeup & Beauty': <Heart className="h-5 w-5" />,
};

function VendorsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isVendorBrowsePop, setIsVendorBrowsePop] = useState(false);
  const [showAllInAllCategory, setShowAllInAllCategory] = useState(false);
  const [cateringServices, setCateringServices] = useState<CateringService[]>([]);
  const [photographyServices, setPhotographyServices] = useState<PhotographyService[]>([]);
  const [videographyServices, setVideographyServices] = useState<VideographyService[]>([]);
  const [bridalMakeupServices, setBridalMakeupServices] = useState<BridalMakeupService[]>([]);
  const [decorationServices, setDecorationServices] = useState<DecorationService[]>([]);
  const [entertainmentServices, setEntertainmentServices] = useState<EntertainmentService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch approved services
  useEffect(() => {
    // Prevent duplicate requests and handle rate limiting
    let cancelled = false;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all services with individual error handling to continue loading others if one fails
        try {
          const cateringResponse = await apiClient.get('/catering');
          if (!cancelled) {
            setCateringServices(cateringResponse.data.data || []);
          }
        } catch (err: unknown) {
          // Check if error has response property (Axios error)
          if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'status' in err.response && err.response.status === 429) {
            console.warn('Rate limit exceeded for catering services');
          } else {
            console.error('Error fetching catering services:', err);
          }
          if (!cancelled) {
            setCateringServices([]);
          }
        }
        
        try {
          const photographyResponse = await apiClient.get('/photography');
          if (!cancelled) {
            setPhotographyServices(photographyResponse.data.data || []);
          }
        } catch (err: unknown) {
          // Check if error has response property (Axios error)
          if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'status' in err.response && err.response.status === 429) {
            console.warn('Rate limit exceeded for photography services');
          } else {
            console.error('Error fetching photography services:', err);
          }
          if (!cancelled) {
            setPhotographyServices([]);
          }
        }
        
        try {
          const videographyResponse = await apiClient.get('/videography');
          if (!cancelled) {
            setVideographyServices(videographyResponse.data.data || []);
          }
        } catch (err: unknown) {
          // Check if error has response property (Axios error)
          if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'status' in err.response && err.response.status === 429) {
            console.warn('Rate limit exceeded for videography services');
          } else {
            console.error('Error fetching videography services:', err);
          }
          if (!cancelled) {
            setVideographyServices([]);
          }
        }
        
        try {
          const bridalMakeupResponse = await apiClient.get('/bridal-makeup');
          if (!cancelled) {
            setBridalMakeupServices(bridalMakeupResponse.data.data || []);
          }
        } catch (err: unknown) {
          // Check if error has response property (Axios error)
          if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'status' in err.response && err.response.status === 429) {
            console.warn('Rate limit exceeded for bridal makeup services');
          } else {
            console.error('Error fetching bridal makeup services:', err);
          }
          if (!cancelled) {
            setBridalMakeupServices([]);
          }
        }
        
        try {
          const decorationResponse = await apiClient.get('/decoration');
          if (!cancelled) {
            setDecorationServices(decorationResponse.data.data || []);
          }
        } catch (err: unknown) {
          // Check if error has response property (Axios error)
          if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'status' in err.response && err.response.status === 429) {
            console.warn('Rate limit exceeded for decoration services');
          } else {
            console.error('Error fetching decoration services:', err);
          }
          if (!cancelled) {
            setDecorationServices([]);
          }
        }
        
        try {
          const entertainmentResponse = await apiClient.get('/entertainment');
          if (!cancelled) {
            setEntertainmentServices(entertainmentResponse.data.data || []);
          }
        } catch (err: unknown) {
          // Check if error has response property (Axios error)
          if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'status' in err.response && err.response.status === 429) {
            console.warn('Rate limit exceeded for entertainment services');
          } else {
            console.error('Error fetching entertainment services:', err);
          }
          if (!cancelled) {
            setEntertainmentServices([]);
          }
        }
        
        // Reset error - will be set if needed below
        if (!cancelled) {
          setError(''); // Clear error if we got here successfully
        }
      } catch (err: unknown) {
        if (!cancelled) {
          // Check if error has response property (Axios error)
          if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'status' in err.response && err.response.status === 429) {
            console.warn('Rate limit exceeded. Please wait a moment and refresh.');
            setError('Too many requests. Please wait a moment and try refreshing the page.');
          } else {
            console.error('Error fetching vendors:', err);
            setError('Failed to load some services. Please try again later.');
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      cancelled = true;
    };
  }, []);

  // Initialize selected category from URL (?category=Photography)
  // This enables deep linking from the home page vendor types section
  useEffect(() => {
    const initialCategory = searchParams?.get('category');
    if (initialCategory) {
      setSelectedCategory(initialCategory);
      setShowAllInAllCategory(false);
    }
    // We intentionally only set on mount/param changes
  }, [searchParams]);

  // Reset the show-all flag whenever category changes from outside
  useEffect(() => {
    if (selectedCategory !== 'All') {
      setShowAllInAllCategory(false);
    }
  }, [selectedCategory]);

  const toggleFavorite = (vendorId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(vendorId)) {
      newFavorites.delete(vendorId);
    } else {
      newFavorites.add(vendorId);
    }
    setFavorites(newFavorites);
  };

  // Handle vendor card click with authentication check
  // This function checks if user is logged in before navigating to vendor details
  const handleVendorClick = (vendor: Vendor) => {
    if (!isAuthenticated) {
      // Redirect to login page if user is not authenticated
      router.push('/auth/login');
      return;
    }
    
    // Navigate to vendor details based on category if authenticated
    if (vendor.category === 'Photography') {
      router.push(`/photography/${vendor.id}`);
    } else if (vendor.category === 'Catering') {
      router.push(`/catering/${vendor.id}`);
    } else if (vendor.category === 'Videography') {
      router.push(`/videography/${vendor.id}`);
    } else if (vendor.category === 'Decoration') {
      router.push(`/decoration/${vendor.id}`);
    } else if (vendor.category === 'Makeup & Beauty') {
      router.push(`/bridal-makeup/${vendor.id}`);
    } else if (vendor.category === 'Music & Entertainment') {
      router.push(`/entertainment/${vendor.id}`);
    } else {
      // Default fallback
      router.push(`/vendors`);
    }
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
    image: service.images.find(img => img.isPrimary)?.url || service.images[0]?.url || '',
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
      : '',
    services: service.photographyTypes ? service.photographyTypes.slice(0, 3) : [],
    isVerified: true
  }));

  // Transform videography services to vendor format for display
  const videographyVendors: Vendor[] = videographyServices.map(service => ({
    id: service._id,
    name: service.name || 'Untitled Service',
    category: 'Videography',
    location: `${service.serviceLocation?.city || ''}, ${service.serviceLocation?.state || ''}`,
    rating: service.rating || 0,
    reviews: service.reviewCount || 0,
    startingPrice: `₹${service.basePrice ? service.basePrice.toLocaleString() : '0'}`,
    image: service.images && service.images.length > 0 
      ? (service.images.find(img => img.isPrimary)?.url || service.images[0]?.url) 
      : '',
    services: service.videographyTypes ? service.videographyTypes.slice(0, 3) : [],
    isVerified: true
  }));

  // Transform bridal makeup services to vendor format for display
  const bridalMakeupVendors: Vendor[] = bridalMakeupServices.map(service => ({
    id: service._id,
    name: service.name || 'Untitled Service',
    category: 'Makeup & Beauty',
    location: `${service.serviceLocation?.city || ''}, ${service.serviceLocation?.state || ''}`,
    rating: service.rating || 0,
    reviews: service.reviewCount || 0,
    startingPrice: `₹${service.basePrice ? service.basePrice.toLocaleString() : '0'}`,
    image: service.images && service.images.length > 0 
      ? (service.images.find(img => img.isPrimary)?.url || service.images[0]?.url) 
      : '',
    services: service.makeupTypes ? service.makeupTypes.slice(0, 3) : [],
    isVerified: true
  }));

  // Transform decoration services to vendor format for display
  const decorationVendors: Vendor[] = decorationServices.map(service => ({
    id: service._id,
    name: service.name || 'Untitled Service',
    category: 'Decoration',
    location: `${service.serviceLocation?.city || ''}, ${service.serviceLocation?.state || ''}`,
    rating: service.rating || 0,
    reviews: service.reviewCount || 0,
    startingPrice: `₹${service.basePrice ? service.basePrice.toLocaleString() : '0'}`,
    image: service.images && service.images.length > 0 
      ? (service.images.find(img => img.isPrimary)?.url || service.images[0]?.url) 
      : '',
    services: service.decorationTypes ? service.decorationTypes.slice(0, 3) : [],
    isVerified: true
  }));

  // Transform entertainment services to vendor format for display
  const entertainmentVendors: Vendor[] = entertainmentServices
    .filter(service => service.status === 'APPROVED' || service.status === 'PENDING_EDIT')
    .map(service => ({
      id: service._id,
      name: service.name || 'Untitled Service',
      category: 'Music & Entertainment',
      location: `${service.serviceLocation?.city || ''}, ${service.serviceLocation?.state || ''}`,
      rating: service.rating || 0,
      reviews: service.reviewCount || 0,
      startingPrice: `₹${service.basePrice ? service.basePrice.toLocaleString() : '0'}`,
      image: service.images && service.images.length > 0 
        ? (service.images.find(img => img.isPrimary)?.url || service.images[0]?.url) 
        : '',
      services: service.entertainmentTypes ? service.entertainmentTypes.slice(0, 3) : [],
      isVerified: true
    }));

  // Combine all vendors
  const allVendors: Vendor[] = useMemo(() => [...cateringVendors, ...photographyVendors, ...videographyVendors, ...bridalMakeupVendors, ...decorationVendors, ...entertainmentVendors], [cateringVendors, photographyVendors, videographyVendors, bridalMakeupVendors, decorationVendors, entertainmentVendors]);

  const filteredVendors = selectedCategory === 'All' 
    ? allVendors 
    : allVendors.filter(vendor => vendor.category === selectedCategory);

  // Limit to first 9 for All category unless expanded
  const visibleVendors = selectedCategory === 'All' && !showAllInAllCategory
    ? filteredVendors.slice(0, 9)
    : filteredVendors;

  // Compute category counts from fetched data to avoid hardcoding numbers
  const computedCategories = useMemo(() => {
    const counts: Record<string, number> = {
      'Photography': photographyVendors.length,
      'Catering': cateringVendors.length,
      'Videography': videographyVendors.length,
      'Decoration': decorationVendors.length,
      'Music & Entertainment': entertainmentVendors.length,
      'Makeup & Beauty': bridalMakeupVendors.length,
    };
    return Object.keys(counts).map((name) => ({
      name,
      icon: categoryIconMap[name],
      count: counts[name] || 0,
    }));
  }, [
    photographyVendors.length,
    cateringVendors.length,
    videographyVendors.length,
    decorationVendors.length,
    entertainmentVendors.length,
    bridalMakeupVendors.length,
  ]);

  // Debug log to check if services are being fetched
  useEffect(() => {
    console.log('Catering services count:', cateringServices.length);
    console.log('Photography services count:', photographyServices.length);
    console.log('Videography services count:', videographyServices.length);
    console.log('Bridal makeup services count:', bridalMakeupServices.length);
    console.log('Decoration services count:', decorationServices.length);
    console.log('Entertainment services count:', entertainmentServices.length);
    console.log('All vendors count:', allVendors.length);
  }, [cateringServices, photographyServices, videographyServices, bridalMakeupServices, decorationServices, entertainmentServices, allVendors]);

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
            <h1 className="text-4xl font-bold mb-4">Event Vendors</h1>
            <p className="text-xl text-pink-100 mb-8">
              Connect with the best event professionals in your city
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
                    <option>Videography</option>
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
            {computedCategories.map((category, index) => (
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
              Showing {selectedCategory === 'All' && !showAllInAllCategory ? Math.min(9, filteredVendors.length) : filteredVendors.length} vendors
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent">
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Service temporarily unavailable
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  {error}
                </p>
                {error.includes('Too many requests') && (
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
                  >
                    Refresh page
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Vendors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleVendors.map((vendor) => (
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
                    onClick={() => handleVendorClick(vendor)}
                  >
                    View Profile
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More / Browse More */}
        <div className="text-center mt-12">
          {selectedCategory === 'All' ? (
            filteredVendors.length > 9 && !showAllInAllCategory ? (
              <Button 
                variant="outline" 
                size="lg"
                className={`border-pink-300 text-pink-700 hover:bg-pink-50 bg-white px-8 py-3 rounded-xl shadow-sm transition-transform duration-150 ${isVendorBrowsePop ? 'scale-105' : ''}`}
                onClick={() => {
                  setIsVendorBrowsePop(true);
                  setTimeout(() => setIsVendorBrowsePop(false), 180);
                  setShowAllInAllCategory(true);
                }}
              >
                Browse More Services
              </Button>
            ) : null
          ) : (
            <Button 
              variant="outline" 
              size="lg"
              className={`border-pink-300 text-pink-700 hover:bg-pink-50 bg-white px-8 py-3 rounded-xl shadow-sm transition-transform duration-150 ${isVendorBrowsePop ? 'scale-105' : ''}`}
              onClick={() => {
                setIsVendorBrowsePop(true);
                setTimeout(() => setIsVendorBrowsePop(false), 180);
                setSelectedCategory('All');
                setShowAllInAllCategory(false);
                if (searchParams?.get('category')) {
                  router.push('/vendors');
                }
              }}
            >
              Browse More Services
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VendorsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-pink-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading vendors...</span>
          </div>
        </div>
      }
    >
      <VendorsPageInner />
    </Suspense>
  );
}