'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import { Button } from '../../../components/ui/button';
import { 
  Utensils, 
  Plus, 
  Eye, 
  Edit, 
  Star, 
  Users, 
  IndianRupee, 
  MapPin,
  Mail,
  Loader2,
  Trash2
} from 'lucide-react';
import apiClient from '../../../lib/api';

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
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export default function CateringDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [services, setServices] = useState<CateringService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    // Confirm deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete "${serviceName}"? This action cannot be undone and all associated images will be permanently deleted.`
    );
    
    if (!confirmed) return;
    
    try {
      setLoading(true);
      await apiClient.delete(`/catering/${serviceId}`);
      
      // Remove the deleted service from the state
      setServices(prevServices => prevServices.filter(service => service._id !== serviceId));
      
      // Show success message
      alert(`"${serviceName}" has been deleted successfully.`);
    } catch (err: unknown) {
      console.error('Error deleting catering service:', err);
      setError('Failed to delete catering service');
    } finally {
      setLoading(false);
    }
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
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Catering Services</h1>
                <p className="text-gray-600 mt-2">Manage your catering packages and services</p>
              </div>
              <Button 
                onClick={() => router.push('/provider/catering/create')}
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
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
              <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className="text-sm font-semibold text-gray-700">Total Services</h3>
                    <Utensils className="h-5 w-5 text-pink-500" />
                  </div>
                  <div className="mt-2">
                    <div className="text-3xl font-bold text-gray-900">{String(totalServices)}</div>
                    <p className="text-xs text-gray-500 mt-1">Active catering packages</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className="text-sm font-semibold text-gray-700">Avg. Rating</h3>
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  </div>
                  <div className="mt-2">
                    <div className="text-3xl font-bold text-gray-900">{String(avgRating)}</div>
                    <p className="text-xs text-gray-500 mt-1">Based on customer reviews</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className="text-sm font-semibold text-gray-700">Total Reviews</h3>
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="mt-2">
                    <div className="text-3xl font-bold text-gray-900">{String(totalReviews)}</div>
                    <p className="text-xs text-gray-500 mt-1">Customer feedback received</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow p-6">
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className="text-sm font-medium">Avg. Price</h3>
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-bold">₹{String(avgPrice)}</div>
                    <p className="text-xs text-muted-foreground">Per plate base price</p>
                  </div>
                </div>
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
                      <Eye className="h-6 w-6 text-green-600" />
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
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Your Catering Services</h2>
                  <p className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    {String(totalServices)} service(s) listed
                  </p>
                </div>

                {totalServices === 0 ? (
                  <div className="text-center py-16">
                    <div className="mx-auto bg-gradient-to-br from-pink-100 to-purple-100 rounded-full p-6 w-24 h-24 flex items-center justify-center mb-6">
                      <Utensils className="h-12 w-12 text-pink-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No catering services yet</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">Get started by creating your first catering service package</p>
                    <Button 
                      onClick={() => router.push('/provider/catering/create')}
                      className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
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
                            <span>₹{(service.basePrice || 0).toLocaleString()}/plate</span>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {service.cuisineTypes?.slice(0, 3).map((cuisine, index) => (
                            <span 
                              key={`${service._id}-cuisine-${index}`} 
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-sm"
                            >
                              {cuisine}
                            </span>
                          ))}
                          {(service.cuisineTypes?.length || 0) > 3 && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                              +{(service.cuisineTypes?.length || 0) - 3} more
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
                              onClick={() => router.push(`/provider/catering/${service._id}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/provider/catering/edit?id=${service._id}`)}
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