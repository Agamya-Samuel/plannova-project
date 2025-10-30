'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import BlogEditor from '@/components/blog/BlogEditor';

// Provider Blog Page: allows PROVIDER to write blogs.

export default function ProviderBlogPage() {
  const { user } = useAuth();

  if (!user || user.role !== 'PROVIDER') {
    return (
      <ProtectedRoute>
        <div className="max-w-3xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">Access denied</h1>
          <p className="text-gray-600">Only providers can write blogs here.</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto p-6 space-y-6 bg-white min-h-screen text-gray-900">
        <header>
          <h1 className="text-3xl font-bold">Write a blog</h1>
          <p className="text-gray-600">Share tips and stories with customers.</p>
        </header>
        <BlogEditor defaultStatus="draft" />
      </div>
    </ProtectedRoute>
  );
}


