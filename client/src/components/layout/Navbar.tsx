'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { UserRole } from '../../types/auth';
import { Search, Menu, X, MapPin, Star, Heart, Camera, Calendar, Users, Settings } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  roles?: UserRole[];
  icon?: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Venues', href: '/venues', icon: <MapPin className="h-4 w-4" /> },
  { label: 'Vendors', href: '/vendors', roles: ['CUSTOMER', 'PROVIDER', 'ADMIN'], icon: <Users className="h-4 w-4" /> },
  { label: 'Photos', href: '/photos', icon: <Camera className="h-4 w-4" /> },
  { label: 'Real Weddings', href: '/real-weddings', icon: <Heart className="h-4 w-4" /> },
  { label: 'My Bookings', href: '/bookings', roles: ['CUSTOMER'], icon: <Calendar className="h-4 w-4" /> },
  { label: 'My Venues', href: '/provider/venues', roles: ['PROVIDER'], icon: <Settings className="h-4 w-4" /> },
  { label: 'Admin Panel', href: '/admin', roles: ['ADMIN'], icon: <Settings className="h-4 w-4" /> },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    if (!isAuthenticated) return false;
    return item.roles.includes(user?.role as UserRole);
  });

  return (
    <nav className="bg-white shadow-lg border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-pink-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  Plannova
                </span>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:ml-8 lg:flex lg:space-x-1">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-1 text-gray-700 hover:text-pink-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-pink-50"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input 
                type="text" 
                placeholder="Search venues, vendors..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user?.firstName?.charAt(0)}
                    </span>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-700 font-medium">
                      Hello, {user?.firstName}
                    </p>
                    <p className="text-xs text-pink-600 font-medium">
                      {user?.role}
                    </p>
                  </div>
                </div>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="border-pink-200 text-pink-600 hover:bg-pink-50">
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-600 hover:text-pink-600">
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" className="text-gray-700 hover:text-pink-600">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-2">
            {/* Mobile Search */}
            <button className="p-2 rounded-lg text-gray-600 hover:text-pink-600 hover:bg-pink-50">
              <Search className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-pink-600 hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pink-500"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isOpen ? 'block' : 'hidden'} lg:hidden bg-white border-t border-gray-200`}>
        <div className="px-4 pt-4 pb-6 space-y-3">
          {/* Mobile Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input 
              type="text" 
              placeholder="Search venues, vendors..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          
          {filteredNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center space-x-3 text-gray-700 hover:text-pink-600 block px-4 py-3 rounded-xl font-medium hover:bg-pink-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          
          {isAuthenticated ? (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center px-4 py-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-semibold">
                    {user?.firstName?.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="text-base font-medium text-gray-800">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{user?.email}</div>
                  <div className="mt-1">
                    <span className="px-2 py-1 text-xs font-semibold text-pink-600 bg-pink-100 rounded-full">
                      {user?.role}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 px-4">
                <Link
                  href="/dashboard"
                  className="block px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="block w-full text-left px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-200 pt-4 mt-4 space-y-2 px-4">
              <Link
                href="/auth/login"
                className="block px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="block px-4 py-3 rounded-xl text-base font-medium text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 transition-colors text-center"
                onClick={() => setIsOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}