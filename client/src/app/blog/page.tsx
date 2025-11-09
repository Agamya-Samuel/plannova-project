'use client';

import BlogDisplay from '@/components/blog/BlogDisplay';

// All Blogs Page: displays all published blogs using unified component
// This page shows all published blogs in a grid layout with pagination

export default function AllBlogsPage() {
  return (
    <BlogDisplay
      mode="public"
      showLoadMoreButton={true}
      title="All Blogs"
      description="Discover our latest articles, guides, and insights"
      className="min-h-screen"
    />
  );
}

