'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { 
  Utensils, 
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Star,
  MapPin,
  Phone,
  Upload,
  DollarSign,
  Check,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { ImageUpload } from '../../../../components/upload';
import apiClient from '../../../../lib/api';
import LocationInput from '@/components/ui/LocationInput';
import { toast } from 'sonner';
import { normalizePhoneNumber } from '../../../../lib/utils';
import { PaymentMethodSelector } from '../../../../components/provider/PaymentMethodSelector';

interface CateringService {
  _id: string;
  name: string;
  description: string;
  serviceLocation: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  contact: {
    phone: string;
    whatsapp: string;
    email: string;
  };
  images: Array<{ url: string; alt: string; category: string; isPrimary: boolean }>;
  cuisineTypes: string[];
  serviceTypes: string[];
  dietaryOptions: string[];
  addons: Array<{ name: string; description: string; price: number }>;
  basePrice: number;
  minGuests?: number;
  cancellationPolicy?: string;
  paymentTerms?: string;
  // Add payment method field
  paymentMethod?: 'CASH' | 'ONLINE_CASH';
}

// Create a separate component for the main content that uses useSearchParams
function EditCateringServiceContent() {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('id') || '';
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  // Use ref instead of state for synchronous updates to prevent double-click issue
  const isExplicitSubmitRef = useRef(false);
  const [formData, setFormData] = useState<Omit<CateringService, '_id'> & { _id?: string }>({
    name: '',
    description: '',
    serviceLocation: {
      address: '',
      city: '',
      state: '',
      pincode: ''
    },
    contact: {
      phone: '',
      whatsapp: '',
      email: ''
    },
    images: [],
    cuisineTypes: [],
    serviceTypes: [],
    dietaryOptions: [],
    addons: [],
    basePrice: 0,
    minGuests: 20,
    cancellationPolicy: '',
    paymentTerms: ''
  });

  // Fetch catering service data
  useEffect(() => {
    const fetchService = async () => {
      if (!serviceId) {
        setError('Service ID is required');
        setFetching(false);
        return;
      }

      try {
        setFetching(true);
        const response = await apiClient.get(`/catering/${serviceId}`);
        const service: CateringService = response.data.data;
        
        // Fetch payment method configuration
        let paymentMethod: 'CASH' | 'ONLINE_CASH' = 'ONLINE_CASH';
        try {
          const paymentConfigResponse = await apiClient.get(`/vendor-service-config/catering`);
          paymentMethod = paymentConfigResponse.data.paymentMode || 'ONLINE_CASH';
        } catch (error) {
          console.log('No payment configuration found, using default', error);
        }
        
        setFormData({
          name: service.name,
          description: service.description,
          serviceLocation: service.serviceLocation,
          contact: service.contact,
          images: service.images || [],
          cuisineTypes: service.cuisineTypes || [],
          serviceTypes: service.serviceTypes || [],
          dietaryOptions: service.dietaryOptions || [],
          addons: service.addons || [],
          basePrice: service.basePrice,
          minGuests: service.minGuests,
          cancellationPolicy: service.cancellationPolicy,
          paymentTerms: service.paymentTerms,
          paymentMethod: paymentMethod
        });
      } catch (err: unknown) {
        console.error('Error fetching catering service:', err);
        setError('Failed to load catering service details');
      } finally {
        setFetching(false);
      }
    };

    if (serviceId) {
      fetchService();
    } else {
      setFetching(false);
    }
  }, [serviceId]);

  // Auto-fill phone number from user profile if available and not already set in form data
  // Normalize to E.164 format for react-phone-number-input
  useEffect(() => {
    if (user?.phone && !formData.contact.phone && !fetching) {
      const normalizedPhone = normalizePhoneNumber(user.phone);
      if (normalizedPhone) {
        setFormData(prev => ({
          ...prev,
          contact: {
            ...prev.contact,
            phone: normalizedPhone
          }
        }));
      }
    }
  }, [user?.phone, formData.contact.phone, fetching]);

  const handleInputChange = (field: string, value: string | number | boolean | string[]) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof formData] as Record<string, unknown>),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const toggleCuisineType = (cuisine: string) => {
    setFormData(prev => {
      const currentCuisines = [...prev.cuisineTypes];
      const index = currentCuisines.indexOf(cuisine);
      
      if (index > -1) {
        currentCuisines.splice(index, 1);
      } else {
        currentCuisines.push(cuisine);
      }
      
      return {
        ...prev,
        cuisineTypes: currentCuisines
      };
    });
  };

  const toggleServiceType = (service: string) => {
    setFormData(prev => {
      const currentServices = [...prev.serviceTypes];
      const index = currentServices.indexOf(service);
      
      if (index > -1) {
        currentServices.splice(index, 1);
      } else {
        currentServices.push(service);
      }
      
      return {
        ...prev,
        serviceTypes: currentServices
      };
    });
  };

  const toggleDietaryOption = (option: string) => {
    setFormData(prev => {
      const currentOptions = [...prev.dietaryOptions];
      const index = currentOptions.indexOf(option);
      
      if (index > -1) {
        currentOptions.splice(index, 1);
      } else {
        currentOptions.push(option);
      }
      
      return {
        ...prev,
        dietaryOptions: currentOptions
      };
    });
  };

  const addAddon = () => {
    setFormData(prev => ({
      ...prev,
      addons: [...prev.addons, { name: '', description: '', price: 0 }]
    }));
  };

  const updateAddon = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      addons: prev.addons.map((addon, i) => 
        i === index ? { ...addon, [field]: value } : addon
      )
    }));
  };

  const removeAddon = (index: number) => {
    setFormData(prev => ({
      ...prev,
      addons: prev.addons.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent, status: 'DRAFT' | 'PENDING' = 'DRAFT') => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only allow submission if it's an explicit submit action
    // Use ref for synchronous check to prevent double-click issue
    if (!isExplicitSubmitRef.current) {
      return;
    }
    
    // Reset the explicit submit flag
    isExplicitSubmitRef.current = false;
    
    // Only allow submission from the review tab
    if (activeTab !== 'review') {
      setError('Please navigate to the Review & Submit tab to submit the form');
      return;
    }
    
    if (!validateCurrentTab()) {
      setError('Please complete all required fields before submitting');
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare data for submission
      const cleanFormData = {
        name: formData.name?.trim() || '',
        description: formData.description?.trim() || '',
        serviceLocation: {
          address: formData.serviceLocation.address?.trim() || '',
          city: formData.serviceLocation.city?.trim() || '',
          state: formData.serviceLocation.state || '',
          pincode: formData.serviceLocation.pincode?.trim() || ''
        },
        contact: {
          phone: formData.contact.phone?.trim() || '',
          whatsapp: formData.contact.whatsapp?.trim() || '',
          email: formData.contact.email?.trim() || ''
        },
        images: Array.isArray(formData.images) ? formData.images : [],
        cuisineTypes: Array.isArray(formData.cuisineTypes) ? formData.cuisineTypes : [],
        serviceTypes: Array.isArray(formData.serviceTypes) ? formData.serviceTypes : [],
        dietaryOptions: Array.isArray(formData.dietaryOptions) ? formData.dietaryOptions : [],
        addons: Array.isArray(formData.addons) ? formData.addons : [],
        basePrice: formData.basePrice || 0,
        minGuests: formData.minGuests || 20,
        cancellationPolicy: formData.cancellationPolicy || '',
        paymentTerms: formData.paymentTerms || ''
      };
      
      // Send data to the backend API
      const response = await apiClient.put(`/catering/${serviceId}`, { ...cleanFormData, status });
      
      console.log('Catering service updated successfully:', response.data);
      
      // Save payment method configuration
      if (formData.paymentMethod) {
        try {
          await apiClient.post('/vendor-service-config', {
            serviceType: 'catering',
            paymentMode: formData.paymentMethod
          });
          console.log('Payment method configuration saved successfully');
        } catch (paymentError) {
          console.error('Error saving payment method configuration:', paymentError);
          // Don't fail the whole process if payment config fails
        }
      }
      
      // Redirect back to service view
      router.push(`/provider/catering/${serviceId}`);
    } catch (err: unknown) {
      console.error('Error updating catering service:', err);
      
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        setError(axiosError.response?.data?.error || 'Failed to update catering service');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`Failed to update catering service: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const validateCurrentTab = () => {
    const validationErrors: string[] = [];

    switch (activeTab) {
      case 'basic':
        if (!formData.name) validationErrors.push('Service name is required');
        if (!formData.description) validationErrors.push('Description is required');
        if (formData.description && formData.description.length < 10) validationErrors.push('Description must be at least 10 characters');
        if (formData.basePrice <= 0) validationErrors.push('Base price must be greater than 0');
        break;
      case 'location':
        if (!formData.serviceLocation.address) validationErrors.push('Address is required');
        if (!formData.serviceLocation.city) validationErrors.push('City is required');
        if (!formData.serviceLocation.state) validationErrors.push('State is required');
        if (!formData.serviceLocation.pincode) validationErrors.push('Pincode is required');
        break;
      case 'contact':
        if (!formData.contact.phone) validationErrors.push('Phone number is required');
        if (!formData.contact.email) validationErrors.push('Email is required');
        if (formData.contact.email && !formData.contact.email.includes('@')) validationErrors.push('Please enter a valid email address');
        break;
      case 'images':
        if (formData.images.length === 0) validationErrors.push('At least one image is required');
        break;
      case 'services':
        if (formData.cuisineTypes.length === 0) validationErrors.push('Please select at least one cuisine type');
        if (formData.serviceTypes.length === 0) validationErrors.push('Please select at least one service type');
        break;
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return false;
    }
    
    setError('');
    return true;
  };

  const isTabCompleted = (tabId: string) => {
    switch (tabId) {
      case 'basic':
        return !!(formData.name && formData.description && formData.description.length >= 10 && formData.basePrice > 0);
      case 'location':
        return !!(formData.serviceLocation.address && formData.serviceLocation.city && formData.serviceLocation.state && formData.serviceLocation.pincode);
      case 'contact':
        return !!(formData.contact.phone && formData.contact.email && formData.contact.email.includes('@'));
      case 'images':
        return formData.images.length > 0;
      case 'services':
        return formData.cuisineTypes.length > 0 && formData.serviceTypes.length > 0;
      case 'policies':
        return true; // Optional section
      case 'review':
        return true; // Review section
      default:
        return false;
    }
  };

  const goToNextTab = () => {
    if (!validateCurrentTab()) {
      return;
    }
    if (!isLastTab) {
      setActiveTab(tabs[currentTabIndex + 1].id);
    }
  };

  const goToPreviousTab = () => {
    setError('');
    if (!isFirstTab) {
      setActiveTab(tabs[currentTabIndex - 1].id);
    }
  };

  const handleManualSubmit = (status: 'DRAFT' | 'PENDING' = 'DRAFT') => {
    // Set ref synchronously to prevent double-click issue
    isExplicitSubmitRef.current = true;
    // Create a synthetic event and call handleSubmit directly with the status
    const event = new Event('submit') as unknown as React.FormEvent;
    handleSubmit(event, status);
  };

  const handleDeleteService = async () => {
    if (!serviceId) return;
    
    // Get service name for confirmation
    const serviceName = formData.name || 'this service';
    
    // Confirm deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete "${serviceName}"? This action will move the service to the trash where it can be restored later.`
    );
    
    if (!confirmed) return;
    
    try {
      setLoading(true);
      await apiClient.delete(`/catering/${serviceId}`);
      
      // Show success message
      toast.success('Service moved to trash successfully');
      
      // Redirect to services list after successful deletion
      router.push('/provider/catering');
      router.refresh(); // Refresh the page to update the list
    } catch (err: unknown) {
      console.error('Error deleting catering service:', err);
      setError('Failed to delete catering service');
      toast.error('Failed to delete catering service');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'PROVIDER' || !user.serviceCategories?.includes('catering')) {
    return <div>Access denied. Please select catering as your service category.</div>;
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Info },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'images', label: 'Images', icon: Upload },
    { id: 'services', label: 'Services', icon: Utensils },
    { id: 'policies', label: 'Policies', icon: DollarSign },
    { id: 'review', label: 'Review', icon: Save }
  ];

  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === tabs.length - 1;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">Edit Catering Service</h1>
                <p className="text-gray-600">Update your catering service details</p>
              </div>
              <Button 
                onClick={handleDeleteService}
                disabled={loading}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Service
              </Button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Progress</h3>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentTabIndex + 1) / tabs.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {currentTabIndex + 1} of {tabs.length}
                  </span>
                </div>
              </div>
              
              {/* Step Indicators */}
              <div className="flex justify-between">
                {tabs.map((tab) => {
                  const isCompleted = isTabCompleted(tab.id);
                  const isCurrent = activeTab === tab.id;
                  
                  return (
                    <div key={tab.id} className="flex flex-col items-center space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.id);
                          setError('');
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm transition-all duration-200 ${
                          isCurrent
                            ? 'bg-pink-600 text-white shadow-lg'
                            : isCompleted
                            ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300 cursor-pointer'
                        }`}
                      >
                        {isCompleted && !isCurrent ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <tab.icon className="h-5 w-5" />
                        )}
                      </button>
                      <span className={`text-xs text-center max-w-16 leading-tight ${
                        isCurrent ? 'text-pink-600 font-medium' : 
                        isCompleted ? 'text-green-600 font-medium' : 'text-gray-600'
                      }`}>
                        {tab.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-xl shadow-lg p-8">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Catering Service Name *
                      </label>
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter your catering service name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Describe your catering service..."
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-black placeholder-gray-400"
                        required
                        minLength={10}
                        maxLength={2000}
                      />
                      <div className="flex justify-between text-sm text-black mt-1">
                        <span>Minimum 10 characters required</span>
                        <span className={`${formData.description.length > 2000 ? 'text-red-600 font-medium' : 'text-black'}`}>
                          {formData.description.length}/2000
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Base Price per Plate (₹) *
                        </label>
                        <Input
                          type="number"
                          value={formData.basePrice || 0}
                          onChange={(e) => handleInputChange('basePrice', parseFloat(e.target.value) || 0)}
                          placeholder="1500"
                          min="0"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">This is your starting price per plate</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum Guests Required
                        </label>
                        <Input
                          type="number"
                          value={formData.minGuests || 20}
                          onChange={(e) => handleInputChange('minGuests', parseInt(e.target.value) || 20)}
                          placeholder="20"
                          min="1"
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimum number of guests for this package</p>
                      </div>
                    </div>
                    
                    {/* Payment Method Selector */}
                    <div className="mt-8">
                      <PaymentMethodSelector 
                        value={formData.paymentMethod || 'ONLINE_CASH'}
                        onChange={(value) => handleInputChange('paymentMethod', value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Location Tab */}
              {activeTab === 'location' && (
                <div className="space-y-6">
                  <LocationInput
                    data={formData.serviceLocation}
                    onChange={(data) => setFormData(prev => ({ ...prev, serviceLocation: data }))}
                  />
                </div>
              )}

              {/* Contact Tab */}
              {activeTab === 'contact' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <Input
                        type="tel"
                        value={formData.contact.phone}
                        onChange={(e) => handleInputChange('contact.phone', e.target.value)}
                        placeholder="+91 9876543210"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        WhatsApp Number
                      </label>
                      <Input
                        type="tel"
                        value={formData.contact.whatsapp}
                        onChange={(e) => handleInputChange('contact.whatsapp', e.target.value)}
                        placeholder="+91 9876543210"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <Input
                        type="email"
                        value={formData.contact.email}
                        onChange={(e) => handleInputChange('contact.email', e.target.value)}
                        placeholder="catering@example.com"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Images Tab */}
              {activeTab === 'images' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Images</h2>
                  
                  <ImageUpload
                    uploadType="catering"
                    maxFiles={20}
                    images={formData.images.map(img => ({
                      ...img,
                      key: undefined,
                      uploadStatus: 'success' as const,
                      category: img.category as 'gallery' | 'food' | 'main' | 'room' | 'decoration' | 'amenity'
                    }))}
                    onImagesChange={(images) => {
                      setFormData(prev => ({
                        ...prev,
                        images: images.map(img => ({
                          url: img.url,
                          alt: img.alt,
                          category: img.category as 'gallery' | 'food' | 'main' | 'room' | 'decoration' | 'amenity',
                          isPrimary: img.isPrimary
                        }))
                      }));
                    }}
                    onUploadStart={() => {
                      setError('');
                    }}
                    onUploadError={(error) => {
                      setError(`Image upload failed: ${error}`);
                    }}
                    disabled={loading}
                    className=""
                  />
                  
                  {/* Image Upload Tips */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Image Upload Tips:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Upload high-quality images of your food, service setup, and team</li>
                      <li>• Include images of different cuisines and presentation styles</li>
                      <li>• The first image will be used as the primary image in search results</li>
                      <li>• Click the star icon to set a different image as primary</li>
                      <li>• Images are automatically optimized for web display</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Services Tab */}
              {activeTab === 'services' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Details</h2>
                
                <div className="space-y-8">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Utensils className="h-5 w-5 text-pink-600 mr-2" />
                      Cuisine Types
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">Select the types of cuisine your service offers</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {cuisineTypes.map(cuisine => (
                        <button
                          key={cuisine}
                          type="button"
                          onClick={() => toggleCuisineType(cuisine)}
                          className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                            formData.cuisineTypes.includes(cuisine) 
                              ? 'bg-gradient-to-r from-pink-500 to-purple-500 border-transparent text-white shadow-lg' 
                              : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-pink-300 hover:shadow-md'
                          }`}
                        >
                          {cuisine}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Utensils className="h-5 w-5 text-blue-600 mr-2" />
                      Available Service Types
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">Choose the types of events you cater to</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {serviceTypes.map(service => (
                        <button
                          key={service}
                          type="button"
                          onClick={() => toggleServiceType(service)}
                          className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                            formData.serviceTypes.includes(service) 
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 border-transparent text-white shadow-lg' 
                              : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-md'
                          }`}
                        >
                          {service}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Star className="h-5 w-5 text-green-600 mr-2" />
                      Dietary Options
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">Select the dietary accommodations you provide</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {dietaryOptions.map(option => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => toggleDietaryOption(option)}
                          className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                            formData.dietaryOptions.includes(option) 
                              ? 'bg-gradient-to-r from-green-500 to-teal-500 border-transparent text-white shadow-lg' 
                              : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-green-300 hover:shadow-md'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                          <Plus className="h-6 w-6 text-pink-600 mr-2" />
                          Add-on Services
                        </h3>
                        <p className="mt-1 text-gray-600">Offer complementary services that enhance your main package</p>
                      </div>
                      <Button type="button" onClick={addAddon} className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Addon
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {formData.addons.length > 0 ? (
                        formData.addons.map((addon, index) => (
                          <div key={`addon-${index}`} className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Addon Name
                                </label>
                                <Input
                                  type="text"
                                  value={addon.name}
                                  onChange={(e) => updateAddon(index, 'name', e.target.value)}
                                  placeholder="e.g., Live Cooking Station"
                                  className="border-2 focus:border-pink-300"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Price (₹)
                                </label>
                                <Input
                                  type="number"
                                  value={addon.price}
                                  onChange={(e) => updateAddon(index, 'price', parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                  min="0"
                                  className="border-2 focus:border-pink-300"
                                />
                              </div>
                              
                              <div className="flex items-end">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeAddon(index)}
                                  className="text-red-600 hover:bg-red-50 border-2 border-red-200 w-full"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </Button>
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                              </label>
                              <textarea
                                value={addon.description}
                                onChange={(e) => updateAddon(index, 'description', e.target.value)}
                                placeholder="Describe this addon service..."
                                rows={2}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-black placeholder-gray-400"
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200">
                          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plus className="h-8 w-8 text-pink-600" />
                          </div>
                          <h4 className="font-medium text-gray-900 mb-2">No Addons Added</h4>
                          <p className="text-gray-600 mb-4 max-w-md mx-auto">
                            Enhance your catering package by offering additional services like live cooking stations, 
                            specialty desserts, or premium beverage services.
                          </p>
                          <Button type="button" onClick={addAddon} className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Addon
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                </div>
              )}

              {/* Policies Tab */}
              {activeTab === 'policies' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Policies</h2>
                  <p className="text-gray-600 mb-6">Set your cancellation and payment policies</p>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cancellation Policy
                    </label>
                    <textarea
                      value={formData.cancellationPolicy || ''}
                      onChange={(e) => handleInputChange('cancellationPolicy', e.target.value)}
                      placeholder="Describe your cancellation policy..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-black placeholder-gray-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Terms
                    </label>
                    <textarea
                      value={formData.paymentTerms || ''}
                      onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                      placeholder="Describe your payment terms (e.g., 50% advance, balance before event)..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-black placeholder-gray-400"
                    />
                  </div>
                </div>
              )}

              {/* Review Tab */}
              {activeTab === 'review' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Service Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-black">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Basic Information</h3>
                      <p><strong>Service Name:</strong> <span className="text-gray-600">{formData.name}</span></p>
                      <p><strong>Description:</strong> <span className="text-gray-600">{formData.description}</span></p>
                      <p><strong>Base Price:</strong> <span className="text-gray-600">₹{formData.basePrice} per plate</span></p>
                      <p><strong>Min Guests:</strong> <span className="text-gray-600">{formData.minGuests}</span></p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Location & Contact</h3>
                      <p><strong>Address:</strong> <span className="text-gray-600">{formData.serviceLocation.address}, {formData.serviceLocation.city}, {formData.serviceLocation.state} - {formData.serviceLocation.pincode}</span></p>
                      <p><strong>Phone:</strong> <span className="text-gray-600">{formData.contact.phone}</span></p>
                      <p><strong>Email:</strong> <span className="text-gray-600">{formData.contact.email}</span></p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Images & Services</h3>
                      <p><strong>Images:</strong> <span className="text-gray-600">{formData.images.length} image(s) uploaded</span></p>
                      <p><strong>Cuisines:</strong> <span className="text-gray-600">{formData.cuisineTypes.join(', ')}</span></p>
                      <p><strong>Service Types:</strong> <span className="text-gray-600">{formData.serviceTypes.join(', ')}</span></p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Additional Details</h3>
                      <p><strong>Dietary Options:</strong> <span className="text-gray-600">{formData.dietaryOptions.join(', ') || 'None'}</span></p>
                      <p><strong>Add-ons:</strong> <span className="text-gray-600">{formData.addons.length} addon(s) configured</span></p>
                      {/* Payment Method Information */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p><strong>Payment Options:</strong> 
                          <span className={`ml-2 font-medium ${formData.paymentMethod === 'CASH' ? 'text-blue-600' : 'text-green-600'}`}>
                            {formData.paymentMethod === 'CASH' ? 'Cash Payment Only' : 'Online + Cash Payment'}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.paymentMethod === 'CASH' 
                            ? 'Customers can only pay in cash directly to the service provider' 
                            : 'Customers can choose to pay online through Razorpay or in cash'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-200">
                <div>
                  {!isFirstTab && (
                    <Button type="button" variant="outline" onClick={goToPreviousTab} className="flex items-center space-x-2">
                      <ChevronLeft className="h-4 w-4" />
                      <span>Previous</span>
                    </Button>
                  )}
                </div>
                
                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/provider/catering')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  
                  {isLastTab ? (
                    <div className="flex space-x-3">
                      {/* Save as Draft Button */}
                      <Button 
                        type="button" 
                        variant="outline" 
                        disabled={loading}
                        onClick={() => handleManualSubmit('DRAFT')}
                        className="border-pink-600 text-pink-600 hover:bg-pink-50 px-6"
                      >
                        {loading ? 'Saving...' : 'Save as Draft'}
                      </Button>
                      {/* Submit for Approval Button */}
                      <Button 
                        type="button" 
                        disabled={loading}
                        onClick={() => handleManualSubmit('PENDING')}
                        className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-6"
                      >
                        {loading ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Submitting...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Save className="h-4 w-4" />
                            <span>Submit for Approval</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <Button type="button" onClick={goToNextTab} className="bg-gradient-to-r from-pink-600 to-purple-600">
                      <span>Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}

// Export the main component wrapped in Suspense
export default function EditCateringServicePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    }>
      <EditCateringServiceContent />
    </Suspense>
  );
}

// Note: Removed unused 'states' list to satisfy linter and keep file concise

const cuisineTypes = [
  'North Indian', 'South Indian', 'Gujarati', 'Punjabi', 'Bengali', 'Rajasthani',
  'Chinese', 'Continental', 'Italian', 'Mexican', 'Thai', 'Japanese',
  'Mughlai', 'Hyderabadi', 'Kerala', 'Tamil', 'Maharashtrian'
];

const serviceTypes = [
  'Wedding Catering', 'Corporate Events', 'Birthday Parties', 
  'Anniversary Celebrations', 'Social Gatherings', 'Buffet Service',
  'Plated Service', 'Cocktail Parties', 'Festivals & Religious Events'
];

const dietaryOptions = [
  'Vegetarian', 'Non-Vegetarian', 'Vegan', 'Gluten-Free', 
  'Dairy-Free', 'Nut-Free', 'Halal', 'Kosher'
];