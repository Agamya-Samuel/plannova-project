'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Video, 
  Star, 
  MapPin, 
  IndianRupee, 
  Search,
  X,
  Loader2
} from 'lucide-react';
import apiClient from '@/lib/api';

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
  minGuests?: number;
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
  data: VideographyService[];
}

export default function VideographyPage() {
  const [services, setServices] = useState<VideographyService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [filteredServices, setFilteredServices] = useState<VideographyService[]>([]);

  const fetchVideographyServices = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<VideographyResponse>('/videography');
      setServices(response.data.data);
      setError('');
    } catch (err) {
      console.error('Error fetching videography services:', err);
      setError('Failed to load videography services');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...services];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchLower) ||
        service.description.toLowerCase().includes(searchLower) ||
        service.serviceLocation.city.toLowerCase().includes(searchLower) ||
        service.videographyTypes.some(type => type.toLowerCase().includes(searchLower))
      );
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter(service =>
        service.serviceLocation.city.toLowerCase().includes(locationFilter.toLowerCase()) ||
        service.serviceLocation.state.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter) {
      filtered = filtered.filter(service =>
        service.videographyTypes.some(type => 
          type.toLowerCase().includes(typeFilter.toLowerCase())
        )
      );
    }

    // Price range filter
    if (priceRange.min) {
      const minPrice = parseFloat(priceRange.min);
      filtered = filtered.filter(service => service.basePrice >= minPrice);
    }
    if (priceRange.max) {
      const maxPrice = parseFloat(priceRange.max);
      filtered = filtered.filter(service => service.basePrice <= maxPrice);
    }

    setFilteredServices(filtered);
  }, [services, searchTerm, locationFilter, typeFilter, priceRange]);

  useEffect(() => {
    fetchVideographyServices();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setTypeFilter('');
    setPriceRange({ min: '', max: '' });
  };

  const getPrimaryImage = (service: VideographyService) => {
    const primaryImage = service.images.find(img => img.isPrimary);
    return primaryImage || service.images[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading videography services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mb-6">
            <Video className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Professional Videography Services
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Capture your special moments with our talented videographers. 
            From weddings to corporate events, we bring your stories to life.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search videographers, locations, or types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <input
                type="text"
                placeholder="City or State"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Type */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="wedding">Wedding</option>
                <option value="pre-wedding">Pre-wedding</option>
                <option value="post-wedding">Post-wedding</option>
                <option value="corporate">Corporate</option>
                <option value="event">Event</option>
                <option value="documentary">Documentary</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-center space-x-2">
              <button
                onClick={clearFilters}
                className="flex items-center px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </button>
            </div>
          </div>

          {/* Price Range */}
          <div className="mt-4 flex items-center space-x-4">
            <span className="text-sm text-gray-600">Price Range:</span>
            <input
              type="number"
              placeholder="Min Price"
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-32"
            />
            <span className="text-gray-400">to</span>
            <input
              type="number"
              placeholder="Max Price"
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-32"
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredServices.length} of {services.length} videography services
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No videography services found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || locationFilter || typeFilter || priceRange.min || priceRange.max
                ? 'Try adjusting your search criteria'
                : 'No videography services are currently available'}
            </p>
            {(searchTerm || locationFilter || typeFilter || priceRange.min || priceRange.max) && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service) => {
              const primaryImage = getPrimaryImage(service);
              return (
                <div key={service._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  {/* Image */}
                  <div className="relative h-64">
                    {primaryImage ? (
                      <Image
                        src={primaryImage.url}
                        alt={primaryImage.alt}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Video className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                        <span className="text-sm font-medium">{service.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>

                    {/* Location */}
                    <div className="flex items-center text-gray-500 text-sm mb-3">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{service.serviceLocation.city}, {service.serviceLocation.state}</span>
                    </div>

                    {/* Types */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {service.videographyTypes.slice(0, 3).map((type, index) => (
                        <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          {type}
                        </span>
                      ))}
                      {service.videographyTypes.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                          +{service.videographyTypes.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Price and Reviews */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center">
                        <IndianRupee className="h-4 w-4 text-gray-600 mr-1" />
                        <span className="text-lg font-bold text-gray-900">
                          {service.basePrice.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">starting</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {service.reviewCount} reviews
                      </div>
                    </div>

                    {/* Action Button */}
                    <Link href={`/videography/${service._id}`}>
                      <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:-translate-y-0.5">
                        View Details
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
