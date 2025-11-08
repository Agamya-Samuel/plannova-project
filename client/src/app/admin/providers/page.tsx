'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/api';
import { Search, Users } from 'lucide-react';

interface ProviderItem {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  counts?: {
    venues: number;
    catering: number;
    photography: number;
    videography: number;
    decoration: number;
    entertainment: number;
    bridalMakeup: number;
  };
}

interface ProvidersResponse {
  providers: ProviderItem[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export default function AdminProvidersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [list, setList] = useState<ProviderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);

  const loadProviders = async (pageNum = 1, searchTerm = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(pageNum), limit: '10' });
      if (searchTerm) params.append('search', searchTerm);
      const res = await apiClient.get<ProvidersResponse>(`/staff/providers?${params}`);
      setList(res.data.providers);
      setPages(res.data.pagination.pages);
      setError('');
    } catch (e) {
      console.error('Error fetching providers', e);
      setError('Failed to fetch providers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadProviders(page, search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page]);

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-indigo-50 text-indigo-700">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">All Providers</h1>
                  <p className="text-gray-600">Search and open a provider to view their work</p>
                </div>
              </div>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { setPage(1); loadProviders(1, search.trim()); } }}
                  placeholder="Search by name or email"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Grid List */}
          {loading ? (
            <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">Loading...</div>
          ) : error ? (
            <div className="bg-white rounded-2xl shadow p-8 text-center text-red-600">{error}</div>
          ) : list.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-500">No providers found</div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {list.map((p) => (
                <div
                  key={p._id}
                  className="bg-white rounded-2xl shadow hover:shadow-xl transition transform hover:-translate-y-0.5 p-6 border border-gray-100"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">
                        {p.firstName?.[0]}{p.lastName?.[0]}
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{p.firstName} {p.lastName}</div>
                        <div className="text-xs text-gray-600">{p.email}{p.phone ? ` · ${p.phone}` : ''}</div>
                      </div>
                    </div>

                    {p.counts && (
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">{p.counts.venues} venues</span>
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">{p.counts.catering} catering</span>
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">{p.counts.photography} photography</span>
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">{p.counts.videography} videography</span>
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">{p.counts.decoration} decoration</span>
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">{p.counts.entertainment} entertainment</span>
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">{p.counts.bridalMakeup} bridal makeup</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => router.push(`/admin/providers/${p._id}`)}
                        className="px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        View Works
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 rounded border text-sm disabled:opacity-50">Prev</button>
              <div className="text-sm text-gray-700">Page {page} of {pages}</div>
              <button disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))} className="px-3 py-1.5 rounded border text-sm disabled:opacity-50">Next</button>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
