"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import apiClient from "@/lib/api";
import { X } from "lucide-react";

// BlogSection: shows latest published blogs on the homepage.
// We keep it isolated to keep the home page file small and focused.
// This component fetches blogs from the API.

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

interface BlogDetails extends BlogItem {
  content?: string;
}

export default function BlogSection() {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [openBlog, setOpenBlog] = useState<BlogDetails | null>(null);
  const [isOpening, setIsOpening] = useState<boolean>(false);

  // Lock/unlock background scroll when the blog modal is open
  // This improves mobile UX by preventing the page behind the modal from scrolling.
  useEffect(() => {
    if (!openBlog) return;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    // Prevent layout shift on desktop by compensating for scrollbar width
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [openBlog]);

  // Close modal on Escape key for accessibility and convenience
  useEffect(() => {
    if (!openBlog) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenBlog(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openBlog]);

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

  const openBlogModal = async (id: string) => {
    try {
      setIsOpening(true);
      // Fetch single blog details to show full content in the popup
      const res = await apiClient.get(`/blogs/${id}`);
      type ApiBlog = Partial<BlogDetails> & {
        _id?: string;
        author?: { firstName?: string; lastName?: string };
        status?: "draft" | "published" | string;
      };
      const blog = (res?.data?.data ?? res?.data ?? null) as ApiBlog | null;
      if (blog) {
        // Normalize author name from different response shapes
        const normalizedAuthorName: string =
          typeof blog?.authorName === 'string' && blog.authorName
            ? blog.authorName
            : blog?.author && (blog.author.firstName || blog.author.lastName)
            ? `${blog.author.firstName || ''} ${blog.author.lastName || ''}`.trim()
            : 'Admin';
        const normalizedStatus: "draft" | "published" | undefined =
          blog.status === 'published' ? 'published' : blog.status === 'draft' ? 'draft' : undefined;
        setOpenBlog({
          _id: blog._id || id,
          title: blog.title || "",
          slug: blog.slug,
          coverImageUrl: blog.coverImageUrl,
          excerpt: blog.excerpt,
          authorName: normalizedAuthorName,
          createdAt: blog.createdAt || "",
          status: normalizedStatus ?? 'draft',
          content: blog.content || "",
        });
      }
    } catch (e: unknown) {
      console.error("Failed to open blog", e);
    } finally {
      setIsOpening(false);
    }
  };

  const closeBlogModal = () => setOpenBlog(null);

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
              onClick={() => item?._id && openBlogModal(item._id)}
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
                      if (item?._id) {
                        openBlogModal(item._id);
                      }
                    }}
                    className="text-pink-600 font-medium hover:text-pink-700"
                    disabled={isOpening}
                  >
                    {isOpening ? 'Opening…' : 'Read more →'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {openBlog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={closeBlogModal} />
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full h-[90vh] overflow-hidden flex flex-col md:h-auto md:max-h-[85vh] md:overflow-hidden">
              <button
                aria-label="Close"
                onClick={closeBlogModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Mobile friendly sticky header with an explicit Close button */}
              <div className="md:hidden sticky top-0 z-10 bg-white/90 backdrop-blur border-b flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium text-gray-700">Blog</span>
                <button
                  onClick={closeBlogModal}
                  className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  aria-label="Close blog"
                >
                  <X className="h-4 w-4" />
                  Close
                </button>
              </div>

              {openBlog.coverImageUrl ? (
                <div className="w-full h-40 md:h-56 relative">
                  <Image
                    src={openBlog.coverImageUrl}
                    alt={openBlog.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : null}

              <div className="p-6 flex-1 overflow-y-auto">
                <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                  <span>{openBlog.authorName || 'Admin'}</span>
                  <span>•</span>
                  <time>{formatDate(openBlog.createdAt)}</time>
                  {openBlog.status === 'published' && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Published</span>
                    </>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{openBlog.title}</h3>
                {openBlog.excerpt && (
                  <p className="text-gray-700 mb-4 whitespace-pre-line">{openBlog.excerpt}</p>
                )}
                {openBlog.content && (
                  <div className="prose prose-pink max-w-none text-gray-800 whitespace-pre-line">
                    {openBlog.content}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}


