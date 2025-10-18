'use client';

import React from 'react';
import { Button } from './button';
import ServiceCardMenu from './ServiceCardMenu';
import { MapPin, Star } from 'lucide-react';

interface ServiceCardProps {
  id: string;
  name: string;
  description: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'PENDING_EDIT';
  location?: string;
  price?: number;
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onDelete?: (id: string) => Promise<void>;
  onSubmitForApproval?: (id: string) => Promise<void>;
  loading?: boolean;
  deleteLoading?: boolean;
  submitLoading?: boolean;
  className?: string;
}

export default function ServiceCard({
  id,
  name,
  description,
  status,
  location,
  price,
  rating = 0,
  reviewCount = 0,
  tags = [],
  onEdit,
  onView,
  onDelete,
  onSubmitForApproval,
  loading = false,
  deleteLoading = false,
  submitLoading = false,
  className = ""
}: ServiceCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
      case 'PENDING_EDIT':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'SUSPENDED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow ${className}`}>
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-900">{name}</h3>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
              {status}
            </span>
            <ServiceCardMenu
              serviceId={id}
              serviceStatus={status}
              onEdit={onEdit}
              onView={onView}
              onDelete={onDelete}
              onSubmitForApproval={onSubmitForApproval}
              loading={loading}
              deleteLoading={deleteLoading}
              submitLoading={submitLoading}
            />
          </div>
        </div>
        
        <p className="text-gray-600 mb-3 text-sm line-clamp-2">{description}</p>
        
        {location && (
          <div className="flex items-center text-gray-600 mb-4">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="text-sm">{location}</span>
          </div>
        )}
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-gray-600">
            <Star className="h-4 w-4 mr-1 text-yellow-500" />
            <span className="text-sm">{rating} ({reviewCount} reviews)</span>
          </div>
          {price && (
            <span className="text-sm text-gray-500">₹{price.toLocaleString()}</span>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => onView(id)}
            className="flex-1"
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
}
