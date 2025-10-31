'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import BlogEditor from '@/components/blog/BlogEditor';
import BlogList from '@/components/blog/BlogList';

// Admin Blog Page: allows ADMIN to write blogs and view drafts.
// Shows both editor and list of existing blogs (drafts and published).

export default function AdminBlogPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'create' | 'drafts' | 'published'>('create');
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingBlog, setEditingBlog] = useState<{ _id: string; title: string; coverImageUrl?: string; excerpt?: string; content?: string; status: "draft" | "published" } | null>(null);

  if (!user || user.role !== 'ADMIN') {
    return (
      <ProtectedRoute>
        <div className="max-w-3xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">Access denied</h1>
          <p className="text-gray-600">Only admins can write blogs here.</p>
        </div>
      </ProtectedRoute>
    );
  }

  // Handle blog saved/updated - refresh the lists
  const handleBlogSaved = () => {
    setRefreshKey(prev => prev + 1);
    setEditingBlog(null); // Clear edit mode
    // If creating new blog, switch to drafts tab; if editing, stay on create tab
    if (!editingBlog) {
      setActiveTab('drafts');
    } else {
      setActiveTab('create');
    }
  };

  // Handle blog deleted - refresh the lists
  const handleBlogDeleted = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Handle blog edit
  const handleBlogEdit = (blog: { _id: string; title: string; coverImageUrl?: string; excerpt?: string; content?: string; status: "draft" | "published" }) => {
    setEditingBlog(blog);
    setActiveTab('create'); // Switch to create tab for editing
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingBlog(null);
  };

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto p-6 space-y-6 bg-white min-h-screen text-gray-900">
        <header>
          <h1 className="text-3xl font-bold">Blog Management</h1>
          <p className="text-gray-600">Create and manage your blog articles.</p>
        </header>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('create')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'create'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Create New Blog
            </button>
            <button
              onClick={() => setActiveTab('drafts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'drafts'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Drafts
            </button>
            <button
              onClick={() => setActiveTab('published')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'published'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Published
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'create' && (
            <div>
              {editingBlog ? (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Edit Blog: {editingBlog.title}</h2>
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
                  <h2 className="text-2xl font-semibold mb-4">Create New Blog</h2>
                  <BlogEditor 
                    defaultStatus="published" 
                    onSave={handleBlogSaved}
                  />
                </>
              )}
            </div>
          )}

          {activeTab === 'drafts' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Draft Blogs</h2>
              <BlogList 
                key={`drafts-${refreshKey}`}
                status="draft" 
                onEdit={handleBlogEdit}
                onDelete={handleBlogDeleted}
                onPublish={handleBlogSaved}
                onRefresh={() => setRefreshKey(prev => prev + 1)}
              />
            </div>
          )}

          {activeTab === 'published' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Published Blogs</h2>
              <BlogList 
                key={`published-${refreshKey}`}
                status="published" 
                onEdit={handleBlogEdit}
                onDelete={handleBlogDeleted}
                onRefresh={() => setRefreshKey(prev => prev + 1)}
              />
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}


