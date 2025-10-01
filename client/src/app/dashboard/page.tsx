'use client';

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { Calendar, Heart, MapPin, MessageCircle, Settings, Star, TrendingUp, Users, Camera, BarChart3, Clock, CheckCircle } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

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
                    {getRoleMessage(user?.role)}
                  </p>
                </div>
                <div className="hidden md:block">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={`${user.firstName} ${user.lastName}`}
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
      </div>
    </ProtectedRoute>
  );
}

function getRoleMessage(role?: string) {
  switch (role) {
    case 'CUSTOMER':
      return "Let's find the perfect venue for your dream wedding";
    case 'PROVIDER':
      return "Manage your venues and connect with couples";
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
        description="View and manage your wedding venue bookings"
        icon={<Calendar className="h-8 w-8 text-pink-600" />}
        action="View Bookings"
        href="/bookings"
        stats="3 Active"
        color="pink"
      />
      <DashboardCard
        title="Browse Venues"
        description="Discover beautiful wedding venues for your special day"
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
          description="Manage your wedding venues and listings"
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

function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">2,847</p>
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
              <p className="text-3xl font-bold text-gray-900">456</p>
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
              <p className="text-3xl font-bold text-gray-900">1,234</p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <CheckCircle className="h-4 w-4 mr-1" />
                89% Success Rate
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
              <p className="text-3xl font-bold text-gray-900">₹12.8L</p>
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
      
      {/* Admin Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard
          title="User Management"
          description="Manage all users, customers, and providers"
          icon={<Users className="h-8 w-8 text-blue-600" />}
          action="Manage Users"
          href="/admin/users"
          stats="2,847 Users"
          color="blue"
        />
        <DashboardCard
          title="Venue Management"
          description="Review and approve venue listings"
          icon={<MapPin className="h-8 w-8 text-pink-600" />}
          action="Manage Venues"
          href="/admin/venues"
          stats="12 Pending"
          color="pink"
        />
        <DashboardCard
          title="Bookings Overview"
          description="Monitor all bookings across the platform"
          icon={<Calendar className="h-8 w-8 text-green-600" />}
          action="View Bookings"
          href="/admin/bookings"
          stats="1,234 Total"
          color="green"
        />
        <DashboardCard
          title="Reports"
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