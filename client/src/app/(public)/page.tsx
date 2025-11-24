'use client';

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Search, MapPin, Users, Star, Heart, Calendar, Grid } from "lucide-react";
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import VendorCategoriesGrid from '@/components/home/VendorCategoriesGrid';
import BlogSection from '@/components/home/BlogSection';
import { VENUE_TYPES } from '@/constants/venueTypes';
// States and cities are now loaded from API routes (server-side)
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
  // Removed unused category visibility state to satisfy linter
  // Dynamic homepage settings (admin managed)
  // Note: pageTitle is fetched but not used - title is hardcoded as "Welcome to Plannova"
  const [bgImages, setBgImages] = useState<string[]>([]); // Legacy field - kept for backward compatibility
  const [bgImagesMobile, setBgImagesMobile] = useState<string[]>([]); // Images for mobile devices
  const [bgImagesLaptop, setBgImagesLaptop] = useState<string[]>([]); // Images for laptop/desktop devices
  const [pageDescription, setPageDescription] = useState<string>('');
  const [bgIndex, setBgIndex] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false); // Track if device is mobile
  const [textFrom, setTextFrom] = useState<string>('');
  const [textTo, setTextTo] = useState<string>('');
  const [typingOptions, setTypingOptions] = useState<string[]>([]); // Options for typing effect
  const [backgroundBlur, setBackgroundBlur] = useState<number>(4); // Background blur level: 0-100, default 4 to match previous 'sm' behavior
  // Track current image index for each venue category to enable image cycling
  const [imageIndices, setImageIndices] = useState<Record<string, number>>({});
  
  // Typing effect state for the typing options (not the title).
  // The title "Welcome to Plannova" is static, but options cycle through with typing effect.
  const [typedOption, setTypedOption] = useState<string>('');
  const [typeIndex, setTypeIndex] = useState<number>(0);
  const [typingDirection, setTypingDirection] = useState<'forward' | 'backward'>('forward');
  const [currentOptionIndex, setCurrentOptionIndex] = useState<number>(0); // Which option we're currently typing
  
  // State and city selection state (India is fixed, no country selection needed)
  // Store selected state code and city name
  // India country code (IN) is hardcoded since we only show Indian states
  const selectedCountry = 'IN'; // Fixed to India
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  // Store list of states for India
  const [states, setStates] = useState<Array<{ iso2: string; name: string }>>([]);
  // Store list of cities for selected state
  const [cities, setCities] = useState<Array<{ name: string }>>([]);
  
  // Service type selection (venue or vendor)
  const [serviceType, setServiceType] = useState<string>('');
  // Selected venue type (when serviceType is 'venue')
  const [selectedVenueType, setSelectedVenueType] = useState<string>('');
  // Selected vendor service (when serviceType is 'vendor')
  const [selectedVendorService, setSelectedVendorService] = useState<string>('');
  
  // Vendor service options with display names and category mappings
  // Maps internal service names to display names and vendor page category names
  const vendorServices = [
    { value: 'catering', label: 'Catering', category: 'Catering' },
    { value: 'photography', label: 'Photography', category: 'Photography' },
    { value: 'videography', label: 'Videography', category: 'Videography' },
    { value: 'bridal-makeup', label: 'Bridal Makeup', category: 'Makeup & Beauty' },
    { value: 'decoration', label: 'Decoration', category: 'Decoration' },
    { value: 'entertainment', label: 'Entertainment', category: 'Music & Entertainment' }
  ];

  // Load India's states from API route (server-side)
  useEffect(() => {
    const loadStates = async () => {
      try {
        console.log('Fetching states from /api/states...');
        // Fetch states from our API route (runs server-side where package works)
        const response = await fetch('/api/states');
        console.log('Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('API error response:', response.status, errorData);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || errorData.error || 'Unknown error'}`);
        }
        
        const data = await response.json();
        console.log('API response data:', JSON.stringify(data, null, 2));
        console.log('Data success:', data.success);
        console.log('Data states type:', typeof data.states, 'isArray:', Array.isArray(data.states), 'length:', data.states?.length);
        
        if (data.success && Array.isArray(data.states)) {
          if (data.states.length > 0) {
            console.log('Successfully loaded Indian states:', data.states.length);
            console.log('First state:', data.states[0]);
            setStates(data.states);
          } else {
            console.warn('States array is empty - API returned success but no states');
            setStates([]);
          }
        } else {
          console.error('API returned unsuccessful response:', data);
          console.error('Success flag:', data.success);
          console.error('States value:', data.states);
          console.error('Error message from API:', data.message);
          console.error('Error stack from API:', data.stack);
          setStates([]);
        }
      } catch (error) {
        console.error('Failed to load states - Full error:', error);
        console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('Error message:', error instanceof Error ? error.message : String(error));
        setStates([]);
      }
    };
    
    loadStates();
  }, []);

  // Load cities when state is selected (from API route)
  useEffect(() => {
    const loadCities = async () => {
      // Reset city selection when state changes
      setSelectedCity('');
      
      if (!selectedCountry || !selectedState) {
        setCities([]);
        return;
      }
      
      try {
        // Fetch cities from our API route
        const response = await fetch(`/api/cities?country=${selectedCountry}&state=${selectedState}`);
        const data = await response.json();
        
        if (data.success && Array.isArray(data.cities) && data.cities.length > 0) {
          console.log('Loaded cities:', data.cities.length);
          setCities(data.cities);
        } else {
          console.error('Failed to load cities:', data);
          setCities([]);
        }
      } catch (error) {
        console.error('Failed to load cities:', error);
        setCities([]);
      }
    };
    
    loadCities();
  }, [selectedCountry, selectedState]);

  // Detect if device is mobile or laptop/desktop
  useEffect(() => {
    // Function to check if device is mobile
    const checkIsMobile = () => {
      // Check window width - mobile devices are typically < 768px
      // Also check user agent for mobile devices
      const isMobileWidth = typeof window !== 'undefined' && window.innerWidth < 768;
      const isMobileUserAgent = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      return isMobileWidth || isMobileUserAgent;
    };
    
    // Set initial mobile state
    setIsMobile(checkIsMobile());
    
    // Listen for window resize to update mobile state
    const handleResize = () => {
      setIsMobile(checkIsMobile());
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    // Prevent duplicate requests and handle rate limiting
    let cancelled = false;
    
    // Fetch venues - API already filters to only show provider-listed venues
    // (venues with providerId, status APPROVED or PENDING_EDIT, isActive: true)
    const fetchVenues = async () => {
      try {
        const res = await apiClient.get('/venues');
        if (!cancelled) {
          const list: VenueItem[] = res?.data?.venues || res?.data?.data || res?.data || [];
          setVenues(Array.isArray(list) ? list : []);
        }
      } catch (e: unknown) {
        if (cancelled) return; // Don't handle errors if component unmounted
        
        // Check if error has response property (Axios error)
        const isAxiosError = e && typeof e === 'object' && 'response' in e;
        const errorResponse = isAxiosError && e.response && typeof e.response === 'object' ? e.response : null;
        const errorStatus = errorResponse && 'status' in errorResponse ? errorResponse.status : null;
        const errorMessage = (e && typeof e === 'object' && 'message' in e) ? String(e.message) : '';
        const errorCode = (e && typeof e === 'object' && 'code' in e) ? String(e.code) : '';
        
        // Handle network errors (server not running, connection issues)
        // Network errors typically have no response and error code 'ERR_NETWORK' or 'ECONNREFUSED'
        const isNetworkError = !errorResponse && (
          errorMessage.includes('Network Error') || 
          errorCode === 'ERR_NETWORK' || 
          errorCode === 'ECONNREFUSED' ||
          errorMessage.includes('Failed to fetch')
        );
        
        if (isNetworkError) {
          // Network error - server likely not running
          // Only log in development mode with helpful message
          if (process.env.NODE_ENV === 'development') {
            console.warn('Network error: Unable to connect to API server. Make sure the backend server is running.');
          }
          // Silently fail - UI will show placeholders
        } else if (errorStatus === 429) {
          // Rate limiting (429) - handle gracefully
          if (process.env.NODE_ENV === 'development') {
            console.warn('Rate limit exceeded. Please wait a moment and refresh.');
          }
          // Silently fail - UI will show placeholders
        } else {
          // Other errors - log in development mode
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to fetch venues for homepage categories', e);
          }
        }
      }
    };
    
    // Fetch dynamic homepage settings (title + background)
    const fetchPageSettings = async () => {
      try {
        const res = await apiClient.get('/page-settings/home');
        if (!cancelled) {
          const data = res?.data || {};
          // Note: title is fetched but not used - homepage title is hardcoded
          // Load mobile and laptop images, fallback to legacy backgroundImages if needed
          const mobileImgs = Array.isArray(data.backgroundImagesMobile) && data.backgroundImagesMobile.length > 0 
            ? data.backgroundImagesMobile 
            : (Array.isArray(data.backgroundImages) ? data.backgroundImages : []);
          const laptopImgs = Array.isArray(data.backgroundImagesLaptop) && data.backgroundImagesLaptop.length > 0 
            ? data.backgroundImagesLaptop 
            : (Array.isArray(data.backgroundImages) ? data.backgroundImages : []);
          const legacyImgs = Array.isArray(data.backgroundImages) ? data.backgroundImages : [];
          
          setBgImagesMobile(mobileImgs);
          setBgImagesLaptop(laptopImgs);
          setBgImages(legacyImgs); // Keep for backward compatibility
          
          // Set initial random index based on device type
          // This will be updated when isMobile state is determined
          const initialImgs = mobileImgs.length > 0 ? mobileImgs : (laptopImgs.length > 0 ? laptopImgs : legacyImgs);
          if (initialImgs.length > 0) {
            setBgIndex(Math.floor(Math.random() * initialImgs.length));
          }
          
          setPageDescription(typeof data.description === 'string' ? data.description : '');
          setTextFrom(typeof data.textGradientFrom === 'string' ? data.textGradientFrom : '');
          setTextTo(typeof data.textGradientTo === 'string' ? data.textGradientTo : '');
          setBackgroundBlur(typeof data.backgroundBlur === 'number' ? data.backgroundBlur : 4); // Default to 4 if not set (matches previous 'sm' behavior)
          setTypingOptions(Array.isArray(data.typingOptions) && data.typingOptions.length > 0 ? data.typingOptions : []);
        }
      } catch {
        // If not configured yet, keep defaults (no title rendered)
        if (process.env.NODE_ENV === 'development' && !cancelled) {
          console.log('Homepage page-settings not found yet');
        }
      }
    };
    
    fetchVenues();
    fetchPageSettings();
    
    // Cleanup function to cancel request if component unmounts
    return () => {
      cancelled = true;
    };
  }, []);
  
  // Update background index when device type or image arrays change
  useEffect(() => {
    // Select appropriate image array based on device type
    const currentImages = isMobile ? bgImagesMobile : bgImagesLaptop;
    // Fallback to legacy images if device-specific images are not available
    const imagesToUse = currentImages.length > 0 ? currentImages : bgImages;
    
    if (imagesToUse.length > 0) {
      // Set random index when images change or device type changes
      setBgIndex(Math.floor(Math.random() * imagesToUse.length));
    }
  }, [isMobile, bgImagesMobile, bgImagesLaptop, bgImages]);

  // Reset typing state when typing options change
  useEffect(() => {
    if (typingOptions.length === 0) {
      setTypedOption('');
      setTypeIndex(0);
      setCurrentOptionIndex(0);
      setTypingDirection('forward');
      return;
    }
    // Reset to first option when options change
    setTypedOption('');
    setTypeIndex(0);
    setCurrentOptionIndex(0);
    setTypingDirection('forward');
  }, [typingOptions]);

  // Infinite typing loop for options: type forward, pause, delete backward, move to next option, repeat
  useEffect(() => {
    if (typingOptions.length === 0) return;
    
    const currentOption = typingOptions[currentOptionIndex];
    if (!currentOption) return;
    
    const atStart = typeIndex === 0 && typingDirection === 'backward';
    const atEnd = typeIndex === currentOption.length && typingDirection === 'forward';
    const edgePauseMs = 1200; // Pause at start/end
    const stepMs = 60; // Typing speed
    const delay = atStart || atEnd ? edgePauseMs : stepMs;

    const timeout = setTimeout(() => {
      if (typingDirection === 'forward') {
        if (typeIndex < currentOption.length) {
          // Still typing forward
          const next = typeIndex + 1;
          setTypeIndex(next);
          setTypedOption(currentOption.slice(0, next));
        } else {
          // Finished typing, start deleting
          setTypingDirection('backward');
        }
      } else {
        // Deleting backward
        if (typeIndex > 0) {
          const next = typeIndex - 1;
          setTypeIndex(next);
          setTypedOption(currentOption.slice(0, next));
        } else {
          // Finished deleting, move to next option
          const nextOptionIndex = (currentOptionIndex + 1) % typingOptions.length;
          setCurrentOptionIndex(nextOptionIndex);
          setTypingDirection('forward');
        }
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [typingOptions, currentOptionIndex, typeIndex, typingDirection]);

  // Rotate background images randomly every 10 seconds if multiple provided
  // Uses device-appropriate image array (mobile or laptop)
  useEffect(() => {
    // Select appropriate image array based on device type
    const currentImages = isMobile ? bgImagesMobile : bgImagesLaptop;
    // Fallback to legacy images if device-specific images are not available
    const imagesToUse = currentImages.length > 0 ? currentImages : bgImages;
    
    if (imagesToUse.length <= 1) return;
    
    const interval = setInterval(() => {
      setBgIndex((current) => {
        if (imagesToUse.length <= 1) return 0;
        let next = Math.floor(Math.random() * imagesToUse.length);
        if (next === current) {
          next = (current + 1) % imagesToUse.length; // ensure change
        }
        return next;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [isMobile, bgImagesMobile, bgImagesLaptop, bgImages]);

  // Component for stable crossfade image transitions
  // Uses same logic as vendor categories grid - no remounting, no jitter
  const SwipeImageCarousel = ({ 
    images, 
    alt, 
    priority,
    currentIndex 
  }: { 
    images: string[]; 
    alt: string; 
    priority?: boolean;
    currentIndex: number;
  }) => {
    // Initialize displayIndex from currentIndex
    const [displayIndex, setDisplayIndex] = useState(() => currentIndex % (images.length || 1));
    const [overlayOpacity, setOverlayOpacity] = useState(0);
    const [nextImageUrl, setNextImageUrl] = useState<string | null>(null);
    const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Update display index when current index changes
    useEffect(() => {
      if (images.length === 0) return;
      const safeIndex = currentIndex % images.length;
      
      // If already showing this image and no transition in progress, do nothing
      if (safeIndex === displayIndex && !nextImageUrl) return;
      
      // If different image, start transition
      if (safeIndex !== displayIndex) {
        // Clear any existing transition first
        if (transitionTimerRef.current) {
          clearTimeout(transitionTimerRef.current);
          transitionTimerRef.current = null;
        }
        
        const nextImg = images[safeIndex] || images[0];
        setNextImageUrl(nextImg);
        
        // Start fade in after a brief delay
        const fadeTimer = setTimeout(() => {
          setOverlayOpacity(1);
        }, 50);
        
        // After transition completes, update base image
        transitionTimerRef.current = setTimeout(() => {
          setDisplayIndex(safeIndex);
          setOverlayOpacity(0);
          setNextImageUrl(null);
          transitionTimerRef.current = null;
        }, 2500);
        
        return () => {
          clearTimeout(fadeTimer);
          if (transitionTimerRef.current) {
            clearTimeout(transitionTimerRef.current);
            transitionTimerRef.current = null;
          }
        };
      }
    }, [currentIndex, displayIndex, images, nextImageUrl]);

    if (images.length === 0) {
      return (
        <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-600 font-semibold">No image available</span>
        </div>
      );
    }

    const currentImage = images[displayIndex] || images[0];

    return (
      <div className="w-full h-64 relative overflow-hidden">
        {/* Base image layer - always visible */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={currentImage}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            priority={priority}
            unoptimized={currentImage.includes('s3.tebi.io') || currentImage.includes('s3.')}
          />
        </div>
        
        {/* Overlay image layer - fades in when transitioning */}
        {nextImageUrl && (
          <div 
            className="absolute inset-0 w-full h-full transition-opacity duration-[2500ms] ease-in-out"
            style={{ opacity: overlayOpacity }}
          >
            <Image
              src={nextImageUrl}
              alt={alt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              priority={false}
              unoptimized={nextImageUrl.includes('s3.tebi.io') || nextImageUrl.includes('s3.')}
            />
          </div>
        )}
      </div>
    );
  };

  const handleCategoryClick = (categoryTitle: string) => {
    // Map category titles to venue types for filtering
    // Only map to categories that exist in the venue creation form
    const venueTypeMap: { [key: string]: string } = {
      'Luxury Hotels': 'Hotel',
      'Banquet Halls': 'Banquet Hall',
      'Outdoor Venues': 'Outdoor',
      'Garden Venues': 'Outdoor',
      'Resorts': 'Resort',
      'Farmhouses': 'Farmhouse',
      'Palaces': 'Palace',
      'Heritage Venues': 'Palace'
    };
    
    const venueType = venueTypeMap[categoryTitle];
    // Check if the venue type exists in our standard venue types list
    if (venueType && (VENUE_TYPES as readonly string[]).includes(venueType)) {
      // Navigate to venues page with filter parameter
      router.push(`/venues?type=${encodeURIComponent(venueType)}`);
    } else {
      // Fallback to general venues page
      router.push('/venues');
    }
  };

  // Only show categories that match the venue types available in the creation form
  // Available types: Banquet Hall, Hotel, Resort, Outdoor, Palace, Farmhouse
  const categoryDefs = useMemo(() => ([
    {
      title: 'Luxury Hotels',
      cities: 'Mumbai | Bangalore | Delhi',
      match: (v: VenueItem) => v.type === 'Hotel' || /hotel/i.test(v.type || ''),
    },
    {
      title: 'Banquet Halls',
      cities: 'Mumbai | Bangalore | Pune',
      match: (v: VenueItem) => v.type === 'Banquet Hall' || /banquet/i.test(v.type || ''),
    },
    {
      title: 'Resorts',
      cities: 'Lonavala | Coorg | Ooty',
      match: (v: VenueItem) => v.type === 'Resort' || /resort/i.test(v.type || ''),
    },
    {
      title: 'Outdoor Venues',
      cities: 'Mumbai | Chennai | Delhi',
      match: (v: VenueItem) => v.type === 'Outdoor' || /outdoor/i.test(v.type || ''),
    },
    {
      title: 'Palaces',
      cities: 'Jaipur | Jodhpur | Udaipur',
      match: (v: VenueItem) => v.type === 'Palace' || /palace/i.test(v.type || ''),
    },
    {
      title: 'Farmhouses',
      cities: 'Delhi | Gurgaon | Pune',
      match: (v: VenueItem) => v.type === 'Farmhouse' || /farmhouse|farm/i.test(v.type || ''),
    }
  ]), []);

  // Helper function to shuffle array randomly
  // This ensures images from all venues of a type are shown in random order
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Generate category cards from provider-listed venues
  // Only shows categories that have venues with images from providers
  const categoryCards = useMemo(() => {
    return categoryDefs.map(def => {
      // Filter venues by type - all venues here are already provider-listed (filtered by API)
      const items = venues.filter(def.match);
      const count = items.length;
      
      // Collect all images from all venues of this type
      const allImages: string[] = [];
      
      // Iterate through all venues of this type and collect their images
      items.forEach(venue => {
        if (venue.images && venue.images.length > 0) {
          venue.images.forEach(img => {
            if (img.url) {
              allImages.push(img.url);
            }
          });
        }
      });
      
      // Remove duplicates while preserving order
      const uniqueImages = Array.from(new Set(allImages));
      
      // Shuffle images randomly so different images appear on each page load
      const shuffledImages = shuffleArray(uniqueImages);
      
      return {
        title: def.title,
        images: shuffledImages, // Now returns array of all images instead of single image
        venuesText: shuffledImages.length > 0 ? `${count} Venues` : 'Unavailable',
        location: def.cities,
        hasImage: shuffledImages.length > 0,
      } as { title: string; images: string[]; venuesText: string; location: string; hasImage: boolean };
    });
  }, [venues, categoryDefs]);

  // Periodically cycle through images for each venue category with smooth transitions
  // Similar to vendor categories grid - cycles every 6 seconds
  // Must be defined after categoryCards to avoid reference error
  useEffect(() => {
    if (categoryCards.length === 0) return;
    
    // Cycle images every 6 seconds to allow very slow, smooth transitions
    const INTERVAL_MS = 6000;
    const id = setInterval(() => {
      setImageIndices(prev => {
        const next = { ...prev };
        // Update each category's index based on available images
        categoryCards.forEach(card => {
          if (card.images.length > 1) {
            next[card.title] = ((next[card.title] || 0) + 1) % card.images.length;
          }
        });
        return next;
      });
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [categoryCards]);

  // Helper function to convert numeric blur value (0-100) to CSS blur style
  // Converts 0-100 to CSS blur value in pixels (0px to 20px for smooth scaling)
  const getBlurStyle = (blur: number): React.CSSProperties => {
    if (blur === 0) {
      return {}; // No blur
    }
    // Map 0-100 to 0px-20px blur (linear scaling)
    const blurPixels = (blur / 100) * 20;
    return {
      filter: `blur(${blurPixels}px)`
    };
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Background Image */}
      <div className="relative min-h-[80vh] bg-gradient-to-r from-primary to-secondary overflow-hidden">
        {/* Background Image Overlay */}
        {/* Select appropriate image array based on device type, with fallback to legacy images */}
        {(() => {
          const currentImages = isMobile ? bgImagesMobile : bgImagesLaptop;
          const imagesToUse = currentImages.length > 0 ? currentImages : bgImages;
          const currentImage = imagesToUse[bgIndex] || imagesToUse[0];
          
          return (
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-100 transition-all duration-700 transform-gpu scale-105"
              style={{
                ...(currentImage ? { backgroundImage: `url(${currentImage})` } : {}),
                ...getBlurStyle(backgroundBlur)
              }}
            />
          );
        })()}
        
        {/* Gradient/Darken Overlay to improve text readability - reduced opacity for better image visibility */}
        <div className="absolute inset-0 bg-black/15" />
        
        {/* Hero Content */}
        <div className="relative z-10 flex items-center justify-center min-h-[80vh] px-4">
          <div className="text-center text-white max-w-4xl mx-auto">
            {/* Static "Welcome to Plannova" title - no typing effect */}
            <h1
              className={`text-5xl md:text-7xl font-extrabold mb-6 leading-tight ${textFrom && textTo ? 'bg-clip-text text-transparent' : ''}`}
              style={textFrom && textTo ? { backgroundImage: `linear-gradient(90deg, ${textFrom}, ${textTo})` } : undefined}
            >
              Welcome to Plannova
            </h1>
            
            {/* Typing effect for options added by admin through page settings */}
            {typingOptions.length > 0 && (
              <h2
                className={`text-3xl md:text-5xl font-bold mb-6 leading-tight ${textFrom && textTo ? 'bg-clip-text text-transparent' : 'text-white'}`}
                style={textFrom && textTo ? { backgroundImage: `linear-gradient(90deg, ${textFrom}, ${textTo})` } : undefined}
              >
                {typedOption}
                <span className="ml-1 animate-pulse">|</span>
              </h2>
            )}
            
            {/* Description (if provided) */}
            {pageDescription ? (
              <p
                className={`text-xl md:text-2xl mb-8 max-w-2xl mx-auto ${textFrom && textTo ? 'bg-clip-text text-transparent' : 'text-pink-100'}`}
                style={textFrom && textTo ? { backgroundImage: `linear-gradient(90deg, ${textFrom}, ${textTo})` } : undefined}
              >
                {pageDescription}
              </p>
            ) : null}
            
            {/* Search Bar */}
            <div className="bg-background rounded-2xl p-6 shadow-2xl max-w-5xl mx-auto mb-8 border border-border relative z-20">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* State Selection Dropdown - Shows India's states directly from package */}
                <div className="relative z-30">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary h-5 w-5 z-10 pointer-events-none" />
                  <select 
                    value={selectedState}
                    onChange={(e) => {
                      console.log('State selected:', e.target.value);
                      setSelectedState(e.target.value);
                    }}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary bg-background relative z-20 cursor-pointer"
                  >
                    <option value="">Select state</option>
                    {states.length > 0 ? (
                      states.map((state, index) => (
                        <option key={`${state.iso2}-${index}`} value={state.iso2}>
                          {state.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Loading states... ({states.length})</option>
                    )}
                  </select>
                </div>
                
                {/* City Selection Dropdown - Only enabled when state is selected */}
                <div className="relative z-30">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary h-5 w-5 z-10 pointer-events-none" />
                  <select 
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    disabled={!selectedState || cities.length === 0}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary bg-background relative z-20 cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ WebkitAppearance: 'menulist' }}
                  >
                    <option value="">Select city</option>
                    {cities.map((city, index) => (
                      <option key={index} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Service Type Selection - First dropdown to choose between venue and vendor */}
                <div className="relative z-30">
                  <Grid className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary h-5 w-5 z-10 pointer-events-none" />
                  <select 
                    value={serviceType}
                    onChange={(e) => {
                      const newServiceType = e.target.value;
                      setServiceType(newServiceType);
                      // Reset category selections when service type changes
                      setSelectedVenueType('');
                      setSelectedVendorService('');
                    }}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary bg-background relative z-20 cursor-pointer appearance-none"
                    style={{ WebkitAppearance: 'menulist' }}
                  >
                    <option value="">Select service type</option>
                    <option value="venue">Venue</option>
                    <option value="vendor">Vendor</option>
                  </select>
                </div>
                
                {/* Conditional Category Selection - Shows venue types or vendor services based on service type */}
                {serviceType === 'venue' && (
                  <div className="relative z-30">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary h-5 w-5 z-10 pointer-events-none" />
                    <select 
                      value={selectedVenueType}
                      onChange={(e) => setSelectedVenueType(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary bg-background relative z-20 cursor-pointer appearance-none"
                      style={{ WebkitAppearance: 'menulist' }}
                    >
                      <option value="">Select venue type</option>
                      {/* Only show venue types available in the creation form */}
                      {VENUE_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                {serviceType === 'vendor' && (
                  <div className="relative z-30">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary h-5 w-5 z-10 pointer-events-none" />
                    <select 
                      value={selectedVendorService}
                      onChange={(e) => setSelectedVendorService(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-text-primary bg-background relative z-20 cursor-pointer appearance-none"
                      style={{ WebkitAppearance: 'menulist' }}
                    >
                      <option value="">Select vendor service</option>
                      {vendorServices.map(service => (
                        <option key={service.value} value={service.value}>
                          {service.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Placeholder div when no service type is selected */}
                {!serviceType && (
                  <div className="relative z-30">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary h-5 w-5 z-10 pointer-events-none" />
                    <select 
                      disabled
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-xl text-text-tertiary bg-background relative z-20 cursor-not-allowed opacity-50 appearance-none"
                      style={{ WebkitAppearance: 'menulist' }}
                    >
                      <option>Select service type first</option>
                    </select>
                  </div>
                )}
                
                {/* Get Started Button */}
                <Button 
                  size="lg" 
                  onClick={() => {
                    // Build query parameters based on selections
                    const params = new URLSearchParams();
                    
                    // Add location filters if selected (state and/or city)
                    // This allows flexible searching - can search with just state, just city, or both
                    if (selectedState) {
                      params.append('state', selectedState);
                    }
                    if (selectedCity) {
                      params.append('city', selectedCity);
                    }
                    
                    // Navigate based on service type
                    // If service type is selected, navigate to the appropriate page
                    if (serviceType === 'venue') {
                      // Navigate to venues page with filters
                      // Venue type is optional - can search all venues in a state/city
                      if (selectedVenueType) {
                        params.append('type', selectedVenueType);
                      }
                      router.push(`/venues${params.toString() ? `?${params.toString()}` : ''}`);
                    } else if (serviceType === 'vendor') {
                      // Navigate to vendors page with category filter
                      // Vendor service is optional - can search all vendors in a state/city
                      if (selectedVendorService) {
                        const vendorService = vendorServices.find(s => s.value === selectedVendorService);
                        if (vendorService) {
                          params.append('category', vendorService.category);
                        }
                      }
                      router.push(`/vendors${params.toString() ? `?${params.toString()}` : ''}`);
                    } else {
                      // If no service type selected but location filters are present,
                      // default to venues page to show all venues in that location
                      // This allows searching with just state/city without selecting service type
                      router.push(`/venues${params.toString() ? `?${params.toString()}` : ''}`);
                    }
                  }}
                  className="bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-secondary-dark text-white py-3 px-8 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
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

      {/* Popular Venue Categories - Only show categories with images from provider-listed venues */}
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

          {/* Filter category cards to only show those with images */}
          {(() => {
            // Filter to only show categories that have images
            const categoriesWithImages = categoryCards.filter(category => category.hasImage);
            
            if (categoriesWithImages.length === 0) {
              return (
                <div className="text-center py-12">
                  <p className="text-gray-600">No venue categories available at the moment.</p>
                </div>
              );
            }
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categoriesWithImages.map((category, index) => {
                  const currentIndex = imageIndices[category.title] || 0;
                  
                  return (
                    <div 
                      key={index} 
                      className="group cursor-pointer"
                      onClick={() => handleCategoryClick(category.title)}
                    >
                      <div className="relative overflow-hidden rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-105">
                        <div className="relative overflow-hidden h-64 group-hover:scale-110 transition-transform duration-300">
                          <SwipeImageCarousel 
                            images={category.images} 
                            alt={category.title} 
                            priority={index === 0}
                            currentIndex={currentIndex}
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-6 left-6 text-white">
                          <h3 className="text-2xl font-bold mb-2">{category.title}</h3>
                          <p className="text-pink-200 font-medium">{category.venuesText}</p>
                          <p className="text-sm text-gray-300">{category.location}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
          
          {/* Browse more venues button - navigates to full venues page */}
          <div className="mt-10 flex justify-center">
            <Link href="/venues">
              <Button className="px-6">Browse more venues</Button>
            </Link>
          </div>
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