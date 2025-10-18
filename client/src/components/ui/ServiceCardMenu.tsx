'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { MoreVertical, Edit3, Eye, Trash2, Send } from 'lucide-react';

interface ServiceCardMenuProps {
  // Service information
  serviceId: string;
  serviceStatus: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'PENDING_EDIT';
  
  // Action handlers
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onDelete?: (id: string) => Promise<void>;
  onSubmitForApproval?: (id: string) => Promise<void>;
  
  // Button states
  loading?: boolean;
  deleteLoading?: boolean;
  submitLoading?: boolean;
  
  // Customization
  submitText?: string;
  className?: string;
}

export default function ServiceCardMenu({
  serviceId,
  serviceStatus,
  onEdit,
  onView,
  onDelete,
  onSubmitForApproval,
  loading = false,
  deleteLoading = false,
  submitLoading = false,
  submitText = 'Submit for Approval',
  className = ''
}: ServiceCardMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close menu when any action is triggered
  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  // Check if service can be submitted for approval
  const canSubmitForApproval = serviceStatus === 'DRAFT' && onSubmitForApproval;

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Three-dot menu button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="h-8 w-8 p-0 hover:bg-gray-50"
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-10 z-50 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
          {/* View option */}
          <button
            onClick={() => handleAction(() => onView(serviceId))}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
          >
            <Eye className="h-4 w-4" />
            <span>View Details</span>
          </button>

          {/* Edit option */}
          <button
            onClick={() => handleAction(() => onEdit(serviceId))}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
          >
            <Edit3 className="h-4 w-4" />
            <span>Edit</span>
          </button>

          {/* Submit for Approval option (only for DRAFT status) */}
          {canSubmitForApproval && (
            <button
              onClick={() => handleAction(() => onSubmitForApproval(serviceId))}
              disabled={submitLoading}
              className="w-full px-4 py-2 text-left text-sm text-blue-700 hover:bg-blue-50 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>{submitText}</span>
            </button>
          )}

          {/* Status indicator */}
          <div className="px-4 py-2 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                serviceStatus === 'APPROVED' ? 'bg-green-500' :
                serviceStatus === 'PENDING' ? 'bg-yellow-500' :
                serviceStatus === 'REJECTED' ? 'bg-red-500' :
                serviceStatus === 'DRAFT' ? 'bg-gray-500' :
                'bg-orange-500'
              }`} />
              <span className="text-xs text-gray-500 capitalize">
                {serviceStatus.toLowerCase().replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Delete option */}
          {onDelete && (
            <div className="border-t border-gray-100">
              <button
                onClick={() => handleAction(() => onDelete(serviceId))}
                disabled={deleteLoading}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
