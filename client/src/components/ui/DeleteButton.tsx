'use client';

import React from 'react';
import { Button } from './button';
import { Trash2 } from 'lucide-react';
import { sonnerConfirm } from '@/lib/sonner-confirm';
import { toast } from 'sonner';

interface DeleteButtonProps {
  // Delete configuration
  itemName: string;
  itemType?: string; // e.g., 'service', 'venue', 'package'
  
  // Delete handler
  onDelete: () => Promise<void>;
  
  // Button customization
  deleteText?: string;
  confirmMessage?: string;
  
  // Button state
  loading?: boolean;
  disabled?: boolean;
  
  // Styling
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'destructive';
  
  // Success/Error handling
  onSuccess?: (itemName: string) => void;
  onError?: (error: string) => void;
}

export default function DeleteButton({
  itemName,
  itemType = 'service',
  onDelete,
  deleteText = 'Delete',
  confirmMessage,
  loading = false,
  disabled = false,
  className = '',
  size = 'md',
  variant = 'destructive',
  onSuccess,
  onError
}: DeleteButtonProps) {
  
  const handleDelete = async () => {
    try {
      // Show confirmation dialog
      const confirmed = await sonnerConfirm(
        confirmMessage || 
        `Are you sure you want to delete "${itemName}"? This action cannot be undone and all associated images will be permanently deleted.`
      );
      
      if (!confirmed) return;
      
      // Execute delete operation
      await onDelete();
      
      // Show success message
      toast.success(`"${itemName}" has been deleted successfully.`);
      
      // Call success callback
      if (onSuccess) {
        onSuccess(itemName);
      }
    } catch (error) {
      console.error(`Error deleting ${itemType}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : `Failed to delete ${itemType}`;
      
      // Show error message
      toast.error(errorMessage);
      
      // Call error callback
      if (onError) {
        onError(errorMessage);
      }
    }
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
    
    if (variant === 'destructive') {
      return `${baseClasses} ${sizeClasses} ${disabledClasses} bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white`;
    }
    
    return `${baseClasses} ${sizeClasses} ${disabledClasses}`;
  };

  return (
    <Button
      type="button"
      variant={variant}
      disabled={disabled || loading}
      onClick={handleDelete}
      className={`${getButtonClasses()} ${className}`}
    >
      <Trash2 className="h-4 w-4" />
      <span>{deleteText}</span>
    </Button>
  );
}
