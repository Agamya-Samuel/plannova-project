'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { 
  Settings,
  Save,
  Shield,
  Bell,
  Lock,
  Eye,
  EyeOff,
  FileText,
  User,
  Trash2,
  Mail,
  Smartphone,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Edit,
  ExternalLink,
  Calendar,
  BarChart3,
  FileCheck,
  FileClock,
  Heart
} from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api';

export default function AccountSettingsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  // Active section state
  const [activeSection, setActiveSection] = useState<'security' | 'notifications' | 'privacy' | 'account' | 'blogs' | 'pastEvents'>('security');
  
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
  
  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    bookingUpdates: true,
    marketingEmails: false,
    newsletter: false
  });
  
  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public', // public, private, friends
    showEmail: false,
    showPhone: false,
    allowSearch: true,
    dataSharing: false
  });
  
  // Account preferences
  const [preferences, setPreferences] = useState({
    language: 'en',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    currency: 'INR'
  });

  // Blog stats
  const [blogStats, setBlogStats] = useState<{ total: number; drafts: number; published: number; lastUpdated?: string | null }>({
    total: 0,
    drafts: 0,
    published: 0,
    lastUpdated: null
  });
  const [loadingBlogStats, setLoadingBlogStats] = useState(false);

  // Check if user can manage blogs
  const canManageBlogsBool = React.useMemo(() => {
    return Boolean(user && ['ADMIN', 'STAFF', 'PROVIDER'].includes(user.role || ''));
  }, [user]);

  // Admin/Staff-only access for Past Events
  const canManagePastEventsBool = React.useMemo(() => {
    return Boolean(user && ['ADMIN', 'STAFF'].includes(user.role || ''));
  }, [user]);

  useEffect(() => {
    const fetchBlogStats = async () => {
      if (!canManageBlogsBool || activeSection !== 'blogs') return;
      setLoadingBlogStats(true);
      try {
        // Fetch counts with minimal payload; rely on pagination.total
        const [allRes, pubRes, draftRes] = await Promise.all([
          apiClient.get('/blogs', { params: { status: 'all', page: 1, limit: 1 } }),
          apiClient.get('/blogs', { params: { status: 'published', page: 1, limit: 1 } }),
          apiClient.get('/blogs', { params: { status: 'draft', page: 1, limit: 1 } })
        ]);

        const total = allRes.data?.pagination?.total || 0;
        const published = pubRes.data?.pagination?.total || 0;
        const drafts = draftRes.data?.pagination?.total || 0;

        setBlogStats({
          total,
          published,
          drafts,
          lastUpdated: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to load blog stats', error);
      } finally {
        setLoadingBlogStats(false);
      }
    };

    fetchBlogStats();
  }, [activeSection, canManageBlogsBool]);

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
      default:
        return null; // Regular users don't have blog access
    }
  };

  // Past Events management URL based on role
  const getPastEventsManagementUrl = () => {
    if (!user) return '#';
    switch (user.role) {
      case 'ADMIN':
        return '/admin/past-events';
      case 'STAFF':
        return '/staff/past-events';
      default:
        return null;
    }
  };

  // Check if user can manage blogs (for rendering conditions)
  const canManageBlogs = () => canManageBlogsBool;

  // Check if user can manage past events
  const canManagePastEvents = () => canManagePastEventsBool;

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

  // Handle notification settings save
  const handleSaveNotifications = async () => {
    try {
      // TODO: Implement save notification preferences API
      await apiClient.put('/user/notifications', notifications);
      toast.success('Notification preferences saved!');
    } catch (error: unknown) {
      console.error('Error saving notifications:', error);
      toast.error(getApiErrorMessage(error) || 'Failed to save notification preferences');
    }
  };

  // Handle privacy settings save
  const handleSavePrivacy = async () => {
    try {
      // TODO: Implement save privacy settings API
      await apiClient.put('/user/privacy', privacy);
      toast.success('Privacy settings saved!');
    } catch (error: unknown) {
      console.error('Error saving privacy settings:', error);
      toast.error(getApiErrorMessage(error) || 'Failed to save privacy settings');
    }
  };

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

                  {canManagePastEvents() && (
                    <button
                      onClick={() => setActiveSection('pastEvents')}
                      className={`w-full text-left flex items-center px-4 py-3 rounded-lg transition-colors ${
                        activeSection === 'pastEvents'
                          ? 'bg-pink-100 text-pink-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Heart className="h-5 w-5 mr-3" />
                      Manage Past Events
                    </button>
                  )}
                  
                  <button
                    onClick={() => setActiveSection('notifications')}
                    className={`w-full text-left flex items-center px-4 py-3 rounded-lg transition-colors ${
                      activeSection === 'notifications'
                        ? 'bg-pink-100 text-pink-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Bell className="h-5 w-5 mr-3" />
                    Notifications
                  </button>
                  
                  <button
                    onClick={() => setActiveSection('privacy')}
                    className={`w-full text-left flex items-center px-4 py-3 rounded-lg transition-colors ${
                      activeSection === 'privacy'
                        ? 'bg-pink-100 text-pink-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Shield className="h-5 w-5 mr-3" />
                    Privacy
                  </button>
                  
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

              {/* Manage Past Events Section (Admin/Staff only) */}
              {activeSection === 'pastEvents' && canManagePastEvents() && (
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                    <div className="flex items-center">
                      <Heart className="h-6 w-6 text-pink-500 mr-3" />
                      <h2 className="text-2xl font-bold text-gray-900">Manage Past Events</h2>
                    </div>
                    <Button
                      onClick={() => router.push(getPastEventsManagementUrl() || '#')}
                      className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Go to Past Events Management
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-6 border border-pink-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Past Events Management Portal</h3>
                      <p className="text-gray-600 mb-4">
                        Create, edit, and publish past event showcases. Manage photo galleries, event details, and visibility.
                      </p>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Add and edit past events with photos and descriptions</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Manage event galleries and featured images</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Publish, unpublish, and control visibility</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Showcase real wedding photography and event details</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-blue-800">
                            <strong>Note:</strong> Only Admin and Staff can access the Past Events management interface. Click the button above to navigate to the full management portal.
                          </p>
                        </div>
                      </div>
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
                    <Button
                      onClick={() => router.push(getBlogManagementUrl() || '#')}
                      className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Go to Blog Management
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-500">Total Posts</div>
                            <div className="text-2xl font-bold text-gray-900">{loadingBlogStats ? '—' : blogStats.total}</div>
                          </div>
                          <BarChart3 className="h-6 w-6 text-pink-500" />
                        </div>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-500">Published</div>
                            <div className="text-2xl font-bold text-gray-900">{loadingBlogStats ? '—' : blogStats.published}</div>
                          </div>
                          <FileCheck className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                      <div className="rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-500">Drafts</div>
                            <div className="text-2xl font-bold text-gray-900">{loadingBlogStats ? '—' : blogStats.drafts}</div>
                          </div>
                          <FileClock className="h-6 w-6 text-amber-600" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-6 border border-pink-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Blog Management Portal</h3>
                      <p className="text-gray-600 mb-4">
                        Create, edit, and manage your blog posts. You can write new articles, edit drafts, and publish content.
                      </p>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Create and publish blog articles</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Save drafts for later editing</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Edit and update published posts</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Manage all your blog content in one place</span>
                        </li>
                      </ul>
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

              {/* Notifications Section */}
              {activeSection === 'notifications' && (
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <Bell className="h-6 w-6 text-pink-500 mr-3" />
                      <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
                    </div>
                    <Button
                      onClick={handleSaveNotifications}
                      className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Preferences
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
                      <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center">
                            <Mail className="h-5 w-5 text-pink-500 mr-3" />
                            <div>
                              <div className="font-medium text-gray-900">Email Notifications</div>
                              <div className="text-sm text-gray-500">Receive notifications via email</div>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={notifications.emailNotifications}
                            onChange={(e) => setNotifications({...notifications, emailNotifications: e.target.checked})}
                            className="w-5 h-5 text-pink-500 rounded focus:ring-pink-500"
                          />
                        </label>
                        
                        <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center">
                            <Calendar className="h-5 w-5 text-pink-500 mr-3" />
                            <div>
                              <div className="font-medium text-gray-900">Booking Updates</div>
                              <div className="text-sm text-gray-500">Get notified about booking status changes</div>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={notifications.bookingUpdates}
                            onChange={(e) => setNotifications({...notifications, bookingUpdates: e.target.checked})}
                            className="w-5 h-5 text-pink-500 rounded focus:ring-pink-500"
                          />
                        </label>
                        
                        <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center">
                            <Mail className="h-5 w-5 text-pink-500 mr-3" />
                            <div>
                              <div className="font-medium text-gray-900">Marketing Emails</div>
                              <div className="text-sm text-gray-500">Receive promotional offers and updates</div>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={notifications.marketingEmails}
                            onChange={(e) => setNotifications({...notifications, marketingEmails: e.target.checked})}
                            className="w-5 h-5 text-pink-500 rounded focus:ring-pink-500"
                          />
                        </label>
                        
                        <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-pink-500 mr-3" />
                            <div>
                              <div className="font-medium text-gray-900">Newsletter</div>
                              <div className="text-sm text-gray-500">Subscribe to our monthly newsletter</div>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={notifications.newsletter}
                            onChange={(e) => setNotifications({...notifications, newsletter: e.target.checked})}
                            className="w-5 h-5 text-pink-500 rounded focus:ring-pink-500"
                          />
                        </label>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Notifications</h3>
                      <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center">
                            <Smartphone className="h-5 w-5 text-pink-500 mr-3" />
                            <div>
                              <div className="font-medium text-gray-900">SMS Notifications</div>
                              <div className="text-sm text-gray-500">Receive text message notifications</div>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={notifications.smsNotifications}
                            onChange={(e) => setNotifications({...notifications, smsNotifications: e.target.checked})}
                            className="w-5 h-5 text-pink-500 rounded focus:ring-pink-500"
                          />
                        </label>
                        
                        <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div className="flex items-center">
                            <Bell className="h-5 w-5 text-pink-500 mr-3" />
                            <div>
                              <div className="font-medium text-gray-900">Push Notifications</div>
                              <div className="text-sm text-gray-500">Receive browser push notifications</div>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={notifications.pushNotifications}
                            onChange={(e) => setNotifications({...notifications, pushNotifications: e.target.checked})}
                            className="w-5 h-5 text-pink-500 rounded focus:ring-pink-500"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy Section */}
              {activeSection === 'privacy' && (
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <Shield className="h-6 w-6 text-pink-500 mr-3" />
                      <h2 className="text-2xl font-bold text-gray-900">Privacy Settings</h2>
                    </div>
                    <Button
                      onClick={handleSavePrivacy}
                      className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Visibility</h3>
                      <div className="space-y-3">
                        <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="profileVisibility"
                            value="public"
                            checked={privacy.profileVisibility === 'public'}
                            onChange={(e) => setPrivacy({...privacy, profileVisibility: e.target.value})}
                            className="w-4 h-4 text-pink-500 focus:ring-pink-500 mr-3"
                          />
                          <div>
                            <div className="font-medium text-gray-900">Public</div>
                            <div className="text-sm text-gray-500">Everyone can see your profile</div>
                          </div>
                        </label>
                        
                        <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name="profileVisibility"
                            value="private"
                            checked={privacy.profileVisibility === 'private'}
                            onChange={(e) => setPrivacy({...privacy, profileVisibility: e.target.value})}
                            className="w-4 h-4 text-pink-500 focus:ring-pink-500 mr-3"
                          />
                          <div>
                            <div className="font-medium text-gray-900">Private</div>
                            <div className="text-sm text-gray-500">Only you can see your profile</div>
                          </div>
                        </label>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                      <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div>
                            <div className="font-medium text-gray-900">Show Email Address</div>
                            <div className="text-sm text-gray-500">Display your email on your profile</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={privacy.showEmail}
                            onChange={(e) => setPrivacy({...privacy, showEmail: e.target.checked})}
                            className="w-5 h-5 text-pink-500 rounded focus:ring-pink-500"
                          />
                        </label>
                        
                        <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div>
                            <div className="font-medium text-gray-900">Show Phone Number</div>
                            <div className="text-sm text-gray-500">Display your phone number on your profile</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={privacy.showPhone}
                            onChange={(e) => setPrivacy({...privacy, showPhone: e.target.checked})}
                            className="w-5 h-5 text-pink-500 rounded focus:ring-pink-500"
                          />
                        </label>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Privacy Settings</h3>
                      <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div>
                            <div className="font-medium text-gray-900">Allow Search Engines</div>
                            <div className="text-sm text-gray-500">Allow your profile to appear in search results</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={privacy.allowSearch}
                            onChange={(e) => setPrivacy({...privacy, allowSearch: e.target.checked})}
                            className="w-5 h-5 text-pink-500 rounded focus:ring-pink-500"
                          />
                        </label>
                        
                        <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <div>
                            <div className="font-medium text-gray-900">Data Sharing</div>
                            <div className="text-sm text-gray-500">Allow us to use your data for analytics (anonymized)</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={privacy.dataSharing}
                            onChange={(e) => setPrivacy({...privacy, dataSharing: e.target.checked})}
                            className="w-5 h-5 text-pink-500 rounded focus:ring-pink-500"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

