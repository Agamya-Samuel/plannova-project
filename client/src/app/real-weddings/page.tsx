'use client';

import React, { useState } from 'react';
import { Search, Heart, MapPin, Calendar, Users, Camera, Clock, Star } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

interface RealWedding {
  id: string;
  title: string;
  coupleNames: string;
  date: string;
  location: string;
  venue: string;
  coverImage: string;
  gallery: string[];
  photographer: string;
  description: string;
  guestCount: number;
  budget: string;
  categories: string[];
  readTime: string;
  views: number;
  likes: number;
  isLiked: boolean;
}

const sampleWeddings: RealWedding[] = [
  {
    id: '1',
    title: 'A Royal Rajasthani Wedding in Udaipur',
    coupleNames: 'Arjun & Priya',
    date: 'December 15, 2023',
    location: 'Udaipur, Rajasthan',
    venue: 'City Palace, Udaipur',
    coverImage: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1606800052052-a08af7148866?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ],
    photographer: 'Heritage Photography',
    description: 'A magnificent three-day celebration that brought together two families in the royal city of Udaipur. From traditional ceremonies to grand receptions, every moment was captured beautifully.',
    guestCount: 450,
    budget: '₹25-30 Lakhs',
    categories: ['Traditional', 'Destination', 'Royal'],
    readTime: '8 min read',
    views: 5600,
    likes: 234,
    isLiked: false
  },
  {
    id: '2',
    title: 'Beach Wedding Paradise in Goa',
    coupleNames: 'Rahul & Kavya',
    date: 'January 20, 2024',
    location: 'North Goa, Goa',
    venue: 'Sunset Beach Resort',
    coverImage: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ],
    photographer: 'Coastal Captures',
    description: 'An intimate beachside wedding with stunning sunset views, barefoot ceremonies, and tropical vibes that perfectly captured the couples free-spirited love story.',
    guestCount: 120,
    budget: '₹12-15 Lakhs',
    categories: ['Beach', 'Intimate', 'Destination'],
    readTime: '6 min read',
    views: 3200,
    likes: 189,
    isLiked: true
  },
  {
    id: '3',
    title: 'Modern Metropolitan Wedding in Mumbai',
    coupleNames: 'Vikram & Sneha',
    date: 'November 5, 2023',
    location: 'Mumbai, Maharashtra',
    venue: 'Grand Ballroom Palace',
    coverImage: 'https://images.unsplash.com/photo-1519167758481-83f29c852c26?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1519167758481-83f29c852c26?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1595476884320-b30ebb0e7cc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ],
    photographer: 'Urban Wedding Studio',
    description: 'A sophisticated city wedding blending contemporary elegance with traditional touches, featuring stunning floral arrangements and modern décor elements.',
    guestCount: 300,
    budget: '₹20-25 Lakhs',
    categories: ['Modern', 'Urban', 'Elegant'],
    readTime: '7 min read',
    views: 4100,
    likes: 167,
    isLiked: false
  },
  {
    id: '4',
    title: 'Garden Romance in Bangalore',
    coupleNames: 'Amit & Riya',
    date: 'February 14, 2024',
    location: 'Bangalore, Karnataka',
    venue: 'Botanical Garden Resort',
    coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1606800052052-a08af7148866?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ],
    photographer: 'Nature Lens Photography',
    description: 'A romantic garden wedding surrounded by lush greenery and blooming flowers, celebrating love in natures embrace with eco-friendly décor.',
    guestCount: 200,
    budget: '₹15-20 Lakhs',
    categories: ['Garden', 'Eco-Friendly', 'Romantic'],
    readTime: '5 min read',
    views: 2800,
    likes: 142,
    isLiked: true
  },
  {
    id: '5',
    title: 'Heritage Palace Wedding in Jaipur',
    coupleNames: 'Karan & Meera',
    date: 'March 10, 2024',
    location: 'Jaipur, Rajasthan',
    venue: 'Hawa Mahal Palace',
    coverImage: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1595476884320-b30ebb0e7cc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ],
    photographer: 'Royal Heritage Photography',
    description: 'A grand celebration in the Pink City featuring traditional Rajasthani customs, royal décor, and majestic architecture that created unforgettable memories.',
    guestCount: 500,
    budget: '₹35-40 Lakhs',
    categories: ['Heritage', 'Grand', 'Traditional'],
    readTime: '9 min read',
    views: 6200,
    likes: 298,
    isLiked: false
  },
  {
    id: '6',
    title: 'Intimate Hill Station Wedding',
    coupleNames: 'Dev & Ananya',
    date: 'April 25, 2024',
    location: 'Shimla, Himachal Pradesh',
    venue: 'Mountain View Resort',
    coverImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ],
    photographer: 'Mountain Memories',
    description: 'A cozy mountain wedding with panoramic views, rustic décor, and warm hospitality that brought together close family and friends in a magical setting.',
    guestCount: 80,
    budget: '₹8-12 Lakhs',
    categories: ['Mountain', 'Intimate', 'Rustic'],
    readTime: '4 min read',
    views: 1900,
    likes: 87,
    isLiked: true
  }
];

const categories = ['All', 'Traditional', 'Modern', 'Beach', 'Garden', 'Heritage', 'Intimate', 'Destination'];
const budgetRanges = ['All Budgets', 'Under ₹10L', '₹10-20L', '₹20-30L', '₹30L+'];

export default function RealWeddingsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBudget, setSelectedBudget] = useState('All Budgets');
  const [weddings, setWeddings] = useState(sampleWeddings);

  const toggleLike = (weddingId: string) => {
    setWeddings(weddings.map(wedding => 
      wedding.id === weddingId 
        ? { ...wedding, isLiked: !wedding.isLiked, likes: wedding.isLiked ? wedding.likes - 1 : wedding.likes + 1 }
        : wedding
    ));
  };

  const filteredWeddings = weddings.filter(wedding => {
    const categoryMatch = selectedCategory === 'All' || wedding.categories.includes(selectedCategory);
    const budgetMatch = selectedBudget === 'All Budgets' || 
      (selectedBudget === 'Under ₹10L' && wedding.budget.includes('8-12')) ||
      (selectedBudget === '₹10-20L' && (wedding.budget.includes('12-15') || wedding.budget.includes('15-20'))) ||
      (selectedBudget === '₹20-30L' && (wedding.budget.includes('20-25') || wedding.budget.includes('25-30'))) ||
      (selectedBudget === '₹30L+' && wedding.budget.includes('35-40'));
    
    return categoryMatch && budgetMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Real Weddings</h1>
            <p className="text-xl text-pink-100 mb-8">
              Get inspired by real couples and their beautiful wedding stories
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto bg-white rounded-2xl p-4 shadow-xl">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Search by couple names, location, or venue..."
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

      {/* Filters */}
      <div className="bg-white py-6 border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
            
            <div className="flex items-center gap-4">
              <select 
                value={selectedBudget}
                onChange={(e) => setSelectedBudget(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                {budgetRanges.map((range) => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>
              
              <div className="text-sm text-gray-600">
                {filteredWeddings.length} stories
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Wedding */}
        {filteredWeddings.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Wedding</h2>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <img 
                    src={filteredWeddings[0].coverImage} 
                    alt={filteredWeddings[0].title}
                    className="w-full h-80 md:h-full object-cover"
                  />
                </div>
                <div className="md:w-1/2 p-8">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {filteredWeddings[0].categories.map((category, index) => (
                      <span 
                        key={index}
                        className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                  
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">{filteredWeddings[0].title}</h3>
                  <p className="text-xl text-pink-600 font-semibold mb-4">{filteredWeddings[0].coupleNames}</p>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="text-sm">{filteredWeddings[0].date}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span className="text-sm">{filteredWeddings[0].venue}, {filteredWeddings[0].location}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span className="text-sm">{filteredWeddings[0].guestCount} guests</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-6 leading-relaxed">{filteredWeddings[0].description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {filteredWeddings[0].readTime}
                      </span>
                      <span className="flex items-center">
                        <Heart className={`h-4 w-4 mr-1 ${filteredWeddings[0].isLiked ? 'text-pink-600 fill-current' : ''}`} />
                        {filteredWeddings[0].likes}
                      </span>
                    </div>
                    <Button className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-xl">
                      Read Full Story
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wedding Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredWeddings.slice(1).map((wedding) => (
            <div key={wedding.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group">
              <div className="relative">
                <img 
                  src={wedding.coverImage} 
                  alt={wedding.title}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                <button
                  onClick={() => toggleLike(wedding.id)}
                  className={`absolute top-4 right-4 p-2 rounded-full transition-all duration-300 ${
                    wedding.isLiked 
                      ? 'bg-pink-600 text-white' 
                      : 'bg-white/80 text-gray-600 hover:bg-white'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${wedding.isLiked ? 'fill-current' : ''}`} />
                </button>
                
                <div className="absolute top-4 left-4">
                  <div className="flex flex-wrap gap-1">
                    {wedding.categories.slice(0, 2).map((category, index) => (
                      <span 
                        key={index}
                        className="bg-white/90 text-pink-600 px-2 py-1 rounded-full text-xs font-semibold"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex -space-x-2">
                    {wedding.gallery.slice(0, 3).map((image, index) => (
                      <img 
                        key={index}
                        src={image} 
                        alt=""
                        className="w-8 h-8 rounded-full border-2 border-white object-cover"
                      />
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-800 flex items-center justify-center text-white text-xs font-semibold">
                      +{wedding.gallery.length - 3}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{wedding.title}</h3>
                <p className="text-lg text-pink-600 font-semibold mb-3">{wedding.coupleNames}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="text-sm">{wedding.date}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm">{wedding.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span className="text-sm">{wedding.guestCount} guests • {wedding.budget}</span>
                  </div>
                </div>
                
                <p className="text-gray-700 text-sm mb-4 line-clamp-3">{wedding.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {wedding.readTime}
                    </span>
                    <span className="flex items-center">
                      <Heart className={`h-4 w-4 mr-1 ${wedding.isLiked ? 'text-pink-600 fill-current' : ''}`} />
                      {wedding.likes}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 rounded-xl"
                  >
                    Read Story
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
            Load More Stories
          </Button>
        </div>
      </div>
    </div>
  );
}