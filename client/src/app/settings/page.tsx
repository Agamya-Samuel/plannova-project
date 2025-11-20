'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { 
  Settings,
  Save,
  Lock,
  Eye,
  EyeOff,
  FileText,
  User,
  Trash2,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Edit,
  ExternalLink,
  BarChart3,
  FileCheck,
  FileClock,
  Heart,
  Loader2,
  MapPin,
  Utensils,
  Camera,
  Video,
  Music,
  Flower
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { ServiceCategory } from '@/types/auth';

// Service categories with icons and descriptions
const serviceCategories = [
  {
    id: 'venue' as ServiceCategory,
    name: 'Venue Service',
    icon: MapPin,
    description: 'Wedding venues, reception halls, and event spaces'
  },
  {
    id: 'catering' as ServiceCategory,
    name: 'Catering Service',
    icon: Utensils,
    description: 'Food services, catering packages, and culinary experiences'
  },
  {
    id: 'photography' as ServiceCategory,
    name: 'Photography Service',
    icon: Camera,
    description: 'Wedding photography, portrait sessions, and photo services'
  },
  {
    id: 'videography' as ServiceCategory,
    name: 'Videography Service',
    icon: Video,
    description: 'Wedding videography, highlight reels, and video services'
  },
  {
    id: 'music' as ServiceCategory,
    name: 'Music & Entertainment Service',
    icon: Music,
    description: 'DJ, bands, and entertainment services'
  },
  {
    id: 'makeup' as ServiceCategory,
    name: 'Bridal Makeup Service',
    icon: Heart,
    description: 'Bridal makeup, hair styling, and beauty services'
  },
  {
    id: 'decoration' as ServiceCategory,
    name: 'Decoration Service',
    icon: Flower,
    description: 'Event decoration and floral arrangements'
  }
];

export default function AccountSettingsPage() {
  const { user, isLoading, updateServiceCategories } = useAuth();
  const router = useRouter();
  
  // Active section state
  // Removed 'notifications' and 'privacy' sections as per user request
  // Account is set as default and appears first in navigation
  const [activeSection, setActiveSection] = useState<'security' | 'account' | 'blogs' | 'services'>('account');
  
  // Security settings
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Removed notification and privacy state variables as per user request
  
  // Account preferences
  const [preferences, setPreferences] = useState({
    language: 'en',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    currency: 'INR'
  });

  // Services management
  const [selectedServiceCategories, setSelectedServiceCategories] = useState<ServiceCategory[]>([]);
  const [isUpdatingServices, setIsUpdatingServices] = useState(false);
  const [serviceError, setServiceError] = useState('');

  // Blog stats
  const [blogStats, setBlogStats] = useState<{ total: number; drafts: number; published: number; lastUpdated?: string | null }>({
    total: 0,
    drafts: 0,
    published: 0,
    lastUpdated: null
  });
  const [loadingBlogStats, setLoadingBlogStats] = useState(false);

  // Check if user can manage blogs
  // All authenticated users (Admin, Staff, Provider, Customer) can manage their own blogs
  const canManageBlogsBool = React.useMemo(() => {
    return Boolean(user && ['ADMIN', 'STAFF', 'PROVIDER', 'CUSTOMER'].includes(user.role || ''));
  }, [user]);


  // Initialize selected services with user's current services
  useEffect(() => {
    if (user?.serviceCategories) {
      setSelectedServiceCategories([...user.serviceCategories]);
    }
  }, [user]);

  useEffect(() => {
    const fetchBlogStats = async () => {
      if (!canManageBlogsBool || activeSection !== 'blogs' || !user) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Blog Stats: Skipping fetch', {
            canManageBlogsBool,
            activeSection,
            hasUser: !!user,
            userRole: user?.role
          });
        }
        return;
      }
      
      setLoadingBlogStats(true);
      try {
        // Use new simplified API endpoints for better performance and accuracy
        const isAdmin = user.role === 'ADMIN';
        
        if (process.env.NODE_ENV === 'development') {
          console.log('Blog Stats: Starting fetch', {
            userId: user.id,
            userRole: user.role,
            isAdmin
          });
        }
        
        // For non-admin users, use the simplified endpoints which automatically filter by user
        // For admin, we need to fetch all published posts
        let totalRes, myPostsRes, draftsRes;
        
        if (isAdmin) {
          // Admin: fetch all published posts for "Total Posts"
          const totalParams: Record<string, string> = { 
            page: '1', 
            limit: '1',
            status: 'published'
          };
          
          [totalRes, myPostsRes, draftsRes] = await Promise.all([
            apiClient.get('/blogs', { params: totalParams }).catch(err => {
              console.error('Error fetching total blogs:', err);
              throw err;
            }),
            apiClient.get('/blogs/my').catch(err => {
              console.error('Error fetching my blogs:', err);
              throw err;
            }),
            apiClient.get('/blogs/drafts').catch(err => {
              console.error('Error fetching drafts:', err);
              throw err;
            })
          ]);
        } else {
          // Non-admin: "Total Posts" should show ALL published posts from ALL users
          // "My Posts" shows only their own published posts
          // So we need to fetch all published posts (public) for Total Posts
          const axios = (await import('axios')).default;
          const publicApiClient = axios.create({
            baseURL: process.env.NEXT_PUBLIC_API_URL,
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          const totalParams: Record<string, string> = { 
            page: '1', 
            limit: '1',
            status: 'published'
          };
          
          [totalRes, myPostsRes, draftsRes] = await Promise.all([
            // Total Posts: ALL published posts from ALL users (public request, no auth)
            publicApiClient.get('/blogs', { params: totalParams }).catch(err => {
              console.error('Error fetching total blogs (non-admin):', err);
              throw err;
            }),
            // My Posts: Only user's own published posts
            apiClient.get('/blogs/my').catch(err => {
              console.error('Error fetching my blogs (non-admin):', err);
              throw err;
            }),
            // Drafts: Only user's own drafts
            apiClient.get('/blogs/drafts').catch(err => {
              console.error('Error fetching drafts (non-admin):', err);
              throw err;
            })
          ]);
        }

        // Verify responses are successful
        if (!totalRes || totalRes.status !== 200) {
          console.error('Total blogs API call failed:', totalRes?.status, totalRes?.data);
        }
        if (!myPostsRes || myPostsRes.status !== 200) {
          console.error('My blogs API call failed:', myPostsRes?.status, myPostsRes?.data);
        }
        if (!draftsRes || draftsRes.status !== 200) {
          console.error('Drafts API call failed:', draftsRes?.status, draftsRes?.data);
        }
        
        // Extract counts from pagination totals
        // Handle different response structures
        const total = totalRes?.data?.pagination?.total ?? totalRes?.data?.total ?? 0;
        const myPosts = myPostsRes?.data?.pagination?.total ?? myPostsRes?.data?.total ?? 0;
        const drafts = draftsRes?.data?.pagination?.total ?? draftsRes?.data?.total ?? 0;
        
        // Debug logging (only in development)
        if (process.env.NODE_ENV === 'development') {
          console.log('Blog Stats (using new API endpoints):', {
            total,
            myPosts,
            drafts,
            userId: user.id,
            userRole: user.role,
            isAdmin,
            totalResponse: totalRes?.data,
            myPostsResponse: myPostsRes?.data,
            draftsResponse: draftsRes?.data,
            totalResponseKeys: totalRes?.data ? Object.keys(totalRes.data) : [],
            myPostsResponseKeys: myPostsRes?.data ? Object.keys(myPostsRes.data) : [],
            draftsResponseKeys: draftsRes?.data ? Object.keys(draftsRes.data) : [],
            totalStatus: totalRes?.status,
            myPostsStatus: myPostsRes?.status,
            draftsStatus: draftsRes?.status
          });
        }
        
        // Additional validation - check if responses are valid
        if (!totalRes || !myPostsRes || !draftsRes) {
          console.error('One or more API responses are missing:', {
            hasTotalRes: !!totalRes,
            hasMyPostsRes: !!myPostsRes,
            hasDraftsRes: !!draftsRes
          });
        }

        setBlogStats({
          total,
          published: myPosts, // Store as "published" - represents user's published posts
          drafts,
          lastUpdated: new Date().toISOString()
        });
      } catch (error: unknown) {
        console.error('Failed to load blog stats', error);
        // Log detailed error information for debugging
        // Type guard to safely access error properties
        const errorStatus = (error as { response?: { status?: number } })?.response?.status;
        const errorMessage = 
          (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 
          (error as { message?: string })?.message || 
          'Unknown error';
        
        if (process.env.NODE_ENV === 'development') {
          console.error('Blog Stats Error Details:', {
            error,
            errorMessage,
            errorResponse: (error as { response?: { data?: unknown } })?.response?.data,
            errorStatus,
            userId: user?.id,
            userRole: user?.role,
            canManageBlogs: canManageBlogsBool,
            errorConfig: (error as { config?: unknown })?.config
          });
        }
        
        // Show user-friendly error message for authentication/authorization errors
        if (errorStatus === 401 || errorStatus === 403) {
          console.error('Authentication/Authorization error when fetching blog stats. User may need to log in again.');
          // Don't show toast here as it might be annoying, but log it
        } else if (errorStatus && errorStatus >= 500) {
          console.error('Server error when fetching blog stats:', errorMessage);
        }
        
        // Set stats to 0 on error to avoid showing stale data
        setBlogStats({
          total: 0,
          published: 0,
          drafts: 0,
          lastUpdated: null
        });
      } finally {
        setLoadingBlogStats(false);
      }
    };

    // Always fetch fresh stats when the blogs section is active
    // This ensures deleted blogs are not counted
    fetchBlogStats();
  }, [activeSection, canManageBlogsBool, user]);
  
  // Listen for refresh event to manually refresh stats
  useEffect(() => {
    const handleRefresh = () => {
      if (activeSection === 'blogs' && canManageBlogsBool && user) {
          // Force a refresh by temporarily changing a dependency
          // This will trigger the fetchBlogStats useEffect
          setLoadingBlogStats(true);
          // The useEffect will handle the actual fetch
        }
    };
    
    window.addEventListener('refreshBlogStats', handleRefresh);
    return () => {
      window.removeEventListener('refreshBlogStats', handleRefresh);
    };
  }, [activeSection, canManageBlogsBool, user]);

  // Get blog management URL based on user role
  const getBlogManagementUrl = () => {
    if (!user) return '#';
    switch (user.role) {
      case 'ADMIN':
        return '/admin/blog';
      case 'STAFF':
        return '/staff/blog';
      case 'PROVIDER':
        return '/provider/blog';
      case 'CUSTOMER':
        return '/my-blogs';
      default:
        return '/my-blogs'; // Default to my-blogs for any other role
    }
  };

  // Check if user can manage blogs (for rendering conditions)
  const canManageBlogs = () => canManageBlogsBool;

  // Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    setChangingPassword(true);
    try {
      // TODO: Implement change password API endpoint in backend
      // This is a placeholder - you'll need to create the endpoint
      await apiClient.post('/auth/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });
      
      toast.success('Password changed successfully!');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: unknown) {
      console.error('Error changing password:', error);
      toast.error(getApiErrorMessage(error) || 'Failed to change password. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  // Removed handleSaveNotifications and handleSavePrivacy functions as per user request

  // Handle account preferences save
  const handleSavePreferences = async () => {
    try {
      // TODO: Implement save preferences API
      await apiClient.put('/user/preferences', preferences);
      toast.success('Account preferences saved!');
    } catch (error: unknown) {
      console.error('Error saving preferences:', error);
      toast.error(getApiErrorMessage(error) || 'Failed to save preferences');
    }
  };

  // Handle account deletion request
  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      'Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently removed.'
    );
    
    if (!confirmed) return;
    
    const doubleConfirm = prompt('Type "DELETE" to confirm account deletion:');
    if (doubleConfirm !== 'DELETE') {
      toast.error('Account deletion cancelled');
      return;
    }
    
    try {
      // TODO: Implement delete account API
      await apiClient.delete('/user/account');
      toast.success('Account deletion requested. Please check your email for confirmation.');
    } catch (error: unknown) {
      console.error('Error deleting account:', error);
      toast.error(getApiErrorMessage(error) || 'Failed to delete account. Please contact support.');
    }
  };

  // Handle service categories update
  const handleUpdateServices = async () => {
    setIsUpdatingServices(true);
    setServiceError('');

    try {
      await updateServiceCategories(selectedServiceCategories);
      toast.success('Service categories updated successfully!');
    } catch (error: unknown) {
      console.error('Error updating service categories:', error);
      setServiceError(getApiErrorMessage(error) || 'Failed to update service categories. Please try again.');
    } finally {
      setIsUpdatingServices(false);
    }
  };

  function getApiErrorMessage(error: unknown): string | undefined {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'object' && error !== null) {
      const maybeResponse = (error as { response?: { data?: { error?: string } } }).response;
      return maybeResponse?.data?.error;
    }
    return undefined;
  }

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading settings...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Account Settings
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Manage your account preferences, security, and privacy settings
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mt-4 md:mt-0">
                  <Settings className="h-5 w-5 text-pink-500" />
                  <span>Settings Portal</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-4 sticky top-4">
                <nav className="space-y-2">
                  {/* Account section appears first as per user request */}
                  <button
                    onClick={() => setActiveSection('account')}
                    className={`w-full text-left flex items-center px-4 py-3 rounded-lg transition-colors ${
                      activeSection === 'account'
                        ? 'bg-pink-100 text-pink-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <User className="h-5 w-5 mr-3" />
                    Account
                  </button>
                  
                  <button
                    onClick={() => setActiveSection('security')}
                    className={`w-full text-left flex items-center px-4 py-3 rounded-lg transition-colors ${
                      activeSection === 'security'
                        ? 'bg-pink-100 text-pink-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Lock className="h-5 w-5 mr-3" />
                    Security
                  </button>
                  
                  {user?.role === 'PROVIDER' && (
                    <button
                      onClick={() => setActiveSection('services')}
                      className={`w-full text-left flex items-center px-4 py-3 rounded-lg transition-colors ${
                        activeSection === 'services'
                          ? 'bg-pink-100 text-pink-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <MapPin className="h-5 w-5 mr-3" />
                      Services
                    </button>
                  )}
                  
                  {canManageBlogs() && (
                    <button
                      onClick={() => setActiveSection('blogs')}
                      className={`w-full text-left flex items-center px-4 py-3 rounded-lg transition-colors ${
                        activeSection === 'blogs'
                          ? 'bg-pink-100 text-pink-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <BookOpen className="h-5 w-5 mr-3" />
                      Manage Blogs
                    </button>
                  )}

                  {/* Removed Notifications and Privacy navigation buttons as per user request */}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Security Section */}
              {activeSection === 'security' && (
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <div className="flex items-center mb-6">
                    <Lock className="h-6 w-6 text-pink-500 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Change Password */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
                      <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                          </label>
                          <div className="relative">
                            <input
                              type={showOldPassword ? 'text' : 'password'}
                              value={passwordForm.oldPassword}
                              onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 pr-10"
                              placeholder="Enter current password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowOldPassword(!showOldPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              {showOldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 pr-10"
                              placeholder="Enter new password (min. 6 characters)"
                              required
                              minLength={6}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 pr-10"
                              placeholder="Confirm new password"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </div>
                        
                        <Button
                          type="submit"
                          disabled={changingPassword}
                          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                        >
                          {changingPassword ? 'Changing Password...' : 'Change Password'}
                        </Button>
                      </form>
                    </div>

                    {/* Security Info */}
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Tips</h3>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Use a strong password with at least 6 characters</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Never share your password with anyone</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Log out from shared devices</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>If you suspect unauthorized access, change your password immediately</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}


              {/* Manage Blogs Section */}
              {activeSection === 'blogs' && canManageBlogs() && (
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                    <div className="flex items-center">
                      <BookOpen className="h-6 w-6 text-pink-500 mr-3" />
                      <h2 className="text-2xl font-bold text-gray-900">Manage Blogs</h2>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          // Manually trigger stats refresh
                          setLoadingBlogStats(true);
                          // Dispatch event to trigger refresh
                          window.dispatchEvent(new Event('refreshBlogStats'));
                          // Also directly call fetchBlogStats logic
                          const fetchBlogStats = async () => {
                            if (!canManageBlogsBool || !user) return;
                            try {
                              // Use new simplified API endpoints
                              const isAdmin = user.role === 'ADMIN';
                              
                              let totalRes, myPostsRes, draftsRes;
                              
                              if (isAdmin) {
                                // Admin: fetch all published posts for "Total Posts"
                                const totalParams: Record<string, string> = { 
                                  page: '1', 
                                  limit: '1',
                                  status: 'published'
                                };
                                
                                [totalRes, myPostsRes, draftsRes] = await Promise.all([
                                  apiClient.get('/blogs', { params: totalParams }),
                                  apiClient.get('/blogs/my'),
                                  apiClient.get('/blogs/drafts')
                                ]);
                              } else {
                                // Non-admin: "Total Posts" should show ALL published posts from ALL users
                                // "My Posts" shows only their own published posts
                                const axios = (await import('axios')).default;
                                const publicApiClient = axios.create({
                                  baseURL: process.env.NEXT_PUBLIC_API_URL,
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                });
                                
                                const totalParams: Record<string, string> = { 
                                  page: '1', 
                                  limit: '1',
                                  status: 'published'
                                };
                                
                                [totalRes, myPostsRes, draftsRes] = await Promise.all([
                                  // Total Posts: ALL published posts from ALL users (public request, no auth)
                                  publicApiClient.get('/blogs', { params: totalParams }).catch(err => {
                                    console.error('Error fetching total blogs (non-admin refresh):', err);
                                    throw err;
                                  }),
                                  // My Posts: Only user's own published posts
                                  apiClient.get('/blogs/my').catch(err => {
                                    console.error('Error fetching my blogs (non-admin refresh):', err);
                                    throw err;
                                  }),
                                  // Drafts: Only user's own drafts
                                  apiClient.get('/blogs/drafts').catch(err => {
                                    console.error('Error fetching drafts (non-admin refresh):', err);
                                    throw err;
                                  })
                                ]);
                              }
                              
                              // Handle different response structures
                              const total = totalRes?.data?.pagination?.total ?? totalRes?.data?.total ?? 0;
                              const myPosts = myPostsRes?.data?.pagination?.total ?? myPostsRes?.data?.total ?? 0;
                              const drafts = draftsRes?.data?.pagination?.total ?? draftsRes?.data?.total ?? 0;
                              
                              if (process.env.NODE_ENV === 'development') {
                                console.log('Blog Stats Refresh:', {
                                  total,
                                  myPosts,
                                  drafts,
                                  totalResponse: totalRes?.data,
                                  myPostsResponse: myPostsRes?.data,
                                  draftsResponse: draftsRes?.data
                                });
                              }
                              
                              setBlogStats({
                                total,
                                published: myPosts,
                                drafts,
                                lastUpdated: new Date().toISOString()
                              });
                              toast.success('Stats refreshed');
                            } catch (error) {
                              console.error('Failed to refresh blog stats', error);
                              toast.error('Failed to refresh stats');
                            } finally {
                              setLoadingBlogStats(false);
                            }
                          };
                          fetchBlogStats();
                        }}
                        variant="outline"
                        className="w-auto bg-gray-50 hover:bg-gray-100 border-gray-300"
                        disabled={loadingBlogStats}
                      >
                        {loadingBlogStats ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin text-pink-500" />
                            Refreshing...
                          </>
                        ) : (
                          <>
                            <BarChart3 className="h-4 w-4 mr-2 text-pink-500" />
                            Refresh Stats
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => router.push(getBlogManagementUrl() || '#')}
                        className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-md"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Go to Blog Management
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Stats Cards - Updated design to match dashboard */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {/* Total Posts Card */}
                      <div className="bg-white rounded-xl shadow-lg p-6 relative">
                        <div className="mb-4">
                          <div className="text-sm font-medium text-gray-600 mb-1">Total Posts</div>
                          <div className="text-3xl font-bold text-gray-900">{loadingBlogStats ? '—' : blogStats.total}</div>
                        </div>
                        <div className="absolute bottom-4 right-4">
                          <BarChart3 className="h-8 w-8 text-pink-500" />
                        </div>
                      </div>

                      {/* My Posts Card */}
                      <div className="bg-white rounded-xl shadow-lg p-6 relative">
                        <div className="mb-4">
                          <div className="text-sm font-medium text-gray-600 mb-1">My Posts</div>
                          <div className="text-3xl font-bold text-gray-900">{loadingBlogStats ? '—' : blogStats.published}</div>
                        </div>
                        <div className="absolute bottom-4 right-4">
                          <FileCheck className="h-8 w-8 text-green-600" />
                        </div>
                      </div>

                      {/* Drafts Card */}
                      <div className="bg-white rounded-xl shadow-lg p-6 relative">
                        <div className="mb-4">
                          <div className="text-sm font-medium text-gray-600 mb-1">Drafts</div>
                          <div className="text-3xl font-bold text-gray-900">{loadingBlogStats ? '—' : blogStats.drafts}</div>
                        </div>
                        <div className="absolute bottom-4 right-4">
                          <FileClock className="h-8 w-8 text-orange-500" />
                        </div>
                      </div>
                    </div>

                    {/* Blog Management Portal Section */}
                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-t-xl p-6 border-t border-l border-r border-pink-200">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Blog Management Portal</h3>
                      <p className="text-gray-700 text-sm">
                        Create, edit, and manage your blog posts. You can write new articles, edit drafts, and publish content.
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-blue-800">
                            <strong>Note:</strong> Click the button above to navigate to the full blog management interface where you can create, edit, and publish your blog posts.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Removed Notifications and Privacy sections as per user request */}

              {/* Account Section */}
              {activeSection === 'account' && (
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <div className="flex items-center mb-6">
                    <User className="h-6 w-6 text-pink-500 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900">Account Preferences</h2>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Preferences */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Language
                          </label>
                          <select
                            value={preferences.language}
                            onChange={(e) => setPreferences({...preferences, language: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                          >
                            <option value="en">English</option>
                            <option value="hi">हिंदी (Hindi)</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Timezone
                          </label>
                          <select
                            value={preferences.timezone}
                            onChange={(e) => setPreferences({...preferences, timezone: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                          >
                            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                            <option value="UTC">UTC</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Date Format
                          </label>
                          <select
                            value={preferences.dateFormat}
                            onChange={(e) => setPreferences({...preferences, dateFormat: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                          >
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Currency
                          </label>
                          <select
                            value={preferences.currency}
                            onChange={(e) => setPreferences({...preferences, currency: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                          >
                            <option value="INR">INR (₹)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                          </select>
                        </div>
                      </div>
                      
                      <Button
                        onClick={handleSavePreferences}
                        className="mt-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Preferences
                      </Button>
                    </div>
                    
                    {/* Account Actions */}
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
                      <div className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-start">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-yellow-800">
                                <strong>Warning:</strong> Deleting your account will permanently remove all your data, including bookings, favorites, and profile information. This action cannot be undone.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          onClick={handleDeleteAccount}
                          variant="outline"
                          className="w-full border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Account
                        </Button>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start">
                            <FileText className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm text-blue-800">
                                Need help? Contact our support team at{' '}
                                <a href="mailto:support@plannova.com" className="underline font-medium">
                                  support@plannova.com
                                </a>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Services Section */}
              {activeSection === 'services' && (
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <div className="flex items-center mb-6">
                    <MapPin className="h-6 w-6 text-pink-500 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-900">Services Management</h2>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Service Categories */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Categories</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {serviceCategories.map(category => (
                          <label key={category.id} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedServiceCategories.includes(category.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedServiceCategories([...selectedServiceCategories, category.id]);
                                } else {
                                  setSelectedServiceCategories(selectedServiceCategories.filter(cat => cat !== category.id));
                                }
                              }}
                              className="w-4 h-4 text-pink-500 focus:ring-pink-500 mr-3"
                            />
                            <div>
                              <div className="font-medium text-gray-900">{category.name}</div>
                              <div className="text-sm text-gray-500">{category.description}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Update Services Button */}
                    <div className="flex justify-end">
                      <Button
                        onClick={handleUpdateServices}
                        disabled={isUpdatingServices}
                        className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                      >
                        {isUpdatingServices ? 'Updating...' : 'Update Services'}
                      </Button>
                    </div>

                    {/* Error Message */}
                    {serviceError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <AlertTriangle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-red-800">
                              {serviceError}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

