'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';
import { Button } from '../../../components/ui/button';
import { 
  Users, 
  Trash2, 
  Eye, 
  Search,
  X,
  Filter,
  UserCheck,
  UserX,
  Shield,
  User,
  Building,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import apiClient from '../../../lib/api';
import { toast } from 'sonner';
import { sonnerConfirm } from '../../../lib/sonner-confirm';

interface ApiError extends Error {
  response?: {
    data?: {
      error?: string;
    };
  };
}

interface AdminUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'CUSTOMER' | 'PROVIDER' | 'STAFF' | 'ADMIN';
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  venueCount?: number;
}

interface UsersResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function AdminDashboardPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const fetchUsers = async (page = 1, role = 'ALL', search = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (role !== 'ALL') {
        params.append('role', role);
      }
      
      if (search) {
        params.append('search', search);
      }

      const response = await apiClient.get<UsersResponse>(`/admin/users?${params}`);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
      setError('');
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      fetchUsers(currentPage, roleFilter, searchTerm);
    }
  }, [currentPage, roleFilter, currentUser]);


  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (value.trim() === '') {
      setCurrentPage(1);
      fetchUsers(1, roleFilter, '');
      return;
    }
    
    setIsSearching(true);
    
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      fetchUsers(1, roleFilter, value.trim()).finally(() => {
        setIsSearching(false);
      });
    }, 300);
    
    setSearchTimeout(timeout);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setCurrentPage(1);
    fetchUsers(1, value, searchTerm);
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmed = await sonnerConfirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    try {
      await apiClient.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully!');
      fetchUsers(currentPage, roleFilter, searchTerm);
    } catch (err: unknown) {
      console.error('Error deleting user:', err);
      let errorMessage = 'Failed to delete user';
      const apiError = err as ApiError;
      if (apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      }
      toast.error(errorMessage);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean, userName: string) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    const confirmed = await sonnerConfirm(`Are you sure you want to ${action} user "${userName}"?`);
    if (!confirmed) {
      return;
    }

    try {
      await apiClient.patch(`/admin/users/${userId}/status`, { isActive: !currentStatus });
      toast.success(`User ${action}d successfully!`);
      fetchUsers(currentPage, roleFilter, searchTerm);
    } catch (err: unknown) {
      console.error(`Error ${action}ing user:`, err);
      let errorMessage = `Failed to ${action} user`;
      const apiError = err as ApiError;
      if (apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      }
      toast.error(errorMessage);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string, userName: string) => {
    const confirmed = await sonnerConfirm(`Are you sure you want to change "${userName}" role to ${newRole}?`);
    if (!confirmed) {
      return;
    }

    try {
      await apiClient.patch(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(`User role updated to ${newRole} successfully!`);
      fetchUsers(currentPage, roleFilter, searchTerm);
    } catch (err: unknown) {
      console.error('Error updating user role:', err);
      let errorMessage = 'Failed to update user role';
      const apiError = err as ApiError;
      if (apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      }
      toast.error(errorMessage);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'CUSTOMER':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'PROVIDER':
        return <Building className="h-4 w-4 text-green-500" />;
      case 'STAFF':
        return <UserCheck className="h-4 w-4 text-orange-500" />;
      case 'ADMIN':
        return <Shield className="h-4 w-4 text-red-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'CUSTOMER':
        return 'bg-blue-100 text-blue-800';
      case 'PROVIDER':
        return 'bg-green-100 text-green-800';
      case 'STAFF':
        return 'bg-orange-100 text-orange-800';
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
                    Admin Dashboard
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Manage users, venues, and system settings
                  </p>
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>&#128161; Tip:</strong> You can create staff by changing any user&apos;s role to &quot;Staff&quot; using the role dropdown below. 
                      Staff members will then have access to approve/reject venues.
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Shield className="h-5 w-5 text-red-500" />
                  <span>Admin Portal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Providers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter(u => u.role === 'PROVIDER').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-200">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <UserCheck className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Staff Members</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {users.filter(u => u.role === 'STAFF').length}
                  </p>
                  <p className="text-xs text-gray-500">Can approve venues</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Admins</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter(u => u.role === 'ADMIN').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="mb-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => handleSearchTermChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => handleSearchTermChange('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {isSearching ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Role Filter */}
                <div className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <select
                    value={roleFilter}
                    onChange={(e) => handleRoleFilterChange(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="CUSTOMER">Customers</option>
                    <option value="PROVIDER">Providers</option>
                    <option value="STAFF">Staff</option>
                    <option value="ADMIN">Admins</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Search Results Info */}
          {!loading && !error && (searchTerm || roleFilter !== 'ALL') && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-red-600" />
                  <span className="text-red-800 font-medium">
                    {users.length} user{users.length !== 1 ? 's' : ''} found
                    {searchTerm && ` for "${searchTerm}"`}
                    {roleFilter !== 'ALL' && ` with role "${roleFilter}"`}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setRoleFilter('ALL');
                    setCurrentPage(1);
                    fetchUsers(1, 'ALL', '');
                  }}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Clear filters
                </button>
              </div>
            </div>
          )}

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

          {/* Users Table */}
          {!loading && !error && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {user.firstName[0]}{user.lastName[0]}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {getRoleIcon(user.role)}
                            <span className="ml-1">{user.role}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <UserX className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-col space-y-2">
                            {/* Role Change Dropdown */}
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">Role:</span>
                              <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(user._id, e.target.value, `${user.firstName} ${user.lastName}`)}
                                className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white shadow-sm"
                                disabled={user._id === currentUser?.id} // Disable for current user
                                style={{ color: '#111827', backgroundColor: 'white' }}
                              >
                                <option value="CUSTOMER" style={{ color: '#111827', backgroundColor: 'white' }}>Customer</option>
                                <option value="PROVIDER" style={{ color: '#111827', backgroundColor: 'white' }}>Provider</option>
                                <option value="STAFF" style={{ color: '#111827', backgroundColor: 'white' }}>Staff</option>
                                <option value="ADMIN" style={{ color: '#111827', backgroundColor: 'white' }}>Admin</option>
                              </select>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleUserStatus(user._id, user.isActive, `${user.firstName} ${user.lastName}`)}
                                className={user.isActive ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'}
                                disabled={user._id === currentUser?.id} // Disable for current user
                              >
                                {user.isActive ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-1" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-1" />
                                    Activate
                                  </>
                                )}
                              </Button>
                              
                              {user.role !== 'ADMIN' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteUser(user._id, `${user.firstName} ${user.lastName}`)}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                        <span className="font-medium">{pagination.total}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md"
                        >
                          Previous
                        </Button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          Page {pagination.page} of {pagination.pages}
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === pagination.pages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md"
                        >
                          Next
                        </Button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
