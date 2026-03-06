'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Calendar, Users, FileText, LayoutDashboard } from 'lucide-react';
import { UserRole } from '@/types/auth';

// Navigation items matching the Navbar exactly
// These are the same items shown in the main navigation bar
const baseDockItems = [
  { label: 'Venues', href: '/venues', icon: MapPin },
  { label: 'Vendors', href: '/vendors', icon: Users },
  { label: 'Blog', href: '/blog', icon: FileText },
];

// Role-specific items that match the Navbar
// Dashboard is added for all authenticated users
const roleSpecificItems: Record<UserRole, Array<{ label: string; href: string; icon: typeof Calendar | typeof LayoutDashboard }>> = {
  CUSTOMER: [
    { label: 'My Bookings', href: '/bookings', icon: Calendar },
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ],
  PROVIDER: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ],
  ADMIN: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ],
  STAFF: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ],
};

export default function FloatingNavDock() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();

  // Check if current route is active
  // This helps highlight the active navigation item
  // Matches the logic from Navbar component
  const isActiveRoute = (href: string) => {
    // Blog route: active when on /blog or any blog sub-route
    if (href === '/blog') {
      return pathname.startsWith('/blog');
    }
    // Dashboard route: active when on /dashboard or any dashboard sub-route
    if (href === '/dashboard') {
      return pathname.startsWith('/dashboard');
    }
    // Bookings route: active when on the bookings page
    if (href === '/bookings') {
      return pathname === '/bookings' || pathname.startsWith('/bookings/');
    }
    // For other routes, check if pathname starts with the href
    return pathname.startsWith(href);
  };

  // Build the complete list of navigation items based on user role
  // This ensures the dock shows the right items for each user type
  const allDockItems = useMemo(() => {
    // Start with base items (always shown)
    const items = [...baseDockItems];
    
    // Add role-specific items if user is authenticated
    if (isAuthenticated && user?.role) {
      const roleItems = roleSpecificItems[user.role] || [];
      items.push(...roleItems);
    }
    
    return items;
  }, [user, isAuthenticated]);

  // Show dock on ALL pages for ALL users in mobile view
  // Always visible - no scroll-based hiding, no auth page restrictions
  // The dock is centered using left-1/2 and -translate-x-1/2 which works
  // regardless of the number of items, as it centers the entire container
  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden"
    >
      {/* Floating navigation dock container */}
      {/* The container is centered, and items are flexed inside, so it stays centered */}
      <nav className="bg-white/95 backdrop-blur-md shadow-2xl rounded-2xl px-2 py-2 border border-gray-200/50">
        <div className="flex items-center gap-1 justify-center">
          {allDockItems.map((item) => {
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
        </div>
      </nav>
    </div>
  );
}

