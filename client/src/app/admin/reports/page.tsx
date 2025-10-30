'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Users, 
  MapPin, 
  IndianRupee,
  Calendar,
  Download,
  Filter,
  ExternalLink
} from 'lucide-react';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import Link from 'next/link';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AdminStats {
  users: {
    total: number;
    customers: number;
    providers: number;
    staff: number;
    admins: number;
  };
  venues: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  catering: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

export default function AdminReportsPage() {
  const { user: currentUser, isLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('monthly');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<AdminStats>('/admin/stats');
      setStats(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      fetchStats();
    }
  }, [currentUser]);

  // User distribution chart data
  const userData = stats ? {
    labels: ['Customers', 'Providers', 'Staff', 'Admins'],
    datasets: [
      {
        label: 'User Distribution',
        data: [
          stats.users.customers,
          stats.users.providers,
          stats.users.staff,
          stats.users.admins
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  // Venue status chart data
  const venueData = stats ? {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [
      {
        label: 'Venue Status',
        data: [
          stats.venues.pending,
          stats.venues.approved,
          stats.venues.rejected
        ],
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(245, 158, 11, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  // Catering status chart data
  const cateringData = stats ? {
    labels: ['Pending', 'Approved', 'Rejected'],
    datasets: [
      {
        label: 'Catering Status',
        data: [
          stats.catering.pending,
          stats.catering.approved,
          stats.catering.rejected
        ],
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(245, 158, 11, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const handleExportReport = () => {
    toast.success('Report export started. Download will begin shortly.');
    // In a real implementation, this would trigger a report generation and download
  };

  if (!isLoading && currentUser?.role !== 'ADMIN') {
    return <div>Your session timed out. Please log in again.</div>;
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Reports & Analytics
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Generate platform analytics and reports
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                  <span>Platform Analytics</span>
                </div>
              </div>
              
              {/* Tabs for Reports and Website Analytics */}
              <div className="mt-6 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <Link 
                    href="/admin/reports" 
                    className="border-b-2 border-red-500 text-red-600 whitespace-nowrap py-4 px-1 text-sm font-medium"
                  >
                    Platform Reports
                  </Link>
                  <Link 
                    href="/admin/analytics" 
                    className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 text-sm font-medium flex items-center"
                  >
                    Website Analytics
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </nav>
              </div>
            </div>
          </div>

          {/* Time Range Filter */}
          <div className="mb-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Platform Overview</h2>
                  <p className="text-gray-600">Key metrics and statistics</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-5 w-5 text-gray-400" />
                    <select
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value)}
                      className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <Button 
                    onClick={handleExportReport}
                    className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export Report</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Stats Cards */}
          {!loading && !error && stats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.users.total}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <MapPin className="h-6 w-6 text-pink-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Venues</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.venues.total}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <IndianRupee className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Catering Services</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.catering.total}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.venues.pending + stats.catering.pending}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* User Distribution Chart */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
                  {userData && <Pie data={userData} options={chartOptions} />}
                </div>
                
                {/* Venue Status Chart */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Venue Status Distribution</h3>
                  {venueData && <Pie data={venueData} options={chartOptions} />}
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-8">
                {/* Catering Status Chart */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Catering Service Status</h3>
                  {cateringData && <Bar data={cateringData} options={chartOptions} />}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}