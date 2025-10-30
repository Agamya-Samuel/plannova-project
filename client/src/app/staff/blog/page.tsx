'use client';

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import BlogEditor from '@/components/blog/BlogEditor';

// Staff Blog Page: allows STAFF to write blogs.

export default function StaffBlogPage() {
  const { user } = useAuth();

  if (!user || user.role !== 'STAFF') {
    return (
      <ProtectedRoute>
        <div className="max-w-3xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">Access denied</h1>
          <p className="text-gray-600">Only staff can write blogs here.</p>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto p-6 space-y-6 bg-white min-h-screen text-gray-900">
        <header>
          <h1 className="text-3xl font-bold">Write a blog</h1>
          <p className="text-gray-600">Team members can publish helpful content.</p>
        </header>
        <BlogEditor defaultStatus="draft" />
      </div>
    </ProtectedRoute>
  );
}


