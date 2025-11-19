'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MapPin, 
  Users, 
  DollarSign, 
  Upload, 
  Plus, 
  Trash2, 
  Save,
  ArrowLeft,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react';
import apiClient from '@/lib/api';
import { ImageUpload } from '@/components/upload';
import VenueContactInput from '@/components/ui/VenueContactInput';
import VenuePolicyInput from '@/components/ui/VenuePolicyInput';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { VENUE_TYPES } from '@/constants/venueTypes';
import { PaymentMethodSelector } from '@/components/provider/PaymentMethodSelector';

interface VenueFormData {
  name: string;
  description: string;
  type: string;
  address: {
    street: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
    landmark: string;
  };
  contact: {
    phone: string;
    email: string;
    whatsapp: string;
    website: string;
  };
  capacity: {
    min: number;
    max: number;
  };
  basePrice: number;
  pricePerGuest: number;
  advancePayment: number;
  cancellationPolicy: string;
  images: Array<{ url: string; alt: string; category: string; isPrimary: boolean }>;
  amenities: Array<{ name: string; description: string; included: boolean; additionalCost: number }>;
  features: string[];
  foodOptions: Array<{ name: string; description: string; price: number; cuisine: string[]; isVeg: boolean; servingSize: string }>;
  decorationOptions: Array<{ name: string; description: string; price: number; theme: string; includes: string[]; duration: string }>;
  addonServices: Array<{ name: string; description: string; price: number; category: string; includes: string[]; duration: string }>;
  paymentMethod: 'ONLINE_CASH' | 'CASH';
}

// Use shared venue types constant to ensure consistency across the application
const venueTypes = VENUE_TYPES;

const states = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Puducherry'
];

const commonFeatures = [
  'Air Conditioning', 'WiFi', 'Parking', 'Sound System', 'Stage', 'Dance Floor',
  'Bridal Room', 'Catering Kitchen', 'Bar', 'Generator Backup', 'Security',
  'Elevator', 'Wheelchair Accessible', 'Garden Area', 'Swimming Pool'
];

const cuisineTypes = [
  'North Indian', 'South Indian', 'Gujarati', 'Punjabi', 'Bengali', 'Rajasthani',
  'Chinese', 'Continental', 'Italian', 'Mexican', 'Thai', 'Japanese'
];

export default function CreateVenuePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [venueId, setVenueId] = useState<string | null>(null);
  const [isExplicitSubmit, setIsExplicitSubmit] = useState(false);
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['basic']));

  const [formData, setFormData] = useState<VenueFormData>({
    name: '',
    description: '',
    type: '',
    address: {
      street: '',
      area: '',
      city: '',
      state: '',
      pincode: '',
      landmark: ''
    },
    contact: {
      phone: '',
      email: user?.email || '',
      whatsapp: '',
      website: ''
    },
    capacity: {
      min: 50,
      max: 500
    },
    basePrice: 50000,
    pricePerGuest: 0,
    advancePayment: 25,
    cancellationPolicy: 'Cancellation allowed up to 30 days before the event with 50% refund. No refund for cancellations within 30 days of the event.',
    images: [],
    amenities: [],
    features: [],
    foodOptions: [],
    decorationOptions: [],
    addonServices: [],
    paymentMethod: 'ONLINE_CASH'
  });

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

  const handleInputChange = (field: string, value: string | number | boolean) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof VenueFormData] as Record<string, unknown>),
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

  const addFeature = (feature: string) => {
    if (!formData.features.includes(feature)) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, feature]
      }));
    }
  };

  const removeFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }));
  };

  const addAmenity = () => {
    setFormData(prev => ({
      ...prev,
      amenities: [...prev.amenities, { name: '', description: '', included: true, additionalCost: 0 }]
    }));
  };

  const updateAmenity = (index: number, field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.map((amenity, i) => 
        i === index ? { ...amenity, [field]: value } : amenity
      )
    }));
  };

  const removeAmenity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter((_, i) => i !== index)
    }));
  };

  const addFoodOption = () => {
    setFormData(prev => ({
      ...prev,
      foodOptions: [...prev.foodOptions, { 
        name: '', 
        description: '', 
        price: 0, 
        cuisine: [], 
        isVeg: true, 
        servingSize: '' 
      }]
    }));
  };

  const updateFoodOption = (index: number, field: string, value: string | number | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      foodOptions: prev.foodOptions.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  const removeFoodOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      foodOptions: prev.foodOptions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent, status: 'DRAFT' | 'PENDING' = 'DRAFT') => {
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
        type: formData.type || '',
        address: {
          street: formData.address.street?.trim() || '',
          area: formData.address.area?.trim() || '',
          city: formData.address.city?.trim() || '',
          state: formData.address.state || '',
          pincode: formData.address.pincode?.trim() || '',
          landmark: formData.address.landmark?.trim() || ''
        },
        contact: {
          phone: formData.contact.phone?.trim() || '',
          email: formData.contact.email?.trim() || '',
          whatsapp: formData.contact.whatsapp?.trim() || '',
          website: formData.contact.website?.trim() || ''
        },
        capacity: {
          min: parseInt(String(formData.capacity.min)) || 0,
          max: parseInt(String(formData.capacity.max)) || 0
        },
        basePrice: parseFloat(String(formData.basePrice)) || 0,
        pricePerGuest: parseFloat(String(formData.pricePerGuest)) || 0,
        advancePayment: parseFloat(String(formData.advancePayment)) || 0,
        cancellationPolicy: formData.cancellationPolicy?.trim() || '',
        images: Array.isArray(formData.images) ? formData.images : [],
        amenities: Array.isArray(formData.amenities) ? formData.amenities : [],
        features: Array.isArray(formData.features) ? formData.features : [],
        foodOptions: Array.isArray(formData.foodOptions) ? formData.foodOptions : []
      };
      
      console.log('Submitting cleaned form data:', cleanFormData);
      console.log('Full API endpoint:', `${apiClient.defaults.baseURL}/venues`);

      const response = await apiClient.post('/venues', { ...cleanFormData, status });
      
      // Save payment configuration
      if (response.data.venue?._id) {
        try {
          await apiClient.post(`/vendor-service-config/${response.data.venue._id}`, {
            serviceType: 'venues',
            paymentMode: formData.paymentMethod
          });
        } catch (configError) {
          console.error('Failed to save payment configuration:', configError);
        }
        setVenueId(response.data.venue._id);
      }
      
      // Always redirect to venues list
      router.push('/provider/venues');
    } catch (err: unknown) {
      console.error('Error creating venue:', err);
      
      // Type guard for axios error
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { errors?: Array<{ msg: string }>; error?: string }; status?: number } };
        console.error('Error response:', axiosError.response?.data);
        
        if (axiosError.response?.data?.errors) {
          // Handle validation errors
          const validationErrors = axiosError.response.data.errors.map((error) => error.msg).join(', ');
          setError(`Validation errors: ${validationErrors}`);
        } else if (axiosError.response?.data?.error) {
          setError(axiosError.response.data.error);
        } else if (axiosError.response?.status === 500) {
          setError('Server error occurred. Please check all required fields and try again.');
          setActiveTab('basic'); // Go back to review data
        } else {
          setError('Failed to create venue. Please check all required fields and try again.');
        }
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(`Failed to create venue: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (status: 'DRAFT' | 'PENDING' = 'DRAFT') => {
    console.log('Manual submit button clicked with status:', status);
    setIsExplicitSubmit(true);
    // Create a synthetic event and call handleSubmit directly with the status
    const event = new Event('submit') as unknown as React.FormEvent;
    handleSubmit(event, status);
  };

  if (user?.role !== 'PROVIDER') {
    return <div>Access denied. Provider access required.</div>;
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: MapPin },
    { id: 'contact', label: 'Contact', icon: MapPin },
    { id: 'images', label: 'Images', icon: Upload },
    { id: 'features', label: 'Features', icon: Users },
    { id: 'food', label: 'Food Options', icon: DollarSign },
    { id: 'review', label: 'Review & Submit', icon: Save }
  ];

  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === tabs.length - 1;

  const goToNextTab = () => {
    // Validate current tab before proceeding
    if (!validateCurrentTab()) {
      return; // Don't proceed if validation fails
    }
    
    if (!isLastTab) {
      const nextTab = tabs[currentTabIndex + 1];
      setActiveTab(nextTab.id);
      setVisitedTabs(prev => new Set([...prev, nextTab.id]));
    }
  };

  const goToPreviousTab = () => {
    setError(''); // Clear any errors when going back
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
               formData.type && 
               formData.description && 
               formData.description.length >= 10 &&
               formData.description.length <= 2000 &&
               formData.address.street && 
               formData.address.area && 
               formData.address.city && 
               formData.address.state && 
               formData.address.pincode && 
               formData.capacity.min > 0 && 
               formData.capacity.max > 0 && 
               formData.capacity.max >= formData.capacity.min &&
               formData.basePrice > 0 && 
               formData.advancePayment > 0 && 
               formData.advancePayment <= 100 &&
               formData.cancellationPolicy);
      case 'contact':
        return !!(formData.contact.phone && 
               formData.contact.email && 
               formData.contact.email.includes('@') &&
               isValidPhoneNumber(formData.contact.phone) &&
               (!formData.contact.whatsapp || isValidPhoneNumber(formData.contact.whatsapp)));
      case 'images':
        return formData.images.length > 0;
      case 'features':
        return true; // If visited, consider it completed (optional section)
      case 'food':
        return true; // If visited, consider it completed (optional section)
      case 'review':
        return false; // Never mark review as completed until final submission
      default:
        return false;
    }
  };

  // Helper function to validate current tab before proceeding
  const validateCurrentTab = () => {
    const currentTab = activeTab;
    const validationErrors: string[] = [];

    switch (currentTab) {
      case 'basic':
        if (!formData.name) validationErrors.push('Venue name is required');
        if (!formData.type) validationErrors.push('Venue type is required');
        if (!formData.description) validationErrors.push('Description is required');
        if (formData.description && formData.description.length < 10) validationErrors.push('Description must be at least 10 characters');
        if (formData.description && formData.description.length > 2000) validationErrors.push('Description must not exceed 2000 characters');
        if (!formData.address.street) validationErrors.push('Street address is required');
        if (!formData.address.area) validationErrors.push('Area is required');
        if (!formData.address.city) validationErrors.push('City is required');
        if (!formData.address.state) validationErrors.push('State is required');
        if (!formData.address.pincode) validationErrors.push('Pincode is required');
        if (formData.capacity.min <= 0) validationErrors.push('Minimum capacity must be greater than 0');
        if (formData.capacity.max <= 0) validationErrors.push('Maximum capacity must be greater than 0');
        if (formData.capacity.max < formData.capacity.min) validationErrors.push('Maximum capacity must be greater than or equal to minimum capacity');
        if (formData.basePrice <= 0) validationErrors.push('Base price must be greater than 0');
        if (formData.advancePayment <= 0) validationErrors.push('Advance payment percentage is required');
        if (formData.advancePayment > 100) validationErrors.push('Advance payment cannot exceed 100%');
        if (!formData.cancellationPolicy) validationErrors.push('Cancellation policy is required');
        break;
      case 'contact':
        if (!formData.contact.phone) validationErrors.push('Phone number is required');
        if (formData.contact.phone && !isValidPhoneNumber(formData.contact.phone)) validationErrors.push('Please enter a valid phone number');
        if (formData.contact.whatsapp && !isValidPhoneNumber(formData.contact.whatsapp)) validationErrors.push('Please enter a valid WhatsApp number');
        if (!formData.contact.email) validationErrors.push('Email address is required');
        if (formData.contact.email && !formData.contact.email.includes('@')) validationErrors.push('Please enter a valid email address');
        break;
      case 'images':
        if (formData.images.length === 0) validationErrors.push('At least one image is required');
        break;
      case 'features':
        // Features section is optional - no validation errors
        break;
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return false;
    }
    
    setError(''); // Clear any existing errors
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
                  <h1 className="text-4xl font-bold text-gray-900">Create New Venue</h1>
                  <p className="text-gray-600 text-lg">Add your event venue to our platform</p>
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
                {tabs.map((tab) => {
                  const isCompleted = isTabCompleted(tab.id);
                  const isCurrent = activeTab === tab.id;
                  const canAccess = isCompleted || isCurrent;
                  
                  return (
                    <div key={tab.id} className="flex flex-col items-center space-y-2">
                      <button
                        onClick={() => {
                          if (canAccess) {
                            setActiveTab(tab.id);
                            setVisitedTabs(prev => new Set([...prev, tab.id]));
                            setError(''); // Clear errors when navigating
                          }
                        }}
                        disabled={!canAccess}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm transition-all duration-200 ${
                          isCurrent
                            ? 'bg-pink-600 text-white shadow-lg'
                            : isCompleted
                            ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <tab.icon className="h-5 w-5" />
                        )}
                      </button>
                      <span className={`text-xs text-center max-w-16 leading-tight ${
                        isCurrent ? 'text-pink-600 font-medium' :
                        isCompleted ? 'text-green-600 font-medium' : 'text-gray-400'
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Venue Name *
                      </label>
                      <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter venue name"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Venue Type *
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900"
                        required
                      >
                        <option value="" className="text-gray-900">Select venue type</option>
                        {venueTypes.map(type => (
                          <option key={type} value={type} className="text-gray-900">{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe your venue..."
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
                        Street Address *
                      </label>
                      <Input
                        type="text"
                        value={formData.address.street}
                        onChange={(e) => handleInputChange('address.street', e.target.value)}
                        placeholder="Enter street address"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Area *
                      </label>
                      <Input
                        type="text"
                        value={formData.address.area}
                        onChange={(e) => handleInputChange('address.area', e.target.value)}
                        placeholder="Enter area/locality"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <Input
                        type="text"
                        value={formData.address.city}
                        onChange={(e) => handleInputChange('address.city', e.target.value)}
                        placeholder="Enter city"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State *
                      </label>
                      <select
                        value={formData.address.state}
                        onChange={(e) => handleInputChange('address.state', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900"
                        required
                      >
                        <option value="" className="text-gray-900">Select state</option>
                        {states.map(state => (
                          <option key={state} value={state} className="text-gray-900">{state}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pincode *
                      </label>
                      <Input
                        type="text"
                        value={formData.address.pincode}
                        onChange={(e) => handleInputChange('address.pincode', e.target.value)}
                        placeholder="Enter pincode"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Landmark (Optional)
                    </label>
                    <Input
                      type="text"
                      value={formData.address.landmark}
                      onChange={(e) => handleInputChange('address.landmark', e.target.value)}
                      placeholder="Enter nearby landmark"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Capacity *
                      </label>
                      <Input
                        type="number"
                        value={formData.capacity.min}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                          handleInputChange('capacity.min', value);
                        }}
                        placeholder="50"
                        min="1"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Capacity *
                      </label>
                      <Input
                        type="number"
                        value={formData.capacity.max}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                          handleInputChange('capacity.max', value);
                        }}
                        placeholder="500"
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Base Price (₹) *
                      </label>
                      <Input
                        type="number"
                        value={formData.basePrice}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                          handleInputChange('basePrice', value);
                        }}
                        placeholder="50000"
                        min="0"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price per Guest (₹)
                      </label>
                      <Input
                        type="number"
                        value={formData.pricePerGuest}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                          handleInputChange('pricePerGuest', value);
                        }}
                        placeholder="500"
                        min="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Advance Payment (%) *
                      </label>
                      <Input
                        type="number"
                        value={formData.advancePayment}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                          handleInputChange('advancePayment', value);
                        }}
                        placeholder="25"
                        min="0"
                        max="100"
                        required
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

                  <VenuePolicyInput
                    data={{ cancellationPolicy: formData.cancellationPolicy }}
                    onChange={(data) => {
                      setFormData(prev => ({
                        ...prev,
                        cancellationPolicy: data.cancellationPolicy
                      }));
                    }}
                  />
                </div>
              )}

              {/* Contact Tab */}
              {activeTab === 'contact' && (
                <VenueContactInput
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Venue Images</h2>
                  
                  {/* S3 Image Upload Component */}
                  <ImageUpload
                    uploadType="venue"
                    venueId={venueId || undefined}
                    maxFiles={20}
                    images={formData.images.map(img => ({
                      ...img,
                      key: undefined, // Will be populated after upload
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
                    onUploadProgress={() => {
                    }}
                    onUploadError={(error) => {
                      setError(`Image upload failed: ${error}`);
                    }}
                    onUploadComplete={() => {
                    }}
                    disabled={loading}
                    className=""
                  />
                  
                  {/* Image Upload Tips */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Image Upload Tips:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Upload at least 5-10 high-quality images of your venue</li>
                      <li>• Include exterior shots, interior spaces, seating arrangements, and decor</li>
                      <li>• The first image will be used as the primary image in search results</li>
                      <li>• Click the star icon to set a different image as primary</li>
                      <li>• Images are automatically optimized for web display</li>
                      <li>• Supported formats: JPEG, PNG, WebP, GIF (max 10MB each)</li>
                    </ul>
                  </div>
                </div>
              )}
              {activeTab === 'features' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Venue Features & Amenities</h2>
                  
                  {/* Common Features */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Available Features</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {commonFeatures.map(feature => (
                        <div key={feature} className="flex items-center">
                          <input
                            type="checkbox"
                            id={feature}
                            checked={formData.features.includes(feature)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                addFeature(feature);
                              } else {
                                removeFeature(feature);
                              }
                            }}
                            className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                          />
                          <label htmlFor={feature} className="ml-2 text-sm text-gray-700">
                            {feature}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Amenities */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Custom Amenities</h3>
                      <Button type="button" onClick={addAmenity} size="sm" className="bg-pink-600 hover:bg-pink-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Amenity
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {formData.amenities.map((amenity, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amenity Name
                              </label>
                              <Input
                                type="text"
                                value={amenity.name}
                                onChange={(e) => updateAmenity(index, 'name', e.target.value)}
                                placeholder="e.g., Valet Parking"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                              </label>
                              <Input
                                type="text"
                                value={amenity.description}
                                onChange={(e) => updateAmenity(index, 'description', e.target.value)}
                                placeholder="Brief description"
                              />
                            </div>
                            
                            <div className="flex items-end space-x-2">
                              <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Additional Cost (₹)
                                </label>
                                <Input
                                  type="number"
                                  value={amenity.additionalCost}
                                  onChange={(e) => updateAmenity(index, 'additionalCost', parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                  min="0"
                                  disabled={amenity.included}
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeAmenity(index)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="mt-3 flex items-center">
                            <input
                              type="checkbox"
                              id={`included-${index}`}
                              checked={amenity.included}
                              onChange={(e) => {
                                updateAmenity(index, 'included', e.target.checked);
                                if (e.target.checked) {
                                  updateAmenity(index, 'additionalCost', 0);
                                }
                              }}
                              className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                            />
                            <label htmlFor={`included-${index}`} className="ml-2 text-sm text-gray-700">
                              Included in base price
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Food Options Tab */}
              {activeTab === 'food' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Food & Catering Options</h2>
                    <Button type="button" onClick={addFoodOption} className="bg-pink-600 hover:bg-pink-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Food Option
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    {formData.foodOptions.map((option, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Menu Name
                            </label>
                            <Input
                              type="text"
                              value={option.name}
                              onChange={(e) => updateFoodOption(index, 'name', e.target.value)}
                              placeholder="e.g., Royal Wedding Menu"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Price per Person (₹)
                            </label>
                            <Input
                              type="number"
                              value={option.price}
                              onChange={(e) => updateFoodOption(index, 'price', parseFloat(e.target.value) || 0)}
                              placeholder="500"
                              min="0"
                            />
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <textarea
                            value={option.description}
                            onChange={(e) => updateFoodOption(index, 'description', e.target.value)}
                            placeholder="Describe the menu items and offerings..."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-black placeholder-gray-400"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Serving Size
                            </label>
                            <Input
                              type="text"
                              value={option.servingSize}
                              onChange={(e) => updateFoodOption(index, 'servingSize', e.target.value)}
                              placeholder="e.g., Per person, Family pack"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Cuisine Types
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {cuisineTypes.map(cuisine => (
                                <label key={cuisine} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={option.cuisine.includes(cuisine)}
                                    onChange={(e) => {
                                      const currentCuisines = [...option.cuisine];
                                      if (e.target.checked) {
                                        currentCuisines.push(cuisine);
                                      } else {
                                        const index = currentCuisines.indexOf(cuisine);
                                        if (index > -1) currentCuisines.splice(index, 1);
                                      }
                                      updateFoodOption(index, 'cuisine', currentCuisines);
                                    }}
                                    className="rounded border-gray-300 text-pink-600 focus:ring-pink-500 mr-1"
                                  />
                                  <span className="text-xs text-gray-700">{cuisine}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={option.isVeg}
                                onChange={(e) => updateFoodOption(index, 'isVeg', e.target.checked)}
                                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Vegetarian</span>
                            </label>
                          </div>
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeFoodOption(index)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {formData.foodOptions.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No food options added yet. Click &quot;Add Food Option&quot; to get started.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Review & Submit Tab */}
              {activeTab === 'review' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Venue Details</h2>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-medium text-black mb-2">Please review all information before submitting:</h4>
                    <ul className="text-sm text-black space-y-1">
                      <li>• Ensure all required fields are completed</li>
                      <li>• Verify contact information is accurate</li>
                      <li>• Check that images represent your venue well</li>
                      <li>• Review pricing and policies carefully</li>
                    </ul>
                  </div>
                  
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-black mb-2">Basic Information</h3>
                      <p className="text-black"><strong>Name:</strong> {formData.name}</p>
                      <p className="text-black"><strong>Type:</strong> {formData.type}</p>
                      <p className="text-black"><strong>Capacity:</strong> {formData.capacity.min} - {formData.capacity.max} guests</p>
                      <p className="text-black"><strong>Base Price:</strong> ₹{formData.basePrice.toLocaleString()}</p>
                      <p className="text-black"><strong>Payment Method:</strong> {formData.paymentMethod === 'ONLINE_CASH' ? 'Online + Cash Payment' : 'Cash Payment Only'}</p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-black mb-2">Contact & Location</h3>
                      <p className="text-black"><strong>Phone:</strong> {formData.contact.phone}</p>
                      <p className="text-black"><strong>Email:</strong> {formData.contact.email}</p>
                      <p className="text-black"><strong>Address:</strong> {formData.address.city}, {formData.address.state}</p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-black mb-2">Images</h3>
                      <p className="text-black">{formData.images.length} image(s) uploaded</p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-black mb-2">Features & Food</h3>
                      <p className="text-black"><strong>Features:</strong> {formData.features.length} selected</p>
                      <p className="text-black"><strong>Food Options:</strong> {formData.foodOptions.length} added</p>
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
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                  
                  {isLastTab ? (
                    <>
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
                    </>
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