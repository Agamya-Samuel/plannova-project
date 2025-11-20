'use client';

import { Suspense } from 'react';
import BlogManagement from '@/components/blog/BlogManagement';

// My Blogs Page: uses the unified BlogManagement component
// Shows My Blogs and Drafts tabs for all authenticated users
// Wrapped in Suspense boundary because BlogManagement uses useSearchParams()

export default function MyBlogsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">Loading...</div>}>
      <BlogManagement initialTab="my" />
    </Suspense>
  );
}

