'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './button';
import { ArrowLeft } from 'lucide-react';

interface BackToServicesButtonProps {
  serviceType: 'catering' | 'photography' | 'videography' | 'bridal-makeup' | 'decoration' | 'venues';
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
}

export default function BackToServicesButton({ 
  serviceType, 
  className = '',
  variant = 'outline'
}: BackToServicesButtonProps) {
  const router = useRouter();
  
  console.log('BackToServicesButton rendered with serviceType:', serviceType);

  const getServiceRoute = (type: string) => {
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
      default:
        return '/provider/dashboard';
    }
  };

  const handleBackClick = () => {
    const route = getServiceRoute(serviceType);
    console.log('Navigating to:', route, 'for service type:', serviceType);
    
    // Try the specific route first, fallback to dashboard if it fails
    try {
      router.push(route);
    } catch (error) {
      console.error('Navigation failed, falling back to dashboard:', error);
      router.push('/provider/dashboard');
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
