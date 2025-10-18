'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Plus, 
  Loader2
} from 'lucide-react';
import StatsOverview from '@/components/ui/StatsOverview';
import ServiceCard from '@/components/ui/ServiceCard';
import SearchFilter from '@/components/ui/SearchFilter';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

interface BridalMakeupService {
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
  makeupTypes: string[];
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

export default function BridalMakeupDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [services, setServices] = useState<BridalMakeupService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [filteredServices, setFilteredServices] = useState<BridalMakeupService[]>([]);
  const [submitLoading, setSubmitLoading] = useState<string | null>(null);

  // Fetch bridal makeup services for the provider
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/bridal-makeup/my-services');
        console.log('API Response:', response.data);
        
        // Ensure we have an array of services
        const servicesData = Array.isArray(response.data.data) ? response.data.data : [];
        console.log('Services data:', servicesData);
        
        setServices(servicesData);
        setFilteredServices(servicesData);
      } catch (err: unknown) {
        console.error('Error fetching bridal makeup services:', err);
        setError('Failed to load bridal makeup services');
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

  const handleDeleteService = async (serviceId: string) => {
    try {
      setLoading(true);
      await apiClient.delete(`/bridal-makeup/${serviceId}`);
      
      // Remove the deleted service from the state
      setServices(prevServices => prevServices.filter(service => service._id !== serviceId));
      setFilteredServices(prevServices => prevServices.filter(service => service._id !== serviceId));
    } catch (err: unknown) {
      console.error('Error deleting bridal makeup service:', err);
      setError('Failed to delete bridal makeup service');
      throw err; // Re-throw to let DeleteButton handle the error display
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async (serviceId: string) => {
    try {
      setSubmitLoading(serviceId);
      
      // Submit service for approval
      await apiClient.patch(`/bridal-makeup/${serviceId}/submit-for-approval`);
      
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




  if (!user || user.role !== 'PROVIDER') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <div className="mx-auto bg-gradient-to-br from-pink-100 to-rose-100 rounded-full p-4 w-24 h-24 flex items-center justify-center mb-6">
            <Heart className="h-12 w-12 text-pink-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You must be logged in as a provider to access this page.
          </p>
          <Button 
            onClick={() => router.push('/auth/login')}
            className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white"
          >
            Login
          </Button>
        </div>
      </div>
    );
  }


  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Bridal Makeup Services</h1>
                <p className="text-gray-600 mt-2">Manage your bridal makeup packages and services</p>
              </div>
              <Button 
                onClick={() => router.push('/provider/bridal-makeup/create')}
                className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Service
              </Button>
            </div>
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
            serviceType="bridal-makeup"
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
              <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
            </div>
          ) : (
            <>
              {/* Services List */}
              {filteredServices.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No bridal makeup services yet</h3>
                  <p className="text-gray-600 mb-6">
                    Get started by creating your first bridal makeup service
                  </p>
                  <button
                    onClick={() => router.push('/provider/bridal-makeup/create')}
                    className="inline-flex items-center px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Service
                  </button>
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
                        tags={service.makeupTypes}
                        onEdit={(id) => router.push(`/provider/bridal-makeup/edit?id=${id}`)}
                        onView={(id) => router.push(`/provider/bridal-makeup/view?id=${id}`)}
                        onDelete={handleDeleteService}
                        onSubmitForApproval={handleSubmitForApproval}
                        loading={loading}
                        submitLoading={submitLoading === service._id}
                      />
                    ))}
                  </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

