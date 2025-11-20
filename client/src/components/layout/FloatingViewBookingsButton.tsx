'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, ArrowRight } from 'lucide-react';

/**
 * Floating "View Bookings" button component
 * Displays a pink floating button on mobile view that links to the appropriate bookings page
 * based on user role. Positioned above the navigation dock.
 * Only shows on dashboard and relevant pages, not on every page.
 */
export default function FloatingViewBookingsButton() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  // Don't show on auth pages or if user is not authenticated
  if (!isAuthenticated || !user || pathname?.startsWith('/auth')) {
    return null;
  }

  // Don't show on the bookings page itself
  if (pathname === '/bookings' || pathname === '/provider/bookings' || pathname === '/admin/bookings') {
    return null;
  }

  // Only show on specific pages: dashboard and provider/admin/staff dashboard pages
  // Don't show on public pages, venue/service detail pages, blog pages, etc.
  const allowedPaths = [
    '/dashboard',                    // Main dashboard
    '/provider/venues',               // Provider venues dashboard
    '/provider/catering',             // Provider catering dashboard
    '/provider/photography',          // Provider photography dashboard
    '/provider/videography',          // Provider videography dashboard
    '/provider/decoration',           // Provider decoration dashboard
    '/provider/entertainment',        // Provider entertainment dashboard
    '/provider/bridal-makeup',        // Provider bridal makeup dashboard
    '/provider/beauty',               // Provider beauty dashboard
    '/admin',                         // Admin dashboard
    '/admin/dashboard',               // Admin dashboard
    '/staff',                         // Staff pages
    '/staff/approvals',               // Staff approvals
    '/staff/providers',               // Staff providers
    '/staff/services',                // Staff services
  ];

  // Check if current path matches any allowed path
  const isAllowedPage = allowedPaths.some(path => pathname?.startsWith(path));

  // Only show on allowed pages
  if (!isAllowedPage) {
    return null;
  }

  // Determine the bookings route based on user role
  let bookingsRoute = '/bookings';
  if (user.role === 'PROVIDER') {
    bookingsRoute = '/provider/bookings';
  } else if (user.role === 'ADMIN' || user.role === 'STAFF') {
    bookingsRoute = '/admin/bookings';
  }

  return (
    <Link
      href={bookingsRoute}
      className="
        fixed bottom-24 left-1/2 -translate-x-1/2 z-50
        md:hidden
        bg-pink-600 hover:bg-pink-700
        text-white font-semibold
        px-6 py-3 rounded-2xl
        shadow-2xl
        flex items-center gap-2
        transition-all duration-300 ease-in-out
        hover:scale-105 active:scale-95
        whitespace-nowrap
      "
      title="View Bookings"
    >
      <Calendar className="h-5 w-5" />
      <span>View Bookings</span>
      <ArrowRight className="h-5 w-5" />
    </Link>
  );
}

