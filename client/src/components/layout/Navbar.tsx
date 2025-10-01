'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { UserRole } from '../../types/auth';
import { Search, Menu, X, MapPin, Heart, Camera, Calendar, Users, Settings, ChevronDown, User, LogOut } from 'lucide-react';
import ProfileImage from '../ui/ProfileImage';

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsProfileOpen(false);
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                {/* Profile Dropdown Trigger */}
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  {/* Profile Image */}
                  <ProfileImage
                    src={user?.photoURL}
                    alt={`${user?.firstName} ${user?.lastName}`}
                    size="sm"
                    firstName={user?.firstName}
                    lastName={user?.lastName}
                    className="flex-shrink-0"
                  />
                  
                  {/* User Info */}
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-700">
                      {user?.firstName}
                    </p>
                    <p className="text-xs text-pink-600 font-medium">
                      {user?.role}
                    </p>
                  </div>
                  
                  {/* Dropdown Arrow */}
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-start space-x-3">
                        <ProfileImage
                          src={user?.photoURL}
                          alt={`${user?.firstName} ${user?.lastName}`}
                          size="md"
                          firstName={user?.firstName}
                          lastName={user?.lastName}
                          className="flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 truncate">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-sm text-gray-500 break-all leading-tight">
                            {user?.email}
                          </p>
                          <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold text-pink-600 bg-pink-100 rounded-full">
                            {user?.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        href="/dashboard"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Calendar className="h-4 w-4 mr-3" />
                        Dashboard
                      </Link>
                      
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User className="h-4 w-4 mr-3" />
                        Profile Settings
                      </Link>
                      
                      <Link
                        href="/settings"
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Account Settings
                      </Link>
                      
                      <hr className="my-2 border-gray-100" />
                      
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
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
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder-gray-500"
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
                <ProfileImage
                  src={user?.photoURL}
                  alt={`${user?.firstName} ${user?.lastName}`}
                  size="md"
                  firstName={user?.firstName}
                  lastName={user?.lastName}
                  className="mr-3"
                />
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