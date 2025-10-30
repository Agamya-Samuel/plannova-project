'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from './button';
import { ArrowLeft } from 'lucide-react';

interface BackToServicesButtonProps {
  serviceType: 'catering' | 'photography' | 'videography' | 'bridal-makeup' | 'decoration' | 'venues' | 'entertainment';
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
}

export default function BackToServicesButton({ 
  serviceType, 
  className = '',
  variant = 'outline'
}: BackToServicesButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  console.log('BackToServicesButton rendered with serviceType:', serviceType, 'user role:', user?.role);

  const getServiceRoute = (type: string, userRole?: string) => {
    // Handle different user roles
    if (userRole === 'STAFF' || userRole === 'ADMIN') {
      // Staff and admin users should go to staff approvals pages
      switch (type) {
        case 'catering':
          return '/staff/approvals/catering';
        case 'photography':
          return '/staff/approvals/photography';
        case 'videography':
          return '/staff/approvals/videography';
        case 'bridal-makeup':
          return '/staff/approvals/bridal-makeup';
        case 'decoration':
          return '/staff/approvals/decoration';
        case 'venues':
          return '/staff/approvals/venues';
        case 'entertainment':
          return '/staff/approvals/entertainment';
        default:
          return '/staff/approvals';
      }
    } else if (userRole === 'PROVIDER') {
      // Provider users go to their service pages
      switch (type) {
        case 'catering':
          return '/provider/catering';
        case 'photography':
          return '/provider/photography';
        case 'videography':
          return '/provider/videography';
        case 'bridal-makeup':
          return '/provider/bridal-makeup';
        case 'decoration':
          return '/provider/decoration';
        case 'venues':
          return '/provider/venues';
        case 'entertainment':
          return '/provider/entertainment';
        default:
          return '/provider/dashboard';
      }
    } else {
      // Default fallback for customers or unknown roles
      return '/dashboard';
    }
  };

  const handleBackClick = () => {
    const route = getServiceRoute(serviceType, user?.role || undefined);
    console.log('Navigating to:', route, 'for service type:', serviceType, 'user role:', user?.role);
    
    // Try the specific route first, fallback to appropriate dashboard if it fails
    try {
      router.push(route);
    } catch (error) {
      console.error('Navigation failed, falling back to dashboard:', error);
      // Fallback based on user role
      if (user?.role === 'STAFF' || user?.role === 'ADMIN') {
        router.push('/staff/approvals');
      } else if (user?.role === 'PROVIDER') {
        router.push('/provider/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  };

  return (
    <Button
      variant={variant}
      onClick={(e) => {
        console.log('Button clicked!', serviceType);
        e.preventDefault();
        e.stopPropagation();
        handleBackClick();
      }}
      className={`flex items-center space-x-2 ${className}`}
      style={{ cursor: 'pointer' }}
    >
      <ArrowLeft className="h-4 w-4" />
      <span>Back to Services</span>
    </Button>
  );
}
