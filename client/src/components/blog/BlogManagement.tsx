'use client';

import React, { useState, useLayoutEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import BlogEditor from '@/components/blog/BlogEditor';
import BlogList from '@/components/blog/BlogList';

// Blog Management Component: Unified component for all user roles
// - Admin: Shows "All Blogs", "My Blogs", and "Drafts" tabs
// - Other roles (Customer, Provider, Staff): Shows "My Blogs" and "Drafts" tabs

interface BlogManagementProps {
  // Optional prop to control initial tab (useful for navigation)
  initialTab?: 'all' | 'my' | 'drafts';
}

export default function BlogManagement({ initialTab = 'my' }: BlogManagementProps) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<'all' | 'my' | 'drafts' | 'create'>(initialTab);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingBlog, setEditingBlog] = useState<{ 
    _id: string; 
    title: string; 
    coverImageUrl?: string; 
    images?: string[];
    excerpt?: string; 
    content?: string; 
    status: "draft" | "published" 
  } | null>(null);

  // Check if user is admin
  const isAdmin = user?.role === 'ADMIN';

  // Check for query parameter to auto-open create section
  // This allows navigation from "Write Your First Blog" button
  useLayoutEffect(() => {
    const createParam = searchParams.get('create');
    if (createParam === 'true') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveSection('create');
      setEditingBlog(null); // Clear any editing state
    }
  }, [searchParams]);

  // Handle blog saved/updated - refresh the lists
  const handleBlogSaved = () => {
    setRefreshKey(prev => prev + 1);
    setEditingBlog(null); // Clear edit mode
    // If creating new blog, switch to Drafts tab; if editing, stay on create section
    if (!editingBlog) {
      setActiveSection('drafts');
    } else {
      setActiveSection('create');
    }
  };

  // Handle blog deleted - refresh the lists
  const handleBlogDeleted = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Handle blog edit
  const handleBlogEdit = (blog: { 
    _id: string; 
    title: string; 
    coverImageUrl?: string; 
    images?: string[];
    excerpt?: string; 
    content?: string; 
    status: "draft" | "published" 
  }) => {
    setEditingBlog(blog);
    setActiveSection('create'); // Switch to create section for editing
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingBlog(null);
  };

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Blog Management</h1>
          <p className="text-gray-600">Create and manage your blog posts</p>
        </div>

        {/* Top Level Tabs */}
        <div className="mb-6 flex gap-4 border-b border-gray-200 items-center justify-between">
          <div className="flex gap-4">
            {/* All Blogs tab - Only for Admin */}
            {isAdmin && (
              <button
                onClick={() => {
                  setActiveSection('all');
                  setEditingBlog(null); // Clear any editing state
                }}
                className={`px-4 py-2 font-medium text-sm transition-colors ${
                  activeSection === 'all'
                    ? 'text-pink-600 border-b-2 border-pink-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All Blogs
              </button>
            )}
            
            {/* My Blogs tab - For all roles */}
            <button
              onClick={() => {
                setActiveSection('my');
                setEditingBlog(null); // Clear any editing state
              }}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeSection === 'my'
                  ? 'text-pink-600 border-b-2 border-pink-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My Blogs
            </button>

            {/* Drafts tab - For all roles */}
            <button
              onClick={() => {
                setActiveSection('drafts');
                setEditingBlog(null); // Clear any editing state
              }}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeSection === 'drafts'
                  ? 'text-pink-600 border-b-2 border-pink-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Drafts
            </button>
          </div>

          {/* Create New Blog Button */}
          <button
            onClick={() => {
              setActiveSection('create');
              setEditingBlog(null); // Clear any editing state
            }}
            className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors text-sm font-medium"
          >
            Create New Blog
          </button>
        </div>

        {/* Content */}
        <div className="mt-6">
          {/* Create New Blog Section */}
          {activeSection === 'create' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {editingBlog ? (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-semibold text-gray-900">Edit Blog: {editingBlog.title}</h2>
                  </div>
                  <BlogEditor 
                    blogId={editingBlog._id}
                    defaultStatus={editingBlog.status}
                    onSave={handleBlogSaved}
                    onCancel={handleCancelEdit}
                  />
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold mb-4 text-gray-900">Create New Blog</h2>
                  <BlogEditor 
                    defaultStatus="draft" 
                    onSave={handleBlogSaved}
                  />
                </>
              )}
            </div>
          )}

          {/* All Blogs Section - Admin only, shows all published blogs */}
          {activeSection === 'all' && isAdmin && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">All Published Blogs</h2>
              <BlogList 
                key={`all-published-${refreshKey}`}
                status="published" 
                showAllBlogs={true} // Show all blogs from all users (admin only)
                onEdit={handleBlogEdit}
                onDelete={handleBlogDeleted}
                onUnpublish={handleBlogSaved}
                onRefresh={() => setRefreshKey(prev => prev + 1)}
              />
            </div>
          )}

          {/* My Blogs Section - Shows published blogs by current user */}
          {activeSection === 'my' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">My Published Blogs</h2>
              <BlogList 
                key={`my-published-${refreshKey}`}
                status="published" 
                showAllBlogs={false} // Always filter by author for regular users
                onEdit={handleBlogEdit}
                onDelete={handleBlogDeleted}
                onUnpublish={handleBlogSaved}
                onRefresh={() => setRefreshKey(prev => prev + 1)}
              />
            </div>
          )}

          {/* Drafts Section - Shows draft blogs by current user */}
          {activeSection === 'drafts' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">My Draft Blogs</h2>
              <BlogList 
                key={`my-drafts-${refreshKey}`}
                status="draft" 
                showAllBlogs={false} // Always filter by author
                onEdit={handleBlogEdit}
                onDelete={handleBlogDeleted}
                onPublish={handleBlogSaved}
                onRefresh={() => setRefreshKey(prev => prev + 1)}
              />
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

