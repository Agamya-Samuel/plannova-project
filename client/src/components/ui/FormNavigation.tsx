'use client';

import React from 'react';
import { Button } from './button';
import SubmitButton from './SubmitButton';

interface FormNavigationProps {
  // Navigation state
  isFirstTab: boolean;
  isLastTab: boolean;
  loading: boolean;
  
  // Navigation handlers
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onSubmitDraft?: () => void; // New handler for draft submission
  onCancel: () => void;
  
  // Button customization
  nextText?: string;
  previousText?: string;
  submitText?: string;
  submitDraftText?: string; // New text for draft submission
  cancelText?: string;
  
  // Service type for styling
  serviceType?: 'catering' | 'photography' | 'bridal-makeup' | 'videography' | 'decoration' | 'venue';
  
  // Styling
  className?: string;
}

export default function FormNavigation({
  isFirstTab,
  isLastTab,
  loading,
  onPrevious,
  onNext,
  onSubmit,
  onSubmitDraft, // New prop
  onCancel,
  nextText = 'Next',
  previousText = 'Previous',
  submitText = 'Submit for Approval',
  submitDraftText = 'Save as Draft', // New prop
  cancelText = 'Cancel',
  serviceType = 'catering',
  className = ''
}: FormNavigationProps) {
  return (
    <div className={`mt-8 flex justify-between items-center ${className}`}>
      {/* Previous Button */}
      <div>
        {!isFirstTab && (
          <SubmitButton
            action="previous"
            onClick={onPrevious}
            disabled={loading}
            previousText={previousText}
            className="flex items-center space-x-2"
          />
        )}
      </div>
      
      {/* Right Side Buttons */}
      <div className="flex space-x-4">
        {/* Cancel Button */}
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-3"
        >
          {cancelText}
        </Button>
        
        {/* Next/Submit Button */}
        {isLastTab ? (
          <div className="flex space-x-3">
            {/* Save as Draft Button */}
            <SubmitButton
              action="create"
              loading={loading}
              onClick={onSubmitDraft || onSubmit} // Use onSubmitDraft if provided, otherwise fallback to onSubmit
              createText={submitDraftText}
              serviceType={serviceType}
              variant="outline"
              className="px-6 border-pink-600 text-pink-600 hover:bg-pink-50"
            />
            {/* Submit for Approval Button */}
            <SubmitButton
              action="create"
              loading={loading}
              onClick={onSubmit}
              createText={submitText}
              serviceType={serviceType}
              className="px-6"
            />
          </div>
        ) : (
          <SubmitButton
            action="next"
            onClick={onNext}
            disabled={loading}
            nextText={nextText}
            serviceType={serviceType}
            className="flex items-center space-x-2"
          />
        )}
      </div>
    </div>
  );
}
