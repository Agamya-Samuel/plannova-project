'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Calendar, Heart, MapPin, MessageCircle, Settings, Star, TrendingUp, Users, Camera, BarChart3, Clock, CheckCircle, Utensils, Video, Music, Flower } from 'lucide-react';
import { useRouter } from 'next/navigation';
import MobileNumberAlertDialog from '@/components/auth/MobileNumberAlertDialog';
import apiClient from '@/lib/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [showMobileAlert, setShowMobileAlert] = useState(false);

  // Check if user needs to provide mobile number
  useEffect(() => {
    console.log('Dashboard useEffect triggered', { user });
    
    // Only show the alert if user is authenticated and doesn't have a phone number
    if (user && !user.phone) {
      console.log('User does not have phone number, showing alert');
      setShowMobileAlert(true);
    } else if (user && user.phone) {
      console.log('User has phone number, hiding alert if it was shown');
      setShowMobileAlert(false);
    }
  }, [user]);

  const renderDashboardContent = () => {
    switch (user?.role) {
      case 'CUSTOMER':
        return <CustomerDashboard />;
      case 'PROVIDER':
        return <ProviderDashboard />;
      case 'ADMIN':
        return <AdminDashboard />;
      default:
        return <div>Invalid user role</div>;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 bg-gradient-to-r from-pink-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    Welcome back, {user?.firstName}! 👋
                  </h1>
                  <p className="text-pink-100 text-lg">
                    {getRoleMessage(user?.role || undefined)}
                  </p>
                </div>
                <div className="hidden md:block">
                  {user?.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={`${user.firstName} ${user.lastName}`}
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full border-4 border-white/30 object-cover shadow-lg"
                      onError={(e) => {
                        console.log('Dashboard profile image failed to load:', user.photoURL);
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.setAttribute('style', 'display: flex');
                      }}
                    />
                  ) : null}
                  <div 
                    className={`w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30 shadow-lg ${user?.photoURL ? 'hidden' : ''}`}
                  >
                    <span className="text-2xl font-bold">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {renderDashboardContent()}
        </div>
        
        <MobileNumberAlertDialog
          isOpen={showMobileAlert}
          onClose={() => setShowMobileAlert(false)}
          userDisplayName={user?.firstName || 'there'}
        />
      </div>
    </ProtectedRoute>
  );
}

function getRoleMessage(role?: string) {
  switch (role) {
    case 'CUSTOMER':
      return "Let's find the perfect venue for your perfect event";
    case 'PROVIDER':
      return "Manage your service offerings and connect with clients";
    case 'ADMIN':
      return "Oversee the platform and support our community";
    default:
      return "Welcome to Plannova!";
  }
}

function CustomerDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <DashboardCard
        title="My Bookings"
        description="View and manage your event venue bookings"
        icon={<Calendar className="h-8 w-8 text-pink-600" />}
        action="View Bookings"
        href="/bookings"
        stats="3 Active"
        color="pink"
      />
      <DashboardCard
        title="Browse Venues"
        description="Discover beautiful event venues for your special occasion"
        icon={<MapPin className="h-8 w-8 text-purple-600" />}
        action="Browse Venues"
        href="/venues"
        stats="500+ Available"
        color="purple"
      />
      <DashboardCard
        title="Favorites"
        description="Your saved venues and wishlists"
        icon={<Heart className="h-8 w-8 text-red-500" />}
        action="View Favorites"
        href="/favorites"
        stats="12 Saved"
        color="red"
      />
      <DashboardCard
        title="Messages"
        description="Communication with venue providers"
        icon={<MessageCircle className="h-8 w-8 text-blue-600" />}
        action="View Messages"
        href="/messages"
        stats="2 New"
        color="blue"
      />
      <DashboardCard
        title="Profile"
        description="Update your personal information"
        icon={<Settings className="h-8 w-8 text-gray-600" />}
        action="Edit Profile"
        href="/profile"
        stats="85% Complete"
        color="gray"
      />
      <DashboardCard
        title="Reviews"
        description="Your reviews and ratings"
        icon={<Star className="h-8 w-8 text-yellow-500" />}
        action="View Reviews"
        href="/reviews"
        stats="5 Reviews"
        color="yellow"
      />
    </div>
  );
}

function ProviderDashboard() {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect to onboarding if provider hasn't selected service categories yet
  useEffect(() => {
    if (user?.role === 'PROVIDER' && (!user.serviceCategories || user.serviceCategories.length === 0)) {
      router.push('/provider/onboarding');
    }
  }, [user, router]);

  // If user hasn't completed onboarding, show nothing while redirecting
  if (user?.role === 'PROVIDER' && (!user.serviceCategories || user.serviceCategories.length === 0)) {
    return null;
  }

  // If user has a service category selected, show the relevant dashboard
  if (user?.role === 'PROVIDER' && user.serviceCategories && user.serviceCategories.length > 0) {
    const selectedService = user.serviceCategories[0]; // Only one service category allowed
    return <ServiceSpecificDashboard serviceType={selectedService} />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900">24</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +12% this month
              </p>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-pink-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Revenue</p>
              <p className="text-3xl font-bold text-gray-900">₹8.4L</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +18% this month
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Rating</p>
              <p className="text-3xl font-bold text-gray-900">4.8</p>
              <p className="text-sm text-blue-600 flex items-center mt-1">
                <Star className="h-4 w-4 mr-1" />
                156 reviews
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Response Time</p>
              <p className="text-3xl font-bold text-gray-900">2h</p>
              <p className="text-sm text-purple-600 flex items-center mt-1">
                <Clock className="h-4 w-4 mr-1" />
                Very Good
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="My Venues"
          description="Manage your event venues and listings"
          icon={<MapPin className="h-8 w-8 text-pink-600" />}
          action="Manage Venues"
          href="/provider/venues"
          stats="3 Active"
          color="pink"
        />
        <DashboardCard
          title="Bookings"
          description="View and manage incoming booking requests"
          icon={<Calendar className="h-8 w-8 text-purple-600" />}
          action="View Bookings"
          href="/provider/bookings"
          stats="8 Pending"
          color="purple"
        />
        <DashboardCard
          title="Calendar"
          description="Check availability and schedule events"
          icon={<Calendar className="h-8 w-8 text-blue-600" />}
          action="View Calendar"
          href="/provider/calendar"
          stats="Next: Tomorrow"
          color="blue"
        />
        <DashboardCard
          title="Analytics"
          description="Track your venue performance and bookings"
          icon={<BarChart3 className="h-8 w-8 text-green-600" />}
          action="View Analytics"
          href="/provider/analytics"
          stats="+18% Growth"
          color="green"
        />
        <DashboardCard
          title="Messages"
          description="Communicate with potential customers"
          icon={<MessageCircle className="h-8 w-8 text-orange-600" />}
          action="View Messages"
          href="/provider/messages"
          stats="5 New"
          color="orange"
        />
        <DashboardCard
          title="Settings"
          description="Manage your business profile and settings"
          icon={<Settings className="h-8 w-8 text-gray-600" />}
          action="Settings"
          href="/provider/settings"
          stats="Profile 90%"
          color="gray"
        />
      </div>
    </div>
  );
}

function ServiceSpecificDashboard({ serviceType }: { serviceType: string }) {
  const getServiceDashboard = () => {
    switch (serviceType) {
      case 'venue':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard
              title="My Venues"
              description="Manage your event venues and listings"
              icon={<MapPin className="h-8 w-8 text-pink-600" />}
              action="Manage Venues"
              href="/provider/venues"
              stats="3 Active"
              color="pink"
            />
            <DashboardCard
              title="Venue Bookings"
              description="View and manage incoming booking requests"
              icon={<Calendar className="h-8 w-8 text-purple-600" />}
              action="View Bookings"
              href="/provider/bookings"
              stats="8 Pending"
              color="purple"
            />
            <DashboardCard
              title="Venue Calendar"
              description="Check availability and schedule events"
              icon={<Calendar className="h-8 w-8 text-blue-600" />}
              action="View Calendar"
              href="/provider/calendar"
              stats="Next: Tomorrow"
              color="blue"
            />
            <DashboardCard
              title="Venue Analytics"
              description="Track your venue performance and bookings"
              icon={<BarChart3 className="h-8 w-8 text-green-600" />}
              action="View Analytics"
              href="/provider/analytics"
              stats="+18% Growth"
              color="green"
            />
            <DashboardCard
              title="Venue Messages"
              description="Communicate with potential customers"
              icon={<MessageCircle className="h-8 w-8 text-orange-600" />}
              action="View Messages"
              href="/provider/messages"
              stats="5 New"
              color="orange"
            />
            <DashboardCard
              title="Venue Settings"
              description="Manage your business profile and settings"
              icon={<Settings className="h-8 w-8 text-gray-600" />}
              action="Settings"
              href="/provider/settings"
              stats="Profile 90%"
              color="gray"
            />
          </div>
        );
      case 'catering':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard
              title="Catering Services"
              description="Manage your catering packages and menus"
              icon={<Utensils className="h-8 w-8 text-blue-600" />}
              action="Manage Catering"
              href="/provider/catering"
              stats="5 Packages"
              color="blue"
            />
            <DashboardCard
              title="Catering Bookings"
              description="View and manage catering booking requests"
              icon={<Calendar className="h-8 w-8 text-purple-600" />}
              action="View Bookings"
              href="/provider/catering/bookings"
              stats="3 Pending"
              color="purple"
            />
            <DashboardCard
              title="Catering Menu"
              description="Create and manage your catering menus"
              icon={<Utensils className="h-8 w-8 text-green-600" />}
              action="Manage Menus"
              href="/provider/catering/menus"
              stats="12 Items"
              color="green"
            />
            <DashboardCard
              title="Catering Analytics"
              description="Track your catering performance and revenue"
              icon={<BarChart3 className="h-8 w-8 text-yellow-600" />}
              action="View Analytics"
              href="/provider/catering/analytics"
              stats="+12% Growth"
              color="yellow"
            />
            <DashboardCard
              title="Catering Messages"
              description="Communicate with potential customers"
              icon={<MessageCircle className="h-8 w-8 text-orange-600" />}
              action="View Messages"
              href="/provider/catering/messages"
              stats="2 New"
              color="orange"
            />
            <DashboardCard
              title="Catering Settings"
              description="Manage your catering business profile"
              icon={<Settings className="h-8 w-8 text-gray-600" />}
              action="Settings"
              href="/provider/catering/settings"
              stats="Profile 85%"
              color="gray"
            />
          </div>
        );
      case 'photography':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard
              title="Photography Services"
              description="Manage your photography packages and portfolio"
              icon={<Camera className="h-8 w-8 text-purple-600" />}
              action="Manage Photography"
              href="/provider/photography"
              stats="15 Packages"
              color="purple"
            />
            <DashboardCard
              title="Photography Bookings"
              description="View and manage photography booking requests"
              icon={<Calendar className="h-8 w-8 text-pink-600" />}
              action="View Bookings"
              href="/provider/photography/bookings"
              stats="4 Pending"
              color="pink"
            />
            <DashboardCard
              title="Photo Gallery"
              description="Manage your photography portfolio and galleries"
              icon={<Camera className="h-8 w-8 text-blue-600" />}
              action="Manage Gallery"
              href="/provider/photography/gallery"
              stats="42 Photos"
              color="blue"
            />
            <DashboardCard
              title="Photography Analytics"
              description="Track your photography performance and revenue"
              icon={<BarChart3 className="h-8 w-8 text-green-600" />}
              action="View Analytics"
              href="/provider/photography/analytics"
              stats="+8% Growth"
              color="green"
            />
            <DashboardCard
              title="Photography Messages"
              description="Communicate with potential customers"
              icon={<MessageCircle className="h-8 w-8 text-orange-600" />}
              action="View Messages"
              href="/provider/photography/messages"
              stats="3 New"
              color="orange"
            />
            <DashboardCard
              title="Photography Settings"
              description="Manage your photography business profile"
              icon={<Settings className="h-8 w-8 text-gray-600" />}
              action="Settings"
              href="/provider/photography/settings"
              stats="Profile 92%"
              color="gray"
            />
          </div>
        );
      case 'videography':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard
              title="Videography Services"
              description="Manage your videography packages and portfolio"
              icon={<Video className="h-8 w-8 text-blue-600" />}
              action="Manage Videography"
              href="/provider/videography"
              stats="8 Packages"
              color="blue"
            />
            <DashboardCard
              title="Videography Bookings"
              description="View and manage videography booking requests"
              icon={<Calendar className="h-8 w-8 text-purple-600" />}
              action="View Bookings"
              href="/provider/videography/bookings"
              stats="2 Pending"
              color="purple"
            />
            <DashboardCard
              title="Video Gallery"
              description="Manage your videography portfolio and reels"
              icon={<Video className="h-8 w-8 text-pink-600" />}
              action="Manage Gallery"
              href="/provider/videography/gallery"
              stats="18 Videos"
              color="pink"
            />
            <DashboardCard
              title="Videography Analytics"
              description="Track your videography performance and revenue"
              icon={<BarChart3 className="h-8 w-8 text-green-600" />}
              action="View Analytics"
              href="/provider/videography/analytics"
              stats="+15% Growth"
              color="green"
            />
            <DashboardCard
              title="Videography Messages"
              description="Communicate with potential customers"
              icon={<MessageCircle className="h-8 w-8 text-orange-600" />}
              action="View Messages"
              href="/provider/videography/messages"
              stats="1 New"
              color="orange"
            />
            <DashboardCard
              title="Videography Settings"
              description="Manage your videography business profile"
              icon={<Settings className="h-8 w-8 text-gray-600" />}
              action="Settings"
              href="/provider/videography/settings"
              stats="Profile 78%"
              color="gray"
            />
          </div>
        );
      case 'music':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard
              title="Entertainment Services"
              description="Manage your music and entertainment packages"
              icon={<Music className="h-8 w-8 text-green-600" />}
              action="Manage Entertainment"
              href="/provider/entertainment"
              stats="7 Packages"
              color="green"
            />
            <DashboardCard
              title="Entertainment Bookings"
              description="View and manage entertainment booking requests"
              icon={<Calendar className="h-8 w-8 text-blue-600" />}
              action="View Bookings"
              href="/provider/entertainment/bookings"
              stats="5 Pending"
              color="blue"
            />
            <DashboardCard
              title="Performance Portfolio"
              description="Manage your performance portfolio and demos"
              icon={<Music className="h-8 w-8 text-purple-600" />}
              action="Manage Portfolio"
              href="/provider/entertainment/portfolio"
              stats="12 Demos"
              color="purple"
            />
            <DashboardCard
              title="Entertainment Analytics"
              description="Track your entertainment performance and revenue"
              icon={<BarChart3 className="h-8 w-8 text-yellow-600" />}
              action="View Analytics"
              href="/provider/entertainment/analytics"
              stats="+22% Growth"
              color="yellow"
            />
            <DashboardCard
              title="Entertainment Messages"
              description="Communicate with potential customers"
              icon={<MessageCircle className="h-8 w-8 text-orange-600" />}
              action="View Messages"
              href="/provider/entertainment/messages"
              stats="4 New"
              color="orange"
            />
            <DashboardCard
              title="Entertainment Settings"
              description="Manage your entertainment business profile"
              icon={<Settings className="h-8 w-8 text-gray-600" />}
              action="Settings"
              href="/provider/entertainment/settings"
              stats="Profile 88%"
              color="gray"
            />
          </div>
        );
      case 'makeup':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard
              title="Beauty Services"
              description="Manage your makeup and beauty packages"
              icon={<Heart className="h-8 w-8 text-red-500" />}
              action="Manage Beauty"
              href="/provider/beauty"
              stats="7 Packages"
              color="red"
            />
            <DashboardCard
              title="Beauty Bookings"
              description="View and manage beauty booking requests"
              icon={<Calendar className="h-8 w-8 text-pink-600" />}
              action="View Bookings"
              href="/provider/beauty/bookings"
              stats="6 Pending"
              color="pink"
            />
            <DashboardCard
              title="Beauty Portfolio"
              description="Manage your beauty portfolio and looks"
              icon={<Heart className="h-8 w-8 text-purple-600" />}
              action="Manage Portfolio"
              href="/provider/beauty/portfolio"
              stats="24 Looks"
              color="purple"
            />
            <DashboardCard
              title="Beauty Analytics"
              description="Track your beauty performance and revenue"
              icon={<BarChart3 className="h-8 w-8 text-green-600" />}
              action="View Analytics"
              href="/provider/beauty/analytics"
              stats="+14% Growth"
              color="green"
            />
            <DashboardCard
              title="Beauty Messages"
              description="Communicate with potential customers"
              icon={<MessageCircle className="h-8 w-8 text-orange-600" />}
              action="View Messages"
              href="/provider/beauty/messages"
              stats="3 New"
              color="orange"
            />
            <DashboardCard
              title="Beauty Settings"
              description="Manage your beauty business profile"
              icon={<Settings className="h-8 w-8 text-gray-600" />}
              action="Settings"
              href="/provider/beauty/settings"
              stats="Profile 95%"
              color="gray"
            />
          </div>
        );
      case 'decoration':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard
              title="Decoration Services"
              description="Manage your decoration and floral packages"
              icon={<Flower className="h-8 w-8 text-pink-500" />}
              action="Manage Decoration"
              href="/provider/decoration"
              stats="9 Packages"
              color="pink"
            />
            <DashboardCard
              title="Decoration Bookings"
              description="View and manage decoration booking requests"
              icon={<Calendar className="h-8 w-8 text-green-600" />}
              action="View Bookings"
              href="/provider/decoration/bookings"
              stats="4 Pending"
              color="green"
            />
            <DashboardCard
              title="Decoration Gallery"
              description="Manage your decoration portfolio and designs"
              icon={<Flower className="h-8 w-8 text-purple-600" />}
              action="Manage Gallery"
              href="/provider/decoration/gallery"
              stats="31 Designs"
              color="purple"
            />
            <DashboardCard
              title="Decoration Analytics"
              description="Track your decoration performance and revenue"
              icon={<BarChart3 className="h-8 w-8 text-blue-600" />}
              action="View Analytics"
              href="/provider/decoration/analytics"
              stats="+11% Growth"
              color="blue"
            />
            <DashboardCard
              title="Decoration Messages"
              description="Communicate with potential customers"
              icon={<MessageCircle className="h-8 w-8 text-orange-600" />}
              action="View Messages"
              href="/provider/decoration/messages"
              stats="2 New"
              color="orange"
            />
            <DashboardCard
              title="Decoration Settings"
              description="Manage your decoration business profile"
              icon={<Settings className="h-8 w-8 text-gray-600" />}
              action="Settings"
              href="/provider/decoration/settings"
              stats="Profile 82%"
              color="gray"
            />
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard
              title="My Services"
              description="Manage your service offerings"
              icon={<Settings className="h-8 w-8 text-gray-600" />}
              action="Manage Services"
              href="/provider/services"
              stats="Configure"
              color="gray"
            />
            <DashboardCard
              title="Service Bookings"
              description="View and manage booking requests"
              icon={<Calendar className="h-8 w-8 text-blue-600" />}
              action="View Bookings"
              href="/provider/bookings"
              stats="Pending"
              color="blue"
            />
            <DashboardCard
              title="Service Settings"
              description="Manage your business profile"
              icon={<Settings className="h-8 w-8 text-purple-600" />}
              action="Settings"
              href="/provider/settings"
              stats="Profile"
              color="purple"
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900">24</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +12% this month
              </p>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-pink-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Revenue</p>
              <p className="text-3xl font-bold text-gray-900">₹8.4L</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +18% this month
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Rating</p>
              <p className="text-3xl font-bold text-gray-900">4.8</p>
              <p className="text-sm text-blue-600 flex items-center mt-1">
                <Star className="h-4 w-4 mr-1" />
                156 reviews
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Response Time</p>
              <p className="text-3xl font-bold text-gray-900">2h</p>
              <p className="text-sm text-purple-600 flex items-center mt-1">
                <Clock className="h-4 w-4 mr-1" />
                Very Good
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Service-specific cards */}
      {getServiceDashboard()}
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState<{ users: { total: number }; venues: { approved: number }; bookings: { total: number; successRate: number }; revenue: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/admin/stats');
        setStats(res.data);
        setError('');
      } catch {
        setError('Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

  return (
    <div className="space-y-6">
      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{loading ? '—' : (stats?.users.total ?? 0).toLocaleString('en-IN')}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +12% this month
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Venues</p>
              <p className="text-3xl font-bold text-gray-900">{loading ? '—' : (stats?.venues.approved ?? 0).toLocaleString('en-IN')}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +8% this month
              </p>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <MapPin className="h-6 w-6 text-pink-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900">{loading ? '—' : (stats?.bookings.total ?? 0).toLocaleString('en-IN')}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <CheckCircle className="h-4 w-4 mr-1" />
                {loading ? '—' : `${stats?.bookings.successRate ?? 0}% Success Rate`}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Platform Revenue</p>
              <p className="text-3xl font-bold text-gray-900">{loading ? '—' : formatCurrency(stats?.revenue ?? 0)}</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +22% this month
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
      
      {/* Admin Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="User Management"
          description="Manage all users, customers, and providers"
          icon={<Users className="h-8 w-8 text-blue-600" />}
          action="Manage Users"
          href="/admin/users"
          stats={stats ? `${stats.users.total.toLocaleString('en-IN')} Users` : undefined}
          color="blue"
        />
        <DashboardCard
          title="Venue Management"
          description="Review and approve venue listings"
          icon={<MapPin className="h-8 w-8 text-pink-600" />}
          action="Manage Venues"
          href="/admin/venues"
          stats={stats ? `${stats.venues.approved.toLocaleString('en-IN')} Approved` : undefined}
          color="pink"
        />
        <DashboardCard
          title="Bookings Overview"
          description="Monitor all bookings across the platform"
          icon={<Calendar className="h-8 w-8 text-green-600" />}
          action="View Bookings"
          href="/admin/bookings"
          stats={stats ? `${stats.bookings.total.toLocaleString('en-IN')} Total` : undefined}
          color="green"
        />
        <DashboardCard
          title="Analytics & Reports"
          description="Generate platform analytics and reports"
          icon={<BarChart3 className="h-8 w-8 text-purple-600" />}
          action="View Reports"
          href="/admin/reports"
          stats="Weekly Report"
          color="purple"
        />
        <DashboardCard
          title="Content Management"
          description="Manage site content and configurations"
          icon={<Camera className="h-8 w-8 text-orange-600" />}
          action="Manage Content"
          href="/admin/content"
          stats="45 Posts"
          color="orange"
        />
        <DashboardCard
          title="System Settings"
          description="Configure system-wide settings"
          icon={<Settings className="h-8 w-8 text-gray-600" />}
          action="System Settings"
          href="/admin/settings"
          stats="All Systems OK"
          color="gray"
        />
      </div>
    </div>
  );
}

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  href: string;
  stats?: string;
  color: string;
}

function DashboardCard({ title, description, icon, action, href, stats, color }: DashboardCardProps) {
  const getColorClasses = (color: string) => {
    const colors = {
      pink: 'from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700',
      purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
      blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
      red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
      yellow: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
      orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
      gray: 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700',
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2 rounded-xl bg-gray-50 group-hover:bg-gray-100 transition-colors">
            {icon}
          </div>
          {stats && (
            <span className="bg-gradient-to-r text-white px-3 py-1 rounded-full text-sm font-semibold">
              {stats}
            </span>
          )}
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
          {description}
        </p>
        
        <a
          href={href}
          className={`inline-flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r ${getColorClasses(color)} text-white font-semibold rounded-xl transition-all duration-300 transform group-hover:scale-105`}
        >
          {action}
          <svg
            className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}