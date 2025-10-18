'use client';

import { useState, useCallback } from 'react';
import { isValidPhoneNumber } from 'react-phone-number-input';

interface ValidationErrors {
  [key: string]: string[];
}

interface FormData {
  name?: string;
  description?: string;
  basePrice?: number | null;
  serviceLocation?: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  contact?: {
    phone?: string;
    whatsapp?: string;
    email?: string;
  };
  images?: Array<unknown>;
}

interface UseFormValidationProps {
  formData: FormData;
  activeTab: string;
}

export function useFormValidation({ formData, activeTab }: UseFormValidationProps) {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateCurrentTab = useCallback(() => {
    const validationErrors: string[] = [];

    switch (activeTab) {
      case 'basic':
        if (!formData.name) validationErrors.push('Service name is required');
        if (!formData.description) validationErrors.push('Description is required');
        if (formData.description && typeof formData.description === 'string' && formData.description.length < 10) {
          validationErrors.push('Description must be at least 10 characters');
        }
        if (formData.description && typeof formData.description === 'string' && formData.description.length > 2000) {
          validationErrors.push('Description must not exceed 2000 characters');
        }
        if (formData.basePrice !== undefined && formData.basePrice !== null && formData.basePrice <= 0) {
          validationErrors.push('Base price must be greater than 0');
        }
        break;

      case 'location':
        if (!formData.serviceLocation?.address) validationErrors.push('Address is required');
        if (!formData.serviceLocation?.city) validationErrors.push('City is required');
        if (!formData.serviceLocation?.state) validationErrors.push('State is required');
        if (!formData.serviceLocation?.pincode) validationErrors.push('Pincode is required');
        break;

      case 'contact':
        if (!formData.contact?.phone) validationErrors.push('Phone number is required');
        if (formData.contact?.phone && typeof formData.contact.phone === 'string' && !isValidPhoneNumber(formData.contact.phone)) {
          validationErrors.push('Please enter a valid phone number');
        }
        if (formData.contact?.whatsapp && typeof formData.contact.whatsapp === 'string' && !isValidPhoneNumber(formData.contact.whatsapp)) {
          validationErrors.push('Please enter a valid WhatsApp number');
        }
        if (!formData.contact?.email) validationErrors.push('Email address is required');
        if (formData.contact?.email && typeof formData.contact.email === 'string' && !formData.contact.email.includes('@')) {
          validationErrors.push('Please enter a valid email address');
        }
        break;

      case 'images':
        if (Array.isArray(formData.images) && formData.images.length === 0) validationErrors.push('At least one image is required');
        break;

      default:
        break;
    }

    setErrors(prev => ({
      ...prev,
      [activeTab]: validationErrors
    }));

    return validationErrors.length === 0;
  }, [activeTab, formData]);

  const isTabCompleted = useCallback((tabId: string) => {
    switch (tabId) {
      case 'basic':
        return !!(
          formData.name &&
          formData.description &&
          typeof formData.description === 'string' &&
          formData.description.length >= 10 &&
          formData.description.length <= 2000 &&
          (formData.basePrice === undefined || formData.basePrice === null || formData.basePrice > 0)
        );

      case 'location':
        return !!(
          formData.serviceLocation?.address &&
          formData.serviceLocation?.city &&
          formData.serviceLocation?.state &&
          formData.serviceLocation?.pincode
        );

      case 'contact':
        return !!(
          formData.contact?.phone &&
          formData.contact?.email &&
          typeof formData.contact.email === 'string' &&
          formData.contact.email.includes('@') &&
          typeof formData.contact.phone === 'string' &&
          isValidPhoneNumber(formData.contact.phone) &&
          (!formData.contact.whatsapp || (typeof formData.contact.whatsapp === 'string' && isValidPhoneNumber(formData.contact.whatsapp)))
        );

      case 'images':
        return Array.isArray(formData.images) && formData.images.length > 0;

      default:
        return true;
    }
  }, [formData]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validateCurrentTab,
    isTabCompleted,
    clearErrors
  };
}
