'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { ArrowLeft, MapPin, Utensils, Camera, Video, Flower, Music, Heart, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { sonnerConfirm } from '@/lib/sonner-confirm';

interface WorkItem {
  _id: string;
  name: string;
  status: string;
  images?: { url: string }[];
  createdAt: string;
}

interface ProviderDetailResponse {
  provider: { _id: string; firstName: string; lastName: string; email: string; phone?: string };
  works: {
    venues: WorkItem[];
    catering: WorkItem[];
    photography: WorkItem[];
    videography: WorkItem[];
    decoration: WorkItem[];
    entertainment: WorkItem[];
    bridalMakeup: WorkItem[];
  };
}

export default function StaffProviderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<ProviderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);

  useEffect(() => {
    const id = params?.id as string;
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<ProviderDetailResponse>(`/staff/providers/${id}`);
        setData(res.data);
        setError('');
      } catch (err) {
        console.error('Error fetching provider detail', err);
        setError('Failed to fetch provider');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params]);

  const sections: { key: keyof ProviderDetailResponse['works']; title: string; icon: React.ReactNode }[] = [
    { key: 'venues', title: 'Venues', icon: <MapPin className="h-4 w-4" /> },
    { key: 'catering', title: 'Catering', icon: <Utensils className="h-4 w-4" /> },
    { key: 'photography', title: 'Photography', icon: <Camera className="h-4 w-4" /> },
    { key: 'videography', title: 'Videography', icon: <Video className="h-4 w-4" /> },
    { key: 'decoration', title: 'Decoration', icon: <Flower className="h-4 w-4" /> },
    { key: 'entertainment', title: 'Entertainment', icon: <Music className="h-4 w-4" /> },
    { key: 'bridalMakeup', title: 'Bridal Makeup', icon: <Heart className="h-4 w-4" /> },
  ];

  const getItemLink = (sectionKey: keyof ProviderDetailResponse['works'], item: WorkItem) => {
    switch (sectionKey) {
      case 'venues':
        return `/venues/${item._id}`;
      case 'catering':
        return `/staff/approvals/catering?search=${encodeURIComponent(item.name)}`;
      case 'photography':
        return `/staff/approvals/photography?search=${encodeURIComponent(item.name)}`;
      case 'videography':
        return `/staff/approvals/videography?search=${encodeURIComponent(item.name)}`;
      case 'decoration':
        return `/staff/approvals/decoration?search=${encodeURIComponent(item.name)}`;
      case 'entertainment':
        return `/staff/approvals/entertainment?search=${encodeURIComponent(item.name)}`;
      case 'bridalMakeup':
        return `/staff/approvals/bridal-makeup?search=${encodeURIComponent(item.name)}`;
      default:
        return '#';
    }
  };

  const getDeleteEndpoint = (sectionKey: keyof ProviderDetailResponse['works'], id: string) => {
    switch (sectionKey) {
      case 'venues':
        return `/venues/staff/${id}`;
      case 'catering':
        return `/catering/staff/${id}`;
      case 'photography':
        return `/photography/staff/${id}`;
      case 'videography':
        return `/videography/staff/${id}`;
      case 'decoration':
        return `/decoration/staff/${id}`;
      case 'entertainment':
        return `/entertainment/staff/${id}`;
      case 'bridalMakeup':
        return `/bridal-makeup/staff/${id}`;
      default:
        return '';
    }
  };

  const handleDelete = async (sectionKey: keyof ProviderDetailResponse['works'], item: WorkItem) => {
    const confirmed = await sonnerConfirm(`Delete "${item.name}"? This cannot be undone.`);
    if (!confirmed) return;
    try {
      const endpoint = getDeleteEndpoint(sectionKey, item._id);
      if (!endpoint) return;
      await apiClient.delete(endpoint);
      toast.success('Deleted successfully');
      // Refresh local state by removing the item
      setData(prev => {
        if (!prev) return prev;
        const updated = { ...prev, works: { ...prev.works } } as ProviderDetailResponse;
        // @ts-expect-error dynamic index
        updated.works[sectionKey] = prev.works[sectionKey].filter((w) => w._id !== item._id);
        return updated;
      });
    } catch {
      toast.error('Failed to delete');
    } finally {
      setOpenMenuKey(null);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <button onClick={() => router.back()} className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-800">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </button>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            {loading ? (
              <div className="text-gray-500">Loading...</div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : data && (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{data.provider.firstName} {data.provider.lastName}</h1>
                  <p className="text-gray-600">{data.provider.email}{data.provider.phone ? ` · ${data.provider.phone}` : ''}</p>
                </div>
              </div>
            )}
          </div>

          {data && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sections.map(section => {
                const items = data.works[section.key];
                return (
                  <div key={section.key} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white">
                        {section.icon}
                      </div>
                      <h2 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                        {section.title}
                      </h2>
                      <span className="ml-auto text-xs text-gray-500">{items?.length || 0}</span>
                    </div>
                    {items && items.length > 0 ? (
                      <ul className="grid grid-cols-1 gap-4">
                        {items.slice(0, 8).map(item => {
                          const menuKey = `${section.key}-${item._id}`;
                          return (
                          <li key={item._id} className="relative flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:shadow transition bg-white">
                            <div>
                              {item.images && item.images[0]?.url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={item.images[0].url} alt={item.name} className="w-16 h-16 rounded-lg object-cover border" />
                              ) : (
                                <div className="w-16 h-16 rounded-lg bg-gray-100 border" />
                              )}
                            </div>
                            <button
                              onClick={() => router.push(getItemLink(section.key, item))}
                              className="text-left group flex-1"
                            >
                              <div className="text-base font-semibold text-gray-900 group-hover:text-indigo-700">{item.name}</div>
                              <div className="text-xs text-gray-500 uppercase tracking-wide">{item.status}</div>
                            </button>
                            <div className="absolute top-3 right-3">
                              <button
                                onClick={() => setOpenMenuKey(k => k === menuKey ? null : menuKey)}
                                className="p-2 rounded-lg hover:bg-gray-100"
                                aria-label="More"
                              >
                                <MoreVertical className="h-4 w-4 text-gray-600" />
                              </button>
                              {openMenuKey === menuKey && (
                                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border z-10">
                                  <button
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                    onClick={() => { setOpenMenuKey(null); router.push(getItemLink(section.key, item)); }}
                                  >
                                    View details
                                  </button>
                                  <button
                                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                    onClick={() => handleDelete(section.key, item)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="text-sm text-gray-500">No items</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}


