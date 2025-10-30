'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import BlogEditor from '@/components/blog/BlogEditor';

// Admin Blog Page: allows ADMIN to write blogs.
// Customers should not access this page; ProtectedRoute enforces auth.

export default function AdminBlogPage() {
  const { user } = useAuth();

  if (!user || user.role !== 'ADMIN') {
    return (
      <ProtectedRoute>
        <div className="max-w-3xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">Access denied</h1>
          <p className="text-gray-600">Only admins can write blogs here.</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto p-6 space-y-6 bg-white min-h-screen text-gray-900">
        <header>
          <h1 className="text-3xl font-bold">Write a blog</h1>
          <p className="text-gray-600">Admins can publish articles for the homepage.</p>
        </header>
        <BlogEditor defaultStatus="published" />
      </div>
    </ProtectedRoute>
  );
}


