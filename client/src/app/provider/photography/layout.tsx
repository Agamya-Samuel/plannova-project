'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function PhotographyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  // Check if user is a provider with photography service
  const isPhotographyProvider = user?.role === 'PROVIDER' && 
    user.serviceCategories?.includes('photography');

  if (!isPhotographyProvider) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-pink-100 flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-600 mb-6">
                You do not have permission to access the photography services section.
                Please make sure you are registered as a photography provider.
              </p>
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return <>{children}</>;
}