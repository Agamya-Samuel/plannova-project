'use client';

import Link from 'next/link';
import { Camera, Utensils, Video, Flower, Music, Heart } from 'lucide-react';
import type React from 'react';

// VendorTypesSection: Shows popular vendor categories as quick-access cards
// This keeps the Home page small and focused while allowing reuse elsewhere
export default function VendorTypesSection() {
  // Vendor types config with icons and destination links
  const vendorTypes: Array<{ name: string; href: string; icon: React.ReactElement; description: string }> = [
    { name: 'Photography', href: '/vendors?category=Photography', icon: <Camera className="h-6 w-6" />, description: 'Top wedding and event photographers' },
    { name: 'Catering', href: '/vendors?category=Catering', icon: <Utensils className="h-6 w-6" />, description: 'Cuisines and custom menus' },
    { name: 'Videography', href: '/vendors?category=Videography', icon: <Video className="h-6 w-6" />, description: 'Cinematic event films' },
    { name: 'Decoration', href: '/vendors?category=Decoration', icon: <Flower className="h-6 w-6" />, description: 'Themes and floral designs' },
    { name: 'Music & Entertainment', href: '/vendors?category=Music%20%26%20Entertainment', icon: <Music className="h-6 w-6" />, description: 'DJs, bands and performers' },
    { name: 'Makeup & Beauty', href: '/vendors?category=Makeup%20%26%20Beauty', icon: <Heart className="h-6 w-6" />, description: 'Bridal and party makeup' },
  ];

  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Popular Vendor Types</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Find trusted pros for every part of your event</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendorTypes.map((type) => (
            <Link
              key={type.name}
              href={type.href}
              className="group block bg-gray-50 hover:bg-white border border-gray-200 hover:border-pink-200 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-pink-50 text-pink-600 group-hover:bg-pink-100">
                  {type.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-pink-700">{type.name}</h3>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link href="/vendors" className="text-pink-600 font-semibold hover:underline">Browse all vendors →</Link>
        </div>
      </div>
    </div>
  );
}


