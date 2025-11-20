'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';

// Unified Blog Display Component
// Can be used for homepage, blog listing pages, and anywhere blogs need to be displayed
// Supports both public (all blogs) and authenticated (user's blogs) views

interface BlogItem {
  _id: string;
  title: string;
  slug?: string;
  coverImageUrl?: string;
  images?: string[];
  excerpt?: string;
  author?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  authorName?: string; // For backward compatibility
  createdAt?: string;
  status?: 'draft' | 'published';
}

interface BlogDisplayProps {
  // Display mode: 'public' shows all published blogs, 'user' shows only logged-in user's blogs
  mode?: 'public' | 'user';
  // Number of blogs to show initially (for homepage preview)
  initialLimit?: number;
  // Show "Show More" button if there are more blogs
  showShowMoreButton?: boolean;
  // Show "Load More" button for pagination
  showLoadMoreButton?: boolean;
  // Custom title and description
  title?: string;
  description?: string;
  // Custom className for container
  className?: string;
  // Hide the section if no blogs found
  hideIfEmpty?: boolean;
}

// Component for displaying blog images with random transitions
function BlogImageCarousel({ images, title }: { images: string[]; title: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState('opacity-100');
  const currentIndexRef = React.useRef(0);

  React.useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    if (images.length <= 1) return;

    let timeoutId: NodeJS.Timeout;

    const scheduleNextTransition = () => {
      const minInterval = 3000;
      const maxInterval = 6000;
      const randomInterval = Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval;

      timeoutId = setTimeout(() => {
        setFadeClass('opacity-0');
        
        setTimeout(() => {
          let nextIndex;
          do {
            nextIndex = Math.floor(Math.random() * images.length);
          } while (nextIndex === currentIndexRef.current && images.length > 1);
          
          setCurrentIndex(nextIndex);
          setFadeClass('opacity-100');
          scheduleNextTransition();
        }, 500);
      }, randomInterval);
    };

    scheduleNextTransition();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [images.length, images]);

  const currentImage = images[currentIndex] || images[0];

  return (
    <div className="relative w-full h-48 overflow-hidden bg-gray-100">
      <Image
        src={currentImage}
        alt={title}
        width={640}
        height={256}
        className={`w-full h-48 object-cover transition-opacity duration-1000 ease-in-out ${fadeClass}`}
        unoptimized={currentImage?.includes('s3.tebi.io') || currentImage?.includes('s3.')}
      />
    </div>
  );
}

export default function BlogDisplay({
  mode = 'public',
  initialLimit,
  showShowMoreButton = false,
  showLoadMoreButton = false,
  title = 'From our blog',
  description = 'Ideas, guides, and inspiration from our team',
  className = '',
  hideIfEmpty = false
}: BlogDisplayProps) {
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const limit = initialLimit || 12;

  useEffect(() => {
    const fetchBlogs = async () => {
      setIsLoading(true);
      try {
        let res;
        
        // For homepage preview (initialLimit), fetch one extra blog to check if there are more
        const fetchLimit = (showShowMoreButton && initialLimit && page === 1) 
          ? (initialLimit + 1) 
          : limit;
        
        if (mode === 'public') {
          // Public mode: fetch all published blogs without auth token
          // This ensures all users see all published blogs, not just their own
          const axios = (await import('axios')).default;
          const publicApiClient = axios.create({
            baseURL: process.env.NEXT_PUBLIC_API_URL,
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          res = await publicApiClient.get('/blogs', {
            params: {
              status: 'published',
              page: page.toString(),
              limit: fetchLimit.toString()
            },
          });
        } else {
          // User mode: fetch only logged-in user's published blogs
          res = await apiClient.get('/blogs/my', {
            params: {
              page: page.toString(),
              limit: fetchLimit.toString()
            },
          });
        }
        
        const blogList: BlogItem[] = res?.data?.data || [];
        const pagination = res?.data?.pagination || {};
        
        if (page === 1) {
          setBlogs(blogList);
        } else {
          setBlogs(prev => [...prev, ...blogList]);
        }
        
        // Check if there are more pages or more blogs than displayed
        // For homepage preview, if we fetched more than initialLimit, there are more blogs
        const hasMorePages = pagination.page < pagination.pages;
        const hasMoreBlogs = (showShowMoreButton && initialLimit && page === 1) 
          ? (blogList.length > initialLimit)
          : false;
        setHasMore(hasMorePages || hasMoreBlogs);
      } catch (error) {
        console.error('Error fetching blogs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, mode]); // mode and page are the main dependencies - limit is derived from initialLimit prop

  const formatDate = (value?: string) => {
    if (!value) return '';
    try {
      return new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const getAuthorName = (blog: BlogItem) => {
    if (blog.author) {
      return `${blog.author.firstName} ${blog.author.lastName}`;
    }
    return blog.authorName || 'Admin';
  };

  const openBlogPage = (blog: BlogItem) => {
    if (!blog._id) return;
    const path = blog.slug ? `/blog/${blog.slug}` : `/blog/${blog._id}`;
    router.push(path);
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
    }
  };

  // Hide section if no blogs and hideIfEmpty is true
  if (hideIfEmpty && !isLoading && blogs.length === 0) {
    return null;
  }

  // Show only initialLimit blogs if specified (for homepage preview)
  // If we fetched initialLimit + 1, we know there are more
  const displayBlogs = initialLimit ? blogs.slice(0, initialLimit) : blogs;
  // Check if there are more blogs: either we fetched more than initialLimit, or pagination says there are more pages
  const hasMoreToShow = initialLimit 
    ? (blogs.length > initialLimit || hasMore) 
    : hasMore;

  return (
    <section className={`py-16 bg-gray-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {(title || description) && (
          <div className="mb-12 text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{title}</h2>
            {description && <p className="text-xl text-gray-600">{description}</p>}
          </div>
        )}

        {/* Blog Grid */}
        {isLoading && blogs.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {new Array(initialLimit || 3).fill(null).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="w-full h-48 bg-gray-200 animate-pulse" />
                <div className="p-6">
                  <div className="h-4 w-24 bg-gray-200 animate-pulse rounded mb-4" />
                  <div className="h-6 w-full bg-gray-200 animate-pulse rounded mb-2" />
                  <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : displayBlogs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg mb-6">No blogs found.</p>
            <button
              onClick={() => router.push('/my-blogs?create=true')}
              className="px-6 py-3 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition-colors shadow-md hover:shadow-lg"
            >
              Write Your First Blog
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayBlogs.map((item) => {
                const blogImages = item?.images && item.images.length > 0
                  ? item.images
                  : (item?.coverImageUrl ? [item.coverImageUrl] : []);

                return (
                  <article
                    key={item._id}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => openBlogPage(item)}
                  >
                    {blogImages.length > 0 ? (
                      blogImages.length > 1 ? (
                        <BlogImageCarousel images={blogImages} title={item.title} />
                      ) : (
                        <Image
                          src={blogImages[0]}
                          alt={item.title}
                          width={640}
                          height={256}
                          className="w-full h-48 object-cover"
                          unoptimized={blogImages[0]?.includes('s3.tebi.io') || blogImages[0]?.includes('s3.')}
                        />
                      )
                    ) : (
                      <div className="w-full h-48 bg-gray-100" />
                    )}

                    <div className="p-6">
                      <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                        <span>{getAuthorName(item)}</span>
                        <span>•</span>
                        <time>{formatDate(item?.createdAt)}</time>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2 hover:underline">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 line-clamp-3 mb-4">
                        {item?.excerpt || ''}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openBlogPage(item);
                        }}
                        className="text-pink-600 font-medium hover:text-pink-700"
                      >
                        Read more →
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Show More Button - Navigate to /blog page */}
            {showShowMoreButton && hasMoreToShow && (
              <div className="mt-12 text-center">
                <button
                  onClick={() => router.push('/blog')}
                  className="px-8 py-3 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition-colors shadow-md hover:shadow-lg"
                >
                  Show More
                </button>
              </div>
            )}

            {/* Load More Button - Load more blogs on same page */}
            {showLoadMoreButton && hasMore && !showShowMoreButton && (
              <div className="mt-12 text-center">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="px-8 py-3 bg-pink-600 text-white font-medium rounded-lg hover:bg-pink-700 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

