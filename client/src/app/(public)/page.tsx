'use client';

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Search, MapPin, Users, Star, Heart, Calendar } from "lucide-react";
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import VendorCategoriesGrid from '@/components/home/VendorCategoriesGrid';
import BlogSection from '@/components/home/BlogSection';
// Removed unused auth import to satisfy linter

interface VenueImage { url: string; isPrimary?: boolean; }
interface VenueItem {
  _id: string;
  name: string;   
  type?: string;
  address?: { city?: string; state?: string };
  images?: VenueImage[];
}

export default function Home() {
  const router = useRouter();
  // Removed unused user from auth context to satisfy linter
  const [venues, setVenues] = useState<VenueItem[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  // Controls whether we show only a subset of category cards or all of them
  const [showAllCategories, setShowAllCategories] = useState(false);
  // Dynamic homepage settings (admin managed)
  const [pageTitle, setPageTitle] = useState<string>('');
  const [bgImages, setBgImages] = useState<string[]>([]);
  const [pageDescription, setPageDescription] = useState<string>('');
  const [bgIndex, setBgIndex] = useState<number>(0);
  const [textFrom, setTextFrom] = useState<string>('');
  const [textTo, setTextTo] = useState<string>('');
  
  // Convert common sharing links to direct image URLs so background works from
  // services like Google Drive or Dropbox. If parsing fails, we return the
  // original URL.
  function normalizeImageUrl(input?: string): string {
    if (!input) return '';
    try {
      // Google Drive share link patterns
      if (/drive\.google\.com/.test(input)) {
        // e.g., https://drive.google.com/file/d/FILE_ID/view?usp=sharing
        const match = input.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match?.[1]) {
          return `https://drive.google.com/uc?id=${match[1]}`;
        }
        // e.g., https://drive.google.com/open?id=FILE_ID or uc?id=FILE_ID
        const idParam = new URL(input).searchParams.get('id');
        if (idParam) {
          return `https://drive.google.com/uc?id=${idParam}`;
        }
      }
      // Dropbox shared links
      if (/dropbox\.com/.test(input)) {
        // Force direct download/raw host
        const url = new URL(input);
        url.hostname = 'dl.dropboxusercontent.com';
        url.searchParams.set('raw', '1');
        url.searchParams.delete('dl');
        return url.toString();
      }
    } catch {
      // Fall through and return original
    }
    return input;
  }
  // Typing effect state for the homepage title. We keep this local so
  // admins can still change the title dynamically via page settings.
  const [typedTitle, setTypedTitle] = useState<string>('');
  const [typeIndex, setTypeIndex] = useState<number>(0);
  const [typingDirection, setTypingDirection] = useState<'forward' | 'backward'>('forward');

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setLoadingVenues(true);
        const res = await apiClient.get('/venues');
        const list: VenueItem[] = res?.data?.venues || res?.data?.data || res?.data || [];
        setVenues(Array.isArray(list) ? list : []);
      } catch (e) {
        // silently fail; UI will fallback to placeholders below
        console.error('Failed to fetch venues for homepage categories', e);
      } finally {
        setLoadingVenues(false);
      }
    };
    fetchVenues();
    // Fetch dynamic homepage settings (title + background)
    const fetchPageSettings = async () => {
      try {
        const res = await apiClient.get('/page-settings/home');
        const data = res?.data || {};
        setPageTitle(typeof data.title === 'string' ? data.title : '');
        const imgs = Array.isArray(data.backgroundImages) ? data.backgroundImages : [];
        setBgImages(imgs);
        if (imgs.length > 0) {
          setBgIndex(Math.floor(Math.random() * imgs.length));
        }
        setPageDescription(typeof data.description === 'string' ? data.description : '');
        setTextFrom(typeof data.textGradientFrom === 'string' ? data.textGradientFrom : '');
        setTextTo(typeof data.textGradientTo === 'string' ? data.textGradientTo : '');
      } catch {
        // If not configured yet, keep defaults (no title rendered)
        if (process.env.NODE_ENV === 'development') {
          console.log('Homepage page-settings not found yet');
        }
      }
    };
    fetchPageSettings();
  }, []);

  // Reset typing state when title changes
  useEffect(() => {
    setTypedTitle('');
    setTypeIndex(0);
    setTypingDirection('forward');
  }, [pageTitle]);

  // Infinite typing loop: type forward, pause, delete backward, pause, repeat
  useEffect(() => {
    if (!pageTitle) return;
    const atStart = typeIndex === 0 && typingDirection === 'backward';
    const atEnd = typeIndex === pageTitle.length && typingDirection === 'forward';
    const edgePauseMs = 1200;
    const stepMs = 60;
    const delay = atStart || atEnd ? edgePauseMs : stepMs;

    const timeout = setTimeout(() => {
      if (typingDirection === 'forward') {
        if (typeIndex < pageTitle.length) {
          const next = typeIndex + 1;
          setTypeIndex(next);
          setTypedTitle(pageTitle.slice(0, next));
        } else {
          setTypingDirection('backward');
        }
      } else {
        if (typeIndex > 0) {
          const next = typeIndex - 1;
          setTypeIndex(next);
          setTypedTitle(pageTitle.slice(0, next));
        } else {
          setTypingDirection('forward');
        }
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [pageTitle, typeIndex, typingDirection]);

  // Rotate background images randomly every 10 seconds if multiple provided
  useEffect(() => {
    if (bgImages.length <= 1) return;
    const interval = setInterval(() => {
      setBgIndex((current) => {
        if (bgImages.length <= 1) return 0;
        let next = Math.floor(Math.random() * bgImages.length);
        if (next === current) {
          next = (current + 1) % bgImages.length; // ensure change
        }
        return next;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [bgImages]);

  const handleCategoryClick = (categoryTitle: string) => {
    // Map category titles to venue types for filtering
    const venueTypeMap: { [key: string]: string } = {
      'Luxury Hotels': 'Hotel',
      'Banquet Halls': 'Banquet Hall',
      'Garden Venues': 'Resort',
      'Beach Venues': 'Resort',
      'Farmhouses': 'Farmhouse',
      'Rooftop Venues': 'Rooftop',
      'Destination Wedding': 'Destination',
      'Resorts': 'Resort',
      'Conference Centers': 'Conference Center',
      'Heritage Venues': 'Heritage'
    };
    
    const venueType = venueTypeMap[categoryTitle];
    if (venueType) {
      // Navigate to venues page with filter parameter
      router.push(`/venues?type=${encodeURIComponent(venueType)}`);
    } else {
      // Fallback to general venues page
      router.push('/venues');
    }
  };

  const categoryDefs = useMemo(() => ([
    {
      title: 'Luxury Hotels',
      cities: 'Mumbai | Bangalore | Delhi',
      match: (v: VenueItem) => /hotel/i.test(v.type || '') || /hotel/i.test(v.name || ''),
    },
    {
      title: 'Banquet Halls',
      cities: 'Mumbai | Bangalore | Pune',
      match: (v: VenueItem) => /banquet/i.test(v.type || '') || /banquet/i.test(v.name || ''),
    },
    {
      title: 'Garden Venues',
      cities: 'Mumbai | Chennai | Delhi',
      match: (v: VenueItem) => /resort|garden|outdoor/i.test(v.type || '') || /garden|resort/i.test(v.name || ''),
    },
    {
      title: 'Beach Venues',
      cities: 'Goa | Mumbai | Chennai',
      match: (v: VenueItem) => /beach|coast|seaside/i.test(v.type || '') || /beach/i.test(v.name || ''),
    },
    {
      title: 'Farmhouses',
      cities: 'Delhi | Gurgaon | Pune',
      match: (v: VenueItem) => /farmhouse|farm/i.test(v.type || '') || /farmhouse|farm/i.test(v.name || ''),
    },
    {
      title: 'Rooftop Venues',
      cities: 'Mumbai | Bangalore | Hyderabad',
      match: (v: VenueItem) => /rooftop|terrace/i.test(v.type || '') || /rooftop|terrace/i.test(v.name || ''),
    },
    {
      title: 'Destination Wedding',
      cities: 'Jaipur | Udaipur | Goa',
      match: (v: VenueItem) => /destination/i.test(v.type || '') || /destination/i.test(v.name || ''),
    },
    {
      title: 'Resorts',
      cities: 'Lonavala | Coorg | Ooty',
      match: (v: VenueItem) => /resort/i.test(v.type || '') || /resort/i.test(v.name || ''),
    },
    {
      title: 'Conference Centers',
      cities: 'Mumbai | Delhi | Bangalore',
      match: (v: VenueItem) => /conference|convention|expo/i.test(v.type || '') || /conference|convention/i.test(v.name || ''),
    },
    {
      title: 'Heritage Venues',
      cities: 'Jaipur | Jodhpur | Udaipur',
      match: (v: VenueItem) => /heritage|palace|fort/i.test(v.type || '') || /palace|fort/i.test(v.name || ''),
    }
  ]), []);

  const categoryCards = useMemo(() => {
    return categoryDefs.map(def => {
      const items = venues.filter(def.match);
      const count = items.length;
      const cover = items.find(v => (v.images?.length || 0) > 0);
      const image = cover?.images?.find(i => i.isPrimary)?.url || cover?.images?.[0]?.url || '';
      return {
        title: def.title,
        image,
        venuesText: image ? `${count} Venues` : 'Unavailable',
        location: def.cities,
        hasImage: Boolean(image),
      } as { title: string; image?: string; venuesText: string; location: string; hasImage: boolean };
    });
  }, [venues, categoryDefs]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Background Image */}
      <div className="relative min-h-[80vh] bg-gradient-to-r from-pink-600 to-purple-600 overflow-hidden">
        {/* Background Image Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-100 transition-all duration-700 blur-md transform-gpu scale-110"
          style={bgImages.length > 0 ? { backgroundImage: `url(${normalizeImageUrl(bgImages[bgIndex])})` } : undefined}
        />
        
        {/* Gradient/Darken Overlay to improve text readability */}
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Hero Content */}
        <div className="relative z-10 flex items-center justify-center min-h-[80vh] px-4">
          <div className="text-center text-white max-w-4xl mx-auto">
            {pageTitle ? (
              <h1
                className={`text-5xl md:text-7xl font-extrabold mb-6 leading-tight ${textFrom && textTo ? 'bg-clip-text text-transparent' : ''}`}
                style={textFrom && textTo ? { backgroundImage: `linear-gradient(90deg, ${textFrom}, ${textTo})` } : undefined}
              >
                {typedTitle || pageTitle}
                <span className="ml-1 animate-pulse">|</span>
              </h1>
            ) : null}
            {pageDescription ? (
              <p
                className={`text-xl md:text-2xl mb-8 max-w-2xl mx-auto ${textFrom && textTo ? 'bg-clip-text text-transparent' : 'text-pink-100'}`}
                style={textFrom && textTo ? { backgroundImage: `linear-gradient(90deg, ${textFrom}, ${textTo})` } : undefined}
              >
                {pageDescription}
              </p>
            ) : null}
            
            {/* Search Bar */}
            <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-4xl mx-auto mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <select className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-700">
                    <option>Select city</option>
                    <option>Mumbai</option>
                    <option>Delhi</option>
                    <option>Bangalore</option>
                    <option>Chennai</option>
                    <option>Pune</option>
                  </select>
                </div>
                
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <select className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-700">
                    <option>Select venue type</option>
                    <option>Banquet Halls</option>
                    <option>Hotels</option>
                    <option>Resorts</option>
                    <option>Outdoor Venues</option>
                    <option>Destination Wedding</option>
                  </select>
                </div>
                
                <Button 
                  size="lg" 
                  className="bg-pink-600 hover:bg-pink-700 text-white py-3 px-8 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Get Started
                </Button>
              </div>
            </div>
            
            {/* Popular Searches removed by request */}
          </div>
        </div>
      </div>

      {/* Popular Venue Categories */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Venue Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the perfect venue for your special event
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(showAllCategories ? categoryCards : categoryCards.slice(0, 6)).map((category, index) => (
              <div 
                key={index} 
                className="group cursor-pointer"
                onClick={() => handleCategoryClick(category.title)}
              >
                <div className="relative overflow-hidden rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-105">
                  {category.hasImage ? (
                    <Image 
                      src={category.image as string} 
                      alt={category.title}
                      width={800}
                      height={256}
                      className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                      priority={index === 0}
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 font-semibold">No image available</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-6 left-6 text-white">
                    <h3 className="text-2xl font-bold mb-2">{category.title}</h3>
                    <p className="text-pink-200 font-medium">{loadingVenues ? 'Loading…' : category.venuesText}</p>
                    <p className="text-sm text-gray-300">{category.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Toggle button to reveal more/less categories */}
          {categoryCards.length > 6 && (
            <div className="mt-10 flex justify-center">
              <Button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="px-6"
              >
                {showAllCategories ? 'View less' : 'View more'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Popular Service Categories - looks like venue cards */}
      <VendorCategoriesGrid />

      {/* Create Blog CTA now lives inside BlogSection header for consistent background */}

      {/* Blog Section - shows latest admin blogs */}
      <BlogSection />

      {/* Why Choose Plannova */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Plannova?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We make your event planning journey seamless and memorable
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Star className="h-12 w-12 text-pink-600" />,
                title: "Verified Reviews",
                description: "Read authentic reviews from real clients"
              },
              {
                icon: <Heart className="h-12 w-12 text-pink-600" />,
                title: "Curated Selection",
                description: "Hand-picked venues for your perfect event"
              },
              {
                icon: <Calendar className="h-12 w-12 text-pink-600" />,
                title: "Easy Booking",
                description: "Book instantly with real-time availability"
              },
              {
                icon: <Users className="h-12 w-12 text-pink-600" />,
                title: "Expert Support",
                description: "Dedicated support throughout your planning"
              }
            ].map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow duration-300">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Plan Your Perfect Event?
          </h2>
          <p className="text-xl text-pink-100 mb-8 max-w-2xl mx-auto">
            Join thousands of people who found their perfect venue through Plannova
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" className="bg-pink-600 text-white hover:bg-pink-700 px-8 py-3 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105">
                Sign Up Today
              </Button>
            </Link>
            <Link href="/venues">
              <Button size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-pink-600 px-8 py-3 text-lg font-semibold rounded-xl transition-all duration-300">
                Browse Venues
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}