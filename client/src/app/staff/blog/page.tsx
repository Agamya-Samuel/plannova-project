'use client';

import { Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import BlogManagement from '@/components/blog/BlogManagement';

// Staff Blog Page: uses the unified BlogManagement component
// Shows My Blogs and Drafts tabs for staff users
// Wrapped in Suspense boundary because BlogManagement uses useSearchParams()

export default function StaffBlogPage() {
  const { user } = useAuth();

  // Role check - only staff can access this page
  if (!user || user.role !== 'STAFF') {
    return (
      <ProtectedRoute>
        <div className="max-w-3xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">Access denied</h1>
          <p className="text-gray-600">Only staff can access this page.</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">Loading...</div>}>
      <BlogManagement initialTab="my" />
    </Suspense>
  );
}


