'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { 
  Video, 
  Plus, 
  Eye, 
  Edit, 
  Star, 
  IndianRupee, 
  MapPin,
  Loader2,
  Trash2
} from 'lucide-react';
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
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PENDING_EDIT';
  createdAt: string;
  updatedAt: string;
}

export default function VideographyDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [services, setServices] = useState<VideographyService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    // Confirm deletion
    const confirmed = await sonnerConfirm(
      `Are you sure you want to delete "${serviceName}"? This action cannot be undone and all associated images will be permanently deleted.`
    );
    
    if (!confirmed) return;
    
    try {
      setLoading(true);
      await apiClient.delete(`/videography/${serviceId}`);
      
      // Remove the deleted service from the state
      setServices(prevServices => prevServices.filter(service => service._id !== serviceId));
      
      // Show success message
      toast.success(`"${serviceName}" has been deleted successfully.`);
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

                {totalServices === 0 ? (
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {services.map((service) => (
                      <div key={service._id} className="bg-white rounded-xl shadow-md p-6 overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 hover:border-purple-300">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                            <p className="text-gray-600 text-sm line-clamp-2 mb-4">{service.description}</p>
                          </div>
                          <div className="flex flex-col items-end space-y-2 ml-4">
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              service.status === 'PENDING' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : service.status === 'APPROVED' 
                                ? 'bg-green-100 text-green-800' 
                                : service.status === 'PENDING_EDIT'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {service.status}
                            </div>
                            <div className="flex items-center bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 px-3 py-1 rounded-full">
                              <Star className="h-4 w-4 fill-current" />
                              <span className="text-sm font-bold ml-1">{String(service.rating || 0)}</span>
                              <span className="text-xs ml-1">({String(service.reviewCount || 0)})</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{service.serviceLocation?.city || ''}, {service.serviceLocation?.state || ''}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <IndianRupee className="h-4 w-4 mr-1" />
                            <span>₹{(service.basePrice || 0).toLocaleString()}/service</span>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {service.videographyTypes?.slice(0, 3).map((type, index) => (
                            <span 
                              key={`${service._id}-type-${index}`} 
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-sm"
                            >
                              {type}
                            </span>
                          ))}
                          {(service.videographyTypes?.length || 0) > 3 && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                              +{(service.videographyTypes?.length || 0) - 3} more
                            </span>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            Created: {service.createdAt ? new Date(service.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/provider/videography/view?id=${service._id}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/provider/videography/edit?id=${service._id}`)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteService(service._id, service.name)}
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>

                      </div>
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
