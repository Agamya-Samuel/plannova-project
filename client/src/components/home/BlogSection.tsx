'use client';

import BlogDisplay from '@/components/blog/BlogDisplay';

// BlogSection: Unified component for homepage blog display
// Uses the shared BlogDisplay component for consistency
// Shows all published blogs from all users (public view)

export default function BlogSection() {
  return (
    <BlogDisplay
      mode="public"
      initialLimit={6}
      showShowMoreButton={true}
      title="From our blog"
      description="Ideas, guides, and inspiration from our team"
      hideIfEmpty={true}
    />
  );
}


