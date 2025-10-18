'use client';

import React from 'react';
import { Button } from './button';
import { Save, Trash2, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';

interface SubmitButtonProps {
  // Action type
  action: 'create' | 'edit' | 'delete' | 'next' | 'previous';
  
  // Button state
  loading?: boolean;
  disabled?: boolean;
  
  // Button text customization
  createText?: string;
  editText?: string;
  deleteText?: string;
  nextText?: string;
  previousText?: string;
  loadingText?: string;
  
  // Click handlers
  onClick?: () => void;
  
  // Styling
  className?: string;
  variant?: 'default' | 'outline' | 'destructive';
  
  // Service type for styling
  serviceType?: 'catering' | 'photography' | 'bridal-makeup' | 'videography' | 'decoration' | 'venue';
  
  // Size
  size?: 'sm' | 'md' | 'lg';
}

export default function SubmitButton({
  action,
  loading = false,
  disabled = false,
  createText = 'Create Service',
  editText = 'Update Service',
  deleteText = 'Delete Service',
  nextText = 'Next',
  previousText = 'Previous',
  loadingText,
  onClick,
  className = '',
  variant = 'default',
  serviceType = 'catering',
  size = 'md'
}: SubmitButtonProps) {
  
  // Get service-specific styling
  const getServiceGradient = (serviceType: string) => {
    switch (serviceType) {
      case 'catering':
        return 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700';
      case 'photography':
        return 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700';
      case 'bridal-makeup':
        return 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700';
      case 'videography':
        return 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700';
      case 'decoration':
        return 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700';
      case 'venue':
        return 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700';
      default:
        return 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700';
    }
  };

  // Get button text based on action
  const getButtonText = () => {
    if (loading) {
      return loadingText || getLoadingText();
    }
    
    switch (action) {
      case 'create':
        return createText;
      case 'edit':
        return editText;
      case 'delete':
        return deleteText;
      case 'next':
        return nextText;
      case 'previous':
        return previousText;
      default:
        return 'Submit';
    }
  };

  const getLoadingText = () => {
    switch (action) {
      case 'create':
        return 'Creating...';
      case 'edit':
        return 'Updating...';
      case 'delete':
        return 'Deleting...';
      case 'next':
        return 'Loading...';
      case 'previous':
        return 'Loading...';
      default:
        return 'Processing...';
    }
  };

  // Get button icon
  const getButtonIcon = () => {
    if (loading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    switch (action) {
      case 'create':
      case 'edit':
        return <Save className="h-4 w-4" />;
      case 'delete':
        return <Trash2 className="h-4 w-4" />;
      case 'next':
        return <ChevronRight className="h-4 w-4" />;
      case 'previous':
        return <ChevronLeft className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Get button variant
  const getButtonVariant = () => {
    if (action === 'delete') return 'destructive';
    if (action === 'previous') return 'outline';
    return variant;
  };

  // Get button size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm';
      case 'lg':
        return 'px-8 py-4 text-lg';
      default:
        return 'px-6 py-3';
    }
  };

  // Get button classes
  const getButtonClasses = () => {
    const baseClasses = 'flex items-center space-x-2 transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg hover:shadow-xl';
    const sizeClasses = getSizeClasses();
    const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';
    
    if (action === 'delete') {
      return `${baseClasses} ${sizeClasses} ${disabledClasses} bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white`;
    }
    
    if (action === 'previous') {
      return `${baseClasses} ${sizeClasses} ${disabledClasses} border border-gray-200 hover:bg-gray-50`;
    }
    
    if (action === 'next' || action === 'create' || action === 'edit') {
      const gradientClasses = getServiceGradient(serviceType);
      return `${baseClasses} ${sizeClasses} ${disabledClasses} ${gradientClasses} text-white`;
    }
    
    return `${baseClasses} ${sizeClasses} ${disabledClasses}`;
  };

  return (
    <Button
      type="button"
      variant={getButtonVariant()}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${getButtonClasses()} ${className}`}
    >
      {getButtonIcon()}
      <span>{getButtonText()}</span>
    </Button>
  );
}
