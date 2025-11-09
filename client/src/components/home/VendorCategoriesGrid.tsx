'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api';

interface ServiceImage { url: string; isPrimary?: boolean; }

// Minimal shapes for the different services; we only read a few fields
interface BaseService {
  _id: string;
  name: string;
  serviceLocation?: { city?: string; state?: string };
  rating?: number;
  images?: ServiceImage[];
}

type AnyService = BaseService;

// A single grid item ready to render
interface CategoryCardItem {
  title: string;
  images: string[]; // Array of images for this category
  countText: string;
  locationText?: string;
  hasImage: boolean;
  href: string;
}

// Renders service categories (Photography, Catering, etc.) as large image cards
// The layout and interactions mirror the Venue Categories grid from the homepage
// Enhanced with smooth swipe-like transitions and category-wise image cycling
export default function VendorCategoriesGrid() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [photography, setPhotography] = useState<AnyService[]>([]);
  const [catering, setCatering] = useState<AnyService[]>([]);
  const [videography, setVideography] = useState<AnyService[]>([]);
  const [decoration, setDecoration] = useState<AnyService[]>([]);
  const [entertainment, setEntertainment] = useState<AnyService[]>([]);
  const [bridalMakeup, setBridalMakeup] = useState<AnyService[]>([]);
  // Track current image index for each category
  const [imageIndices, setImageIndices] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [p, c, v, d, e, m] = await Promise.all([
          apiClient.get('/photography').catch(() => ({ data: { data: [] } })),
          apiClient.get('/catering').catch(() => ({ data: { data: [] } })),
          apiClient.get('/videography').catch(() => ({ data: { data: [] } })),
          apiClient.get('/decoration').catch(() => ({ data: { data: [] } })),
          apiClient.get('/entertainment').catch(() => ({ data: { data: [] } })),
          apiClient.get('/bridal-makeup').catch(() => ({ data: { data: [] } })),
        ]);
        setPhotography(Array.isArray(p?.data?.data) ? p.data.data : []);
        setCatering(Array.isArray(c?.data?.data) ? c.data.data : []);
        setVideography(Array.isArray(v?.data?.data) ? v.data.data : []);
        setDecoration(Array.isArray(d?.data?.data) ? d.data.data : []);
        setEntertainment(Array.isArray(e?.data?.data) ? e.data.data : []);
        setBridalMakeup(Array.isArray(m?.data?.data) ? m.data.data : []);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Build cards with all available images for each category
  const cards: CategoryCardItem[] = useMemo(() => {
    const build = (title: string, list: AnyService[], categoryParam: string): CategoryCardItem => {
      const count = list.length;
      // Extra safety: if backend returns mixed categories, narrow to matching ones when possible
      const maybeCategoryMatches = (item: AnyService): boolean => {
        const raw = item as unknown as Record<string, unknown>;
        const categoryLike: string = String(
          (raw as { category?: unknown }).category ??
          (raw as { serviceCategory?: unknown }).serviceCategory ??
          (raw as { serviceType?: unknown }).serviceType ??
          (raw as { type?: unknown }).type ??
          ''
        ).toLowerCase();
        if (!categoryLike) return true; // if unknown, don't exclude
        const t = title.toLowerCase();
        const p = categoryParam.toLowerCase();
        return categoryLike.includes(t) || categoryLike.includes(p);
      };

      const narrowed = list.filter(maybeCategoryMatches);
      const servicesWithImages = (narrowed.length ? narrowed : list).filter(s => (s.images?.length || 0) > 0);

      // Collect all images from all services in this category
      const allImages: string[] = [];
      let locationText = '';

      if (servicesWithImages.length > 0) {
        // Get first service for location (we'll use the first one found)
        const firstService = servicesWithImages[0];
        const city = firstService?.serviceLocation?.city || '';
        const state = firstService?.serviceLocation?.state || '';
        locationText = [city, state].filter(Boolean).join(', ');

        // Collect all images from all services, prioritizing primary images
        servicesWithImages.forEach(service => {
          const imgs = service.images || [];
          // Add primary images first, then others
          const primary = imgs.find(i => i.isPrimary);
          if (primary?.url) {
            allImages.push(primary.url);
          }
          imgs.forEach(img => {
            if (img.url && (!img.isPrimary || !primary)) {
              allImages.push(img.url);
            }
          });
        });

        // Remove duplicates while preserving order
        const uniqueImages = Array.from(new Set(allImages));
        return {
          title,
          images: uniqueImages,
          countText: uniqueImages.length > 0 ? `${count} Services` : 'Unavailable',
          locationText,
          hasImage: uniqueImages.length > 0,
          href: `/vendors?category=${encodeURIComponent(categoryParam)}`,
        };
      }

      return {
        title,
        images: [],
        countText: 'Unavailable',
        locationText: '',
        hasImage: false,
        href: `/vendors?category=${encodeURIComponent(categoryParam)}`,
      };
    };
    return [
      build('Photography', photography, 'Photography'),
      build('Catering', catering, 'Catering'),
      build('Videography', videography, 'Videography'),
      build('Decoration', decoration, 'Decoration'),
      build('Bridal Makeup', bridalMakeup, 'Makeup & Beauty'),
      build('Entertainment', entertainment, 'Music & Entertainment'),
    ];
  }, [photography, catering, videography, decoration, bridalMakeup, entertainment]);

  // Periodically cycle through images for each category with smooth transitions
  // Uses same pattern as venue section for consistency
  useEffect(() => {
    if (cards.length === 0) return;
    
    // Cycle images every 6 seconds to allow very slow, smooth transitions
    const INTERVAL_MS = 6000;
    const id = setInterval(() => {
      setImageIndices(prev => {
        const next = { ...prev };
        // Update each category's index based on available images
        cards.forEach(card => {
          if (card.images.length > 1) {
            next[card.title] = ((next[card.title] || 0) + 1) % card.images.length;
          }
        });
        return next;
      });
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [cards]);

  const handleClick = (href: string) => {
    router.push(href);
  };

  // Component for stable crossfade image transitions
  // Uses same logic as venue section - no remounting, no jitter
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

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Popular Service Categories</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Discover trusted professionals for every part of your event</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card, index) => {
            const currentIndex = imageIndices[card.title] || 0;
            
            return (
              <div
                key={card.title}
                className="group cursor-pointer"
                onClick={() => handleClick(card.href)}
              >
                <div className="relative overflow-hidden rounded-2xl shadow-lg">
                  {card.hasImage ? (
                    <div className="relative overflow-hidden h-64">
                      <SwipeImageCarousel 
                        images={card.images} 
                        alt={card.title} 
                        priority={index === 0}
                        currentIndex={currentIndex}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 font-semibold">No image available</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-6 left-6 text-white">
                    <h3 className="text-2xl font-bold mb-2">{card.title}</h3>
                    <p className="text-pink-200 font-medium">{loading ? 'Loading…' : card.countText}</p>
                    {card.locationText ? (
                      <p className="text-sm text-gray-300">{card.locationText}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <Button className="px-6" onClick={() => router.push('/vendors')}>Browse all services</Button>
        </div>
      </div>
    </div>
  );
}


