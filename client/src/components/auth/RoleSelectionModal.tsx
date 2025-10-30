'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/auth';
import { Heart, Users, Building, X } from 'lucide-react';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onRoleSelected: (role: UserRole) => void;
  onClose: () => void;
  userDisplayName?: string;
  isLoading?: boolean;
}

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  isOpen,
  onRoleSelected,
  onClose,
  userDisplayName,
  isLoading = false,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  if (!isOpen) return null;

  const handleRoleConfirm = () => {
    if (selectedRole) {
      onRoleSelected(selectedRole);
    }
  };

  const roleOptions = [
    {
      value: 'CUSTOMER' as UserRole,
      title: 'Customer',
      subtitle: 'Looking for event venues',
      icon: <Heart className="h-8 w-8" />,
      description: 'I\'m planning my event and looking for the perfect venue',
      gradient: 'from-pink-500 to-rose-500',
      bgGradient: 'from-pink-50 to-rose-50',
      borderColor: 'border-pink-200',
      selectedBorder: 'border-pink-500',
      emoji: '🤵👰',
    },
    {
      value: 'PROVIDER' as UserRole,
      title: 'Provider',
      subtitle: 'Event venue owner',
      icon: <Building className="h-8 w-8" />,
      description: 'I own or manage event venues and want to list them',
      gradient: 'from-purple-500 to-indigo-500',
      bgGradient: 'from-purple-50 to-indigo-50',
      borderColor: 'border-purple-200',
      selectedBorder: 'border-purple-500',
      emoji: '🏛️',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
            {!isLoading && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome{userDisplayName ? `, ${userDisplayName.split(' ')[0]}` : ''}! 🎉
          </h2>
          <p className="text-gray-600">
            Please choose your account type to personalize your experience on Plannova.
          </p>
        </div>

        {/* Role Options */}
        <div className="px-6 pb-6 space-y-4">
          {roleOptions.map((option) => (
            <div
              key={option.value}
              onClick={() => !isLoading && setSelectedRole(option.value)}
              className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                selectedRole === option.value
                  ? `${option.selectedBorder} bg-gradient-to-r ${option.bgGradient} shadow-lg`
                  : `${option.borderColor} bg-white hover:${option.borderColor} hover:shadow-md`
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${option.gradient} text-white flex-shrink-0`}>
                  {option.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xl">{option.emoji}</span>
                    <h3 className="text-lg font-bold text-gray-800">
                      {option.title}
                    </h3>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    {option.subtitle}
                  </p>
                  <p className="text-sm text-gray-500">
                    {option.description}
                  </p>
                </div>

                {/* Selection Indicator */}
                {selectedRole === option.value && (
                  <div className="absolute top-3 right-3">
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${option.gradient} flex items-center justify-center`}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="px-6 pb-6 space-y-3">
          <Button
            onClick={handleRoleConfirm}
            disabled={!selectedRole || isLoading}
            className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Setting up your account...
              </div>
            ) : (
              'Continue'
            )}
          </Button>

          {!isLoading && (
            <p className="text-xs text-gray-500 text-center px-4">
              You can change your account type later in your profile settings.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionModal;