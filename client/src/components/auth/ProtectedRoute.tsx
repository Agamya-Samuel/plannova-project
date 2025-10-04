'use client';

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles = ['CUSTOMER', 'PROVIDER', 'STAFF', 'ADMIN'],
  redirectTo = '/auth/login'
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Wait for auth to load

    if (!isAuthenticated) {
      router.push(redirectTo);
      return;
    }

    if (user && !allowedRoles.includes(user.role)) {
      // User doesn't have required role, redirect to appropriate page
      const roleRedirects = {
        CUSTOMER: '/dashboard',
        PROVIDER: '/provider/venues',
        STAFF: '/staff/approvals',
        ADMIN: '/admin/dashboard',
      };
      router.push(roleRedirects[user.role] || '/dashboard');
      return;
    }
  }, [user, isAuthenticated, isLoading, allowedRoles, redirectTo, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!isAuthenticated || (user && !allowedRoles.includes(user.role))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}