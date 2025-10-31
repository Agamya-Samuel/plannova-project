'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Music, Plus } from 'lucide-react';
import apiClient from '@/lib/api';
import SearchFilter from '@/components/ui/SearchFilter';
import StatsOverview from '@/components/ui/StatsOverview';
import ServiceCard from '@/components/ui/ServiceCard';
import { toast } from 'sonner';

interface EntertainmentService {
  _id: string;
  name: string;
  description: string;
  basePrice: number;
  entertainmentTypes: string[];
  images: Array<{ url: string; isPrimary: boolean }>;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PENDING_EDIT';
  createdAt: string;
}

export default function EntertainmentDashboardPage() {
  const router = useRouter();
  const [services, setServices] = useState<EntertainmentService[]>([]);
  const [filtered, setFiltered] = useState<EntertainmentService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [submitLoading, setSubmitLoading] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/entertainment/my-services');
        setServices(res.data.data);
        setFiltered(res.data.data);
      } catch (e) {
        console.error('Failed to fetch entertainment services', e);
        setError('Failed to fetch services');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  useEffect(() => {
    const f = services.filter(s => {
      const matchesSearch = !searchTerm || s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || s.status === (statusFilter as EntertainmentService['status']);
      return matchesSearch && matchesStatus;
    });
    setFiltered(f);
  }, [services, searchTerm, statusFilter]);

  const handleDeleteService = async (id: string) => {
    try {
      setLoading(true);
      await apiClient.delete(`/entertainment/${id}`);
      setServices(prev => prev.filter(s => s._id !== id));
      setFiltered(prev => prev.filter(s => s._id !== id));
    } catch (e) {
      console.error('Delete entertainment failed', e);
      setError('Failed to delete entertainment service');
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async (id: string) => {
    try {
      setSubmitLoading(id);
      await apiClient.patch(`/entertainment/${id}/submit-for-approval`);
      setServices(prev => prev.map(s => s._id === id ? { ...s, status: 'PENDING' } : s));
      setFiltered(prev => prev.map(s => s._id === id ? { ...s, status: 'PENDING' } : s));
      toast.success('Service submitted for approval');
    } catch (e) {
      console.error('Submit entertainment failed', e);
      toast.error('Failed to submit for approval');
    } finally {
      setSubmitLoading(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2"><Music className="h-7 w-7" /> Music & Entertainment Services</h1>
              <p className="mt-2 text-gray-600">Manage your music and entertainment services</p>
            </div>
            <Button
              onClick={() => router.push('/provider/entertainment/create')}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Service
            </Button>
          </div>

          <StatsOverview
            totalServices={services.length}
            approvedServices={services.filter(s => s.status === 'APPROVED').length}
            pendingServices={services.filter(s => s.status === 'PENDING' || s.status === 'PENDING_EDIT').length}
            averagePrice={services.length ? services.reduce((sum, s) => sum + s.basePrice, 0) / services.length : 0}
            serviceType="entertainment"
          />

          <div className="mb-6">
            <SearchFilter
              searchValue={searchTerm}
              onSearchChange={(v) => setSearchTerm(v)}
              onSearch={() => {}}
              onClear={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
              statusValue={statusFilter}
              onStatusChange={(v) => setStatusFilter(v)}
              statusOptions={[
                { value: 'ALL', label: 'All Status' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'PENDING_EDIT', label: 'Pending Edit' },
                { value: 'REJECTED', label: 'Rejected' },
              ]}
            />
          </div>

          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No entertainment services yet</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first entertainment service package</p>
              <Button
                onClick={() => router.push('/provider/entertainment/create')}
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Service
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((s) => (
                <ServiceCard
                  key={s._id}
                  id={s._id}
                  name={s.name}
                  description={s.description}
                  status={s.status}
                  price={s.basePrice}
                  tags={s.entertainmentTypes}
                  onEdit={(id) => router.push(`/provider/entertainment/edit?id=${id}`)}
                  onView={(id) => router.push(`/provider/entertainment/view?id=${id}`)}
                  onDelete={handleDeleteService}
                  onSubmitForApproval={handleSubmitForApproval}
                  loading={loading}
                  submitLoading={submitLoading === s._id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}


