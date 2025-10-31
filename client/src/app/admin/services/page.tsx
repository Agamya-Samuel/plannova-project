'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Search,
  X,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Trash2,
  Camera,
  Video,
  Music,
  Flower2,
  Utensils,
  Heart,
} from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

type ServiceKey =
  | 'venue'
  | 'catering'
  | 'photography'
  | 'videography'
  | 'bridal-makeup'
  | 'decoration'
  | 'entertainment';

interface PaginationShape {
  page: number;
  pages: number;
  limit: number;
  total: number;
}

interface ProviderShape {
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface LocationShape {
  city?: string;
  state?: string;
}

interface RawServiceItem {
  _id: string;
  name: string;
  status: string;
  providerId?: ProviderShape;
  provider?: ProviderShape;
  address?: LocationShape;
  serviceLocation?: LocationShape;
  basePrice?: number;
  startingPrice?: number;
  averagePackagePrice?: number;
}

interface GenericServiceItem {
  _id: string;
  name: string;
  status: string;
  providerName?: string;
  providerEmail?: string;
  city?: string;
  state?: string;
  price?: number;
}

const SERVICE_CONFIG: Record<
  ServiceKey,
  {
    label: string;
    icon: React.ReactNode;
    color: string;
    listPath: string; // expects staff pending-like endpoints
    viewPath: (id: string) => string;
    approvePath?: (id: string) => { method: 'post' | 'put'; path: string };
    rejectPath?: (id: string) => { method: 'post' | 'put'; path: string };
    deletePath?: (id: string) => string;
  }
> = {
  'venue': {
    label: 'Venues',
    icon: <MapPin className="h-5 w-5 text-pink-600" />,
    color: 'pink',
    listPath: '/venues/staff/pending',
    viewPath: (id) => `/venues/${id}`,
    approvePath: (id) => ({ method: 'post', path: `/venues/staff/${id}/approve` }),
    rejectPath: (id) => ({ method: 'post', path: `/venues/staff/${id}/reject` }),
    deletePath: (id) => `/venues/staff/${id}`,
  },
  'catering': {
    label: 'Catering',
    icon: <Utensils className="h-5 w-5 text-blue-600" />,
    color: 'blue',
    listPath: '/catering/staff/pending',
    viewPath: (id) => `/provider/catering/${id}`,
    approvePath: (id) => ({ method: 'put', path: `/catering/${id}/approve` }),
    rejectPath: (id) => ({ method: 'put', path: `/catering/${id}/reject` }),
    deletePath: (id) => `/catering/staff/${id}`,
  },
  'photography': {
    label: 'Photography',
    icon: <Camera className="h-5 w-5 text-purple-600" />,
    color: 'purple',
    listPath: '/photography/staff/pending',
    viewPath: (id) => `/\(public\)/photography/${id}`,
    approvePath: (id) => ({ method: 'put', path: `/photography/staff/${id}/approve` }),
    rejectPath: (id) => ({ method: 'put', path: `/photography/staff/${id}/reject` }),
    deletePath: (id) => `/photography/staff/${id}`,
  },
  'videography': {
    label: 'Videography',
    icon: <Video className="h-5 w-5 text-indigo-600" />,
    color: 'indigo',
    listPath: '/videography/staff/pending',
    viewPath: (id) => `/videography/${id}`,
    approvePath: (id) => ({ method: 'put', path: `/videography/staff/${id}/approve` }),
    rejectPath: (id) => ({ method: 'put', path: `/videography/staff/${id}/reject` }),
    deletePath: (id) => `/videography/staff/${id}`,
  },
  'bridal-makeup': {
    label: 'Bridal Makeup',
    icon: <Heart className="h-5 w-5 text-rose-600" />,
    color: 'rose',
    listPath: '/bridal-makeup/staff/pending',
    viewPath: (id) => `/\(public\)/bridal-makeup/${id}`,
    approvePath: (id) => ({ method: 'put', path: `/bridal-makeup/staff/${id}/approve` }),
    rejectPath: (id) => ({ method: 'put', path: `/bridal-makeup/staff/${id}/reject` }),
    deletePath: (id) => `/bridal-makeup/staff/${id}`,
  },
  'decoration': {
    label: 'Decoration',
    icon: <Flower2 className="h-5 w-5 text-green-600" />,
    color: 'green',
    listPath: '/decoration/staff/pending',
    viewPath: (id) => `/\(public\)/decoration/${id}`,
    approvePath: (id) => ({ method: 'put', path: `/decoration/staff/${id}/approve` }),
    rejectPath: (id) => ({ method: 'put', path: `/decoration/staff/${id}/reject` }),
    deletePath: (id) => `/decoration/staff/${id}`,
  },
  'entertainment': {
    label: 'Entertainment',
    icon: <Music className="h-5 w-5 text-yellow-600" />,
    color: 'yellow',
    listPath: '/entertainment/staff/pending',
    viewPath: (id) => `/\(public\)/entertainment/${id}`,
    approvePath: (id) => ({ method: 'put', path: `/entertainment/staff/${id}/approve` }),
    rejectPath: (id) => ({ method: 'put', path: `/entertainment/staff/${id}/reject` }),
    deletePath: (id) => `/entertainment/staff/${id}`,
  },
};

export default function AdminServicesPage() {
  const { user, isLoading } = useAuth();
  const [activeService, setActiveService] = useState<ServiceKey>('venue');
  const [items, setItems] = useState<GenericServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginationShape>({ page: 1, pages: 0, limit: 10, total: 0 });

  const serviceCfg = useMemo(() => SERVICE_CONFIG[activeService], [activeService]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'PENDING_EDIT':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING_EDIT':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const fetchList = async (page = 1, status = statusFilter, search = searchTerm) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (status !== 'ALL') params.append('status', status);
      if (search) params.append('search', search);

      const res = await apiClient.get(`${serviceCfg.listPath}?${params.toString()}`);

      // Normalize different response shapes
      const raw = res.data;
      let list: RawServiceItem[] = [];
      let pag: PaginationShape = { page, pages: 1, limit: 10, total: 0 };

      if (activeService === 'venue') {
        list = (raw.venues as RawServiceItem[]) || [];
        pag = raw.pagination || pag;
      } else if (activeService === 'catering') {
        list = (raw.caterings as RawServiceItem[]) || [];
        pag = raw.pagination || pag;
      } else if (activeService === 'photography') {
        list = (raw.data as RawServiceItem[]) || [];
        const p = raw.pagination;
        if (p) pag = { page: p.currentPage, pages: p.totalPages, limit: p.itemsPerPage, total: p.totalItems };
      } else if (activeService === 'videography') {
        list = (raw.data as RawServiceItem[]) || [];
        const p = raw.pagination;
        if (p) pag = { page: p.currentPage, pages: p.totalPages, limit: p.itemsPerPage, total: p.totalItems };
      } else if (activeService === 'bridal-makeup') {
        list = (raw.data as RawServiceItem[]) || [];
        const p = raw.pagination;
        if (p) pag = { page: p.currentPage, pages: p.totalPages, limit: p.itemsPerPage, total: p.totalItems };
      } else if (activeService === 'decoration') {
        list = (raw.data as RawServiceItem[]) || [];
        const p = raw.pagination;
        if (p) pag = { page: p.currentPage, pages: p.totalPages, limit: p.itemsPerPage, total: p.totalItems };
      } else if (activeService === 'entertainment') {
        list = (raw.data as RawServiceItem[]) || [];
        const p = raw.pagination;
        if (p) pag = { page: p.currentPage, pages: p.totalPages, limit: p.itemsPerPage, total: p.totalItems };
      }

      // Map to generic items
      const mapped: GenericServiceItem[] = list.map((it: RawServiceItem) => {
        const provider = it.providerId || it.provider;
        const location = it.address || it.serviceLocation || {};
        const price = it.basePrice || it.startingPrice || it.averagePackagePrice || undefined;
        return {
          _id: it._id,
          name: it.name,
          status: it.status,
          providerName: provider ? `${provider.firstName ?? ''} ${provider.lastName ?? ''}`.trim() : undefined,
          providerEmail: provider?.email,
          city: (location as LocationShape).city,
          state: (location as LocationShape).state,
          price,
        };
      });

      setItems(mapped);
      setPagination(pag);
      setError('');
    } catch {
      setError('Failed to fetch services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchList(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeService, user]);

  const handleApprove = async (id: string) => {
    const cfg = serviceCfg.approvePath?.(id);
    if (!cfg) return;
    try {
      if (cfg.method === 'post') await apiClient.post(cfg.path);
      else await apiClient.put(cfg.path);
      toast.success('Approved successfully');
      fetchList(pagination.page);
    } catch {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (id: string) => {
    const cfg = serviceCfg.rejectPath?.(id);
    if (!cfg) return;
    try {
      if (cfg.method === 'post') await apiClient.post(cfg.path, { reason: 'Rejected by admin' });
      else await apiClient.put(cfg.path, { rejectionReason: 'Rejected by admin' });
      toast.success('Rejected successfully');
      fetchList(pagination.page);
    } catch {
      toast.error('Failed to reject');
    }
  };

  const handleDelete = async (id: string) => {
    if (!serviceCfg.deletePath) return;
    try {
      await apiClient.delete(serviceCfg.deletePath(id));
      toast.success('Deleted successfully');
      fetchList(pagination.page);
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (!isLoading && user?.role !== 'ADMIN') {
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
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">Services Management</h1>
                  <p className="text-gray-600 text-lg">Review, approve, and manage all service listings</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {serviceCfg.icon}
                  <span>{SERVICE_CONFIG[activeService].label}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Service Tabs */}
          <div className="mb-6">
            <div className="bg-white rounded-xl shadow-lg p-2 flex flex-wrap gap-2">
              {(Object.keys(SERVICE_CONFIG) as ServiceKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setActiveService(key)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border ${
                    key === activeService ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {SERVICE_CONFIG[key].icon}
                    {SERVICE_CONFIG[key].label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder={`Search ${serviceCfg.label.toLowerCase()}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') fetchList(1); }}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    />
                    {searchTerm && (
                      <button onClick={() => { setSearchTerm(''); fetchList(1, statusFilter, ''); }} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); fetchList(1, e.target.value); }}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="PENDING_EDIT">Pending Edit</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Loading/Error */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Table */}
          {!loading && !error && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((it) => (
                      <tr key={it._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{it.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{it.providerName || '-'}</div>
                          <div className="text-sm text-gray-500">{it.providerEmail || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{[it.city, it.state].filter(Boolean).join(', ') || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(it.status)}`}>
                            {getStatusIcon(it.status)}
                            <span className="ml-1">{it.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{it.price ? `₹${it.price.toLocaleString('en-IN')}` : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-wrap gap-2">
                            <Link href={serviceCfg.viewPath(it._id)}>
                              <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                                <Eye className="h-4 w-4 mr-1" /> View
                              </Button>
                            </Link>
                            {serviceCfg.approvePath && it.status === 'PENDING' && (
                              <Button size="sm" variant="outline" onClick={() => handleApprove(it._id)} className="text-green-600 border-green-200 hover:bg-green-50">
                                <CheckCircle className="h-4 w-4 mr-1" /> Approve
                              </Button>
                            )}
                            {serviceCfg.rejectPath && it.status === 'PENDING' && (
                              <Button size="sm" variant="outline" onClick={() => handleReject(it._id)} className="text-red-600 border-red-200 hover:bg-red-50">
                                <XCircle className="h-4 w-4 mr-1" /> Reject
                              </Button>
                            )}
                            {serviceCfg.deletePath && (
                              <Button size="sm" variant="outline" onClick={() => handleDelete(it._id)} className="text-red-600 border-red-200 hover:bg-red-50">
                                <Trash2 className="h-4 w-4 mr-1" /> Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button variant="outline" onClick={() => fetchList(pagination.page - 1)} disabled={pagination.page === 1}>Previous</Button>
                    <Button variant="outline" onClick={() => fetchList(pagination.page + 1)} disabled={pagination.page === pagination.pages}>Next</Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                        <span className="font-medium">{pagination.total}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <Button variant="outline" onClick={() => fetchList(pagination.page - 1)} disabled={pagination.page === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md">Previous</Button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">Page {pagination.page} of {pagination.pages}</span>
                        <Button variant="outline" onClick={() => fetchList(pagination.page + 1)} disabled={pagination.page === pagination.pages} className="relative inline-flex items-center px-2 py-2 rounded-r-md">Next</Button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}


