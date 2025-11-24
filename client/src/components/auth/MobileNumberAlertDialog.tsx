'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, X } from 'lucide-react';
import { toast } from 'sonner';

interface MobileNumberAlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userDisplayName?: string;
}

export const MobileNumberAlertDialog: React.FC<MobileNumberAlertDialogProps> = ({
  isOpen,
  onClose,
  userDisplayName = 'there'
}) => {
  const [mobile, setMobile] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateMobileNumber } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!mobile.trim()) {
      setError('Please enter your mobile number');
      return;
    }
    
    // Simple phone number validation (can be enhanced)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(mobile.replace(/[\s\-\(\)]/g, ''))) {
      setError('Please enter a valid mobile number');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await updateMobileNumber(mobile);
      toast.success('Mobile number updated successfully!');
      onClose();
    } catch (error) {
      console.error('Mobile number update failed:', error);
      setError('Failed to update mobile number. Please try again.');
      toast.error('Failed to update mobile number. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
        
        <div className="text-center mb-6">
          <div className="mx-auto bg-gradient-to-r from-pink-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <Phone className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome, {userDisplayName}!</h2>
          <p className="text-gray-600">
            To enhance your experience, please provide your mobile number.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="mobile" className="block text-sm font-semibold text-gray-700 mb-2">
              Mobile Number
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                id="mobile"
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="pl-12 h-12 !bg-white !text-gray-900 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-300 !placeholder-gray-400"
                placeholder="Enter your mobile number"
                disabled={isLoading}
              />
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-500 flex items-center">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 h-12 border-2 border-gray-300 hover:border-pink-300 text-gray-700 hover:text-pink-600 font-semibold rounded-xl transition-all duration-300"
            >
              Skip for now
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Submitting...
                </div>
              ) : (
                'Submit'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MobileNumberAlertDialog;