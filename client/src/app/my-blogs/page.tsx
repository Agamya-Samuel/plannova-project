'use client';

import BlogManagement from '@/components/blog/BlogManagement';

// My Blogs Page: uses the unified BlogManagement component
// Shows My Blogs and Drafts tabs for all authenticated users

export default function MyBlogsPage() {
  return <BlogManagement initialTab="my" />;
}

