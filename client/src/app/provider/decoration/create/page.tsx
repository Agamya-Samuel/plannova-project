'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
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
import { ImageUpload } from '@/components/upload';
import type { VenueImageWithUpload } from '@/types/upload';
import LocationInput from '@/components/ui/LocationInput';
import 'react-phone-number-input/style.css';
import { isValidPhoneNumber } from 'react-phone-number-input';
import ContactInput from '@/components/ui/ContactInput';
import PolicyInput from '@/components/ui/PolicyInput';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

// Define the structure of the form data
interface DecorationFormData {
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
  basePrice: number;
  cancellationPolicy: string;
  paymentTerms: string;
  decorationTypes: string[];
  packages: Array<PackageFormData>;
  addons: Array<AddonFormData>;
  images: Array<{ url: string; alt: string; isPrimary: boolean; category: string }>;
}

interface PackageFormData {
  name: string;
  description: string;
  includes: string[];
  duration: string;
  price: number;
  isPopular: boolean;
}

interface AddonFormData {
  name: string;
  description: string;
  price: number;
}

// States list removed to satisfy linter
const decorationTypeOptions = [
  'Wedding Decoration',
  'Birthday Party',
  'Corporate Events',
  'Anniversary',
  'Baby Shower',
  'Engagement',
  'Reception',
  'Pre-event',
  'Festival Decoration',
  'Theme Parties'
];

const tabs = [
  { id: 'basic', label: 'Basic Info', icon: Info },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'contact', label: 'Contact', icon: Phone },
  { id: 'images', label: 'Portfolio', icon: ImageIcon },
  { id: 'services', label: 'Services', icon: Package },
  { id: 'policies', label: 'Policies', icon: ShieldCheck },
  { id: 'review', label: 'Review', icon: Save }
];

export default function CreateDecorationService() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['basic']));
  const [isExplicitSubmit, setIsExplicitSubmit] = useState(false);

  const [formData, setFormData] = useState<DecorationFormData>({
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
    basePrice: 0,
    cancellationPolicy: '',
    paymentTerms: '',
    decorationTypes: [],
    packages: [{ name: '', description: '', includes: [''], duration: '', price: 0, isPopular: false }],
    addons: [{ name: '', description: '', price: 0 }],
    images: []
  });

  // Update email when user data becomes available
  useEffect(() => {
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

  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === tabs.length - 1;

  const goToNextTab = () => {
    if (!validateCurrentTab()) {
      return;
    }
    if (!isLastTab) {
      const nextTab = tabs[currentTabIndex + 1];
      setActiveTab(nextTab.id);
      setVisitedTabs(prev => new Set(prev).add(nextTab.id));
    }
  };

  const goToPreviousTab = () => {
    if (!isFirstTab) {
      setActiveTab(tabs[currentTabIndex - 1].id);
    }
  };

  const isTabCompleted = (tabId: string) => {
    if (!visitedTabs.has(tabId)) return false;
    
    switch (tabId) {
        case 'basic':
            return !!(formData.name.trim() && formData.description.length >= 10 && formData.basePrice > 0);
        case 'location':
            return !!(formData.serviceLocation.address.trim() && formData.serviceLocation.city.trim() && formData.serviceLocation.state.trim() && formData.serviceLocation.pincode.trim());
        case 'contact':
            return !!(formData.contact.phone && formData.contact.phone.trim() && formData.contact.email && formData.contact.email.trim());
        case 'images':
            return formData.images.length > 0;
        case 'services':
            return formData.decorationTypes.length > 0 && formData.packages[0]?.name.trim() && formData.packages[0]?.price > 0;
        case 'policies':
            return true; // Policies are optional
        default:
            return false;
    }
  }

  const validateCurrentTab = () => {
    const validationErrors: string[] = [];
    switch (activeTab) {
        case 'basic':
            if (!formData.name.trim()) validationErrors.push('Service name is required');
            if (formData.description.length < 10) validationErrors.push('Description must be at least 10 characters');
            if (!formData.basePrice || formData.basePrice <= 0) validationErrors.push('Base price must be a positive number');
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
            if (formData.decorationTypes.length === 0) validationErrors.push('At least one decoration type is required');
            if (!formData.packages[0]?.name.trim()) validationErrors.push('Package name is required');
            if (!formData.packages[0]?.price || formData.packages[0]?.price <= 0) validationErrors.push('Package price is required');
            break;
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
    } else {
      setError('');
    }
    
    return validationErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isExplicitSubmit) return;
    if (!validateCurrentTab()) {
        toast.error("Please fill all required fields before submitting.");
        return;
    }
    setLoading(true);
    try {
      const serviceData = {
        ...formData,
        packages: formData.packages.map(p => ({...p, price: Number(p.price)})),
        addons: formData.addons.filter(a => a.name.trim() !== '').map(a => ({...a, price: Number(a.price)})),
        basePrice: Number(formData.basePrice)
      };
      await apiClient.post('/decoration', { ...serviceData, status: 'DRAFT' });
      toast.success('Decoration service created successfully!');
      router.push('/provider/decoration');
    } catch (err) {
      let errorMessage = 'Failed to create decoration service';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (err as { response?: { data?: { error?: string } } }).response;
        if (response?.data?.error) {
          errorMessage = response.data.error;
        }
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setIsExplicitSubmit(false);
    }
  };

  const handleManualSubmit = () => {
    setIsExplicitSubmit(true);
    const form = document.querySelector('form');
    if (form) {
      form.requestSubmit();
    }
  };

  const handleInputChange = (field: string, value: string | number | string[] | undefined) => {
    const keys = field.split('.');
    if (keys.length > 1) {
      setFormData(prev => {
        const newState: DecorationFormData = { ...prev };
        let current: DecorationFormData | DecorationFormData['serviceLocation'] | DecorationFormData['contact'] = newState;
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i] as keyof typeof current] as DecorationFormData['serviceLocation'] | DecorationFormData['contact'];
        }
        // Use a more specific type instead of any
        if (keys[keys.length - 1] in current) {
          (current as Record<string, string | number | string[] | undefined>)[keys[keys.length - 1]] = value;
        }
        return newState;
      });
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleDecorationTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      decorationTypes: prev.decorationTypes.includes(type)
        ? prev.decorationTypes.filter(t => t !== type)
        : [...prev.decorationTypes, type]
    }));
  };

  const updatePackage = (index: number, field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.map((pkg, i) => 
        i === index ? { ...pkg, [field]: value } : pkg
      )
    }));
  };

  const handleImagesChange = (newImages: VenueImageWithUpload[]) => {
    const formattedImages = newImages.map(({ url, alt, isPrimary }) => ({ url, alt, isPrimary, category: 'gallery' }));
    setFormData(prev => ({ ...prev, images: formattedImages }));
  };

  if (!user || user.role !== 'PROVIDER') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
          <div className="mx-auto bg-gradient-to-br from-pink-100 to-rose-100 rounded-full p-4 w-24 h-24 flex items-center justify-center mb-6">
            <Package className="h-12 w-12 text-pink-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You must be logged in as a provider to access this page.
          </p>
          <Button 
            onClick={() => router.push('/auth/login')}
            className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white"
          >
            Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/provider/decoration')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Create Decoration Service</h1>
                <p className="text-gray-600 text-lg">Set up your decoration service profile</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

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
              
              <div className="flex justify-between">
                {tabs.map((tab) => {
                  const isCurrent = activeTab === tab.id;
                  const isCompleted = isTabCompleted(tab.id);
                  const canAccess = isCompleted || isCurrent || visitedTabs.has(tab.id);
                  
                  return (
                    <div key={tab.id} className="flex flex-col items-center space-y-2">
                      <button
                        onClick={() => {
                          if (canAccess) {
                            setActiveTab(tab.id);
                            setError('');
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
                        {isCompleted && !isCurrent ? <Check className="h-5 w-5" /> : <tab.icon className="h-5 w-5" />}
                      </button>
                      <span className={`text-xs text-center max-w-16 leading-tight ${
                        isCurrent ? 'text-pink-600 font-medium' : isCompleted ? 'text-green-600 font-medium' : canAccess ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {tab.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-xl shadow-lg p-8">
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Name *</label>
                    <Input type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="e.g., Premium Wedding Decoration" required className="text-black" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Describe your decoration services and experience..." rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black" required minLength={10} />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Starting Price (₹) *</label>
                    <Input type="number" value={formData.basePrice} onChange={(e) => handleInputChange('basePrice', Number(e.target.value))} placeholder="e.g., 25000" min="0" required className="text-black" />
                  </div>
                </div>
              )}

              {activeTab === 'location' && (
                <LocationInput
                  data={formData.serviceLocation}
                  onChange={(data) => setFormData(prev => ({ ...prev, serviceLocation: data }))}
                />
              )}

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

              {activeTab === 'images' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Portfolio Images</h2>
                  <p className="text-gray-600 mb-4">
                    Upload your best decoration work to showcase your skills and attract clients.
                  </p>
                  <ImageUpload
                    uploadType="decoration"
                    maxFiles={10}
                    images={formData.images.map(img => ({ ...img, key: img.url, uploadStatus: 'success' as const, category: 'gallery' as const }))}
                    onImagesChange={handleImagesChange}
                    showImagePreview={true}
                    allowPrimarySelection={true}
                  />
                </div>
              )}

              {activeTab === 'services' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Services Offered</h2>
                  
                  {/* Decoration Types */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">What decoration services do you offer? *</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {decorationTypeOptions.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleDecorationTypeToggle(type)}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            formData.decorationTypes.includes(type)
                              ? 'border-pink-500 bg-pink-50 text-pink-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-pink-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{type}</span>
                            {formData.decorationTypes.includes(type) && (
                              <Check className="h-4 w-4 text-pink-500" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Basic Package */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Package Details</h3>
                    <div className="border border-gray-200 rounded-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Package Name *
                          </label>
                          <Input
                            type="text"
                            value={formData.packages[0]?.name || ''}
                            onChange={(e) => updatePackage(0, 'name', e.target.value)}
                            placeholder="e.g., Complete Wedding Package"
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price (₹) *
                          </label>
                          <Input
                            type="number"
                            value={formData.packages[0]?.price || 0}
                            onChange={(e) => updatePackage(0, 'price', parseFloat(e.target.value) || 0)}
                            placeholder="Enter package price"
                            className="w-full"
                            min="0"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          What&apos;s included? *
                        </label>
                        <textarea
                          value={formData.packages[0]?.description || ''}
                          onChange={(e) => updatePackage(0, 'description', e.target.value)}
                          placeholder="e.g., Stage decoration, entrance setup, lighting, floral arrangements..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'policies' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Policies (Optional)</h2>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-blue-800 text-sm">
                      <strong>Note:</strong> These are optional. You can add your policies later from your dashboard.
                    </p>
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

              {activeTab === 'review' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Review & Submit</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-black">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Service Details</h3>
                      <p><strong>Name:</strong> <span className="text-gray-600">{formData.name}</span></p>
                      <p><strong>Description:</strong> <span className="text-gray-600">{formData.description}</span></p>
                      <p><strong>Base Price:</strong> <span className="text-gray-600">₹{formData.basePrice.toLocaleString()}</span></p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Location & Contact</h3>
                      <p><strong>Address:</strong> <span className="text-gray-600">{formData.serviceLocation.address}, {formData.serviceLocation.city}, {formData.serviceLocation.state} - {formData.serviceLocation.pincode}</span></p>
                      <p><strong>Phone:</strong> <span className="text-gray-600">{formData.contact.phone}</span></p>
                      <p><strong>Email:</strong> <span className="text-gray-600">{formData.contact.email}</span></p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Images</h3>
                      <p><span className="text-gray-600">{formData.images.length} image(s) uploaded</span></p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Services & Packages</h3>
                      <p><strong>Decoration Types:</strong> <span className="text-gray-600">{formData.decorationTypes.join(', ')}</span></p>
                      <p><strong>Packages:</strong> <span className="text-gray-600">{formData.packages.length} package(s) configured</span></p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-between items-center">
              <div>
                {!isFirstTab && (
                  <Button type="button" variant="outline" onClick={goToPreviousTab} className="flex items-center space-x-2">
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </Button>
                )}
              </div>
              
              <div className="flex space-x-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                
                {isLastTab ? (
                  <Button type="button" disabled={loading} onClick={handleManualSubmit} className="bg-gradient-to-r from-pink-600 to-purple-600">
                    {loading ? 'Creating…' : 'Create Service'}
                  </Button>
                ) : (
                  <Button type="button" onClick={goToNextTab} className="bg-gradient-to-r from-pink-600 to-purple-600">
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
