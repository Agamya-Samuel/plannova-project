'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Camera, Plus } from 'lucide-react';
import StatsOverview from '@/components/ui/StatsOverview';
import ServiceCard from '@/components/ui/ServiceCard';
import SearchFilter from '@/components/ui/SearchFilter';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

interface PhotographyService {
  _id: string;
  name: string;
  description: string;
  basePrice: number;
  photographyTypes: string[];
  packages: Array<{
    name: string;
    price: number;
  }>;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PENDING_EDIT';
  createdAt: string;
}

export default function PhotographyDashboard() {
  const router = useRouter();
  const [services, setServices] = useState<PhotographyService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [filteredServices, setFilteredServices] = useState<PhotographyService[]>([]);
  const [submitLoading, setSubmitLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPhotographyServices();
  }, []);

  const fetchPhotographyServices = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/photography/my-services');
      setServices(response.data.data);
      setFilteredServices(response.data.data);
    } catch (err) {
      setError('Failed to fetch photography services');
      console.error('Error fetching photography services:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-filter when search term or status filter changes
  useEffect(() => {
    const filtered = services.filter(service => {
      const matchesSearch = !searchTerm || 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || service.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    setFilteredServices(filtered);
  }, [services, searchTerm, statusFilter]);

  // Search and filter handlers
  const handleSearch = () => {
    // Auto-filtering is handled by useEffect, this is just for button click
    console.log('Search triggered');
  };

  const handleClear = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      setLoading(true);
      await apiClient.delete(`/photography/${serviceId}`);
      
      // Remove the deleted service from the state
      setServices(prevServices => prevServices.filter(service => service._id !== serviceId));
      setFilteredServices(prevServices => prevServices.filter(service => service._id !== serviceId));
    } catch (err: unknown) {
      console.error('Error deleting photography service:', err);
      setError('Failed to delete photography service');
      throw err; // Re-throw to let DeleteButton handle the error display
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async (serviceId: string) => {
    try {
      setSubmitLoading(serviceId);
      
      // Submit service for approval
      await apiClient.patch(`/photography/${serviceId}/submit-for-approval`);
      
      // Update service status in state
      setServices(prevServices => 
        prevServices.map(service => 
          service._id === serviceId 
            ? { ...service, status: 'PENDING' as const }
            : service
        )
      );
      
      setFilteredServices(prevServices => 
        prevServices.map(service => 
          service._id === serviceId 
            ? { ...service, status: 'PENDING' as const }
            : service
        )
      );
      
      toast.success('Service submitted for approval successfully!');
    } catch (err: unknown) {
      console.error('Error submitting service for approval:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit service for approval';
      toast.error(errorMessage);
    } finally {
      setSubmitLoading(null);
    }
  };



  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Photography Services</h1>
            <Button
              onClick={() => router.push('/provider/photography/create')}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Service
            </Button>
            </div>
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Photography Services</h1>
              <p className="mt-2 text-gray-600">
                Manage your photography services and packages
              </p>
            </div>
            <Button
              onClick={() => router.push('/provider/photography/create')}
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Service
            </Button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Stats Overview */}
          <StatsOverview
            totalServices={services.length}
            approvedServices={services.filter(s => s.status === 'APPROVED').length}
            pendingServices={services.filter(s => s.status === 'PENDING' || s.status === 'PENDING_EDIT').length}
            averagePrice={services.length > 0 ? services.reduce((sum, service) => sum + service.basePrice, 0) / services.length : 0}
            serviceType="photography"
          />

          {/* Search and Filter */}
          <div className="mb-6">
            <SearchFilter
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              onSearch={handleSearch}
              onClear={handleClear}
              statusValue={statusFilter}
              onStatusChange={setStatusFilter}
              statusOptions={[
                { value: 'ALL', label: 'All Status' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'REJECTED', label: 'Rejected' }
              ]}
              placeholder="Search by service name, location, or description..."
            />
          </div>

          {/* Services List */}
          {filteredServices.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No photography services yet</h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first photography service
              </p>
              <Button
                onClick={() => router.push('/provider/photography/create')}
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Service
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service._id}
                  id={service._id}
                  name={service.name}
                  description={service.description}
                  status={service.status as 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'PENDING_EDIT'}
                  price={service.basePrice}
                  tags={service.photographyTypes}
                  onEdit={(id) => router.push(`/provider/photography/edit?id=${id}`)}
                  onView={(id) => router.push(`/provider/photography/view?id=${id}`)}
                  onDelete={handleDeleteService}
                  onSubmitForApproval={handleSubmitForApproval}
                  loading={loading}
                  submitLoading={submitLoading === service._id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}