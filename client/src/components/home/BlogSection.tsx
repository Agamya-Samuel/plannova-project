"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import apiClient from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

// BlogSection: shows latest published blogs on the homepage.
// We keep it isolated to keep the home page file small and focused.
// This component fetches blogs from the API. If the API is not ready yet,
// it falls back to a small static list so the UI still works.

interface BlogItem {
  _id: string;
  title: string;
  slug?: string;
  coverImageUrl?: string;
  excerpt?: string;
  authorName?: string;
  createdAt?: string;
}

export default function BlogSection() {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchBlogs = async () => {
      setIsLoading(true);
      try {
        // Try a conventional endpoint first. Backend can map to published admin blogs.
        // Keep query simple. Backend can refine later.
        const res = await apiClient.get("/blogs", { params: { status: "published", limit: 6 } });
        const list: BlogItem[] = res?.data?.blogs || res?.data?.data || res?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          setBlogs(list);
          return;
        }
      } catch {
        // Ignore errors; we will use fallback data below.
      } finally {
        setIsLoading(false);
      }

      // Fallback demo items so layout is visible when API is not wired yet.
      setBlogs([
        {
          _id: "demo-1",
          title: "Top 10 Wedding Venues in Mumbai",
          slug: "top-10-wedding-venues-mumbai",
          coverImageUrl:
            "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop",
          excerpt: "Explore our curated list of the best venues across the city.",
          authorName: "Admin",
          createdAt: new Date().toISOString(),
        },
        {
          _id: "demo-2",
          title: "How to Plan a Budget-Friendly Destination Wedding",
          slug: "budget-friendly-destination-wedding",
          coverImageUrl:
            "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=1200&auto=format&fit=crop",
          excerpt: "Smart tips to save money while creating magical moments.",
          authorName: "Admin",
          createdAt: new Date().toISOString(),
        },
        {
          _id: "demo-3",
          title: "Checklist: 6 Months to Your Big Day",
          slug: "wedding-checklist-6-months",
          coverImageUrl:
            "https://images.unsplash.com/photo-1519741497205-6b6ce1d2bff5?q=80&w=1200&auto=format&fit=crop",
          excerpt: "A simple timeline to keep everything on track.",
          authorName: "Admin",
          createdAt: new Date().toISOString(),
        },
      ]);
    };

    fetchBlogs();
  }, []);

  const formatDate = (value?: string) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  if (!isLoading && blogs.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex items-start justify-between gap-4">
          <div className="text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">From our blog</h2>
            <p className="text-xl text-gray-600">Ideas, guides, and inspiration from our team</p>
          </div>
          {user && (user.role === 'ADMIN' || user.role === 'PROVIDER' || user.role === 'STAFF') ? (
            <Link href={user.role === 'ADMIN' ? '/admin/blog' : user.role === 'PROVIDER' ? '/provider/blog' : '/staff/blog'}>
              <Button className="px-6">Create blog</Button>
            </Link>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(isLoading ? new Array(3).fill(null) : blogs).map((item, idx) => (
            <article key={item?._id || idx} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {isLoading ? (
                <div className="w-full h-48 bg-gray-200 animate-pulse" />
              ) : item?.coverImageUrl ? (
                <Link href={item?.slug ? `/blog/${item.slug}` : "#"}>
                  <Image
                    src={item.coverImageUrl}
                    alt={item.title}
                    width={640}
                    height={256}
                    className="w-full h-48 object-cover"
                  />
                </Link>
              ) : (
                <div className="w-full h-48 bg-gray-100" />
              )}

              <div className="p-6">
                <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                  <span>{item?.authorName || "Admin"}</span>
                  <span>•</span>
                  <time>{formatDate(item?.createdAt)}</time>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                  {isLoading ? (
                    <span className="inline-block h-6 w-3/4 bg-gray-200 animate-pulse rounded" />
                  ) : (
                    <Link href={item?.slug ? `/blog/${item.slug}` : "#"} className="hover:underline">
                      {item.title}
                    </Link>
                  )}
                </h3>
                <p className="text-gray-600 line-clamp-3">
                  {isLoading ? (
                    <span className="inline-block h-4 w-full bg-gray-200 animate-pulse rounded" />
                  ) : (
                    item?.excerpt || ""
                  )}
                </p>
                <div className="mt-4">
                  <Link
                    href={item?.slug ? `/blog/${item.slug}` : "#"}
                    className="text-pink-600 font-medium hover:text-pink-700"
                  >
                    Read more →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}


