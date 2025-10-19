'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Users, 
  Eye, 
  MousePointerClick,
  Calendar,
  Download,
  Filter,
  RefreshCw
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
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface UmamiStats {
  pageviews: {
    value: number;
    change: number;
  };
  visitors: {
    value: number;
    change: number;
  };
  visits: {
    value: number;
    change: number;
  };
  bounces: {
    value: number;
    change: number;
  };
  totalTime: {
    value: number;
    change: number;
  };
  activeVisitors: {
    value: number;
  };
}

interface UmamiPageview {
  x: string; // date
  y: number; // pageviews
}

interface UmamiEvent {
  x: string; // event name
  y: number; // count
}

interface UmamiMetrics {
  pageviews: UmamiPageview[];
  events: UmamiEvent[];
}

export default function AdminAnalyticsPage() {
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<UmamiStats | null>(null);
  const [metrics, setMetrics] = useState<UmamiMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch stats
      const statsResponse = await apiClient.get<UmamiStats>(`/admin/analytics/stats?range=${timeRange}`);
      setStats(statsResponse.data);
      
      // Fetch metrics
      const metricsResponse = await apiClient.get<UmamiMetrics>(`/admin/analytics/metrics?range=${timeRange}`);
      setMetrics(metricsResponse.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to fetch analytics data');
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
    toast.success('Analytics data refreshed');
  };

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      fetchAnalytics();
    }
  }, [currentUser, timeRange]);

  // Pageviews chart data
  const pageviewsData = metrics ? {
    labels: metrics.pageviews.map(item => item.x),
    datasets: [
      {
        label: 'Pageviews',
        data: metrics.pageviews.map(item => item.y),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1
      }
    ]
  } : null;

  // Events chart data
  const eventsData = metrics ? {
    labels: metrics.events.map(item => item.x),
    datasets: [
      {
        label: 'Events',
        data: metrics.events.map(item => item.y),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1,
      }
    ]
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
    toast.success('Analytics report export started. Download will begin shortly.');
    // In a real implementation, this would trigger a report generation and download
  };

  if (currentUser?.role !== 'ADMIN') {
    return <div>Access denied. Admin access required.</div>;
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
                    Analytics Dashboard
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Platform usage statistics and insights
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                  <span>Umami Analytics</span>
                </div>
              </div>
              
              {/* Umami Cloud Link Notice */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800">
                  <span className="font-medium">Note:</span> For detailed analytics and advanced insights, please visit{' '}
                  <a 
                    href="https://cloud.umami.is/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline font-medium hover:text-blue-600"
                  >
                    Umami Cloud
                  </a>.
                </p>
              </div>
            </div>
          </div>

          {/* Time Range Filter */}
          <div className="mb-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Website Analytics</h2>
                  <p className="text-gray-600">Traffic and engagement metrics</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-5 w-5 text-gray-400" />
                    <select
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value)}
                      className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="1d">Last 24 hours</option>
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                      <option value="365d">Last year</option>
                    </select>
                  </div>
                  <Button 
                    onClick={refreshData}
                    disabled={refreshing}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                  </Button>
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
              <Button 
                onClick={fetchAnalytics}
                className="mt-2 bg-red-600 hover:bg-red-700"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Stats Cards */}
          {!loading && !error && stats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Visitors</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.visitors.value.toLocaleString()}</p>
                      <p className={`text-sm ${stats.visitors.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.visitors.change >= 0 ? '+' : ''}{stats.visitors.change}%
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Eye className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pageviews</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.pageviews.value.toLocaleString()}</p>
                      <p className={`text-sm ${stats.pageviews.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.pageviews.change >= 0 ? '+' : ''}{stats.pageviews.change}%
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <MousePointerClick className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Visits</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.visits.value.toLocaleString()}</p>
                      <p className={`text-sm ${stats.visits.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {stats.visits.change >= 0 ? '+' : ''}{stats.visits.change}%
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Bounce Rate</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.bounces.value}%</p>
                      <p className={`text-sm ${stats.bounces.change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {stats.bounces.change >= 0 ? '+' : ''}{stats.bounces.change}%
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-teal-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Visitors</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.activeVisitors.value}</p>
                      <p className="text-sm text-gray-500">Currently online</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              {metrics && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Pageviews Chart */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Pageviews Over Time</h3>
                    {pageviewsData && <Line data={pageviewsData} options={chartOptions} />}
                  </div>
                  
                  {/* Events Chart */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Events</h3>
                    {eventsData && <Pie data={eventsData} options={chartOptions} />}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}