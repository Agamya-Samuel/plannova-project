'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { 
  Utensils, 
  MapPin, 
  Phone, 
  Upload, 
  Plus, 
  Trash2, 
  Save,
  ArrowLeft,
  AlertCircle,
  Check,
  Star,
  IndianRupee
} from 'lucide-react';
import apiClient from '../../../../lib/api';
import { ImageUpload } from '../../../../components/upload';
import BasicInfoInput from '../../../../components/ui/BasicInfoInput';
import LocationInput from '../../../../components/ui/LocationInput';
import ContactInput from '../../../../components/ui/ContactInput';
import PolicyInput from '../../../../components/ui/PolicyInput';
import FormNavigation from '../../../../components/ui/FormNavigation';
import { isValidPhoneNumber } from 'react-phone-number-input';

interface CateringServiceFormData {
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
}


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

export default function CreateCateringServicePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<CateringServiceFormData>({
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
      email: user?.email || ''
    },
    images: [],
    cuisineTypes: [],
    serviceTypes: [],
    dietaryOptions: [],
    addons: [],
    basePrice: 1500,
    minGuests: 20,
    cancellationPolicy: 'Cancellation allowed up to 7 days before the event with 50% refund. No refund for cancellations within 7 days of the event.',
    paymentTerms: '50% advance payment required at the time of booking. Remaining 50% to be paid 3 days before the event.'
  });
  const [isExplicitSubmit, setIsExplicitSubmit] = useState(false);
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['basic']));

  // Update email when user data becomes available
  React.useEffect(() => {
    if (user?.email && !formData.contact.email) {
      setFormData(prev => ({
        ...prev,
        contact: {
          ...prev.contact,
          email: user.email
        }
      }));
    }
  }, [user?.email, formData.contact.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only allow submission if it's an explicit submit action
    if (!isExplicitSubmit) {
      console.log('Preventing automatic form submission');
      return;
    }
    
    // Reset the explicit submit flag
    setIsExplicitSubmit(false);
    
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
      // Clean and validate form data before submission
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
      
      console.log('Submitting catering service data:', cleanFormData);
      
      // Send data to the backend API
      const response = await apiClient.post('/catering', { ...cleanFormData, status: 'DRAFT' });
      
      console.log('Catering service created successfully:', response.data);
      
      // Redirect to provider dashboard or catering services list
      router.push('/provider/catering');
    } catch (err: unknown) {
      console.error('Error creating catering service:', err);
      
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        setError(axiosError.response?.data?.error || 'Failed to create catering service');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`Failed to create catering service: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = () => {
    console.log('Manual submit button clicked');
    setIsExplicitSubmit(true);
    // Trigger form submission after setting the flag
    const form = document.querySelector('form');
    if (form) {
      form.requestSubmit();
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean | string[]) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof CateringServiceFormData] as Record<string, unknown>),
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

  if (user?.role !== 'PROVIDER') {
    return <div>Access denied. Provider access required.</div>;
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Utensils },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'images', label: 'Images', icon: Upload },
    { id: 'services', label: 'Services', icon: Utensils },
    { id: 'pricing', label: 'Pricing', icon: IndianRupee },
    { id: 'review', label: 'Review', icon: Save }
  ];

  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === tabs.length - 1;

  const goToNextTab = () => {
    // Validate current tab before proceeding
    if (!validateCurrentTab()) {
      return;
    }
    
    if (!isLastTab) {
      const nextTab = tabs[currentTabIndex + 1];
      setActiveTab(nextTab.id);
      setVisitedTabs(prev => new Set([...prev, nextTab.id]));
    }
  };

  const goToPreviousTab = () => {
    setError('');
    if (!isFirstTab) {
      setActiveTab(tabs[currentTabIndex - 1].id);
    }
  };

  // Helper function to check if a tab section is completed
  const isTabCompleted = (tabId: string) => {
    // Only consider a tab completed if it has been visited and meets completion criteria
    if (!visitedTabs.has(tabId)) return false;
    
    switch (tabId) {
      case 'basic':
        return !!(formData.name && 
               formData.description && 
               formData.description.length >= 10 &&
               formData.description.length <= 2000);
      case 'location':
        return !!(formData.serviceLocation.address && 
               formData.serviceLocation.city && 
               formData.serviceLocation.state && 
               formData.serviceLocation.pincode);
      case 'contact':
        return !!(formData.contact.phone && 
               formData.contact.email && 
               formData.contact.email.includes('@'));
      case 'images':
        return formData.images.length > 0;
      case 'services':
        return !!(formData.cuisineTypes.length > 0 && 
               formData.serviceTypes.length > 0);
      case 'pricing':
        return !!(formData.basePrice && formData.basePrice > 0);
      case 'review':
        return false; // Never mark review as completed until final submission
      default:
        return false;
    }
  };

  const validateCurrentTab = () => {
    const currentTab = activeTab;
    const validationErrors: string[] = [];

    switch (currentTab) {
      case 'basic':
        if (!formData.name) validationErrors.push('Service name is required');
        if (!formData.description) validationErrors.push('Description is required');
        if (formData.description && formData.description.length < 10) validationErrors.push('Description must be at least 10 characters');
        if (formData.description && formData.description.length > 2000) validationErrors.push('Description must not exceed 2000 characters');
        break;
      case 'location':
        if (!formData.serviceLocation.address) validationErrors.push('Address is required');
        if (!formData.serviceLocation.city) validationErrors.push('City is required');
        if (!formData.serviceLocation.state) validationErrors.push('State is required');
        if (!formData.serviceLocation.pincode) validationErrors.push('Pincode is required');
        break;
      case 'contact':
        if (!formData.contact.phone) validationErrors.push('Phone number is required');
        if (formData.contact.phone && !isValidPhoneNumber(formData.contact.phone)) validationErrors.push('Please enter a valid phone number');
        if (formData.contact.whatsapp && !isValidPhoneNumber(formData.contact.whatsapp)) validationErrors.push('Please enter a valid WhatsApp number');
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
      case 'pricing':
        if (!formData.basePrice || formData.basePrice <= 0) validationErrors.push('Base price must be greater than 0');
        break;
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return false;
    }
    
    setError('');
    return true;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center space-x-4 mb-4">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">Create Catering Service</h1>
                  <p className="text-gray-600 text-lg">Set up your catering service profile</p>
                </div>
              </div>
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
                {tabs.map((tab, index) => {
                  const isCurrent = activeTab === tab.id;
                  // Check if tab is completed
                  const isCompleted = isTabCompleted(tab.id);
                  // Allow navigation to any tab that has been visited, is completed, or is the next logical tab
                  const canAccess = isCompleted || isCurrent || index <= currentTabIndex + 1;
                  
                  return (
                    <div key={tab.id} className="flex flex-col items-center space-y-2">
                      <button
                        onClick={() => {
                          // Validate current tab before allowing navigation away
                          if (!validateCurrentTab()) {
                            return;
                          }
                          
                          if (canAccess) {
                            setActiveTab(tab.id);
                            setError('');
                            setVisitedTabs(prev => new Set([...prev, tab.id]));
                          }
                        }}
                        disabled={!canAccess}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm transition-all duration-200 ${
                          isCurrent
                            ? 'bg-pink-600 text-white shadow-lg'
                            : isCompleted
                            ? 'bg-green-500 text-white'
                            : canAccess
                            ? 'bg-gray-200 text-gray-600 hover:bg-gray-300 cursor-pointer'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <tab.icon className="h-5 w-5" />
                        )}
                      </button>
                      <span className={`text-xs text-center max-w-16 leading-tight ${
                        isCurrent 
                          ? 'text-pink-600 font-medium' 
                          : isCompleted 
                          ? 'text-green-600 font-medium' 
                          : canAccess 
                          ? 'text-gray-600' 
                          : 'text-gray-400'
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
                <BasicInfoInput
                  data={{
                    name: formData.name,
                    description: formData.description,
                    basePrice: formData.basePrice
                  }}
                  onChange={(data) => {
                    setFormData(prev => ({
                      ...prev,
                      name: data.name,
                      description: data.description,
                      basePrice: data.basePrice || prev.basePrice
                    }));
                  }}
                  serviceType="Catering"
                />
              )}

              {/* Location Tab */}
              {activeTab === 'location' && (
                <LocationInput
                  data={formData.serviceLocation}
                  onChange={(data) => {
                    setFormData(prev => ({
                      ...prev,
                      serviceLocation: data
                    }));
                  }}
                />
              )}

              {/* Contact Tab */}
              {activeTab === 'contact' && (
                <ContactInput
                  data={formData.contact}
                  onChange={(data) => {
                    setFormData(prev => ({
                      ...prev,
                      contact: data
                    }));
                  }}
                />
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
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Details</h2>
                  <p className="text-gray-600 mb-6">Define cuisine types, dietary options, and service details</p>
                  
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
                    <p className="text-xs text-gray-500 mt-3">Choose relevant service types for accurate matching</p>
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
              )}

              {/* Pricing Tab */}
              {activeTab === 'pricing' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Pricing Information</h2>
                  <p className="text-gray-600 mb-6">Set your base pricing and additional charges</p>
                  
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
                        className="text-black"
                      />
                      <p className="text-xs text-gray-500 mt-1">This is your starting price per plate - you can adjust for different packages</p>
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
                        className="text-black"
                      />
                      <p className="text-xs text-gray-500 mt-1">Minimum number of guests for this package</p>
                    </div>
                  </div>
                  
                  <PolicyInput
                    data={{
                      cancellationPolicy: formData.cancellationPolicy || '',
                      paymentTerms: formData.paymentTerms || ''
                    }}
                    onChange={(data) => {
                      setFormData(prev => ({
                        ...prev,
                        cancellationPolicy: data.cancellationPolicy,
                        paymentTerms: data.paymentTerms
                      }));
                    }}
                  />
                </div>
              )}

              {/* Review Tab */}
              {activeTab === 'review' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Service Details</h2>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Please review all information before submitting:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Ensure all required fields are completed</li>
                      <li>• Verify contact information is accurate</li>
                      <li>• Check that images represent your service well</li>
                      <li>• Review service types and cuisine options</li>
                      <li>• Confirm pricing and policy information</li>
                      <li className="font-medium">• Click the Create Service button at the bottom to submit</li>
                    </ul>
                  </div>
                  
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h3 className="font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-300">Basic Information</h3>
                      <div className="space-y-2 text-sm text-gray-700">
                        <p><span className="font-medium">Service Name:</span> {formData.name || 'Not provided'}</p>
                        <div>
                          <span className="font-medium">Description:</span> 
                          <p className="mt-1 text-gray-600">{formData.description || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h3 className="font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-300">Location & Contact</h3>
                      <div className="space-y-2 text-sm text-gray-700">
                        <p><span className="font-medium">Address:</span> {formData.serviceLocation.address || 'Not provided'}</p>
                        <p><span className="font-medium">City:</span> {formData.serviceLocation.city || 'Not provided'}</p>
                        <p><span className="font-medium">State:</span> {formData.serviceLocation.state || 'Not provided'}</p>
                        <p><span className="font-medium">Pincode:</span> {formData.serviceLocation.pincode || 'Not provided'}</p>
                        <p><span className="font-medium">Phone:</span> {formData.contact.phone || 'Not provided'}</p>
                        <p><span className="font-medium">WhatsApp:</span> {formData.contact.whatsapp || 'Not provided'}</p>
                        <p><span className="font-medium">Email:</span> {formData.contact.email || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h3 className="font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-300">Service Details</h3>
                      <div className="space-y-2 text-sm text-gray-700">
                        <div>
                          <span className="font-medium">Cuisine Types:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {formData.cuisineTypes.length > 0 ? (
                              formData.cuisineTypes.map((cuisine, index) => (
                                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                  {cuisine}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500">None selected</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Service Types:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {formData.serviceTypes.length > 0 ? (
                              formData.serviceTypes.map((service, index) => (
                                <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                                  {service}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500">None selected</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Dietary Options:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {formData.dietaryOptions.length > 0 ? (
                              formData.dietaryOptions.map((option, index) => (
                                <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                  {option}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500">None selected</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h3 className="font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-300">Pricing</h3>
                      <div className="space-y-2 text-sm text-gray-700">
                        <p><span className="font-medium">Base Price:</span> ₹{formData.basePrice?.toLocaleString() || '0'}/plate</p>
                        <p><span className="font-medium">Minimum Guests:</span> {formData.minGuests || 'Not specified'}</p>
                        <div>
                          <span className="font-medium">Cancellation Policy:</span>
                          <p className="mt-1 text-gray-600">{formData.cancellationPolicy || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="font-medium">Payment Terms:</span>
                          <p className="mt-1 text-gray-600">{formData.paymentTerms || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h3 className="font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-300">Media</h3>
                      <div className="space-y-2 text-sm text-gray-700">
                        <p><span className="font-medium">Images Uploaded:</span> {formData.images.length} image(s)</p>
                        <p><span className="font-medium">Addon Services:</span> {formData.addons.length} service(s) added</p>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h3 className="font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-300">Add-on Services</h3>
                      <div className="space-y-2 text-sm text-gray-700">
                        {formData.addons.length > 0 ? (
                          formData.addons.map((addon, index) => (
                            <div key={index} className="border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                              <p className="font-medium">{addon.name || 'Unnamed Addon'}</p>
                              <p className="text-gray-600 text-xs mt-1">{addon.description || 'No description'}</p>
                              <p className="font-medium mt-1">₹{addon.price?.toLocaleString() || '0'}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500">No add-on services added</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <FormNavigation
                isFirstTab={isFirstTab}
                isLastTab={isLastTab}
                loading={loading}
                onPrevious={goToPreviousTab}
                onNext={goToNextTab}
                onSubmit={handleManualSubmit}
                onCancel={() => router.back()}
                serviceType="catering"
              />
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}