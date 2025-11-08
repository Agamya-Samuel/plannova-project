'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api';
import Image from 'next/image';
import SocialShare from '@/components/ui/SocialShare';

// Public Blog Detail: customers can read blogs here.

interface BlogDetail {
  _id: string;
  title: string;
  slug?: string;
  coverImageUrl?: string;
  excerpt?: string;
  content?: string;
  authorName?: string;
  author?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  createdAt?: string;
  status?: string;
}

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = String(params?.slug || '');
  const [blog, setBlog] = useState<BlogDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  // Check if the current URL parameter is a MongoDB ObjectId (24 hex characters)
  // If it is, and the blog has a slug, we should redirect to the slug-based URL
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);

  // Fetch blog data when slug changes
  // This fetches the complete blog content including all fields
  useEffect(() => {
    const fetchOne = async () => {
      setIsLoading(true);
      setError(null);
      setIsRedirecting(false); // Reset redirect state when slug changes
      try {
        const res = await apiClient.get(`/blogs/${slug}`);
        
        // Handle different API response structures
        // Server returns: { data: blog }, axios wraps it in .data
        const rawBlog = res?.data?.data || res?.data?.blog || res?.data || null;
        
        if (!rawBlog) {
          setError('Blog not found');
          setBlog(null);
          return;
        }

        // Normalize author name from different response shapes
        // Author can be a string (authorName) or an object (populated author field)
        const normalizedAuthorName: string =
          typeof rawBlog?.authorName === 'string' && rawBlog.authorName
            ? rawBlog.authorName
            : rawBlog?.author && (rawBlog.author.firstName || rawBlog.author.lastName)
            ? `${rawBlog.author.firstName || ''} ${rawBlog.author.lastName || ''}`.trim()
            : 'Admin';

        // Create normalized blog object with all fields
        const normalizedBlog: BlogDetail = {
          _id: rawBlog._id || slug,
          title: rawBlog.title || '',
          slug: rawBlog.slug,
          coverImageUrl: rawBlog.coverImageUrl || '',
          excerpt: rawBlog.excerpt || '',
          content: rawBlog.content || '',
          authorName: normalizedAuthorName,
          createdAt: rawBlog.createdAt,
          status: rawBlog.status,
        };

        // CRITICAL: If user accessed via ID-based URL, ALWAYS redirect to slug URL
        // This ensures clean URLs like /blog/blog-title instead of /blog/6904691044fd55c56027081a
        // The server now auto-generates slugs for blogs that don't have them, so slug should always exist
        if (isObjectId && normalizedBlog.slug && normalizedBlog.slug.trim()) {
          // Set redirecting state to prevent showing error during redirect
          setIsRedirecting(true);
          // Keep loading state true during redirect to prevent flash of error
          // Redirect to the slug-based URL for better SEO and user experience
          // Use replace instead of push to avoid adding to browser history
          router.replace(`/blog/${normalizedBlog.slug}`);
          return; // Don't set blog state or change loading, let the redirect handle it
        }

        // Blog loaded successfully, set state
        setBlog(normalizedBlog);
        setIsLoading(false);
      } catch (err: unknown) {
        console.error('Error fetching blog:', err);
        // Only set error if we're not redirecting
        if (!isRedirecting) {
          setError('Failed to load blog. Please try again.');
          setBlog(null);
          setIsLoading(false);
        }
      }
    };
    if (slug) fetchOne();
  }, [slug, isObjectId, router, isRedirecting]);

  // Helper function to ensure image URL is absolute for social media sharing
  // WhatsApp and other platforms require absolute URLs (with https://) to fetch images
  const ensureAbsoluteImageUrl = (imageUrl: string | undefined): string | undefined => {
    if (!imageUrl) return undefined;
    
    // If already absolute URL (starts with http:// or https://), return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // If relative URL, convert to absolute using current origin
    if (typeof window !== 'undefined') {
      // Remove leading slash if present to avoid double slashes
      const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
      return `${window.location.origin}/${cleanPath}`;
    }
    
    return imageUrl;
  };

  // Update document head with Open Graph and Twitter Card meta tags for social sharing
  // This hook must be called before any early returns to follow React Hooks rules
  // Enhanced with WhatsApp-specific meta tags and absolute image URLs
  useEffect(() => {
    if (!blog) return;

    // Update or create meta tags for social media sharing
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Get absolute image URL for proper social media sharing
    // WhatsApp requires absolute URLs to fetch and display images
    const absoluteImageUrl = ensureAbsoluteImageUrl(blog.coverImageUrl);
    
    // Create description for Open Graph tags
    // Facebook prefers shorter descriptions (200-300 chars), so use excerpt or truncated content
    // Format: Use excerpt if available, otherwise use first part of content, otherwise use title
    let fullDescription = '';
    if (blog.excerpt && blog.excerpt.trim()) {
      fullDescription = blog.excerpt.trim();
    } else if (blog.content && blog.content.trim()) {
      // Truncate content to ~250 chars for Facebook (they prefer shorter descriptions)
      fullDescription = blog.content.trim().substring(0, 250);
      if (blog.content.length > 250) {
        fullDescription += '...';
      }
    } else {
      fullDescription = blog.title;
    }

    // Update title
    document.title = blog.title;

    // Update description - use full content for better sharing
    updateMetaTag('description', fullDescription);

    // Open Graph tags for Facebook, LinkedIn, WhatsApp, etc.
    // WhatsApp uses Open Graph tags to fetch images and preview content
    updateMetaTag('og:type', 'article', true);
    updateMetaTag('og:title', blog.title, true);
    updateMetaTag('og:description', fullDescription, true);
    updateMetaTag('og:url', typeof window !== 'undefined' ? window.location.href : '', true);
    
    // Set image with absolute URL - critical for WhatsApp image preview
    if (absoluteImageUrl) {
      updateMetaTag('og:image', absoluteImageUrl, true);
      updateMetaTag('og:image:width', '1200', true);
      updateMetaTag('og:image:height', '630', true);
      updateMetaTag('og:image:alt', blog.title, true);
      // Add og:image:type for better compatibility
      updateMetaTag('og:image:type', 'image/jpeg', true);
      // Add og:image:secure_url for HTTPS requirement (WhatsApp prefers this)
      if (absoluteImageUrl.startsWith('https://')) {
        updateMetaTag('og:image:secure_url', absoluteImageUrl, true);
      }
    }

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', blog.title);
    updateMetaTag('twitter:description', fullDescription);
    
    if (absoluteImageUrl) {
      updateMetaTag('twitter:image', absoluteImageUrl);
      updateMetaTag('twitter:image:alt', blog.title);
    }
  }, [blog]);

  // Format date for display
  const formatDate = (value?: string) => {
    if (!value) return '';
    try {
      return new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  // Early returns must come after all hooks
  // Show loading state during initial load or redirect (prevents flash of error message)
  if (isLoading || isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="h-10 w-3/4 bg-gray-200 animate-pulse rounded mb-4" />
          <div className="h-5 w-1/2 bg-gray-200 animate-pulse rounded mb-8" />
          <div className="h-96 w-full bg-gray-200 animate-pulse rounded mb-8" />
          <div className="space-y-4">
            <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
            <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
            <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Only show error if we're not redirecting and actually have an error
  if ((error || !blog) && !isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-6 text-center">
          <h1 className="text-3xl font-bold mb-4 text-gray-900">Blog not found</h1>
          <p className="text-gray-600 mb-6">
            {error || 'The blog you are looking for does not exist or has been removed.'}
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            Go back to home
          </Link>
        </div>
      </div>
    );
  }

  // Ensure blog exists before rendering (TypeScript guard)
  if (!blog) {
    return null; // This shouldn't happen, but TypeScript needs this check
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header Section */}
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
            {blog.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="font-medium">{blog.authorName || 'Admin'}</span>
            {blog.createdAt && (
              <>
                <span>•</span>
                <time>{formatDate(blog.createdAt)}</time>
              </>
            )}
            {blog.status === 'published' && (
              <>
                <span>•</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Published
                </span>
              </>
            )}
          </div>
        </header>

        {/* Cover Image Section */}
        {blog.coverImageUrl && (
          <div className="relative w-full mb-8 rounded-2xl overflow-hidden shadow-2xl bg-gray-100">
            {/* Full-width hero image - displays the complete image without cropping */}
            {/* Using object-contain ensures the entire image is visible without any cropping */}
            <div className="relative w-full min-h-[300px] md:min-h-[500px] lg:min-h-[600px] flex items-center justify-center">
              <Image
                src={blog.coverImageUrl}
                alt={blog.title}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 1200px"
                priority
                unoptimized={blog.coverImageUrl.includes('s3.tebi.io') || blog.coverImageUrl.includes('s3.')}
              />
            </div>
          </div>
        )}

        {/* Excerpt Section */}
        {blog.excerpt && (
          <div className="mb-8">
            <p className="text-xl md:text-2xl text-gray-700 leading-relaxed font-light italic border-l-4 border-pink-500 pl-6">
              {blog.excerpt}
            </p>
          </div>
        )}

        {/* Main Content Section */}
        {blog.content && (
          <div className="prose prose-lg max-w-none mb-12">
            {/* Render content with proper formatting */}
            {/* Preserves line breaks and whitespace for better readability */}
            <div className="text-gray-800 leading-relaxed whitespace-pre-line text-base md:text-lg">
              {blog.content}
            </div>
          </div>
        )}

        {/* Show message if no content is available */}
        {!blog.content && !blog.excerpt && (
          <div className="mb-12 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">
              This blog post doesn&apos;t have any content yet.
            </p>
          </div>
        )}

        {/* Social Sharing Section */}
        {/* Add bottom padding on mobile to prevent overlap with floating dock */}
        <div className="border-t border-gray-200 pt-8 mt-12 pb-20 md:pb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Share this article:</span>
            <SocialShare
              url={
                // Use slug-based URL if available, otherwise fall back to current URL
                blog.slug && typeof window !== 'undefined'
                  ? `${window.location.origin}/blog/${blog.slug}`
                  : typeof window !== 'undefined' 
                  ? window.location.href 
                  : undefined
              }
              title={blog.title || 'Blog Post'}
              description={
                // Ensure we always pass the full blog content
                // Priority: content > excerpt > title (as fallback)
                blog.content && blog.content.trim() 
                  ? blog.content.trim()
                  : blog.excerpt && blog.excerpt.trim()
                  ? blog.excerpt.trim()
                  : blog.title || ''
              }
              imageUrl={blog.coverImageUrl}
              variant="button"
            />
          </div>
        </div>
      </article>
    </div>
  );
}


