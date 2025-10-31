"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import apiClient from "@/lib/api";
import { toast } from "sonner";
import { Edit, Trash2, MoreVertical, Loader2, CheckCircle } from "lucide-react";
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
  onEdit?: (blog: BlogItem) => void;
  onDelete?: (blogId: string) => void;
  onPublish?: (blogId: string) => void;
  onRefresh?: () => void;
  showActions?: boolean;
}

export default function BlogList({ 
  status = "all", 
  onEdit,
  onDelete,
  onPublish,
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
  const fetchBlogs = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (status !== "all") {
        params.status = status;
      }
      
      const res = await apiClient.get("/blogs", { params });
      const blogList: BlogItem[] = res?.data?.data || [];
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
  }, [status]);

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
      await apiClient.patch(`/blogs/${blogId}`, { status: "published" });
      toast.success("Blog published successfully");
      // Refresh the list
      await fetchBlogs();
      if (onRefresh) {
        onRefresh();
      }
      if (onPublish) {
        onPublish(blogId);
      }
    } catch (error) {
      console.error("Error publishing blog:", error);
      toast.error("Failed to publish blog");
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
    // Admin and staff can modify any blog
    if (user.role === "ADMIN" || user.role === "STAFF") return true;
    // Users can only modify their own blogs
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
          {showActions && canModify(blog) && (
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
                  <button
                    onClick={() => handleEdit(blog)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>

                  {blog.status === "draft" && (
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
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                  blog.status === "published"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {blog.status === "published" ? "Published" : "Draft"}
              </span>
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

