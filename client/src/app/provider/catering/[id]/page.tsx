'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import { Button } from '../../../../components/ui/button';
import { 
  Utensils, 
  MapPin, 
  Phone, 
  Star, 
  IndianRupee,
  Mail,
  Clock,
  User,
  Edit,
  ArrowLeft,
  Loader2,
  Plus,
  Users,
  Trash2,
  Upload
} from 'lucide-react';
import apiClient from '../../../../lib/api';

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  contact: string;
}

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
    key?: string; // Add key for S3 deletion
  }>;
  cuisineTypes: string[];
  serviceTypes: string[];
  dietaryOptions: string[];
  addons: Array<{
    name: string;
    description: string;
    price: number;
  }>;
  basePrice: number;
  minGuests?: number;
  cancellationPolicy?: string;
  paymentTerms?: string;
  rating: number;
  reviewCount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviews: Review[];
  createdAt: string;
  updatedAt: string;
}

export default function CateringServiceViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const serviceId = params.id as string;
  
  const [service, setService] = useState<CateringService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch catering service details
  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/catering/${serviceId}`);
        setService(response.data.data);
      } catch (err: unknown) {
        console.error('Error fetching catering service:', err);
        setError('Failed to load catering service details');
      } finally {
        setLoading(false);
      }
    };

    if (serviceId) {
      fetchService();
    }
  }, [serviceId]);

  const handleDeleteService = async () => {
    if (!service) return;
    
    // Confirm deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete "${service.name}"? This action cannot be undone and all associated images will be permanently deleted.`
    );
    
    if (!confirmed) return;
    
    try {
      setLoading(true);
      await apiClient.delete(`/catering/${serviceId}`);
      
      // Redirect to services list after successful deletion
      router.push('/provider/catering');
      router.refresh(); // Refresh the page to update the list
    } catch (err: unknown) {
      console.error('Error deleting catering service:', err);
      setError('Failed to delete catering service');
      setLoading(false);
    }
  };

  // Allow providers with catering service or staff/admin users to view the page
  if (!user || 
      (user.role !== 'PROVIDER' && user.role !== 'STAFF' && user.role !== 'ADMIN') || 
      (user.role === 'PROVIDER' && !user.serviceCategories?.includes('catering'))) {
    return <div>Access denied. You don't have permission to view this page.</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={() => router.back()}
              className="mt-4"
            >
              Back to Services
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <p className="text-gray-600">Catering service not found.</p>
            <Button 
              onClick={() => router.push('/provider/catering')}
              className="mt-4"
            >
              Back to Services
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => router.push('/provider/catering')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Services</span>
            </Button>
          </div>

          {/* Service Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    service.status === 'PENDING' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : service.status === 'APPROVED' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {service.status}
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  <div className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="text-lg font-bold ml-1">{service.rating}</span>
                    <span className="text-sm ml-1">({service.reviewCount} reviews)</span>
                  </div>
                  <div className="ml-4 text-gray-600">
                    <span>₹{service.basePrice.toLocaleString()}/person</span>
                  </div>
                </div>
                <p className="text-gray-600 mt-4">{service.description}</p>
              </div>
              {/* Show edit/delete buttons only for providers */}
              {user?.role === 'PROVIDER' && (
                <div className="flex space-x-3">
                  <Button 
                    onClick={() => router.push(`/provider/catering/edit?id=${service._id}`)}
                    className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Service
                  </Button>
                  <Button 
                    onClick={handleDeleteService}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white flex items-center"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Service
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Gallery */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Upload className="h-6 w-6 text-pink-600 mr-2" />
                  Service Gallery
                </h2>
                {service.images && service.images.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.images.map((image, index) => (
                      <div key={`${service._id}-image-${index}`} className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden shadow-sm">
                        {image.url ? (
                          <img 
                            src={image.url} 
                            alt={image.alt || `Image ${index + 1}`} 
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <span className="text-gray-500">{image.alt || `Gallery Image ${index + 1}`}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium">No images available for this service</p>
                  </div>
                )}
              </div>

              {/* Service Details */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Utensils className="h-6 w-6 text-pink-600 mr-2" />
                  Service Details
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-pink-50 to-white rounded-xl p-4 border border-pink-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                      <Utensils className="h-5 w-5 text-pink-600 mr-2" />
                      Cuisine Types
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {service.cuisineTypes.map((cuisine, index) => (
                        <span 
                          key={`${service._id}-cuisine-${index}`} 
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-sm"
                        >
                          {cuisine}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-4 border border-blue-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                      <Utensils className="h-5 w-5 text-blue-600 mr-2" />
                      Service Types
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {service.serviceTypes.map((type, index) => (
                        <span 
                          key={`${service._id}-service-${index}`} 
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {service.dietaryOptions && service.dietaryOptions.length > 0 && (
                    <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-4 border border-green-100 shadow-sm">
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                        <Star className="h-5 w-5 text-green-600 mr-2" />
                        Dietary Options
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {service.dietaryOptions.map((option, index) => (
                          <span 
                            key={`${service._id}-dietary-${index}`} 
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-sm"
                          >
                            {option}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-gradient-to-br from-yellow-50 to-white rounded-xl p-4 border border-yellow-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                      <Users className="h-5 w-5 text-yellow-600 mr-2" />
                      Minimum Guests
                    </h3>
                    <p className="text-gray-800 font-bold text-lg">
                      {service.minGuests ? `${service.minGuests} guests` : 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Addons */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Plus className="h-6 w-6 text-pink-600 mr-2" />
                  Add-on Services
                </h2>
                
                {service.addons && service.addons.length > 0 ? (
                  <div className="space-y-4">
                    {service.addons.map((addon, index) => (
                      <div key={`${service._id}-addon-${index}`} className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white shadow-sm hover:shadow-md transition-shadow duration-300">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg">{addon.name}</h3>
                            <p className="text-gray-700 text-sm mt-2">{addon.description}</p>
                          </div>
                          <div className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-lg shadow">
                            ₹{addon.price.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">No Add-on Services</h3>
                    <p className="text-gray-600">No additional services available for this package.</p>
                  </div>
                )}
              </div>

              {/* Policies */}
              {(service.cancellationPolicy || service.paymentTerms) && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <User className="h-6 w-6 text-indigo-600 mr-2" />
                    Policies
                  </h2>
                  
                  <div className="space-y-6">
                    {service.cancellationPolicy && (
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                          <Clock className="h-5 w-5 text-indigo-600 mr-2" />
                          Cancellation Policy
                        </h3>
                        <p className="text-gray-700 bg-indigo-50 p-4 rounded-lg border border-indigo-100">{service.cancellationPolicy}</p>
                      </div>
                    )}
                    
                    {service.paymentTerms && (
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                          <IndianRupee className="h-5 w-5 text-green-600 mr-2" />
                          Payment Terms
                        </h3>
                        <p className="text-gray-700 bg-green-50 p-4 rounded-lg border border-green-100">{service.paymentTerms}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reviews */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Star className="h-6 w-6 text-yellow-500 mr-2" />
                    Customer Reviews
                  </h2>
                  <span className="text-sm font-bold text-gray-700 bg-yellow-100 px-3 py-1 rounded-full">
                    {service.reviewCount} reviews
                  </span>
                </div>
                
                {service.reviews && service.reviews.length > 0 ? (
                  <div className="space-y-6">
                    {service.reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                        <div className="flex items-start">
                          <div className="bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed rounded-xl w-12 h-12 flex items-center justify-center" />
                          <div className="ml-4 flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-gray-900">{review.customerName}</h4>
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-gray-500 text-sm mt-1">{review.date}</p>
                            <p className="text-gray-700 mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">{review.comment}</p>
                            <div className="flex items-center mt-3 text-sm text-gray-600">
                              <Phone className="h-4 w-4 mr-1" />
                              <span className="mr-3 font-medium">{review.contact}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Star className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">No Reviews Yet</h3>
                    <p className="text-gray-600">This service doesn't have any customer reviews yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Phone className="h-6 w-6 text-blue-600 mr-2" />
                  Contact Information
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-start py-2">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div className="ml-3">
                      <p className="text-sm font-bold text-gray-900">Service Location</p>
                      <p className="text-sm text-gray-700 mt-1">{service.serviceLocation.address}</p>
                      <p className="text-sm text-gray-700">
                        {service.serviceLocation.city}, {service.serviceLocation.state} {service.serviceLocation.pincode}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start py-2">
                    <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div className="ml-3">
                      <p className="text-sm font-bold text-gray-900">Phone</p>
                      <p className="text-sm text-gray-700">{service.contact.phone}</p>
                    </div>
                  </div>
                  
                  {service.contact.whatsapp && (
                    <div className="flex items-start py-2">
                      <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div className="ml-3">
                        <p className="text-sm font-bold text-gray-900">WhatsApp</p>
                        <p className="text-sm text-gray-700">{service.contact.whatsapp}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-start py-2">
                    <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div className="ml-3">
                      <p className="text-sm font-bold text-gray-900">Email</p>
                      <p className="text-sm text-gray-700">{service.contact.email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                    Contact Service Provider
                  </Button>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <IndianRupee className="h-6 w-6 text-green-600 mr-2" />
                  Pricing
                </h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-700 font-medium">Base Price</span>
                    <span className="text-xl font-bold text-gray-900">₹{service.basePrice.toLocaleString()}/plate</span>
                  </div>
                  
                  {service.minGuests && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-700 font-medium">Minimum Guests</span>
                      <span className="text-lg font-semibold text-gray-900">{service.minGuests} guests</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg px-4 mt-2">
                    <span className="font-bold text-gray-900">Starting From</span>
                    <span className="text-2xl font-bold text-green-700">₹{service.basePrice.toLocaleString()}/plate</span>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800 font-medium">* Prices may vary based on event size, menu customization, and additional services.</p>
                </div>
              </div>

              {/* Service Info */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Clock className="h-6 w-6 text-purple-600 mr-2" />
                  Service Information
                </h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-700 font-medium">Status</span>
                    <span className={`font-bold px-3 py-1 rounded-full text-sm ${
                      service.status === 'PENDING' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : service.status === 'APPROVED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {service.status}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-700 font-medium">Created</span>
                    <span className="font-semibold text-gray-900">{new Date(service.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 font-medium">Last Updated</span>
                    <span className="font-semibold text-gray-900">{new Date(service.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}