'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Camera, Plus, Edit3, Eye, BarChart3, Settings } from 'lucide-react';
import apiClient from '@/lib/api';

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
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PENDING_EDIT';
  createdAt: string;
}

export default function PhotographyDashboard() {
  const router = useRouter();
  const [services, setServices] = useState<PhotographyService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPhotographyServices();
  }, []);

  const fetchPhotographyServices = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/photography/my-services');
      setServices(response.data.data);
    } catch (err) {
      setError('Failed to fetch photography services');
      console.error('Error fetching photography services:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PENDING_EDIT':
        return 'bg-blue-100 text-blue-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Approved';
      case 'PENDING':
        return 'Pending Approval';
      case 'PENDING_EDIT':
        return 'Edit Pending';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Photography Services</h1>
              <button
                onClick={() => router.push('/provider/photography/create')}
                className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New Service
              </button>
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
            <button
              onClick={() => router.push('/provider/photography/create')}
              className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Service
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Services</p>
                  <p className="text-3xl font-bold text-gray-900">{services.length}</p>
                </div>
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Camera className="h-6 w-6 text-pink-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Approved</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {services.filter(s => s.status === 'APPROVED').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {services.filter(s => s.status === 'PENDING' || s.status === 'PENDING_EDIT').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Packages</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {services.reduce((total, service) => total + service.packages.length, 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Settings className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Services List */}
          {services.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No photography services yet</h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first photography service
              </p>
              <button
                onClick={() => router.push('/provider/photography/create')}
                className="inline-flex items-center px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Service
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div key={service._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                        {getStatusText(service.status)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {service.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {service.photographyTypes.slice(0, 3).map((type, index) => (
                        <span key={index} className="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">
                          {type}
                        </span>
                      ))}
                      {service.photographyTypes.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                          +{service.photographyTypes.length - 3}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Packages</p>
                        <p className="font-semibold text-gray-900">{service.packages.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Starting at</p>
                        <p className="font-semibold text-gray-900">₹{service.basePrice}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/provider/photography/edit?id=${service._id}`)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => router.push(`/provider/photography/view?id=${service._id}`)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}