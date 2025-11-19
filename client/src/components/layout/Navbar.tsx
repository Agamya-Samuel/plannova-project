'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { UserRole, ServiceCategory } from '@/types/auth';
import { Search, Menu, X, MapPin, Heart, Camera, Calendar, Users, Settings, ChevronDown, User, LogOut, Utensils, Video, Flower, Music, FileText } from 'lucide-react';
import ProfileImage from '@/components/ui/ProfileImage';
import Image from 'next/image';

interface NavItem {
  label: string;
  href: string;
  roles?: UserRole[];
  icon?: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Venues', href: '/venues', icon: <MapPin className="h-4 w-4" /> },
  { label: 'Vendors', href: '/vendors', icon: <Users className="h-4 w-4" /> },
  { label: 'Blog', href: '/blog', icon: <FileText className="h-4 w-4" /> },
  { label: 'My Bookings', href: '/bookings', roles: ['CUSTOMER'], icon: <Calendar className="h-4 w-4" /> },
  // My Service dropdown will be added dynamically for providers
  // Approvals moved to Staff Dashboard card
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const desktopProfileRef = useRef<HTMLDivElement>(null);
  const mobileProfileRef = useRef<HTMLDivElement>(null);
  const servicesRef = useRef<HTMLDivElement>(null);

  // Handle button pop animation on click
  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    const target = e.currentTarget;
    target.classList.add('button-pop');
    setTimeout(() => {
      target.classList.remove('button-pop');
    }, 200);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsProfileOpen(false);
  };

  // Reliable navigation helper for mobile dropdown
  const navigate = (path: string) => {
    setIsProfileOpen(false);
    // Defer navigation to the next tick to avoid race with closing animations/state
    setTimeout(() => router.push(path), 0);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const targetNode = event.target as Node;
      const clickedInsideDesktop = desktopProfileRef.current?.contains(targetNode);
      const clickedInsideMobile = mobileProfileRef.current?.contains(targetNode);
      if (!clickedInsideDesktop && !clickedInsideMobile) setIsProfileOpen(false);
      if (servicesRef.current && !servicesRef.current.contains(event.target as Node)) {
        setIsServicesOpen(false);
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

  // Add service navigation item for providers
  const allNavItems = [...filteredNavItems];
  if (user?.role === 'PROVIDER') {
    // Insert the My Service dropdown at the correct position
    allNavItems.splice(5, 0, { 
      label: 'My Service', 
      href: '#', 
      roles: ['PROVIDER'], 
      icon: <Settings className="h-4 w-4" /> 
    });
  }

  const isActiveRoute = (href: string) => {
    if (href === '/provider/venues') {
      return pathname.startsWith('/provider/venues');
    }
    // Blog route: active when on /blog or any blog sub-route
    if (href === '/blog') {
      return pathname.startsWith('/blog');
    }
    return pathname === href;
  };

  // Service options for the dropdown
  const serviceOptions = [
    { id: 'venue', name: 'Venue Service', icon: <MapPin className="h-4 w-4" />, path: '/provider/venues' },
    { id: 'catering', name: 'Catering Service', icon: <Utensils className="h-4 w-4" />, path: '/provider/catering' },
    { id: 'photography', name: 'Photography Service', icon: <Camera className="h-4 w-4" />, path: '/provider/photography' },
    { id: 'videography', name: 'Videography Service', icon: <Video className="h-4 w-4" />, path: '/provider/videography' },
    { id: 'makeup', name: 'Bridal Makeup Service', icon: <Heart className="h-4 w-4" />, path: '/provider/beauty' },
    { id: 'decoration', name: 'Decoration Service', icon: <Flower className="h-4 w-4" />, path: '/provider/decoration' },
    { id: 'music', name: 'Music & Entertainment Service', icon: <Music className="h-4 w-4" />, path: '/provider/entertainment' },
  ];

  // Filter service options based on user's selected service categories
  const filteredServiceOptions = user?.serviceCategories 
    ? serviceOptions.filter(service => user.serviceCategories?.includes(service.id as ServiceCategory))
    : serviceOptions;

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between items-center h-16">
          {/* Mobile: Left - Hamburger (reserve space; hide visually when profile menu open) */}
          <div className="lg:hidden flex items-center w-10 justify-start">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-pink-600 hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-pink-500`}
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
          {/* Logo - Left */}
          <div className="hidden lg:flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <div className="flex items-center space-x-2">
                <Image 
                  src="https://cdn-prod.plannova.in/logo/plannova-logo.svg" 
                  alt="Plannova Logo" 
                  width={64}
                  height={64}
                  priority
                  className="h-8 w-auto"
                />
                <span className="ml-2 text-xl font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Plannova</span>
              </div>
            </Link>
          </div>

          {/* Logo - Center (Mobile) */}
          <div className="lg:hidden absolute left-1/2 -translate-x-1/2">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <div className="flex items-center space-x-2">
                <Image 
                  src="https://cdn-prod.plannova.in/logo/plannova-logo.svg" 
                  alt="Plannova Logo" 
                  width={64}
                  height={64}
                  priority
                  className="h-8 w-auto"
                />
                <span className="ml-1 text-lg font-semibold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Plannova</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Center */}
          <div className="hidden lg:flex lg:space-x-1 flex-1 justify-center">
            {allNavItems.map((item, index) => {
                // Special handling for the My Service dropdown
                if (item.label === 'My Service' && user?.role === 'PROVIDER') {
                  return (
                    <div key={index} className="relative" ref={servicesRef}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setIsServicesOpen(!isServicesOpen);
                        }}
                        className="flex items-center space-x-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-gray-700 hover:text-pink-600 hover:bg-pink-50"
                      >
                        {item.icon}
                        <span>{item.label}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isServicesOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isServicesOpen && (
                        <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Select a service</p>
                          </div>
                          <div className="max-h-96 overflow-y-auto">
                            {filteredServiceOptions.map((service) => (
                              <Link
                                key={service.id}
                                href={service.path}
                                className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                                onClick={() => setIsServicesOpen(false)}
                              >
                                <div className="flex items-center space-x-3">
                                  {service.icon}
                                  <span>{service.name}</span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                const isActive = isActiveRoute(item.href);
                return (
                  <Link
                    key={index}
                    href={item.href}
                    className={`flex items-center space-x-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-pink-600 bg-pink-50 border-b-2 border-pink-600'
                        : 'text-gray-700 hover:text-pink-600 hover:bg-pink-50'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
            })}
          </div>

          {/* Desktop Auth Section - Right */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            {isAuthenticated ? (
              <div className="relative" ref={desktopProfileRef}>
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
                    {/* Role as a tag/badge */}
                    <span className="inline-block mt-0.5 px-2 py-0.5 text-xs font-semibold text-pink-600 bg-pink-100 rounded-full">
                      {user?.role}
                    </span>
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
                      {user?.role === 'ADMIN' && (
                        <Link
                          href="/admin/page-settings"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Settings className="h-4 w-4 mr-3" />
                          Page Settings
                        </Link>
                      )}
                      
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
                <Link href="/auth/login" onClick={handleButtonClick}>
                  <Button
                    size="sm"
                    className={`${
                      pathname?.includes('/auth/login')
                        ? 'bg-blue-100 border-blue-500 text-blue-800 shadow-inner'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700'
                    } active:bg-blue-100 active:border-blue-500 active:text-blue-800 focus:bg-blue-50 focus:border-blue-400 focus:text-blue-700 shadow-sm hover:shadow-md active:shadow-inner rounded-lg px-5 py-2 font-medium transition-all duration-200`}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register" onClick={handleButtonClick}>
                  <Button
                    size="sm"
                    className={`${
                      pathname?.includes('/auth/register')
                        ? 'bg-gradient-to-r from-pink-700 to-purple-700 shadow-inner'
                        : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700'
                    } text-white shadow-md hover:shadow-lg rounded-lg px-5 py-2 font-medium transition-all duration-200`}
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile: Right - Profile/Login with dropdown */}
          <div className="lg:hidden flex items-center w-10 justify-end relative" ref={mobileProfileRef}>
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setIsProfileOpen(!isProfileOpen);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="p-1 rounded-full hover:bg-gray-50"
                >
                  <ProfileImage
                    src={user?.photoURL}
                    alt={`${user?.firstName} ${user?.lastName}`}
                    size="sm"
                    firstName={user?.firstName}
                    lastName={user?.lastName}
                    className="flex-shrink-0"
                  />
                </button>
                {isProfileOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 origin-top-right"
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                  >
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
                    <div className="py-2">
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full text-left flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                      >
                        <Calendar className="h-4 w-4 mr-3" />
                        Dashboard
                      </button>
                      <button
                        onClick={() => navigate('/profile')}
                        className="w-full text-left flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                      >
                        <User className="h-4 w-4 mr-3" />
                        Profile Settings
                      </button>
                      <button
                        onClick={() => navigate('/settings')}
                        className="w-full text-left flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Account Settings
                      </button>
                      {user?.role === 'ADMIN' && (
                        <button
                          onClick={() => navigate('/admin/page-settings')}
                          className="w-full text-left flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                        >
                          <Settings className="h-4 w-4 mr-3" />
                          Page Settings
                        </button>
                      )}
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsProfileOpen(false);
                        }}
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
              <Link href="/auth/login" className="p-2 rounded-lg text-gray-600 hover:text-pink-600 hover:bg-pink-50">
                <User className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer menu - slides from left, covers ~70% width */}
      {/* Overlay */}
      <div className={`${isOpen ? 'fixed' : 'hidden'} lg:hidden inset-0 z-[60]`}>
        <button
          aria-label="Close menu"
          onClick={() => setIsOpen(false)}
          className="absolute inset-0 bg-black/40"
        />
      </div>

      {/* Drawer Panel */}
      <div
        className={`lg:hidden fixed inset-y-0 left-0 z-[61] w-[72vw] max-w-sm transform bg-white shadow-2xl border-r border-gray-200 transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <span className="text-base font-semibold text-gray-800">Menu</span>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-2 text-gray-600 hover:text-pink-600 hover:bg-pink-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="px-4 pt-4 pb-8 overflow-y-auto h-full space-y-3">
          {/* Mobile Search */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search venues, vendors..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            />
          </div>

          {allNavItems.map((item, index) => {
            // Special handling for the My Service dropdown on mobile
            if (item.label === 'My Service' && user?.role === 'PROVIDER') {
              return (
                <div key={index}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setIsServicesOpen(!isServicesOpen);
                    }}
                    className="flex items-center justify-between w-full px-4 py-3 rounded-xl font-medium text-gray-700 hover:text-pink-600 hover:bg-pink-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isServicesOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isServicesOpen && (
                    <div className="pl-8 pr-4 py-2 space-y-1">
                      {filteredServiceOptions.map((service) => (
                        <Link
                          key={service.id}
                          href={service.path}
                          className="block px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                          onClick={() => {
                            setIsServicesOpen(false);
                            setIsOpen(false);
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            {service.icon}
                            <span>{service.name}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = isActiveRoute(item.href);
            return (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActive
                    ? 'text-pink-600 bg-pink-50 border-l-4 border-pink-600'
                    : 'text-gray-700 hover:text-pink-600 hover:bg-pink-50'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}

          {isAuthenticated ? (
            <></>
          ) : (
            <div className="border-t border-gray-200 pt-4 mt-2 space-y-3 px-4">
              <Link
                href="/auth/login"
                className={`block px-6 py-3 rounded-lg text-base font-medium text-center transition-all duration-200 ${
                  pathname?.includes('/auth/login')
                    ? 'bg-blue-100 border border-blue-500 text-blue-800 shadow-inner'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 active:bg-blue-100 active:border-blue-500 active:text-blue-800 shadow-sm hover:shadow-md active:shadow-inner'
                }`}
                onClick={(e) => {
                  handleButtonClick(e);
                  setIsOpen(false);
                }}
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className={`block px-6 py-3 rounded-lg text-base font-medium text-white text-center transition-all duration-200 ${
                  pathname?.includes('/auth/register')
                    ? 'bg-gradient-to-r from-pink-700 to-purple-700 shadow-inner'
                    : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 shadow-md hover:shadow-lg'
                }`}
                onClick={(e) => {
                  handleButtonClick(e);
                  setIsOpen(false);
                }}
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