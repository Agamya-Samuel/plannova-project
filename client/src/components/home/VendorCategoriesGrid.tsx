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

  const cards: CategoryCardItem[] = useMemo(() => {
    const build = (title: string, list: AnyService[], categoryParam: string): CategoryCardItem => {
      const count = list.length;
      const cover = list.find(s => (s.images?.length || 0) > 0);
      const image = cover?.images?.find(i => i.isPrimary)?.url || cover?.images?.[0]?.url || '';
      const city = cover?.serviceLocation?.city || '';
      const state = cover?.serviceLocation?.state || '';
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
  }, [photography, catering, videography, decoration, bridalMakeup, entertainment]);

  const handleClick = (href: string) => {
    router.push(href);
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
                  <Image
                    src={card.image as string}
                    alt={card.title}
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


