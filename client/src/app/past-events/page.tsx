'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Search, Heart, MapPin, Calendar, Users, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface RealEvent {
  id: string;
  title: string;
  clientNames: string;
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

const sampleEvents: RealEvent[] = [
  {
    id: '1',
    title: 'A Royal Rajasthani Wedding in Udaipur',
    clientNames: 'Arjun & Priya',
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
    clientNames: 'Rahul & Kavya',
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
    description: 'An intimate beachside celebration with stunning sunset views, barefoot ceremonies, and tropical vibes that perfectly captured the clients free-spirited celebration story.',
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
    clientNames: 'Vikram & Sneha',
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
    description: 'A sophisticated city event blending contemporary elegance with traditional touches, featuring stunning floral arrangements and modern décor elements.',
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
    clientNames: 'Amit & Riya',
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
    description: 'A romantic garden celebration surrounded by lush greenery and blooming flowers, celebrating love in natures embrace with eco-friendly décor.',
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
    clientNames: 'Karan & Meera',
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
    clientNames: 'Dev & Ananya',
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
    description: 'A cozy mountain celebration with panoramic views, rustic décor, and warm hospitality that brought together close family and friends in a magical setting.',
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

export default function RealEventsPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBudget, setSelectedBudget] = useState('All Budgets');
  const [events, setEvents] = useState(sampleEvents);

  const toggleLike = (eventId: string) => {
    setEvents(events.map(event => 
      event.id === eventId 
        ? { ...event, isLiked: !event.isLiked, likes: event.isLiked ? event.likes - 1 : event.likes + 1 }
        : event
    ));
  };

  const filteredEvents = events.filter(event => {
    const categoryMatch = selectedCategory === 'All' || event.categories.includes(selectedCategory);
    const budgetMatch = selectedBudget === 'All Budgets' || 
      (selectedBudget === 'Under ₹10L' && event.budget.includes('8-12')) ||
      (selectedBudget === '₹10-20L' && (event.budget.includes('12-15') || event.budget.includes('15-20'))) ||
      (selectedBudget === '₹20-30L' && (event.budget.includes('20-25') || event.budget.includes('25-30'))) ||
      (selectedBudget === '₹30L+' && event.budget.includes('35-40'));
    
    return categoryMatch && budgetMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Real Events</h1>
            <p className="text-xl text-pink-100 mb-8">
              Get inspired by beautiful event photography from real celebrations
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

      {/* Categories and Filters */}
      <div className="bg-white py-6 border-b sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
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
              <select
                value={selectedBudget}
                onChange={(e) => setSelectedBudget(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                {budgetRanges.map((range) => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            Showing {filteredEvents.length} events
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] group">
              <div className="relative">
                <Image 
                  src={event.coverImage} 
                  alt={event.title}
                  width={800}
                  height={256}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSorjUdEAiuRDQfKt36WV1ZuVYyv9EG1X9jU0qLUcqcM3FTKuuOTKL8sR6k1v6WS09nclLF2Jl2VvvjIJHhV6k2qv0pY8kP18D3jqF0wCnZWp/qFgFa4kNDR9zf/2Q=="
                  priority={event.id === '1'}
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleLike(event.id)}
                          className={`p-2 rounded-full transition-all duration-300 ${
                            event.isLiked 
                              ? 'bg-pink-600 text-white' 
                              : 'bg-white/80 text-gray-600 hover:bg-white'
                          }`}
                        >
                          <Heart className={`h-5 w-5 ${event.isLiked ? 'fill-current' : ''}`} />
                        </button>
                        <button className="p-2 rounded-full bg-white/80 text-gray-600 hover:bg-white transition-all duration-300">
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 text-pink-600 px-3 py-1 rounded-full text-sm font-semibold">
                    {event.categories[0]}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                
                <div className="flex items-center text-gray-500 text-sm mb-4">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{event.date}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-gray-500 text-sm">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="truncate max-w-[100px]">{event.location}</span>
                    </div>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{event.guestCount} guests</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-500 text-sm">
                    <Heart className="h-4 w-4 mr-1" />
                    <span>{event.likes}</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Budget</p>
                    <p className="font-semibold text-gray-900">{event.budget}</p>
                  </div>
                  <Button variant="outline" className="border-pink-600 text-pink-600 hover:bg-pink-50">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No events found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}