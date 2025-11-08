'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
  createdAt?: string;
}

export default function BlogDetailPage() {
  const params = useParams();
  const slug = String(params?.slug || '');
  const [blog, setBlog] = useState<BlogDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch blog data when slug changes
  useEffect(() => {
    const fetchOne = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get(`/blogs/${slug}`);
        const data: BlogDetail = res?.data?.blog || res?.data || null;
        setBlog(data);
      } catch {
        setBlog(null);
      } finally {
        setIsLoading(false);
      }
    };
    if (slug) fetchOne();
  }, [slug]);

  // Update document head with Open Graph and Twitter Card meta tags for social sharing
  // This hook must be called before any early returns to follow React Hooks rules
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

    // Update title
    document.title = blog.title;

    // Update description
    updateMetaTag('description', blog.excerpt || blog.title);

    // Open Graph tags for Facebook, LinkedIn, etc.
    updateMetaTag('og:type', 'article', true);
    updateMetaTag('og:title', blog.title, true);
    updateMetaTag('og:description', blog.excerpt || blog.title, true);
    updateMetaTag('og:url', typeof window !== 'undefined' ? window.location.href : '', true);
    
    if (blog.coverImageUrl) {
      updateMetaTag('og:image', blog.coverImageUrl, true);
      updateMetaTag('og:image:width', '1200', true);
      updateMetaTag('og:image:height', '630', true);
      updateMetaTag('og:image:alt', blog.title, true);
    }

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', blog.title);
    updateMetaTag('twitter:description', blog.excerpt || blog.title);
    
    if (blog.coverImageUrl) {
      updateMetaTag('twitter:image', blog.coverImageUrl);
      updateMetaTag('twitter:image:alt', blog.title);
    }
  }, [blog]);

  // Early returns must come after all hooks
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="h-8 w-2/3 bg-gray-200 animate-pulse rounded mb-4" />
        <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded mb-6" />
        <div className="h-64 w-full bg-gray-200 animate-pulse rounded" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Blog not found</h1>
        <p className="text-gray-600">Please check the link and try again.</p>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto p-6 space-y-6 bg-white min-h-screen text-gray-900">
        <header className="space-y-2">
        <h1 className="text-3xl font-bold">{blog.title}</h1>
        <div className="text-sm text-gray-500">
          <span>{blog.authorName || 'Admin'}</span>
          {blog.createdAt ? (
            <>
              <span> • </span>
              <time>{new Date(blog.createdAt).toLocaleDateString()}</time>
            </>
          ) : null}
        </div>
      </header>

      {blog.coverImageUrl ? (
        <div className="relative w-full -mx-6 md:-mx-0 rounded-lg overflow-hidden shadow-xl">
          {/* Full-width hero image - displays the complete image without cropping */}
          <div className="relative w-full min-h-[400px] md:min-h-[600px] lg:min-h-[700px]">
            <Image
              src={blog.coverImageUrl}
              alt={blog.title}
              fill
              className="object-contain"
              sizes="100vw"
              priority
              unoptimized={blog.coverImageUrl.includes('s3.tebi.io') || blog.coverImageUrl.includes('s3.')}
            />
          </div>
        </div>
      ) : null}

      {blog.excerpt ? (
        <p className="text-lg text-gray-700">{blog.excerpt}</p>
      ) : null}

      {blog.content ? (
        <div className="prose max-w-none">
          {/* Render as plain text for simplicity. Replace with markdown renderer later if needed. */}
          <p className="whitespace-pre-line">{blog.content}</p>
        </div>
      ) : null}

      {/* Social Sharing Section */}
      <div className="border-t pt-6 mt-8">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Share this article:</span>
          <SocialShare
            title={blog.title}
            description={blog.excerpt}
            imageUrl={blog.coverImageUrl}
            variant="button"
          />
        </div>
      </div>
    </article>
  );
}


