'use client';

import React from 'react';
import StatsCard from './StatsCard';
import { 
  Building, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Camera,
  Utensils,
  Heart,
  Video,
  Sparkles,
  Music
} from 'lucide-react';

interface StatsOverviewProps {
  totalServices: number;
  approvedServices: number;
  pendingServices: number;
  averagePrice: number;
  serviceType: 'catering' | 'photography' | 'decoration' | 'bridal-makeup' | 'videography' | 'venues' | 'entertainment';
  className?: string;
}

const serviceIcons = {
  catering: { icon: Utensils, color: 'text-pink-600', bg: 'bg-pink-100' },
  photography: { icon: Camera, color: 'text-pink-600', bg: 'bg-pink-100' },
  decoration: { icon: Heart, color: 'text-pink-600', bg: 'bg-pink-100' },
  'bridal-makeup': { icon: Sparkles, color: 'text-pink-600', bg: 'bg-pink-100' },
  videography: { icon: Video, color: 'text-pink-600', bg: 'bg-pink-100' },
  entertainment: { icon: Music, color: 'text-pink-600', bg: 'bg-pink-100' },
  venues: { icon: Building, color: 'text-pink-600', bg: 'bg-pink-100' }
};

export default function StatsOverview({
  totalServices,
  approvedServices,
  pendingServices,
  averagePrice,
  serviceType,
  className = ""
}: StatsOverviewProps) {
  const serviceIcon = serviceIcons[serviceType];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 ${className}`}>
      <StatsCard
        title="Total Services"
        value={totalServices}
        icon={serviceIcon.icon}
        iconColor={serviceIcon.color}
        iconBgColor={serviceIcon.bg}
      />
      
      <StatsCard
        title="Approved"
        value={approvedServices}
        icon={CheckCircle}
        iconColor="text-green-600"
        iconBgColor="bg-green-100"
      />
      
      <StatsCard
        title="Pending"
        value={pendingServices}
        icon={Clock}
        iconColor="text-yellow-600"
        iconBgColor="bg-yellow-100"
      />
      
      <StatsCard
        title="Avg. Price"
        value={`₹${Math.round(averagePrice).toLocaleString()}`}
        icon={TrendingUp}
        iconColor="text-blue-600"
        iconBgColor="bg-blue-100"
      />
    </div>
  );
}
