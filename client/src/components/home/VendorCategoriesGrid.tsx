'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
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
  image?: string;
  countText: string;
  locationText?: string;
  hasImage: boolean;
  href: string;
}

// Renders service categories (Photography, Catering, etc.) as large image cards
// The layout and interactions mirror the Venue Categories grid from the homepage
export default function VendorCategoriesGrid() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [photography, setPhotography] = useState<AnyService[]>([]);
  const [catering, setCatering] = useState<AnyService[]>([]);
  const [videography, setVideography] = useState<AnyService[]>([]);
  const [decoration, setDecoration] = useState<AnyService[]>([]);
  const [entertainment, setEntertainment] = useState<AnyService[]>([]);
  const [bridalMakeup, setBridalMakeup] = useState<AnyService[]>([]);
  // Ticks to reshuffle displayed images periodically
  const [shuffleTick, setShuffleTick] = useState(0);

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

  // Periodically reshuffle images so cards update automatically
  useEffect(() => {
    // Do nothing if nothing is loaded yet
    const anyLoaded = [photography, catering, videography, decoration, entertainment, bridalMakeup].some(
      arr => Array.isArray(arr) && arr.length > 0
    );
    if (!anyLoaded) return;
    const INTERVAL_MS = 2000; // faster changes: every 2s
    const id = setInterval(() => setShuffleTick(t => t + 1), INTERVAL_MS);
    return () => clearInterval(id);
  }, [photography, catering, videography, decoration, entertainment, bridalMakeup]);

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

      let chosenService: AnyService | undefined;
      let image = '';

      if (servicesWithImages.length > 0) {
        // Pick a random service that has images
        const randomServiceIndex = (Math.floor(Math.random() * servicesWithImages.length) + shuffleTick) % servicesWithImages.length;
        chosenService = servicesWithImages[randomServiceIndex];

        const imgs = chosenService.images || [];
        // If multiple photos exist, pick a random one; otherwise fall back to primary/first
        const primary = imgs.find(i => i.isPrimary)?.url;
        if (imgs.length > 1) {
          const randomImageIndex = (Math.floor(Math.random() * imgs.length) + shuffleTick) % imgs.length;
          image = imgs[randomImageIndex]?.url || primary || imgs[0]?.url || '';
        } else {
          image = primary || imgs[0]?.url || '';
        }
      }

      const city = chosenService?.serviceLocation?.city || '';
      const state = chosenService?.serviceLocation?.state || '';
      const locationText = [city, state].filter(Boolean).join(', ');
      return {
        title,
        image,
        countText: image ? `${count} Services` : 'Unavailable',
        locationText,
        hasImage: Boolean(image),
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
  }, [photography, catering, videography, decoration, bridalMakeup, entertainment, shuffleTick]);

  const handleClick = (href: string) => {
    router.push(href);
  };

  // Small helper to crossfade images when src changes
  const CrossfadeImage = ({ src, alt, priority }: { src: string; alt: string; priority?: boolean }) => {
    const [currentSrc, setCurrentSrc] = useState(src);
    const [nextSrc, setNextSrc] = useState<string | null>(null);
    const [fading, setFading] = useState(false);

    useEffect(() => {
      if (src && src !== currentSrc) {
        setNextSrc(src);
        setFading(true);
      }
    }, [src, currentSrc]);

    // When the overlaid image loads, complete the crossfade and commit the src
    const handleNewImageLoaded = () => {
      setCurrentSrc(nextSrc as string);
      setFading(false);
      setNextSrc(null);
    };

    return (
      <div className="w-full h-64 relative">
          <Image
          src={currentSrc}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover absolute inset-0"
          priority={priority}
        />
        {nextSrc ? (
          <Image
            src={nextSrc}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`object-cover absolute inset-0 transition-opacity duration-200 ${fading ? 'opacity-0 animate-[fadeIn_200ms_ease_forwards]' : ''}`}
            onLoadingComplete={handleNewImageLoaded}
            priority={priority}
          />
        ) : null}
        {/* Tailwind keyframes for the quick fade-in */}
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
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
          {cards.map((card, index) => (
            <div
              key={card.title}
              className="group cursor-pointer"
              onClick={() => handleClick(card.href)}
            >
              <div className="relative overflow-hidden rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-105">
                {card.hasImage ? (
                  <div className="relative overflow-hidden">
                    <div className="group-hover:scale-110 transition-transform duration-300">
                      <CrossfadeImage src={card.image as string} alt={card.title} priority={index === 0} />
                    </div>
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
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Button className="px-6" onClick={() => router.push('/vendors')}>Browse all services</Button>
        </div>
      </div>
    </div>
  );
}


