'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { 
  Building, 
  Utensils, 
  Camera, 
  Video, 
  Music, 
  Flower2,
  CheckCircle,
  Clock,
} from 'lucide-react';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { usePathname, useRouter } from 'next/navigation';

export default function StaffApprovalsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [stats, setStats] = useState({
    venues: { pending: 0, approved: 0, rejected: 0 },
    catering: { pending: 0, approved: 0, rejected: 0 },
    photography: { pending: 0, approved: 0, rejected: 0 }
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch venue stats
        const venueResponse = await apiClient.get('/venues/staff/stats');
        // Fetch catering stats
        const cateringResponse = await apiClient.get('/catering/staff/stats');
        // Fetch photography stats
        const photographyResponse = await apiClient.get('/photography/staff/stats');
        
        setStats({
          venues: venueResponse.data.data,
          catering: cateringResponse.data.data,
          photography: photographyResponse.data.data
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        toast.error('Failed to fetch dashboard statistics');
      } finally {
      }
    };

    if (user?.role === 'STAFF' || user?.role === 'ADMIN') {
      fetchStats();
    }
  }, [user]);

  const getServiceStats = (serviceType: 'venues' | 'catering' | 'photography') => {
    const serviceStats = stats[serviceType];
    return (
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-yellow-50 rounded-lg p-2">
          <div className="text-lg font-bold text-yellow-700">{serviceStats.pending}</div>
          <div className="text-xs text-yellow-600">Pending</div>
        </div>
        <div className="bg-green-50 rounded-lg p-2">
          <div className="text-lg font-bold text-green-700">{serviceStats.approved}</div>
          <div className="text-xs text-green-600">Approved</div>
        </div>
        <div className="bg-red-50 rounded-lg p-2">
          <div className="text-lg font-bold text-red-700">{serviceStats.rejected}</div>
          <div className="text-xs text-red-600">Rejected</div>
        </div>
      </div>
    );
  };

  if (user?.role !== 'STAFF' && user?.role !== 'ADMIN') {
    return <div>Access denied. Staff access required.</div>;
  }

  return (
    <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Service Approvals Dashboard
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Review and approve provider service submissions
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Staff Portal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Service Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Venue Services */}
            <div className={`bg-white rounded-xl shadow-lg p-6 border-2 ${pathname.includes('venues') ? 'border-blue-500' : 'border-transparent'} hover:shadow-xl transition-all duration-300`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Venue Services</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-700">{stats.venues.pending} pending</span>
                </div>
              </div>
              
              {getServiceStats('venues')}
              
              <div className="mt-6">
                <Button 
                  onClick={() => router.push('/staff/approvals/venues')}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  Manage Venue Approvals
                </Button>
              </div>
            </div>

            {/* Catering Services */}
            <div className={`bg-white rounded-xl shadow-lg p-6 border-2 ${pathname.includes('catering') ? 'border-pink-500' : 'border-transparent'} hover:shadow-xl transition-all duration-300`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-pink-100 rounded-lg">
                    <Utensils className="h-6 w-6 text-pink-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Catering Services</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-700">{stats.catering.pending} pending</span>
                </div>
              </div>
              
              {getServiceStats('catering')}
              
              <div className="mt-6">
                <Button 
                  onClick={() => router.push('/staff/approvals/catering')}
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white"
                >
                  Manage Catering Approvals
                </Button>
              </div>
            </div>

            {/* Photography Services */}
            <div className={`bg-white rounded-xl shadow-lg p-6 border-2 ${pathname.includes('photography') ? 'border-purple-500' : 'border-transparent'} hover:shadow-xl transition-all duration-300`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Camera className="h-6 w-6 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Photography Services</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-700">{stats.photography.pending} pending</span>
                </div>
              </div>
              
              {getServiceStats('photography')}
              
              <div className="mt-6">
                <Button 
                  onClick={() => router.push('/staff/approvals/photography')}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                >
                  Manage Photography Approvals
                </Button>
              </div>
            </div>
          </div>

          {/* Additional Service Types (Coming Soon) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Videography', icon: Video, color: 'bg-indigo-100', iconColor: 'text-indigo-600' },
              { name: 'Entertainment', icon: Music, color: 'bg-yellow-100', iconColor: 'text-yellow-600' },
              { name: 'Decoration', icon: Flower2, color: 'bg-green-100', iconColor: 'text-green-600' }
            ].map((service, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 opacity-60">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-3 ${service.color} rounded-lg`}>
                    <service.icon className={`h-6 w-6 ${service.iconColor}`} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{service.name}</h2>
                </div>
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">Coming Soon</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}