'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { 
  Camera,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User
} from 'lucide-react';
import { toast } from 'sonner';

interface ContentItem {
  id: string;
  title: string;
  type: 'blog' | 'testimonial' | 'faq' | 'announcement';
  status: 'draft' | 'published' | 'archived';
  author: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminContentPage() {
  const { user: currentUser, isLoading } = useAuth();
  const [contentItems] = useState<ContentItem[]>([
    {
      id: '1',
      title: 'Top 10 Wedding Venues in Mumbai',
      type: 'blog',
      status: 'published',
      author: 'Admin User',
      createdAt: '2025-10-15',
      updatedAt: '2025-10-15'
    },
    {
      id: '2',
      title: 'Customer Success Story: Raj & Priya',
      type: 'testimonial',
      status: 'published',
      author: 'Admin User',
      createdAt: '2025-10-10',
      updatedAt: '2025-10-10'
    },
    {
      id: '3',
      title: 'New Payment Options Available',
      type: 'announcement',
      status: 'draft',
      author: 'Admin User',
      createdAt: '2025-10-18',
      updatedAt: '2025-10-18'
    },
    {
      id: '4',
      title: 'Frequently Asked Questions',
      type: 'faq',
      status: 'published',
      author: 'Admin User',
      createdAt: '2025-10-01',
      updatedAt: '2025-10-01'
    }
  ]);
  const [filter, setFilter] = useState('all');

  const handleCreateContent = () => {
    toast.success('Create content functionality would open here');
    // In a real implementation, this would open a modal or navigate to a create page
  };

  const handleEditContent = (id: string) => {
    toast.success(`Edit content with ID: ${id}`);
    // In a real implementation, this would open an edit modal or navigate to an edit page
  };

  const handleDeleteContent = (id: string) => {
    toast.success(`Delete content with ID: ${id}`);
    // In a real implementation, this would show a confirmation and delete the content
  };

  const handlePreviewContent = (id: string) => {
    toast.success(`Preview content with ID: ${id}`);
    // In a real implementation, this would open a preview
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'blog':
        return <Edit className="h-4 w-4" />;
      case 'testimonial':
        return <User className="h-4 w-4" />;
      case 'faq':
        return <Edit className="h-4 w-4" />;
      case 'announcement':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Edit className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'blog':
        return 'bg-blue-100 text-blue-800';
      case 'testimonial':
        return 'bg-green-100 text-green-800';
      case 'faq':
        return 'bg-purple-100 text-purple-800';
      case 'announcement':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredContent = filter === 'all' 
    ? contentItems 
    : contentItems.filter(item => item.type === filter);

  if (!isLoading && currentUser?.role !== 'ADMIN') {
    return <div>Your session timed out. Please log in again.</div>;
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Content Management
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Manage site content and configurations
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Camera className="h-5 w-5 text-orange-500" />
                  <span>Content Administration</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Edit className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Posts</p>
                  <p className="text-2xl font-bold text-gray-900">{contentItems.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Published</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {contentItems.filter(item => item.status === 'published').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Edit className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Drafts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {contentItems.filter(item => item.status === 'draft').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Blog Posts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {contentItems.filter(item => item.type === 'blog').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mb-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilter('all')}
                    className={filter === 'all' ? 'bg-red-600 hover:bg-red-700' : ''}
                  >
                    All Content
                  </Button>
                  <Button
                    variant={filter === 'blog' ? 'default' : 'outline'}
                    onClick={() => setFilter('blog')}
                    className={filter === 'blog' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                  >
                    Blog Posts
                  </Button>
                  <Button
                    variant={filter === 'testimonial' ? 'default' : 'outline'}
                    onClick={() => setFilter('testimonial')}
                    className={filter === 'testimonial' ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    Testimonials
                  </Button>
                  <Button
                    variant={filter === 'faq' ? 'default' : 'outline'}
                    onClick={() => setFilter('faq')}
                    className={filter === 'faq' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                  >
                    FAQs
                  </Button>
                  <Button
                    variant={filter === 'announcement' ? 'default' : 'outline'}
                    onClick={() => setFilter('announcement')}
                    className={filter === 'announcement' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                  >
                    Announcements
                  </Button>
                </div>
                <Button 
                  onClick={handleCreateContent}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Content</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Content Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Content
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContent.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {item.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                          {getTypeIcon(item.type)}
                          <span className="ml-1 capitalize">{item.type}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          <span className="capitalize">{item.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.author}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreviewContent(item.id)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditContent(item.id)}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteContent(item.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredContent.length === 0 && (
              <div className="text-center py-12">
                <Camera className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No content found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filter === 'all' 
                    ? "Get started by creating new content." 
                    : `No ${filter} content found.`}
                </p>
                <div className="mt-6">
                  <Button 
                    onClick={handleCreateContent}
                    className="flex items-center space-x-2 bg-red-600 hover:bg-red-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Content</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}