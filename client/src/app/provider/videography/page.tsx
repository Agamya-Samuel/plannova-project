'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { 
  Video, 
  Plus, 
  Loader2
} from 'lucide-react';
import StatsOverview from '@/components/ui/StatsOverview';
import ServiceCard from '@/components/ui/ServiceCard';
import SearchFilter from '@/components/ui/SearchFilter';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { sonnerConfirm } from '@/lib/sonner-confirm';

interface VideographyService {
  _id: string;
  name: string;
  description: string;
  serviceLocation: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  contact: {
    phone: string;
    whatsapp?: string;
    email: string;
  };
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  videographyTypes: string[];
  packages: Array<{
    name: string;
    price: number;
  }>;
  addons: Array<{
    name: string;
    price: number;
  }>;
  basePrice: number;
  rating: number;
  reviewCount: number;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PENDING_EDIT';
  createdAt: string;
  updatedAt: string;
}

export default function VideographyDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [services, setServices] = useState<VideographyService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [filteredServices, setFilteredServices] = useState<VideographyService[]>([]);
  const [submitLoading, setSubmitLoading] = useState<string | null>(null);

  // Fetch videography services for the provider
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/videography/my-services');
        console.log('API Response:', response.data);
        
        // Ensure we have an array of services
        const servicesData = Array.isArray(response.data.data) ? response.data.data : [];
        console.log('Services data:', servicesData);
        
        setServices(servicesData);
        setFilteredServices(servicesData);
      } catch (err: unknown) {
        console.error('Error fetching videography services:', err);
        setError('Failed to load videography services');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchServices();
    }
  }, [user]);

  // Auto-filter when search term or status filter changes
  useEffect(() => {
    const filtered = services.filter(service => {
      const matchesSearch = !searchTerm || 
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.serviceLocation.city.toLowerCase().includes(searchTerm.toLowerCase());
      
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

  const handleSubmitForApproval = async (serviceId: string) => {
    try {
      setSubmitLoading(serviceId);
      
      // Submit service for approval
      await apiClient.patch(`/videography/${serviceId}/submit-for-approval`);
      
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

  const handleDeleteService = async (serviceId: string) => {
    // Confirm deletion
    const confirmed = await sonnerConfirm(
      `Are you sure you want to delete this service? This action cannot be undone and all associated images will be permanently deleted.`
    );
    
    if (!confirmed) return;
    
    try {
      setLoading(true);
      await apiClient.delete(`/videography/${serviceId}`);
      
      // Remove the deleted service from the state
      setServices(prevServices => prevServices.filter(service => service._id !== serviceId));
      
      // Show success message
      toast.success('Service has been deleted successfully.');
    } catch (err: unknown) {
      console.error('Error deleting videography service:', err);
      setError('Failed to delete videography service');
      toast.error('Failed to delete videography service');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'PROVIDER' || !user.serviceCategories?.includes('videography')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <div className="mx-auto bg-gradient-to-br from-purple-100 to-blue-100 rounded-full p-4 w-24 h-24 flex items-center justify-center mb-6">
            <Video className="h-12 w-12 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You must be logged in as a videography provider to access this page.
          </p>
          <Button 
            onClick={() => router.push('/auth/login')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            Login
          </Button>
        </div>
      </div>
    );
  }

  const totalServices = services.length;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Videography Services</h1>
                <p className="text-gray-600 mt-2">Manage your videography packages and services</p>
              </div>
              <Button 
                onClick={() => router.push('/provider/videography/create')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Service
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Stats Overview */}
          <StatsOverview
            totalServices={services.length}
            approvedServices={services.filter(s => s.status === 'APPROVED').length}
            pendingServices={services.filter(s => s.status === 'PENDING' || s.status === 'PENDING_EDIT').length}
            averagePrice={services.length > 0 ? services.reduce((sum, service) => sum + service.basePrice, 0) / services.length : 0}
            serviceType="videography"
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

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <>
              {/* Services List */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Your Videography Services</h2>
                  <p className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {String(totalServices)} service(s) listed
                  </p>
                </div>

                {filteredServices.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mx-auto bg-gradient-to-br from-purple-100 to-blue-100 rounded-full p-6 w-24 h-24 flex items-center justify-center mb-6">
                      <Video className="h-12 w-12 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No videography services yet</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">Get started by creating your first videography service package</p>
                    <Button 
                      onClick={() => router.push('/provider/videography/create')}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
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
                        location={`${service.serviceLocation?.city || ''}, ${service.serviceLocation?.state || ''}`}
                        price={service.basePrice}
                        rating={service.rating || 0}
                        reviewCount={service.reviewCount || 0}
                        tags={service.videographyTypes || []}
                        onEdit={(id) => router.push(`/provider/videography/edit?id=${id}`)}
                        onView={(id) => router.push(`/provider/videography/view?id=${id}`)}
                        onDelete={handleDeleteService}
                        onSubmitForApproval={handleSubmitForApproval}
                        loading={loading}
                        submitLoading={submitLoading === service._id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
