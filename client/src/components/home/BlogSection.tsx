"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";

// BlogSection: shows latest published blogs on the homepage.
// We keep it isolated to keep the home page file small and focused.
// This component fetches blogs from the API.
// When a blog is clicked, it navigates to a new page instead of opening a pop-up.

interface BlogItem {
  _id: string;
  title: string;
  slug?: string;
  coverImageUrl?: string;
  excerpt?: string;
  authorName?: string;
  createdAt?: string;
  status?: "draft" | "published";
}

export default function BlogSection() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    const readCache = (): { items: BlogItem[]; ts: number } | null => {
      try {
        const raw = sessionStorage.getItem("home.blogs.cache");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    };

    const writeCache = (items: BlogItem[]) => {
      try {
        sessionStorage.setItem(
          "home.blogs.cache",
          JSON.stringify({ items, ts: Date.now() })
        );
      } catch {}
    };

    const fetchWithRetry = async (maxAttempts = 3): Promise<BlogItem[] | null> => {
      let attempt = 0;
      // small jitter to avoid thundering herd
      const baseDelay = 350;
      while (attempt < maxAttempts) {
        try {
          const res = await apiClient.get("/blogs", {
            params: { status: "published", limit: 6 },
          });
          const list: BlogItem[] = res?.data?.blogs || res?.data?.data || res?.data || [];
          return Array.isArray(list) ? list : [];
        } catch (error: unknown) {
          const status = (typeof error === 'object' && error && 'response' in error)
            ? (error as { response?: { status?: number } }).response?.status
            : undefined;
          // Retry on 429/503 with exponential backoff
          if (status === 429 || status === 503) {
            const delay = baseDelay * Math.pow(2, attempt);
            await new Promise(r => setTimeout(r, delay));
            attempt += 1;
            continue;
          }
          // For other errors, break and fallback
          throw error;
        }
      }
      return null;
    };

    const bootstrap = async () => {
      setIsLoading(true);
      // Throttle network if we have a fresh cache (<= 60s)
      const cached = readCache();
      if (cached && Date.now() - cached.ts <= 60_000) {
        if (!cancelled) setBlogs(cached.items || []);
        setIsLoading(false);
        return;
      }

      try {
        const items = await fetchWithRetry(3);
        if (!cancelled) {
          if (items && items.length > 0) {
            setBlogs(items);
            writeCache(items);
          } else {
            setBlogs([]);
          }
        }
      } catch (error) {
        console.error("Error fetching blogs:", error);
        // Last resort: stale cache if available
        if (!cancelled) setBlogs(cached?.items || []);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
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

  // Navigate to blog detail page using slug-based URL
  // Always prefer slug for SEO-friendly URLs like /blog/blog-title
  const openBlogPage = (blog: BlogItem) => {
    if (!blog._id) return;
    
    // Always use slug if available for clean URLs like /blog/blog-title
    // Fall back to ID only if slug doesn't exist (for backward compatibility)
    const path = blog.slug ? `/blog/${blog.slug}` : `/blog/${blog._id}`;
    router.push(path);
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex items-start justify-between gap-4">
          <div className="text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">From our blog</h2>
            <p className="text-xl text-gray-600">Ideas, guides, and inspiration from our team</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(isLoading ? new Array(3).fill(null) : blogs).map((item, idx) => (
            <article
              key={item?._id || idx}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => item && openBlogPage(item)}
            >
              {isLoading ? (
                <div className="w-full h-48 bg-gray-200 animate-pulse" />
              ) : item?.coverImageUrl ? (
                <>
                  <Image
                    src={item.coverImageUrl}
                    alt={item.title}
                    width={640}
                    height={256}
                    className="w-full h-48 object-cover"
                  />
                </>
              ) : (
                <div className="w-full h-48 bg-gray-100" />
              )}

              <div className="p-6">
                <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                  <span>{item?.authorName || "Admin"}</span>
                  <span>•</span>
                  <time>{formatDate(item?.createdAt)}</time>
                  {/* Show published status badge if blog is published */}
                  {item?.status === "published" && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Published
                      </span>
                    </>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                  {isLoading ? (
                    <span className="inline-block h-6 w-3/4 bg-gray-200 animate-pulse rounded" />
                  ) : (
                    <span className="hover:underline">{item.title}</span>
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
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item) {
                        openBlogPage(item);
                      }
                    }}
                    className="text-pink-600 font-medium hover:text-pink-700"
                  >
                    Read more →
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}


