'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Calendar, Heart, MapPin, MessageCircle, Settings, Star, TrendingUp, Users, Camera, BarChart3, Clock, CheckCircle, Utensils, Video, Music, Flower, FileText, Trash2, User, Phone, Mail, IndianRupee, Check, X, Search, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import MobileNumberAlertDialog from '@/components/auth/MobileNumberAlertDialog';
import apiClient from '@/lib/api';
import { Booking, ServiceType } from '@/types/booking';

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
      case 'STAFF':
        return <StaffDashboard />;
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
      <DashboardCard
        title="My Blogs"
        description="Create and manage your blog posts"
        icon={<FileText className="h-8 w-8 text-indigo-600" />}
        action="Manage Blogs"
        href="/my-blogs"
        color="indigo"
      />
    </div>
  );
}

function ProviderDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<{
    totalBookings: number;
    bookingsGrowth: number;
    revenue: number;
    revenueGrowth: number;
    avgRating: number;
    totalReviews: number;
    responseTime: string;
    responseTimeStatus: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'services' | 'bookings'>('dashboard');

  // Fetch provider statistics from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/bookings/provider/stats');
        setStats(res.data);
      } catch (error) {
        console.error('Error fetching provider stats:', error);
        // Set default stats on error
        setStats({
          totalBookings: 0,
          bookingsGrowth: 0,
          revenue: 0,
          revenueGrowth: 0,
          avgRating: 0,
          totalReviews: 0,
          responseTime: '—',
          responseTimeStatus: 'No data'
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'PROVIDER') {
      fetchStats();
    }
  }, [user]);

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

  // Format revenue for display (convert to lakhs if needed)
  const formatRevenue = (amount: number): string => {
    if (amount >= 100000) {
      const lakhs = (amount / 100000).toFixed(1);
      return `₹${lakhs}L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const handleMyServicesClick = () => {
    setActiveView('services');
  };

  const handleMyBookingsClick = () => {
    setActiveView('bookings');
  };

  const handleBackToDashboard = () => {
    setActiveView('dashboard');
  };

  // Render services view
  const renderServicesView = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleBackToDashboard}
            className="flex items-center text-purple-600 hover:text-purple-800 font-medium"
          >
            <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </button>
          <h2 className="text-2xl font-bold text-gray-900">My Services</h2>
          <div></div> {/* Spacer for alignment */}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Add New Service Card */}
          <div 
            onClick={() => router.push('/settings')}
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group border-2 border-dashed border-gray-300 cursor-pointer flex flex-col items-center justify-center p-8 text-center hover:border-purple-500"
          >
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
              <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Add New Service</h3>
            <p className="text-gray-600">Expand your service offerings</p>
          </div>
          
          {/* Service Category Cards */}
          {user?.serviceCategories?.map((serviceCategory) => (
            <ServiceCategoryCard 
              key={serviceCategory} 
              serviceCategory={serviceCategory} 
              onViewDetails={() => {
                const serviceRoutes: Record<string, string> = {
                  'venue': '/provider/venues',
                  'catering': '/provider/catering',
                  'photography': '/provider/photography',
                  'videography': '/provider/videography',
                  'music': '/provider/entertainment',
                  'makeup': '/provider/beauty',
                  'bridal-makeup': '/provider/bridal-makeup',
                  'decoration': '/provider/decoration'
                };
                
                const route = serviceRoutes[serviceCategory];
                if (route) {
                  router.push(route);
                }
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  // Render bookings view
  const renderBookingsView = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleBackToDashboard}
            className="flex items-center text-purple-600 hover:text-purple-800 font-medium"
          >
            <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </button>
          <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
          <div></div> {/* Spacer for alignment */}
        </div>
        
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <BookingView />
        </div>
      </div>
    );
  };

  // Render main dashboard view
  const renderDashboardView = () => {
    return (
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '—' : (stats?.totalBookings ?? 0)}
                </p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {loading ? '—' : stats && stats.bookingsGrowth > 0 ? `+${stats.bookingsGrowth}%` : stats && stats.bookingsGrowth < 0 ? `${stats.bookingsGrowth}%` : '0%'} this month
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
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '—' : formatRevenue(stats?.revenue ?? 0)}
                </p>
                <p className="text-sm text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {loading ? '—' : stats && stats.revenueGrowth > 0 ? `+${stats.revenueGrowth}%` : stats && stats.revenueGrowth < 0 ? `${stats.revenueGrowth}%` : '0%'} this month
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
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '—' : (stats?.avgRating ?? 0).toFixed(1)}
                </p>
                <p className="text-sm text-blue-600 flex items-center mt-1">
                  <Star className="h-4 w-4 mr-1" />
                  {loading ? '—' : `${stats?.totalReviews ?? 0} reviews`}
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
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '—' : (stats?.responseTime ?? '—')}
                </p>
                <p className="text-sm text-purple-600 flex items-center mt-1">
                  <Clock className="h-4 w-4 mr-1" />
                  {loading ? '—' : (stats?.responseTimeStatus ?? 'No data')}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardCard
            title="My Services"
            description="View and manage all your service offerings"
            icon={<Settings className="h-8 w-8 text-purple-600" />}
            action="View Services"
            onClick={handleMyServicesClick}
            color="purple"
          />
          <DashboardCard
            title="My Bookings"
            description="View and manage all your bookings"
            icon={<Calendar className="h-8 w-8 text-pink-600" />}
            action="View Bookings"
            onClick={handleMyBookingsClick}
            color="pink"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {activeView === 'dashboard' && renderDashboardView()}
      {activeView === 'services' && renderServicesView()}
      {activeView === 'bookings' && renderBookingsView()}
    </div>
  );
}

function ServiceSpecificDashboard({ serviceType }: { serviceType: string }) {
  const [stats, setStats] = useState<{
    totalBookings: number;
    bookingsGrowth: number;
    revenue: number;
    revenueGrowth: number;
    avgRating: number;
    totalReviews: number;
    responseTime: string;
    responseTimeStatus: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch provider statistics from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/bookings/provider/stats');
        setStats(res.data);
      } catch (error) {
        console.error('Error fetching provider stats:', error);
        // Set default stats on error
        setStats({
          totalBookings: 0,
          bookingsGrowth: 0,
          revenue: 0,
          revenueGrowth: 0,
          avgRating: 0,
          totalReviews: 0,
          responseTime: '—',
          responseTimeStatus: 'No data'
        });
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'PROVIDER') {
      fetchStats();
    }
  }, [user]);

  // Format revenue for display (convert to lakhs if needed)
  const formatRevenue = (amount: number): string => {
    if (amount >= 100000) {
      const lakhs = (amount / 100000).toFixed(1);
      return `₹${lakhs}L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

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
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '—' : (stats?.totalBookings ?? 0)}
              </p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                {loading ? '—' : stats && stats.bookingsGrowth > 0 ? `+${stats.bookingsGrowth}%` : stats && stats.bookingsGrowth < 0 ? `${stats.bookingsGrowth}%` : '0%'} this month
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
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '—' : formatRevenue(stats?.revenue ?? 0)}
              </p>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                {loading ? '—' : stats && stats.revenueGrowth > 0 ? `+${stats.revenueGrowth}%` : stats && stats.revenueGrowth < 0 ? `${stats.revenueGrowth}%` : '0%'} this month
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
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '—' : (stats?.avgRating ?? 0).toFixed(1)}
              </p>
              <p className="text-sm text-blue-600 flex items-center mt-1">
                <Star className="h-4 w-4 mr-1" />
                {loading ? '—' : `${stats?.totalReviews ?? 0} reviews`}
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
              <p className="text-3xl font-bold text-gray-900">
                {loading ? '—' : (stats?.responseTime ?? '—')}
              </p>
              <p className="text-sm text-purple-600 flex items-center mt-1">
                <Clock className="h-4 w-4 mr-1" />
                {loading ? '—' : (stats?.responseTimeStatus ?? 'No data')}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
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
          title="Manage Providers"
          description="Browse all providers and view their work"
          icon={<Users className="h-8 w-8 text-blue-600" />}
          action="Manage Providers"
          href="/admin/providers"
          stats={stats ? `${stats.users.total.toLocaleString('en-IN')} Providers` : undefined}
          color="blue"
        />
        <DashboardCard
          title="User Management"
          description="Manage all users, customers, and providers"
          icon={<Users className="h-8 w-8 text-indigo-600" />}
          action="Manage Users"
          href="/admin/users"
          stats={stats ? `${stats.users.total.toLocaleString('en-IN')} Users` : undefined}
          color="purple"
        />
        <DashboardCard
          title="Services Management"
          description="Review and manage all provider services"
          icon={<MapPin className="h-8 w-8 text-pink-600" />}
          action="Manage Services"
          href="/admin/services"
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
          icon={<BarChart3 className="h-8 w-8 text-yellow-600" />}
          action="View Reports"
          href="/admin/reports"
          stats="Weekly Report"
          color="yellow"
        />
        <DashboardCard
          title="Payment Management"
          description="Track all payments and revenue across the platform"
          icon={<IndianRupee className="h-8 w-8 text-green-600" />}
          action="Manage Payments"
          href="/admin/payments"
          stats="View Transactions"
          color="green"
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
        <DashboardCard
          title="Trash Management"
          description="Manage deleted items and restore or permanently delete them"
          icon={<Trash2 className="h-8 w-8 text-red-600" />}
          action="Manage Trash"
          href="/admin/trash"
          stats="View Deleted Items"
          color="red"
        />
      </div>
    </div>
  );
}

function StaffDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <DashboardCard
        title="Providers"
        description="Browse all providers and view their work"
        icon={<Users className="h-8 w-8 text-blue-600" />}
        action="Manage Providers"
        href="/staff/providers"
        color="blue"
      />
      <DashboardCard
        title="Service Approvals"
        description="Review and approve provider submissions across services"
        icon={<CheckCircle className="h-8 w-8 text-green-600" />}
        action="Manage Approvals"
        href="/staff/approvals"
        color="green"
      />
      <DashboardCard
        title="Services Management"
        description="Review and manage all provider services"
        icon={<MapPin className="h-8 w-8 text-pink-600" />}
        action="Manage Services"
        href="/staff/services"
        color="pink"
      />
      <DashboardCard
        title="Bookings Overview"
        description="Monitor bookings across the platform"
        icon={<Calendar className="h-8 w-8 text-green-600" />}
        action="View Bookings"
        href="/admin/bookings"
        color="green"
      />
      {/* Removed Analytics & Reports and Content Management for staff */}
    </div>
  );
}

// Add new components for the service category card and booking view
function ServiceCategoryCard({ serviceCategory, onViewDetails }: { serviceCategory: string; onViewDetails: () => void }) {
  const getServiceInfo = (category: string) => {
    const serviceMap: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
      'venue': {
        title: 'Venue Services',
        description: 'Manage your event venues and listings',
        icon: <MapPin className="h-8 w-8 text-pink-600" />
      },
      'catering': {
        title: 'Catering Services',
        description: 'Manage your catering packages and menus',
        icon: <Utensils className="h-8 w-8 text-blue-600" />
      },
      'photography': {
        title: 'Photography Services',
        description: 'Manage your photography packages and portfolio',
        icon: <Camera className="h-8 w-8 text-purple-600" />
      },
      'videography': {
        title: 'Videography Services',
        description: 'Manage your videography packages and portfolio',
        icon: <Video className="h-8 w-8 text-blue-600" />
      },
      'music': {
        title: 'Entertainment Services',
        description: 'Manage your music and entertainment packages',
        icon: <Music className="h-8 w-8 text-green-600" />
      },
      'makeup': {
        title: 'Beauty Services',
        description: 'Manage your makeup and beauty packages',
        icon: <Heart className="h-8 w-8 text-red-500" />
      },
      'bridal-makeup': {
        title: 'Bridal Makeup Services',
        description: 'Manage your bridal makeup packages',
        icon: <Heart className="h-8 w-8 text-red-500" />
      },
      'decoration': {
        title: 'Decoration Services',
        description: 'Manage your decoration and floral packages',
        icon: <Flower className="h-8 w-8 text-pink-500" />
      }
    };
    
    return serviceMap[category] || {
      title: `${category.charAt(0).toUpperCase() + category.slice(1)} Services`,
      description: `Manage your ${category} services`,
      icon: <Settings className="h-8 w-8 text-gray-600" />
    };
  };

  const serviceInfo = getServiceInfo(serviceCategory);

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2 rounded-xl bg-gray-50 group-hover:bg-gray-100 transition-colors">
            {serviceInfo.icon}
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
          {serviceInfo.title}
        </h3>
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
          {serviceInfo.description}
        </p>
        
        <button
          onClick={onViewDetails}
          className="inline-flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform group-hover:scale-105"
        >
          Manage Service
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
        </button>
      </div>
    </div>
  );
}

function BookingView() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled' | 'rejected' | 'completed'>('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<'all' | ServiceType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get<Booking[]>('/bookings/provider/incoming');
        setBookings(response.data || []);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load bookings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'PROVIDER') {
      fetchBookings();
    }
  }, [user]);

  const handleAcceptBooking = async (bookingId: string) => {
    if (processingBookingId) return; // Prevent concurrent requests
    
    try {
      setProcessingBookingId(bookingId);
      setError(null);
      console.log('🔄 Attempting to accept booking:', bookingId);
      const response = await apiClient.put(`/bookings/${bookingId}/accept`);
      console.log('✅ Booking accepted successfully:', response.data);
      // Refresh bookings
      const bookingsResponse = await apiClient.get<Booking[]>('/bookings/provider/incoming');
      setBookings(bookingsResponse.data);
    } catch (err: unknown) {
      console.error('❌ Error accepting booking:', err);
      const apiError = err as { response?: { data?: { error?: string; status?: number } } };
      console.error('❌ Error response:', apiError.response?.data);
      console.error('❌ Error status:', apiError.response?.data?.status);
      const errorMessage = apiError.response?.data?.error || 'Failed to accept booking. Please try again.';
      setError(errorMessage);
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    if (processingBookingId) return; // Prevent concurrent requests
    
    try {
      setProcessingBookingId(bookingId);
      setError(null);
      console.log('🔄 Attempting to reject booking:', bookingId);
      const response = await apiClient.put(`/bookings/${bookingId}/reject`);
      console.log('✅ Booking rejected successfully:', response.data);
      // Refresh bookings
      const bookingsResponse = await apiClient.get<Booking[]>('/bookings/provider/incoming');
      setBookings(bookingsResponse.data);
    } catch (err: unknown) {
      console.error('❌ Error rejecting booking:', err);
      const apiError = err as { response?: { data?: { error?: string; status?: number } } };
      console.error('❌ Error response:', apiError.response?.data);
      console.error('❌ Error status:', apiError.response?.data?.status);
      const errorMessage = apiError.response?.data?.error || 'Failed to reject booking. Please try again.';
      setError(errorMessage);
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    if (processingBookingId) return; // Prevent concurrent requests
    
    // Confirm the action
    if (!confirm('Are you sure you want to mark this booking as completed? This confirms that the event was successfully held.')) {
      return;
    }
    
    try {
      setProcessingBookingId(bookingId);
      setError(null);
      console.log('🔄 Attempting to complete booking:', bookingId);
      const response = await apiClient.put(`/bookings/${bookingId}/complete`);
      console.log('✅ Booking completed successfully:', response.data);
      // Refresh bookings
      const bookingsResponse = await apiClient.get<Booking[]>('/bookings/provider/incoming');
      setBookings(bookingsResponse.data);
    } catch (err: unknown) {
      console.error('❌ Error completing booking:', err);
      const apiError = err as { response?: { data?: { error?: string; status?: number } } };
      console.error('❌ Error response:', apiError.response?.data);
      console.error('❌ Error status:', apiError.response?.data?.status);
      const errorMessage = apiError.response?.data?.error || 'Failed to mark booking as completed. Please try again.';
      setError(errorMessage);
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleViewDetails = (booking: Booking) => {
    // Navigate to the service details page based on service type
    if (booking.serviceId && booking.serviceType) {
      const serviceRoutes: Record<string, string> = {
        'venue': '/venues',
        'catering': '/catering',
        'photography': '/photography',
        'videography': '/videography',
        'bridal-makeup': '/bridal-makeup',
        'decoration': '/decoration'
      };
      
      const route = serviceRoutes[booking.serviceType];
      if (route) {
        router.push(`${route}/${booking.serviceId}`);
      }
    }
  };

  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-white" />;
      case 'completed':
        return <Check className="h-5 w-5 text-white" />;
      case 'pending':
        return <Calendar className="h-5 w-5 text-white" />;
      case 'cancelled':
      case 'rejected':
        return <X className="h-5 w-5 text-white" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      case 'rejected':
        return 'Rejected';
      default:
        return '';
    }
  };

  const getStatusClass = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-600 text-white';
      case 'completed':
        return 'bg-blue-600 text-white';
      case 'pending':
        return 'bg-yellow-600 text-white';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-600 text-white';
      default:
        return '';
    }
  };

  const getServiceTypeLabel = (serviceType?: string) => {
    switch (serviceType) {
      case 'venue':
        return 'Venue';
      case 'catering':
        return 'Catering';
      case 'photography':
        return 'Photography';
      case 'videography':
        return 'Videography';
      case 'bridal-makeup':
        return 'Bridal Makeup';
      case 'decoration':
        return 'Decoration';
      case 'entertainment':
        return 'Entertainment';
      default:
        return 'Service';
    }
  };

  // Filter and sort bookings
  const filteredBookings = useMemo(() => {
    let result = [...bookings];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(booking => 
        booking.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.contactEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.contactPhone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.serviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.venueName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(booking => booking.status === statusFilter);
    }
    
    // Apply service type filter
    if (serviceTypeFilter !== 'all') {
      result = result.filter(booking => booking.serviceType === serviceTypeFilter);
    }
    
    return result;
  }, [bookings, searchTerm, statusFilter, serviceTypeFilter]);

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    rejected: bookings.filter(b => b.status === 'rejected' || b.status === 'cancelled').length,
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <X className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by customer name, email, phone, or service..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-4">
          {/* Status Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'confirmed' | 'cancelled' | 'rejected' | 'completed')}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Service Type Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
            <select
              className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 appearance-none"
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value as 'all' | ServiceType)}
            >
              <option value="all">All Services</option>
              <option value="venue">Venue</option>
              <option value="catering">Catering</option>
              <option value="photography">Photography</option>
              <option value="videography">Videography</option>
              <option value="bridal-makeup">Bridal Makeup</option>
              <option value="decoration">Decoration</option>
              <option value="entertainment">Entertainment</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {(searchTerm || statusFilter !== 'all' || serviceTypeFilter !== 'all') && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setServiceTypeFilter('all');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
          <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
          <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4">
          <p className="text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
          <p className="text-sm text-gray-600 mb-1">Confirmed</p>
          <p className="text-2xl font-bold text-green-900">{stats.confirmed}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4">
          <p className="text-sm text-gray-600 mb-1">Completed</p>
          <p className="text-2xl font-bold text-indigo-900">{stats.completed}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4">
          <p className="text-sm text-gray-600 mb-1">Rejected</p>
          <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-6">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No bookings found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' || serviceTypeFilter !== 'all' 
                ? 'Try adjusting your filters or check back later' 
                : 'You don\'t have any bookings yet.'}
            </p>
            {(searchTerm || statusFilter !== 'all' || serviceTypeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setServiceTypeFilter('all');
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          filteredBookings.map((booking: Booking) => (
            <div key={booking.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col lg:flex-row">
                  {/* Service Image */}
                  <div className="lg:w-1/4 mb-4 lg:mb-0 lg:mr-6">
                    <div className="aspect-video bg-gray-200 rounded-xl overflow-hidden">
                      <Image 
                        src={booking.serviceImage || booking.venueImage || '/placeholder-image.jpg'} 
                        alt={booking.serviceName || booking.venueName || 'Service'}
                        width={400}
                        height={225}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                        }}
                      />
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="lg:w-3/4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h2 className="text-xl font-bold text-gray-900 mr-3">
                            {booking.serviceName || booking.venueName}
                          </h2>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(booking.status)}`}>
                            {getStatusIcon(booking.status)}
                            <span className="ml-1">{getStatusText(booking.status)}</span>
                          </span>
                        </div>
                        <div className="mb-4">
                          <span className="inline-block px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded">
                            {getServiceTypeLabel(booking.serviceType)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="flex items-center text-gray-900">
                            <Calendar className="h-5 w-5 mr-3 text-pink-600" />
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Event Time</p>
                              <p className="font-semibold">
                                {new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {booking.time}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center text-gray-900">
                            <User className="h-5 w-5 mr-3 text-pink-600" />
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Guest Count</p>
                              <p className="font-semibold">{booking.guestCount} guests</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center text-gray-900">
                            <IndianRupee className="h-5 w-5 mr-3 text-pink-600" />
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">Total Price</p>
                              <p className="font-semibold">₹{booking.totalPrice.toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 md:mt-0">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Total Amount</p>
                          <p className="text-2xl font-bold text-gray-900">₹{booking.totalPrice.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Customer Information */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center text-gray-600">
                          <User className="h-5 w-5 mr-3 text-pink-600" />
                          <div>
                            <p className="text-sm text-gray-500 mb-0.5">Customer</p>
                            <p className="font-medium text-gray-900">{booking.contactPerson}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-gray-600">
                          <Phone className="h-5 w-5 mr-3 text-pink-600" />
                          <div>
                            <p className="text-sm text-gray-500 mb-0.5">Phone</p>
                            <p className="font-medium text-gray-900">{booking.contactPhone}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center text-gray-600">
                          <Mail className="h-5 w-5 mr-3 text-pink-600" />
                          <div>
                            <p className="text-sm text-gray-500 mb-0.5">Email</p>
                            <p className="font-medium text-gray-900">{booking.contactEmail}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    {booking.status === 'pending' && (
                      <div className="mt-6 flex flex-wrap gap-3">
                        <button 
                          onClick={() => handleAcceptBooking(booking.id)}
                          disabled={processingBookingId !== null}
                          className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {processingBookingId === booking.id ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                              Processing...
                            </>
                          ) : (
                            'Accept Booking'
                          )}
                        </button>
                        <button 
                          onClick={() => handleRejectBooking(booking.id)}
                          disabled={processingBookingId !== null}
                          className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {processingBookingId === booking.id ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                              Processing...
                            </>
                          ) : (
                            'Reject Booking'
                          )}
                        </button>
                      </div>
                    )}

                    {booking.status === 'confirmed' && (
                      <div className="mt-6 flex flex-wrap gap-3">
                        <button 
                          onClick={() => handleCompleteBooking(booking.id)}
                          disabled={processingBookingId !== null}
                          className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {processingBookingId === booking.id ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4" />
                              Mark as Completed
                            </>
                          )}
                        </button>
                        <button 
                          onClick={() => handleViewDetails(booking)}
                          className="px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </button>
                      </div>
                    )}

                    {booking.status === 'completed' && (
                      <div className="mt-6 flex flex-wrap gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">Event Successfully Completed</span>
                        </div>
                        <button 
                          onClick={() => handleViewDetails(booking)}
                          className="px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Update DashboardCard to support onClick
interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  href?: string;
  onClick?: () => void;
  stats?: string;
  color: string;
}

function DashboardCard({ title, description, icon, action, href, onClick, stats, color }: DashboardCardProps) {
  const getColorClasses = (color: string) => {
    const colors = {
      pink: 'from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700',
      purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
      indigo: 'from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
      blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
      red: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
      yellow: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
      orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
      gray: 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700',
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      window.location.href = href;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group cursor-pointer" onClick={handleClick}>
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
        
        <div
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
        </div>
      </div>
    </div>
  );
}
