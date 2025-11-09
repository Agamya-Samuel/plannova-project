'use client';

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import BlogManagement from '@/components/blog/BlogManagement';

// Provider Blog Page: uses the unified BlogManagement component
// Shows My Blogs and Drafts tabs for provider users

export default function ProviderBlogPage() {
  const { user } = useAuth();

  // Role check - only providers can access this page
  if (!user || user.role !== 'PROVIDER') {
    return (
      <ProtectedRoute>
        <div className="max-w-3xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">Access denied</h1>
          <p className="text-gray-600">Only providers can access this page.</p>
        </div>
      </ProtectedRoute>
    );
  }

  return <BlogManagement initialTab="my" />;
}


