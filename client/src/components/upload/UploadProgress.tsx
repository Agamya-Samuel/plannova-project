'use client';

import React from 'react';
import { CheckCircle, AlertCircle, Upload, Loader2 } from 'lucide-react';
import type { UploadProgressBarProps } from '@/types/upload';

export default function UploadProgress({
  progress,
  status,
  fileName,
  showPercentage = true,
  className = ''
}: UploadProgressBarProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Upload className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-600';
      case 'success':
        return 'bg-green-600';
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'success':
        return 'Upload complete';
      case 'error':
        return 'Upload failed';
      default:
        return 'Ready to upload';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Status and File Info */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="font-medium text-gray-900">
            {fileName || getStatusText()}
          </span>
        </div>
        
        {showPercentage && (
          <span className="text-gray-600">
            {Math.round(progress)}%
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ease-out ${getStatusColor()}`}
          style={{ 
            width: `${Math.min(100, Math.max(0, progress))}%`,
            transition: status === 'uploading' ? 'width 0.3s ease-out' : 'width 0.1s ease-out'
          }}
        />
      </div>

      {/* Additional Status Text for File Name */}
      {fileName && (
        <div className="text-xs text-gray-500">
          {getStatusText()}
        </div>
      )}
    </div>
  );
}