'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import { Button } from '../../../components/ui/button';
import { 
  Utensils, 
  Plus, 
  Mail,
  Loader2
} from 'lucide-react';
import StatsOverview from '@/components/ui/StatsOverview';
import ServiceCard from '@/components/ui/ServiceCard';
import SearchFilter from '@/components/ui/SearchFilter';
import apiClient from '../../../lib/api';
import { toast } from 'sonner';

// Card components are not available, using plain divs instead

interface CateringService {
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
  cuisineTypes: string[];
  serviceTypes: string[];
  dietaryOptions: string[];
  basePrice: number;
  rating: number;
  reviewCount: number;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export default function CateringDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [services, setServices] = useState<CateringService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [filteredServices, setFilteredServices] = useState<CateringService[]>([]);
  const [submitLoading, setSubmitLoading] = useState<string | null>(null);

  // Fetch catering services for the provider
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/catering/my-services');
        console.log('API Response:', response.data);
        
        // Ensure we have an array of services
        const servicesData = Array.isArray(response.data.data) ? response.data.data : [];
        console.log('Services data:', servicesData);
        
        setServices(servicesData);
        setFilteredServices(servicesData);
      } catch (err: unknown) {
        console.error('Error fetching catering services:', err);
        setError('Failed to load catering services');
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

  const handleDeleteService = async (serviceId: string) => {
    try {
      setLoading(true);
      await apiClient.delete(`/catering/${serviceId}`);
      
      // Remove the deleted service from the state
      setServices(prevServices => prevServices.filter(service => service._id !== serviceId));
      setFilteredServices(prevServices => prevServices.filter(service => service._id !== serviceId));
    } catch (err: unknown) {
      console.error('Error deleting catering service:', err);
      setError('Failed to delete catering service');
      throw err; // Re-throw to let DeleteButton handle the error display
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async (serviceId: string) => {
    try {
      setSubmitLoading(serviceId);
      
      // Submit service for approval
      await apiClient.patch(`/catering/${serviceId}/submit-for-approval`);
      
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

  // Search and filter handlers
  const handleSearch = () => {
    // Auto-filtering is handled by useEffect, this is just for button click
    console.log('Search triggered');
  };

  const handleClear = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
  };

  if (!user || user.role !== 'PROVIDER' || !user.serviceCategories?.includes('catering')) {
    return <div>Access denied. Please select catering as your service category.</div>;
  }

  // Calculate statistics with defensive programming
  console.log('Raw services data for stats calculation:', services);
  const totalServices = services.length;
  
  // Safely calculate average rating
  const validRatings = services
    .map(service => {
      const rating = typeof service.rating === 'number' ? service.rating : 0;
      return isNaN(rating) ? 0 : rating;
    });
  const avgRating = validRatings.length > 0 
    ? (validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length).toFixed(1) 
    : '0.0';
  
  // Safely calculate total reviews
  const totalReviews = services
    .map(service => {
      const count = typeof service.reviewCount === 'number' ? service.reviewCount : 0;
      return isNaN(count) ? 0 : count;
    })
    .reduce((sum, count) => sum + count, 0);
  
  // Safely calculate average price
  const validPrices = services
    .map(service => {
      const price = typeof service.basePrice === 'number' ? service.basePrice : 0;
      return isNaN(price) || price < 0 ? 0 : price;
    });
  const avgPrice = validPrices.length > 0 
    ? Math.round(validPrices.reduce((sum, price) => sum + price, 0) / validPrices.length) 
    : 0;

  console.log('Calculated stats:', { totalServices, avgRating, totalReviews, avgPrice });

  // Get services by status
  const pendingServices = services.filter(service => service.status === 'PENDING');
  const approvedServices = services.filter(service => service.status === 'APPROVED');
  const rejectedServices = services.filter(service => service.status === 'REJECTED');

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Catering Services</h1>
              <p className="mt-2 text-gray-600">
                Manage your catering services and packages
              </p>
              </div>
              <Button 
                onClick={() => router.push('/provider/catering/create')}
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
              <Plus className="h-5 w-5 mr-2" />
              Add New Service
              </Button>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              <StatsOverview
                totalServices={totalServices}
                approvedServices={approvedServices.length}
                pendingServices={pendingServices.length}
                averagePrice={avgPrice}
                serviceType="catering"
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

              {/* Status Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <Loader2 className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-bold text-gray-900">Pending Approval</h3>
                      <p className="text-3xl font-bold text-yellow-600 mt-1">{String(pendingServices.length)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">Services awaiting staff review</p>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Mail className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-bold text-gray-900">Approved</h3>
                      <p className="text-3xl font-bold text-green-600 mt-1">{String(approvedServices.length)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">Live and visible to customers</p>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <Mail className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-bold text-gray-900">Rejected</h3>
                      <p className="text-3xl font-bold text-red-600 mt-1">{String(rejectedServices.length)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">Services that need revision</p>
                </div>
              </div>

              {/* Services List */}
              {totalServices === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <Utensils className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No catering services yet</h3>
                  <p className="text-gray-600 mb-6">
                    Get started by creating your first catering service
                  </p>
                    <Button 
                      onClick={() => router.push('/provider/catering/create')}
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
                      status={service.status}
                      location={`${service.serviceLocation?.city}, ${service.serviceLocation?.state}`}
                      price={service.basePrice}
                      tags={service.cuisineTypes || []}
                       onEdit={(id) => router.push(`/provider/catering/edit?id=${id}`)}
                       onView={(id) => router.push(`/provider/catering/${id}`)}
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