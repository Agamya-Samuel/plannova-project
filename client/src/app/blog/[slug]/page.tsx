'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import apiClient from '@/lib/api';
import Image from 'next/image';

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
        <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden">
          <Image
            src={blog.coverImageUrl}
            alt={blog.title}
            fill
            className="object-cover"
          />
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
    </article>
  );
}


