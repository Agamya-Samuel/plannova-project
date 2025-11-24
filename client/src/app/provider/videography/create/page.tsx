'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Video, 
  ArrowLeft, 
  Plus, 
  X, 
  MapPin,
  Phone,
  Save,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Info,
  Image as ImageIcon,
  Package,
  ShieldCheck
} from 'lucide-react';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { ImageUpload } from '@/components/upload';
import type { VenueImageWithUpload } from '@/types/upload';
import StateCitySelect from '@/components/ui/StateCitySelect';
import 'react-phone-number-input/style.css';
import { isValidPhoneNumber } from 'react-phone-number-input';
import ContactInput from '@/components/ui/ContactInput';
import PolicyInput from '@/components/ui/PolicyInput';
import { PaymentMethodSelector } from '@/components/provider/PaymentMethodSelector';
import { normalizePhoneNumber } from '@/lib/utils';

interface VideographyFormData {
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
  videographyTypes: string[];
  packages: Array<{
    name: string;
    description: string;
    includes: string[];
    duration: string;
    price: number;
    isPopular: boolean;
  }>;
  addons: Array<{
    name: string;
    description: string;
    price: number;
  }>;
  basePrice: number;
  minGuests: number;
  cancellationPolicy: string;
  paymentTerms: string;
  images: Array<{ url: string; alt: string; isPrimary: boolean }>;
  paymentMethod: 'ONLINE_CASH' | 'CASH';
}

const initialFormData: VideographyFormData = {
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
  videographyTypes: [],
  packages: [{
    name: '',
    description: '',
    includes: [''],
    duration: '',
    price: 0,
    isPopular: false
  }],
  addons: [],
  basePrice: 0,
  minGuests: 0,
  cancellationPolicy: '',
  paymentTerms: '',
  images: [],
  paymentMethod: 'ONLINE_CASH'
};

const videographyTypeOptions = [
  'Wedding Videography',
  'Pre-event Videography',
  'Post-event Videography',
  'Corporate Videography',
  'Event Videography',
  'Documentary Videography',
  'Music Video',
  'Commercial Videography',
  'Drone Videography',
  'Live Streaming'
];

// Note: Removed unused 'states' list to satisfy linter and keep file concise

export default function CreateVideographyServicePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState<VideographyFormData>({
    ...initialFormData,
    contact: {
      ...initialFormData.contact,
      email: user?.email || ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['basic']));
  // Use ref instead of state for synchronous updates to prevent double-click issue
  const isExplicitSubmitRef = useRef(false);

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

  // Auto-fill phone number from user profile if available and not already set
  // Normalize to E.164 format for react-phone-number-input
  React.useEffect(() => {
    if (user?.phone && !formData.contact.phone) {
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
  }, [user?.phone, formData.contact.phone]);

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Info },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'images', label: 'Images', icon: ImageIcon },
    { id: 'services', label: 'Services', icon: Video },
    { id: 'packages', label: 'Packages', icon: Package },
    { id: 'policies', label: 'Policies', icon: ShieldCheck },
    { id: 'review', label: 'Review', icon: Save }
  ];

  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === tabs.length - 1;

  if (!user || user.role !== 'PROVIDER' || !user.serviceCategories?.includes('videography')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <div className="mx-auto bg-gradient-to-br from-purple-100 to-blue-100 rounded-full p-4 w-24 h-24 flex items-center justify-center mb-6">
            <Video className="h-12 w-12 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You must be logged in as a videography provider to access this page.
          </p>
          <Button 
            onClick={() => router.push('/auth/login')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            Login
          </Button>
        </div>
      </div>
    );
  }

  const validateCurrentTab = () => {
    const validationErrors: string[] = [];
    
    switch (activeTab) {
      case 'basic':
        if (!formData.name.trim()) validationErrors.push('Service name is required');
        if (!formData.description.trim()) validationErrors.push('Description is required');
        if (formData.description.length < 10) validationErrors.push('Description must be at least 10 characters');
        if (formData.basePrice <= 0) validationErrors.push('Base price must be greater than 0');
        break;
      case 'location':
        if (!formData.serviceLocation.address.trim()) validationErrors.push('Address is required');
        if (!formData.serviceLocation.city.trim()) validationErrors.push('City is required');
        if (!formData.serviceLocation.state.trim()) validationErrors.push('State is required');
        if (!formData.serviceLocation.pincode.trim()) validationErrors.push('Pincode is required');
        break;
      case 'contact':
        if (!formData.contact.phone.trim()) {
          validationErrors.push('Phone number is required');
        } else if (!isValidPhoneNumber(formData.contact.phone)) {
          validationErrors.push('Please enter a valid phone number');
        }
        if (formData.contact.whatsapp.trim() && !isValidPhoneNumber(formData.contact.whatsapp)) {
          validationErrors.push('Please enter a valid WhatsApp number');
        }
        if (!formData.contact.email.trim()) validationErrors.push('Email is required');
        break;
      case 'images':
        if (formData.images.length === 0) validationErrors.push('At least one image is required');
        break;
      case 'services':
        if (formData.videographyTypes.length === 0) validationErrors.push('At least one videography type is required');
        break;
      case 'packages':
        if (formData.packages.length === 0) validationErrors.push('At least one package is required');
        formData.packages.forEach((pkg, index) => {
          if (!pkg.name.trim()) validationErrors.push(`Package ${index + 1} name is required`);
          if (pkg.price <= 0) validationErrors.push(`Package ${index + 1} price must be greater than 0`);
        });
        break;
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return false;
    }
    
    setError('');
    return true;
  };

  const goToNextTab = () => {
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

  const isTabCompleted = (tabId: string) => {
    if (!visitedTabs.has(tabId)) return false;
    
    switch (tabId) {
      case 'basic':
        return !!(formData.name.trim() && 
               formData.description.trim() && 
               formData.description.length >= 10 &&
               formData.basePrice > 0);
      case 'location':
        return !!(formData.serviceLocation.address.trim() && 
               formData.serviceLocation.city.trim() && 
               formData.serviceLocation.state.trim() && 
               formData.serviceLocation.pincode.trim());
      case 'contact':
        return !!(formData.contact.phone.trim() && 
               formData.contact.email.trim() && 
               formData.contact.email.includes('@'));
      case 'images':
        return formData.images.length > 0;
      case 'services':
        return formData.videographyTypes.length > 0;
      case 'packages':
        return formData.packages.length > 0 && 
               formData.packages.every(pkg => pkg.name.trim() && pkg.price > 0);
      case 'policies':
        return true; // Policies are optional
      case 'review':
        return false; // Never mark review as completed until final submission
      default:
        return false;
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    // Handle nested fields (e.g., 'serviceLocation.state', 'contact.phone')
    if (field.includes('.')) {
      const keys = field.split('.');
      setFormData(prev => {
        const newState = { ...prev };
        // Use Record<string, unknown> for type-safe dynamic property access
        // This allows navigating through nested objects while maintaining type safety
        let current: Record<string, unknown> = newState;
        
        // Navigate to the nested object
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]] as Record<string, unknown>;
        }
        
        // Set the final value
        current[keys[keys.length - 1]] = value;
        
        return newState;
      });
    } else {
      // Handle top-level fields
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  // Removed unused handleNestedInputChange to satisfy linter

  const handleVideographyTypeChange = (type: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      videographyTypes: checked 
        ? [...prev.videographyTypes, type]
        : prev.videographyTypes.filter(t => t !== type)
    }));
  };

  const addPackage = () => {
    setFormData(prev => ({
      ...prev,
      packages: [...prev.packages, {
        name: '',
        description: '',
        includes: [''],
        duration: '',
        price: 0,
        isPopular: false
      }]
    }));
  };

  const removePackage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.filter((_, i) => i !== index)
    }));
  };

  const updatePackage = (index: number, field: string, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.map((pkg, i) => 
        i === index ? { ...pkg, [field]: value } : pkg
      )
    }));
  };

  const updatePackageIncludes = (packageIndex: number, includeIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.map((pkg, i) => 
        i === packageIndex 
          ? {
              ...pkg,
              includes: pkg.includes.map((include, j) => 
                j === includeIndex ? value : include
              )
            }
          : pkg
      )
    }));
  };

  const addPackageInclude = (packageIndex: number) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.map((pkg, i) => 
        i === packageIndex 
          ? { ...pkg, includes: [...pkg.includes, ''] }
          : pkg
      )
    }));
  };

  const removePackageInclude = (packageIndex: number, includeIndex: number) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.map((pkg, i) => 
        i === packageIndex 
          ? {
              ...pkg,
              includes: pkg.includes.filter((_, j) => j !== includeIndex)
            }
          : pkg
      )
    }));
  };



  const handleImagesChange = (newImages: VenueImageWithUpload[]) => {
    const formattedImages = newImages.map(({ url, alt, isPrimary }) => ({ url, alt, isPrimary }));
    setFormData(prev => ({ ...prev, images: formattedImages }));
  };

  const handleManualSubmit = (status: 'DRAFT' | 'PENDING' = 'DRAFT') => {
    // Set ref synchronously to prevent double-click issue
    isExplicitSubmitRef.current = true;
    // Create a synthetic event and call handleSubmit directly with the status
    const event = new Event('submit') as unknown as React.FormEvent;
    handleSubmit(event, status);
  };

  const handleSubmit = async (e: React.FormEvent, status: 'DRAFT' | 'PENDING' = 'DRAFT') => {
    e.preventDefault();
    
    // Use ref for synchronous check to prevent double-click issue
    if (!isExplicitSubmitRef.current) {
      return;
    }

    if (!validateCurrentTab()) {
      toast.error('Please complete all required fields before submitting');
      return;
    }

      setLoading(true);
      
    try {
      const submitData = {
        name: formData.name,
        description: formData.description,
        serviceLocation: formData.serviceLocation,
        contact: formData.contact,
        videographyTypes: formData.videographyTypes,
        packages: formData.packages,
        addons: formData.addons,
        basePrice: formData.basePrice,
        minGuests: formData.minGuests,
        cancellationPolicy: formData.cancellationPolicy,
        paymentTerms: formData.paymentTerms,
        images: formData.images,
        paymentMethod: formData.paymentMethod
      };

      const response = await apiClient.post('/videography', { ...submitData, status });
      
      // Save payment configuration
      // Use the correct endpoint without service ID - it uses serviceType in the body
      if (response.data?.data?._id) {
        try {
          await apiClient.post('/vendor-service-config', {
            serviceType: 'videography',
            paymentMode: formData.paymentMethod
          });
        } catch (configError) {
          console.error('Failed to save payment configuration:', configError);
        }
      }
      
      toast.success('Videography service created successfully!');
      router.push('/provider/videography');
    } catch (error: unknown) {
      console.error('Error creating videography service:', error);
      const errorMessage = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to create videography service';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      isExplicitSubmitRef.current = false;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center space-x-4 mb-4">
                <Button
                  variant="outline"
              onClick={() => router.push('/provider/videography')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">Create Videography Service</h1>
                  <p className="text-gray-600 text-lg">Set up your videography service profile</p>
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
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
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
                  const isCompleted = isTabCompleted(tab.id);
                  const canAccess = isCompleted || isCurrent || index <= currentTabIndex + 1;
                  
                  return (
                    <div key={tab.id} className="flex flex-col items-center space-y-2">
                      <button
                        onClick={() => {
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
                            ? 'bg-purple-600 text-white shadow-lg'
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
                          ? 'text-purple-600 font-medium' 
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
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>
                  
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Name *
                  </label>
                    <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your videography service name"
                      required
                      className="text-black"
                  />
                </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe your videography services, style, and what makes you unique"
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black placeholder-gray-400"
                      required
                      minLength={10}
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
                    Base Price (₹) *
                  </label>
                      <Input
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => handleInputChange('basePrice', parseFloat(e.target.value) || 0)}
                    placeholder="Enter starting price"
                    min="0"
                        required
                        className="text-black"
                  />
              </div>

                    <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Guests
                </label>
                      <Input
                  type="number"
                  value={formData.minGuests}
                  onChange={(e) => handleInputChange('minGuests', parseInt(e.target.value) || 0)}
                  placeholder="Minimum number of guests"
                  min="0"
                        className="text-black"
                />
              </div>
            </div>
            
            {/* Payment Method Selector */}
            <div className="mt-8">
              <PaymentMethodSelector 
                value={formData.paymentMethod}
                onChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
              />
            </div>
                </div>
              )}

              {/* Location Tab */}
              {activeTab === 'location' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Location</h2>
                    <p className="text-gray-600 mb-6">Where do you provide your services? This helps customers find you in their area.</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <Input
                      type="text"
                      value={formData.serviceLocation.address}
                      onChange={(e) => handleInputChange('serviceLocation.address', e.target.value)}
                      placeholder="Enter your service address"
                      required
                      className="text-black"
                    />
                    <p className="text-xs text-gray-500 mt-1">This can be your kitchen location or main service area</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* State and City selection using @countrystatecity package */}
                    <StateCitySelect
                      selectedState={formData.serviceLocation.state}
                      selectedCity={formData.serviceLocation.city}
                      onStateChange={(stateName) => handleInputChange('serviceLocation.state', stateName)}
                      onCityChange={(cityName) => handleInputChange('serviceLocation.city', cityName)}
                      stateLabel="State *"
                      cityLabel="City *"
                      required={true}
                    />
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pincode *
                      </label>
                      <Input
                        type="text"
                        value={formData.serviceLocation.pincode}
                        onChange={(e) => handleInputChange('serviceLocation.pincode', e.target.value)}
                        placeholder="Enter pincode"
                        required
                        className="text-black"
                      />
                    </div>
                  </div>
                </div>
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Portfolio Images</h2>
                  
                  <ImageUpload
                    uploadType="videography"
                    maxFiles={10}
                    images={formData.images.map(img => ({ 
                      ...img, 
                      key: img.url, 
                      uploadStatus: 'success' as const, 
                      category: 'gallery' as const 
                    }))}
                    onImagesChange={handleImagesChange}
                    showImagePreview={true}
                    allowPrimarySelection={true}
                  />
                  
                  {/* Image Upload Tips */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Image Upload Tips:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Upload high-quality images of your videography work and equipment</li>
                      <li>• Include screenshots from your videos and behind-the-scenes photos</li>
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Videography Types</h2>
                  <p className="text-gray-600 mb-6">Select the types of videography services you offer</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {videographyTypeOptions.map((type) => (
                          <button
                        key={type}
                            type="button"
                        onClick={() => handleVideographyTypeChange(type, !formData.videographyTypes.includes(type))}
                        className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                          formData.videographyTypes.includes(type) 
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 border-transparent text-white shadow-lg' 
                            : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-purple-300 hover:shadow-md'
                        }`}
                      >
                        {type}
                          </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Packages Tab */}
              {activeTab === 'packages' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Packages & Pricing</h2>
                    <Button
                      type="button"
                      onClick={addPackage}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Package
                    </Button>
                  </div>

                  {formData.packages.map((pkg, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Package {index + 1}</h3>
                        {formData.packages.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removePackage(index)}
                            className="text-red-600 hover:text-red-700"
                            variant="outline"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Package Name *
                          </label>
                          <Input
                            type="text"
                            value={pkg.name}
                            onChange={(e) => updatePackage(index, 'name', e.target.value)}
                            placeholder="Enter package name"
                            className="text-black"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price (₹) *
                          </label>
                          <Input
                            type="number"
                            value={pkg.price}
                            onChange={(e) => updatePackage(index, 'price', parseFloat(e.target.value) || 0)}
                            placeholder="Enter package price"
                            min="0"
                            className="text-black"
                          />
                        </div>
                      </div>

                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={pkg.description}
                          onChange={(e) => updatePackage(index, 'description', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black placeholder-gray-400"
                          placeholder="Describe what's included in this package"
                        />
                      </div>

                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration
                        </label>
                        <Input
                          type="text"
                          value={pkg.duration}
                          onChange={(e) => updatePackage(index, 'duration', e.target.value)}
                          placeholder="e.g., 8 hours, Full day, etc."
                          className="text-black"
                        />
                      </div>

                      <div className="mt-6">
                        <div className="flex justify-between items-center mb-4">
                          <label className="block text-sm font-medium text-gray-700">
                            What&apos;s Included
                          </label>
                          <Button
                            type="button"
                            onClick={() => addPackageInclude(index)}
                            className="text-purple-600 hover:text-purple-700"
                            variant="outline"
                            size="sm"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Item
                          </Button>
                        </div>
                        {pkg.includes.map((include, includeIndex) => (
                          <div key={includeIndex} className="flex items-center space-x-2 mb-2">
                            <Input
                              type="text"
                              value={include}
                              onChange={(e) => updatePackageIncludes(index, includeIndex, e.target.value)}
                              className="flex-1 text-black"
                              placeholder="Enter what's included"
                            />
                            {pkg.includes.length > 1 && (
                              <Button
                                type="button"
                                onClick={() => removePackageInclude(index, includeIndex)}
                                className="text-red-600 hover:text-red-700"
                                variant="outline"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="mt-6">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pkg.isPopular}
                            onChange={(e) => updatePackage(index, 'isPopular', e.target.checked)}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm text-gray-700">Mark as Popular Package</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Policies Tab */}
              {activeTab === 'policies' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Policies</h2>
                  
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
                      <li>• Review videography types and packages</li>
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
                        <p><span className="font-medium">Base Price:</span> ₹{formData.basePrice?.toLocaleString() || '0'}</p>
                        <p><span className="font-medium">Minimum Guests:</span> {formData.minGuests || 'Not specified'}</p>
                        <p><span className="font-medium">Payment Method:</span> {formData.paymentMethod === 'ONLINE_CASH' ? 'Online + Cash Payment' : 'Cash Payment Only'}</p>
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
                          <span className="font-medium">Videography Types:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {formData.videographyTypes.length > 0 ? (
                              formData.videographyTypes.map((type, index) => (
                                <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                                  {type}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500">None selected</span>
                            )}
                          </div>
                        </div>
                        <p><span className="font-medium">Packages:</span> {formData.packages.length} package(s) configured</p>
                        <p><span className="font-medium">Add-ons:</span> {formData.addons.length} service(s) added</p>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <h3 className="font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-300">Media & Policies</h3>
                      <div className="space-y-2 text-sm text-gray-700">
                        <p><span className="font-medium">Images Uploaded:</span> {formData.images.length} image(s)</p>
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
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex justify-between items-center">
                <div>
                  {!isFirstTab && (
              <Button
                type="button"
                variant="outline"
                      onClick={goToPreviousTab}
                      className="flex items-center space-x-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Previous</span>
                    </Button>
                  )}
                </div>
                
                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/provider/videography')}
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
                        className="border-pink-600 text-pink-600 hover:bg-pink-50 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600"></div>
                            <span>Saving...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Save className="h-4 w-4" />
                            <span>Save as Draft</span>
                          </div>
                        )}
                      </Button>
                      {/* Submit for Approval Button */}
                      <Button 
                        type="button" 
                        disabled={loading}
                        onClick={() => handleManualSubmit('PENDING')}
                        className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white px-6 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <Button
                      type="button"
                      onClick={goToNextTab}
                      className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white flex items-center space-x-2"
                    >
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
