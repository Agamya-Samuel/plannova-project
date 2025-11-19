'use client';

import BlogManagement from '@/components/blog/BlogManagement';

// Admin Blog Page: uses the unified BlogManagement component
// Shows All Blogs, My Blogs, and Drafts tabs for admin users

export default function AdminBlogPage() {
  return <BlogManagement initialTab="all" />;
}


