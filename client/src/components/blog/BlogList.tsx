"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import apiClient from "@/lib/api";
import { toast } from "sonner";
import { Edit, Trash2, MoreVertical, Loader2, CheckCircle, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

// BlogList: displays a list of blogs (drafts and published)
// Supports filtering by status and editing/deleting blogs

interface BlogItem {
  _id: string;
  title: string;
  coverImageUrl?: string;
  excerpt?: string;
  content?: string;
  status: "draft" | "published";
  author?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface BlogListProps {
  status?: "draft" | "published" | "all";
  showAllBlogs?: boolean; // If true, show all blogs (for admin). If false, filter by current user
  onEdit?: (blog: BlogItem) => void;
  onDelete?: (blogId: string) => void;
  onPublish?: (blogId: string) => void;
  onUnpublish?: (blogId: string) => void; // New prop for unpublishing
  onRefresh?: () => void;
  showActions?: boolean;
}

export default function BlogList({ 
  status = "all", 
  showAllBlogs = false, // Default to false - show only user's own blogs
  onEdit,
  onDelete,
  onPublish,
  onUnpublish,
  onRefresh,
  showActions = true 
}: BlogListProps) {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { user } = useAuth();

  // Fetch blogs from API
  // Uses simplified endpoints when appropriate for better performance
  const fetchBlogs = async () => {
    setIsLoading(true);
    try {
      let res;
      let blogList: BlogItem[] = [];

      // Use simplified endpoints when fetching user's own blogs
      // This is more efficient and matches the API design
      if (!showAllBlogs && user && user.id) {
        // For user's own blogs, use simplified endpoints
        if (status === "published") {
          // Use /api/blogs/my endpoint for published blogs
          res = await apiClient.get("/blogs/my");
          blogList = res?.data?.data || [];
        } else if (status === "draft") {
          // Use /api/blogs/drafts endpoint for draft blogs
          res = await apiClient.get("/blogs/drafts");
          blogList = res?.data?.data || [];
        } else {
          // For "all" status, use main endpoint with author filter
          const params: Record<string, string> = { status: "all" };
          params.author = user.id;
          res = await apiClient.get("/blogs", { params });
          blogList = res?.data?.data || [];
        }
      } else {
        // For admin viewing all blogs or other cases, use main endpoint
        const params: Record<string, string> = {};
        if (status !== "all") {
          params.status = status;
        }
        
        // Filter by author ID for admin's own blogs if needed
        if (user && user.id && user.role === "ADMIN" && !showAllBlogs) {
          params.author = user.id;
        }
        
        res = await apiClient.get("/blogs", { params });
        blogList = res?.data?.data || [];
      }
      
      // CRITICAL: Client-side filtering to ensure data integrity
      // Filter by status FIRST to ensure only the correct status blogs are shown
      if (status && status !== "all") {
        blogList = blogList.filter(blog => {
          // Normalize status comparison - handle both string and enum values
          const blogStatus = String(blog.status || '').toLowerCase().trim();
          const targetStatus = String(status || '').toLowerCase().trim();
          const matches = blogStatus === targetStatus;
          
          // Debug log if status doesn't match (only in development)
          if (!matches && process.env.NODE_ENV === 'development') {
            console.warn('Blog status mismatch:', {
              blogId: blog._id,
              blogStatus: blog.status,
              blogStatusNormalized: blogStatus,
              targetStatus: status,
              targetStatusNormalized: targetStatus,
              matches
            });
          }
          
          return matches;
        });
      }
      
      // Additional client-side filtering for non-admin users to ensure only their own blogs are shown
      // This is a safety measure in case backend filtering doesn't work correctly
      if (user && user.id && user.role !== "ADMIN") {
        blogList = blogList.filter(blog => {
          // Check if blog author matches current user
          // Handle both populated author object and direct author ID
          const authorId = blog.author?._id || (typeof blog.author === 'string' ? blog.author : null) || blog.author;
          const currentUserId = user.id;
          
          // Compare as strings to handle ObjectId comparison
          const authorIdStr = authorId?.toString() || '';
          const userIdStr = currentUserId?.toString() || '';
          const matches = authorIdStr === userIdStr;
          
          // Debug log if author doesn't match (only in development)
          if (!matches && process.env.NODE_ENV === 'development') {
            console.warn('Blog author mismatch:', {
              blogId: blog._id,
              blogAuthor: blog.author,
              blogAuthorId: authorIdStr,
              currentUserId: userIdStr,
              matches
            });
          }
          
          return matches;
        });
      }
      
      // Final debug log for draft filtering (only in development)
      if (status === 'draft' && process.env.NODE_ENV === 'development') {
        console.log('Client-side draft filter result:', {
          requestedStatus: status,
          totalFromAPI: res?.data?.data?.length || 0,
          afterStatusFilter: blogList.length,
          drafts: blogList.filter(b => String(b.status).toLowerCase() === 'draft').length,
          blogStatuses: blogList.map(b => ({ id: b._id, status: b.status, title: b.title }))
        });
      }
      
      setBlogs(Array.isArray(blogList) ? blogList : []);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      toast.error("Failed to load blogs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, user?.id, showAllBlogs]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        const menuElement = menuRefs.current[openMenuId];
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  // Handle delete blog
  const handleDelete = async (blogId: string) => {
    if (!confirm("Are you sure you want to delete this blog?")) {
      return;
    }

    setDeletingId(blogId);
    try {
      await apiClient.delete(`/blogs/${blogId}`);
      toast.success("Blog deleted successfully");
      // Remove from list
      setBlogs(prev => prev.filter(blog => blog._id !== blogId));
      if (onDelete) {
        onDelete(blogId);
      }
    } catch (error) {
      console.error("Error deleting blog:", error);
      toast.error("Failed to delete blog");
    } finally {
      setDeletingId(null);
    }
  };

  // Handle edit blog
  const handleEdit = (blog: BlogItem) => {
    setOpenMenuId(null);
    if (onEdit) {
      onEdit(blog);
    }
  };

  // Handle publish blog
  const handlePublish = async (blogId: string) => {
    setOpenMenuId(null);
    if (!confirm("Are you sure you want to publish this blog? It will be visible on the main page.")) {
      return;
    }

    setPublishingId(blogId);
    try {
      // Normalize status to ensure it's properly sent
      await apiClient.patch(`/blogs/${blogId}`, { status: "published" });
      toast.success("Blog published successfully");
      
      // Remove the blog from current list (since it's now published, it shouldn't be in drafts)
      setBlogs(prev => prev.filter(blog => blog._id !== blogId));
      
      // Refresh the list to get updated data
      await fetchBlogs();
      
      // Trigger refresh callbacks
      if (onRefresh) {
        onRefresh();
      }
      if (onPublish) {
        onPublish(blogId);
      }
    } catch (error) {
      console.error("Error publishing blog:", error);
      toast.error("Failed to publish blog");
      // Refresh on error to ensure we have correct data
      await fetchBlogs();
    } finally {
      setPublishingId(null);
    }
  };

  // Handle unpublish blog (change from published to draft)
  const handleUnpublish = async (blogId: string) => {
    setOpenMenuId(null);
    if (!confirm("Are you sure you want to unpublish this blog? It will be moved to drafts and won't be visible on the main page.")) {
      return;
    }

    setPublishingId(blogId);
    try {
      // Normalize status to ensure it's properly sent
      await apiClient.patch(`/blogs/${blogId}`, { status: "draft" });
      toast.success("Blog unpublished successfully");
      
      // Remove the blog from current list (since it's now draft, it shouldn't be in published)
      setBlogs(prev => prev.filter(blog => blog._id !== blogId));
      
      // Refresh the list to get updated data
      await fetchBlogs();
      
      // Trigger refresh callbacks
      if (onRefresh) {
        onRefresh();
      }
      if (onUnpublish) {
        onUnpublish(blogId);
      }
    } catch (error) {
      console.error("Error unpublishing blog:", error);
      toast.error("Failed to unpublish blog");
      // Refresh on error to ensure we have correct data
      await fetchBlogs();
    } finally {
      setPublishingId(null);
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  // Get author name
  const getAuthorName = (blog: BlogItem) => {
    if (blog.author) {
      return `${blog.author.firstName} ${blog.author.lastName}`;
    }
    return "Unknown";
  };

  // Check if user can edit/delete this blog
  const canModify = (blog: BlogItem) => {
    if (!user) return false;
    // Admin can modify any blog
    if (user.role === "ADMIN") return true;
    // Users can only modify their own blogs
    return blog.author?._id === user.id;
  };

  // Check if user can delete this blog
  // Admin can delete any blog in "All Blogs" section, users can only delete their own
  const canDelete = (blog: BlogItem) => {
    if (!user) return false;
    // Admin can delete any blog
    if (user.role === "ADMIN") return true;
    // Users can only delete their own blogs
    return blog.author?._id === user.id;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  if (blogs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">No blogs found.</p>
        {status === "draft" && (
          <p className="text-sm mt-2">Start writing your first blog draft!</p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {blogs.map((blog) => (
        <div
          key={blog._id}
          className="relative bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col"
        >
          {/* Actions - moved to top-right */}
          {showActions && (canModify(blog) || canDelete(blog)) && (
            <div
              className="absolute top-3 right-3 z-20"
              ref={(el) => {
                menuRefs.current[blog._id] = el;
              }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setOpenMenuId(openMenuId === blog._id ? null : blog._id)
                }
                className="h-8 w-8 p-0 rounded-full bg-white/90 hover:bg-white shadow"
                title="More options"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>

              {openMenuId === blog._id && (
                <div className="absolute right-0 top-10 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-30 py-1">
                  {canModify(blog) && (
                    <button
                      onClick={() => handleEdit(blog)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                  )}

                  {canModify(blog) && blog.status === "draft" && (
                    <button
                      onClick={() => handlePublish(blog._id)}
                      disabled={publishingId === blog._id}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                    >
                      {publishingId === blog._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      Publish
                    </button>
                  )}

                  {canModify(blog) && blog.status === "published" && onUnpublish && (
                    <button
                      onClick={() => handleUnpublish(blog._id)}
                      disabled={publishingId === blog._id}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                    >
                      {publishingId === blog._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4 text-yellow-600" />
                      )}
                      Unpublish
                    </button>
                  )}

                  {canDelete(blog) && (
                    <button
                      onClick={() => handleDelete(blog._id)}
                      disabled={deletingId === blog._id}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                    >
                      {deletingId === blog._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          {/* Cover Image */}
          {blog.coverImageUrl && (
            <div className="relative w-full pt-[56%] bg-gray-100">
              <Image
                src={blog.coverImageUrl}
                alt={blog.title}
                fill
                className="absolute inset-0 w-full h-full object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                unoptimized={blog.coverImageUrl.includes('s3.tebi.io') || blog.coverImageUrl.includes('s3.')}
              />
            </div>
          )}

          {/* Content */}
          <div className="p-5 flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                {blog.title || "Untitled"}
              </h3>
              {/* Show Draft badge only - Published status is kept in backend but not displayed */}
              {blog.status === "draft" && (
                <span className="px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap bg-yellow-100 text-yellow-800">
                  Draft
                </span>
              )}
            </div>

            {blog.excerpt && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{blog.excerpt}</p>
            )}

            <div className="mt-auto flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate">By {getAuthorName(blog)}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span>Created {formatDate(blog.createdAt)}</span>
              </div>
            </div>

            {/* Actions moved to top-right above */}
          </div>
        </div>
      ))}
    </div>
  );
}

