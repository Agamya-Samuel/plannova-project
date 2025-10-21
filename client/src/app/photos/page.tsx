'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Search, Heart, Eye, Download, Filter, Grid3X3, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Photo {
  id: string;
  title: string;
  category: string;
  photographer: string;
  venue: string;
  location: string;
  image: string;
  views: number;
  likes: number;
  isLiked: boolean;
}

const samplePhotos: Photo[] = [
  {
    id: '1',
    title: 'Royal Palace Wedding',
    category: 'Ceremony',
    photographer: 'Pixel Perfect Photography',
    venue: 'Grand Ballroom Palace',
    location: 'Mumbai',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    views: 1250,
    likes: 89,
    isLiked: false
  },
  {
    id: '2',
    title: 'Garden Paradise Reception',
    category: 'Reception',
    photographer: 'Cinema Wedding Films',
    venue: 'The Luxury Garden Resort',
    location: 'Lonavala',
    image: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    views: 2100,
    likes: 156,
    isLiked: true
  },
  {
    id: '3',
    title: 'Elegant Mandap Setup',
    category: 'Decoration',
    photographer: 'Royal Captures',
    venue: 'Heritage Grand Hotel',
    location: 'Jaipur',
    image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    views: 890,
    likes: 67,
    isLiked: false
  },
  {
    id: '4',
    title: 'Beachside Romance',
    category: 'Pre-Wedding',
    photographer: 'Coastal Weddings',
    venue: 'Sunset Beach Resort',
    location: 'Goa',
    image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    views: 3200,
    likes: 234,
    isLiked: true
  },
  {
    id: '5',
    title: 'Traditional Henna Ceremony',
    category: 'Mehndi',
    photographer: 'Tradition Lens',
    venue: 'Family Garden',
    location: 'Delhi',
    image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    views: 1500,
    likes: 98,
    isLiked: false
  },
  {
    id: '6',
    title: 'Sangam Night Celebrations',
    category: 'Sangeet',
    photographer: 'Dance Memories',
    venue: 'Crystal Ballroom',
    location: 'Bangalore',
    image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    views: 1800,
    likes: 142,
    isLiked: false
  },
  {
    id: '7',
    title: 'Ring Exchange Moment',
    category: 'Engagement',
    photographer: 'Moment Makers',
    venue: 'Sky Lounge',
    location: 'Mumbai',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    views: 2500,
    likes: 189,
    isLiked: true
  },
  {
    id: '8',
    title: 'Royal Bridal Portrait',
    category: 'Portraits',
    photographer: 'Elite Photography',
    venue: 'Palace Gardens',
    location: 'Udaipur',
    image: 'https://images.unsplash.com/photo-1595476884320-b30ebb0e7cc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    views: 4200,
    likes: 312,
    isLiked: false
  },
  {
    id: '9',
    title: 'Destination Wedding Bliss',
    category: 'Destination',
    photographer: 'Travel Weddings',
    venue: 'Mountain Resort',
    location: 'Shimla',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    views: 1900,
    likes: 145,
    isLiked: true
  }
];

const categories = [
  'All', 'Ceremony', 'Reception', 'Pre-Wedding', 'Engagement', 'Mehndi', 'Sangeet', 'Decoration', 'Portraits', 'Destination'
];

export default function PhotosPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [photos, setPhotos] = useState(samplePhotos);

  const toggleLike = (photoId: string) => {
    setPhotos(photos.map(photo => 
      photo.id === photoId 
        ? { ...photo, isLiked: !photo.isLiked, likes: photo.isLiked ? photo.likes - 1 : photo.likes + 1 }
        : photo
    ));
  };

  const filteredPhotos = selectedCategory === 'All' 
    ? photos 
    : photos.filter(photo => photo.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Wedding Photos</h1>
            <p className="text-xl text-pink-100 mb-8">
              Get inspired by beautiful wedding photography from real celebrations
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto bg-white rounded-2xl p-4 shadow-xl">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Search by venue, photographer, or location..."
                    className="pl-10 h-12 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500"
                  />
                </div>
                <Button className="h-12 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-xl font-semibold px-8">
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white py-6 border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-pink-50 hover:text-pink-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-pink-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <Grid3X3 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('masonry')}
                  className={`p-2 rounded-lg ${viewMode === 'masonry' ? 'bg-pink-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <LayoutList className="h-5 w-5" />
                </button>
              </div>
              
              <Button 
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 border-gray-300"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </Button>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            Showing {filteredPhotos.length} photos
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Photographer</h3>
                <div className="space-y-2">
                  {['All Photographers', 'Pixel Perfect Photography', 'Cinema Wedding Films', 'Royal Captures'].map((photographer) => (
                    <label key={photographer} className="flex items-center">
                      <input type="radio" name="photographer" className="text-pink-600 focus:ring-pink-500" />
                      <span className="ml-2 text-sm text-gray-700">{photographer}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Location</h3>
                <div className="space-y-2">
                  {['All Locations', 'Mumbai', 'Delhi', 'Bangalore', 'Goa'].map((location) => (
                    <label key={location} className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                      <span className="ml-2 text-sm text-gray-700">{location}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Popularity</h3>
                <div className="space-y-2">
                  {['Most Liked', 'Most Viewed', 'Recent', 'Trending'].map((sort) => (
                    <label key={sort} className="flex items-center">
                      <input type="radio" name="sort" className="text-pink-600 focus:ring-pink-500" />
                      <span className="ml-2 text-sm text-gray-700">{sort}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Venue Type</h3>
                <div className="space-y-2">
                  {['All Venues', 'Hotels', 'Banquet Halls', 'Resorts', 'Outdoor'].map((venue) => (
                    <label key={venue} className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-pink-600 focus:ring-pink-500" />
                      <span className="ml-2 text-sm text-gray-700">{venue}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Photos Grid */}
        <div className={`${
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' 
            : 'columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8'
        }`}>
          {filteredPhotos.map((photo) => (
            <div 
              key={photo.id} 
              className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group ${
                viewMode === 'masonry' ? 'break-inside-avoid mb-8' : ''
              }`}
            >
              <div className="relative">
                <Image 
                  src={photo.image} 
                  alt={photo.title}
                  width={800}
                  height={viewMode === 'grid' ? 256 : 600}
                  className={`w-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                    viewMode === 'grid' ? 'h-64' : 'h-auto'
                  }`}
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSorjUdEAiuRDQfKt36WV1ZuVYyv9EG1X9jU0qLUcqcM3FTKuuOTKL8sR6k1v6WS09nclLF2Jl2VvvjIJHhV6k2qv0pY8kP18D3jqF0wCnZWp/qFgFa4kNDR9zf/2Q=="
                  priority={photo.id === '1'}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleLike(photo.id)}
                          className={`p-2 rounded-full transition-all duration-300 ${
                            photo.isLiked 
                              ? 'bg-pink-600 text-white' 
                              : 'bg-white/80 text-gray-600 hover:bg-white'
                          }`}
                        >
                          <Heart className={`h-5 w-5 ${photo.isLiked ? 'fill-current' : ''}`} />
                        </button>
                        <button className="p-2 rounded-full bg-white/80 text-gray-600 hover:bg-white transition-all duration-300">
                          <Eye className="h-5 w-5" />
                        </button>
                        <button className="p-2 rounded-full bg-white/80 text-gray-600 hover:bg-white transition-all duration-300">
                          <Download className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 text-pink-600 px-3 py-1 rounded-full text-sm font-semibold">
                    {photo.category}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{photo.title}</h3>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Photographer:</span> {photo.photographer}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Venue:</span> {photo.venue}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Location:</span> {photo.location}
                  </p>
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Heart className={`h-4 w-4 ${photo.isLiked ? 'text-pink-600 fill-current' : ''}`} />
                      <span>{photo.likes}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="h-4 w-4" />
                      <span>{photo.views}</span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-pink-200 text-pink-600 hover:bg-pink-50"
                  >
                    View Full
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
            Load More Photos
          </Button>
        </div>
      </div>
    </div>
  );
}