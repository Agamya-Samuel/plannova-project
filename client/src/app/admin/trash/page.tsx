'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, RotateCcw, User, MapPin, Calendar, FileText, Camera, Video, Palette, Utensils, Link, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import apiClient from '@/lib/api';

interface TrashItem {
  _id: string;
  type: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  name?: string;
  title?: string;
  description?: string;
  providerId?: { firstName: string; lastName: string; email: string };
  provider?: { firstName: string; lastName: string; email: string };
  author?: { firstName: string; lastName: string; email: string };
  customerId?: { firstName: string; lastName: string; email: string };
  serviceType?: string;
  date?: string;
  deletedAt: string;
}

interface TrashResponse {
  items: TrashItem[];
}

const TABS = [
  { id: 'all', label: 'All Items' },
  { id: 'users', label: 'Users' },
  { id: 'venues', label: 'Venues' },
  { id: 'catering', label: 'Catering' },
  { id: 'photography', label: 'Photography' },
  { id: 'videography', label: 'Videography' },
  { id: 'bridal-makeup', label: 'Bridal Makeup' },
  { id: 'decoration', label: 'Decoration' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'blogs', label: 'Blogs' },
];

export default function TrashPage() {
  const { user: authUser } = useAuth();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTrashItems = useCallback(async () => {
    try {
      setLoading(true);
      // Fix the URL construction to avoid empty type parameter
      const url = activeTab === 'all' || !activeTab
        ? '/admin/trash' 
        : `/admin/trash?type=${activeTab}`;
    
      const response = await apiClient.get<TrashResponse>(url);
      setItems(response.data.items || []);
    } catch (error: unknown) {
      console.error('Failed to fetch trash items:', error);
      if (error instanceof Error) {
        toast.error(`Failed to fetch trash items: ${error.message}`);
      } else {
        toast.error('Failed to fetch trash items');
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchTrashItems();
  }, [fetchTrashItems]);

  const restoreItem = async (id: string, type: string) => {
    try {
      await apiClient.post(`/admin/trash/${id}/restore`, { type });

      toast.success('Item restored successfully');
      fetchTrashItems(); // Refresh the list
    } catch (error: unknown) {
      console.error('Failed to restore item:', error);
      if (error instanceof Error) {
        toast.error(`Failed to restore item: ${error.message}`);
      } else {
        toast.error('Failed to restore item');
      }
    }
  };

  const permanentlyDeleteItem = async (id: string, type: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.delete(`/admin/trash/${id}/permanent`, { data: { type } });

      toast.success('Item permanently deleted');
      fetchTrashItems(); // Refresh the list
    } catch (error: unknown) {
      console.error('Failed to permanently delete item:', error);
      if (error instanceof Error) {
        toast.error(`Failed to permanently delete item: ${error.message}`);
      } else {
        toast.error('Failed to permanently delete item');
      }
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user': return <User className="h-4 w-4" />;
      case 'venue': return <MapPin className="h-4 w-4" />;
      case 'catering': return <Utensils className="h-4 w-4" />;
      case 'photography': return <Camera className="h-4 w-4" />;
      case 'videography': return <Video className="h-4 w-4" />;
      case 'bridal-makeup': return <Palette className="h-4 w-4" />;
      case 'decoration': return <Palette className="h-4 w-4" />;
      case 'booking': return <Calendar className="h-4 w-4" />;
      case 'blog': return <FileText className="h-4 w-4" />;
      default: return <Link className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'user': return 'User';
      case 'venue': return 'Venue';
      case 'catering': return 'Catering';
      case 'photography': return 'Photography';
      case 'videography': return 'Videography';
      case 'bridal-makeup': return 'Bridal Makeup';
      case 'decoration': return 'Decoration';
      case 'booking': return 'Booking';
      case 'blog': return 'Blog';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter items based on search term
  const filteredItems = items.filter(item => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    
    if (item.type === 'user') {
      return (
        item.firstName?.toLowerCase().includes(term) ||
        item.lastName?.toLowerCase().includes(term) ||
        item.email?.toLowerCase().includes(term)
      );
    }
    
    if (['venue', 'catering', 'photography', 'videography', 'bridal-makeup', 'decoration'].includes(item.type)) {
      return (
        item.name?.toLowerCase().includes(term) ||
        item.provider?.firstName?.toLowerCase().includes(term) ||
        item.provider?.lastName?.toLowerCase().includes(term) ||
        item.providerId?.firstName?.toLowerCase().includes(term) ||
        item.providerId?.lastName?.toLowerCase().includes(term)
      );
    }
    
    if (item.type === 'booking') {
      return (
        item.serviceType?.toLowerCase().includes(term) ||
        item.customerId?.firstName?.toLowerCase().includes(term) ||
        item.customerId?.lastName?.toLowerCase().includes(term) ||
        (item.date && new Date(item.date).toLocaleDateString().toLowerCase().includes(term))
      );
    }
    
    if (item.type === 'blog') {
      return (
        item.title?.toLowerCase().includes(term) ||
        item.author?.firstName?.toLowerCase().includes(term) ||
        item.author?.lastName?.toLowerCase().includes(term)
      );
    }
    
    return false;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    // Added more margin on all sides (m-6) for better spacing
    <div className="space-y-6 m-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Trash Management</h1>
        <p className="text-gray-500 mt-2">Manage deleted items and restore or permanently delete them.</p>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search deleted items..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <Button 
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id 
                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 shadow-sm" 
                : "border border-gray-200 bg-white text-gray-700 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-600"
              }
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="border rounded-2xl p-12 text-center bg-white shadow-sm border-gray-200">
          <Trash2 className="h-16 w-16 mx-auto text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No items found</h3>
          <p className="text-gray-500 mt-2">
            {searchTerm ? 'No deleted items match your search.' : 'Items that are deleted will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <div key={`${item._id}-${item.type}`} className="border rounded-2xl p-5 flex flex-col bg-white shadow-sm hover:shadow-md transition-shadow border-gray-200">
              <div className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="text-sm font-medium flex items-center gap-2 text-gray-700">
                  {getTypeIcon(item.type)}
                  {getTypeLabel(item.type)}
                </div>
                <Badge variant="secondary" className="bg-pink-50 text-pink-600 border-pink-100">
                  {formatDate(item.deletedAt)}
                </Badge>
              </div>
              <div className="flex-1">
                <div className="space-y-3 mt-3">
                  {item.type === 'user' && (
                    <div>
                      <p className="font-medium text-gray-900">{item.firstName} {item.lastName}</p>
                      <p className="text-sm text-gray-500">{item.email}</p>
                    </div>
                  )}
                  
                  {(item.type === 'venue' || item.type === 'catering' || item.type === 'photography' || 
                    item.type === 'videography' || item.type === 'bridal-makeup' || item.type === 'decoration') && (
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {(item.provider || item.providerId) && (
                        <p className="text-sm text-gray-500">
                          Provider: {(item.provider || item.providerId)?.firstName} {(item.provider || item.providerId)?.lastName}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {item.type === 'booking' && (
                    <div>
                      <p className="font-medium text-gray-900">{item.serviceType}</p>
                      <p className="text-sm text-gray-500">
                        Customer: {item.customerId?.firstName} {item.customerId?.lastName}
                      </p>
                      {item.date && (
                        <p className="text-sm text-gray-500">
                          Date: {new Date(item.date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {item.type === 'blog' && (
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      {item.author && (
                        <p className="text-sm text-gray-500">
                          Author: {item.author.firstName} {item.author.lastName}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 mt-5">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => restoreItem(item._id, item.type)}
                    className="flex-1 border border-gray-200 bg-white text-gray-700 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-600"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restore
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => permanentlyDeleteItem(item._id, item.type)}
                    className="flex-1 bg-red-500 text-white hover:bg-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
