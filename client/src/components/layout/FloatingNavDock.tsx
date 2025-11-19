'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Calendar, Users, Home, FileText } from 'lucide-react';

// Navigation items for the floating dock
// These are the main quick-access navigation items
const dockItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Venues', href: '/venues', icon: MapPin },
  { label: 'Vendors', href: '/vendors', icon: Users },
  { label: 'Blog', href: '/blog', icon: FileText },
];

export default function FloatingNavDock() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();

  // Check if current route is active
  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    // Blog route: active when on /blog or any blog sub-route
    if (href === '/blog') {
      return pathname.startsWith('/blog');
    }
    return pathname.startsWith(href);
  };

  // Filter items based on user role if needed
  // For now, show all items but we can filter based on roles later
  const filteredItems = dockItems;

  // Show dock on ALL pages for ALL users in mobile view
  // Always visible - no scroll-based hiding, no auth page restrictions
  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden"
    >
      {/* Floating navigation dock container */}
      <nav className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl px-2 py-2 border border-gray-200/50">
        <div className="flex items-center gap-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center
                  px-4 py-2 rounded-xl
                  min-w-[60px] transition-all duration-200
                  ${isActive
                    ? 'bg-pink-50 text-pink-600'
                    : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50/50'
                  }
                `}
                title={item.label}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-pink-600' : 'text-gray-600'}`} />
                <span className="text-xs font-medium mt-1 hidden sm:block">
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Add My Bookings for authenticated customers */}
          {isAuthenticated && user?.role === 'CUSTOMER' && (
            <Link
              href="/bookings"
              className={`
                flex flex-col items-center justify-center
                px-4 py-2 rounded-xl
                min-w-[60px] transition-all duration-200
                ${isActiveRoute('/bookings')
                  ? 'bg-pink-50 text-pink-600'
                  : 'text-gray-600 hover:text-pink-600 hover:bg-pink-50/50'
                }
              `}
              title="My Bookings"
            >
              <Calendar className={`h-5 w-5 ${isActiveRoute('/bookings') ? 'text-pink-600' : 'text-gray-600'}`} />
              <span className="text-xs font-medium mt-1 hidden sm:block">
                Bookings
              </span>
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}

