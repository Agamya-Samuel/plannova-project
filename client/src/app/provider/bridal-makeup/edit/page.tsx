'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
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
  ShieldCheck,
} from 'lucide-react';
import { ImageUpload } from '@/components/upload';
import type { VenueImageWithUpload } from '@/types/upload';
import 'react-phone-number-input/style.css';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

// Define the structure of the form data
interface BridalMakeupFormData {
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
  minGuests: number;
  cancellationPolicy: string;
  paymentTerms: string;
  makeupTypes: string[];
  packages: Array<PackageFormData>;
  addons: Array<AddonFormData>;
  images: Array<{ url: string; alt: string; isPrimary: boolean }>;
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

const makeupTypeOptions = [
  'Bridal Makeup',
  'Engagement Makeup',
  'Reception Makeup',
  'Pre-wedding Makeup',
  'Party Makeup',
  'Traditional Makeup',
  'Contemporary Makeup',
  'Natural Makeup',
  'Glamour Makeup'
];

const states = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Puducherry'
];

export default function EditBridalMakeupService() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('id');
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['basic']));
  const [isExplicitSubmit, setIsExplicitSubmit] = useState(false);

  const [formData, setFormData] = useState<BridalMakeupFormData>({
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
    minGuests: 1,
    cancellationPolicy: '',
    paymentTerms: '',
    makeupTypes: [],
    packages: [{ name: '', description: '', includes: [''], duration: '', price: 0, isPopular: false }],
    addons: [{ name: '', description: '', price: 0 }],
    images: []
  });

  const fetchBridalMakeupService = React.useCallback(async () => {
    try {
      setFetching(true);
      const response = await apiClient.get(`/bridal-makeup/${serviceId}`);
      const service = response.data.data;
      setFormData({
        name: service.name,
        description: service.description,
        serviceLocation: service.serviceLocation,
        contact: service.contact,
        basePrice: service.basePrice,
        minGuests: service.minGuests || 1,
        cancellationPolicy: service.cancellationPolicy || '',
        paymentTerms: service.paymentTerms || '',
        makeupTypes: service.makeupTypes,
        packages: service.packages.map((p: { price: number; }) => ({...p, price: p.price})),
        addons: service.addons.map((a: { price: number; }) => ({...a, price: a.price})),
        images: service.images
      });
    } catch (err: unknown) {
      let errorMessage = 'Failed to fetch bridal makeup service';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (err as { response?: { data?: { error?: string } } }).response;
        if (response?.data?.error) {
          errorMessage = response.data.error;
        }
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setFetching(false);
    }
  }, [serviceId]);

  useEffect(() => {
    if (serviceId) {
      fetchBridalMakeupService();
    } else {
      router.push('/provider/bridal-makeup');
    }
  }, [serviceId, fetchBridalMakeupService, router]);

  const handleInputChange = (field: string, value: string | number | string[] | undefined) => {
    const keys = field.split('.');
    if (keys.length > 1) {
      setFormData(prev => {
        const newState: BridalMakeupFormData = { ...prev };
        let current: BridalMakeupFormData | BridalMakeupFormData['serviceLocation'] | BridalMakeupFormData['contact'] = newState;
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i] as keyof typeof current] as BridalMakeupFormData['serviceLocation'] | BridalMakeupFormData['contact'];
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

  const handleMakeupTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      makeupTypes: prev.makeupTypes.includes(type)
        ? prev.makeupTypes.filter(t => t !== type)
        : [...prev.makeupTypes, type]
    }));
  };

  const handleAddPackage = () => {
    setFormData(prev => ({
      ...prev,
      packages: [...prev.packages, { name: '', description: '', includes: [''], duration: '', price: 0, isPopular: false }]
    }));
  };

  const handleRemovePackage = (index: number) => {
    if (formData.packages.length > 1) {
      setFormData(prev => ({
        ...prev,
        packages: prev.packages.filter((_, i) => i !== index)
      }));
    }
  };

  const handlePackageChange = (index: number, field: keyof PackageFormData, value: string | boolean | number) => {
    const newPackages = [...formData.packages];
    // Use a more specific type instead of any
    const pkg: PackageFormData = newPackages[index];
    pkg[field] = value as never; // This is safe because we know the field and value match
    setFormData(prev => ({ ...prev, packages: newPackages }));
  };

  const handlePackageIncludesChange = (packageIndex: number, includeIndex: number, value: string) => {
    const newPackages = [...formData.packages];
    newPackages[packageIndex].includes[includeIndex] = value;
    setFormData(prev => ({ ...prev, packages: newPackages }));
  };

  const handleAddPackageInclude = (packageIndex: number) => {
    const newPackages = [...formData.packages];
    newPackages[packageIndex].includes.push('');
    setFormData(prev => ({ ...prev, packages: newPackages }));
  };

  const handleRemovePackageInclude = (packageIndex: number, includeIndex: number) => {
    const newPackages = [...formData.packages];
    if (newPackages[packageIndex].includes.length > 1) {
      newPackages[packageIndex].includes.splice(includeIndex, 1);
      setFormData(prev => ({ ...prev, packages: newPackages }));
    }
  };

  const handleImagesChange = (newImages: VenueImageWithUpload[]) => {
    const formattedImages = newImages.map(({ url, alt, isPrimary }) => ({ url, alt, isPrimary }));
    setFormData(prev => ({ ...prev, images: formattedImages }));
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Info },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'images', label: 'Portfolio', icon: ImageIcon },
    { id: 'services', label: 'Services', icon: Package },
    { id: 'policies', label: 'Policies', icon: ShieldCheck },
    { id: 'review', label: 'Review', icon: Save }
  ];

  const currentTabIndex = tabs.findIndex(tab => tab.id === activeTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === tabs.length - 1;

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
            if (formData.makeupTypes.length === 0) validationErrors.push('At least one makeup type is required');
            if (formData.packages.some(p => !p.name.trim() || !p.price || p.price <= 0)) validationErrors.push('All packages must have a name and valid price');
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
            return formData.makeupTypes.length > 0 && formData.packages.every(p => p.name.trim() && p.price > 0);
        case 'policies':
            return true; // Policies are optional
        default:
            return false;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isExplicitSubmit) return;
    if (!validateCurrentTab()) {
        toast.error("Please fill all required fields before submitting.");
        return;
    }
    setLoading(true);
    try {
      const serviceData: BridalMakeupFormData = {
        ...formData,
        packages: formData.packages.map(p => ({...p, price: Number(p.price)})),
        addons: formData.addons.filter(a => a.name.trim() !== '').map(a => ({...a, price: Number(a.price)})),
        basePrice: Number(formData.basePrice)
      };
      await apiClient.put(`/bridal-makeup/${serviceId}`, serviceData);
      toast.success('Bridal makeup service updated successfully!');
      router.push('/provider/bridal-makeup');
    } catch (err: unknown) {
      let errorMessage = 'Failed to update bridal makeup service';
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

  if (fetching) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-pink-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center space-x-4 mb-4">
                <Button variant="outline" onClick={() => router.back()} className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">Edit Bridal Makeup Service</h1>
                  <p className="text-gray-600 text-lg">Update your bridal makeup service profile</p>
                </div>
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
                    <Input type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="e.g., Premium Bridal Makeup" required className="text-black" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                    <textarea value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Describe your bridal makeup service in detail..." rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black" required minLength={10} />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Base Price (₹) *</label>
                    <Input type="number" value={formData.basePrice} onChange={(e) => handleInputChange('basePrice', Number(e.target.value))} placeholder="e.g., 15000" min="0" required className="text-black" />
                  </div>
                </div>
              )}

              {activeTab === 'location' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Location Information</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                    <Input type="text" value={formData.serviceLocation.address} onChange={(e) => handleInputChange('serviceLocation.address', e.target.value)} placeholder="Street address" required className="text-black" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                      <Input type="text" value={formData.serviceLocation.city} onChange={(e) => handleInputChange('serviceLocation.city', e.target.value)} placeholder="City" required className="text-black" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                      <select value={formData.serviceLocation.state} onChange={(e) => handleInputChange('serviceLocation.state', e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black" required>
                        <option value="">Select state</option>
                        {states.map(state => <option key={state} value={state}>{state}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pincode *</label>
                      <Input type="text" value={formData.serviceLocation.pincode} onChange={(e) => handleInputChange('serviceLocation.pincode', e.target.value)} placeholder="Pincode" required className="text-black" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'contact' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                      <PhoneInput
                        international
                        defaultCountry="IN"
                        value={formData.contact.phone}
                        onChange={(value) => handleInputChange('contact.phone', value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number</label>
                      <PhoneInput
                        international
                        defaultCountry="IN"
                        value={formData.contact.whatsapp}
                        onChange={(value) => handleInputChange('contact.whatsapp', value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <Input type="email" value={formData.contact.email} onChange={(e) => handleInputChange('contact.email', e.target.value)} placeholder="Email address" required className="text-black" />
                  </div>
                </div>
              )}

              {activeTab === 'images' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Portfolio Images</h2>
                  <ImageUpload
                    uploadType="bridal-makeup"
                    maxFiles={10}
                    images={formData.images.map(img => ({ ...img, key: img.url, uploadStatus: 'success' as const, category: 'gallery' as const }))}
                    onImagesChange={handleImagesChange}
                    showImagePreview={true}
                    allowPrimarySelection={true}
                  />
                </div>
              )}

              {activeTab === 'services' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Services & Packages</h2>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Makeup Types</h3>
                    <div className="flex flex-wrap gap-2">
                        {makeupTypeOptions.map(type => (
                            <button key={type} type="button" onClick={() => formData.makeupTypes.includes(type) ? handleMakeupTypeToggle(type) : handleMakeupTypeToggle(type)}
                                className={`px-4 py-2 rounded-full border text-sm font-medium ${formData.makeupTypes.includes(type) ? 'bg-pink-600 text-white' : 'bg-white text-gray-700'}`}>
                                {type}
                            </button>
                        ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Packages</h3>
                        <Button type="button" onClick={handleAddPackage}><Plus className="h-4 w-4 mr-2" />Add Package</Button>
                    </div>
                    <div className="space-y-4">
                        {formData.packages.map((pkg, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input placeholder="Package Name" value={pkg.name} onChange={e => handlePackageChange(index, 'name', e.target.value)} className="text-black" />
                                    <Input type="number" placeholder="Price" value={pkg.price} onChange={e => handlePackageChange(index, 'price', Number(e.target.value))} className="text-black" />
                                </div>
                                <textarea placeholder="Description" value={pkg.description} onChange={e => handlePackageChange(index, 'description', e.target.value)} className="w-full mt-4 p-2 border rounded text-black"/>
                                <Input placeholder="Duration" value={pkg.duration} onChange={e => handlePackageChange(index, 'duration', e.target.value)} className="mt-4 text-black"/>
                                <div className="mt-4">
                                    <label className="font-medium text-black">Includes:</label>
                                    {pkg.includes.map((item, i) => (
                                        <div key={i} className="flex items-center gap-2 mt-2">
                                            <Input value={item} onChange={e => handlePackageIncludesChange(index, i, e.target.value)} className="text-black" />
                                            <Button type="button" variant="destructive" size="sm" onClick={() => handleRemovePackageInclude(index, i)}>X</Button>
                                        </div>
                                    ))}
                                    <Button type="button" size="sm" onClick={() => handleAddPackageInclude(index)} className="mt-2">Add Item</Button>
                                </div>
                                <div className="flex items-center mt-4">
                                    <input type="checkbox" checked={pkg.isPopular} onChange={e => handlePackageChange(index, 'isPopular', e.target.checked)} />
                                    <label className="ml-2">Mark as Popular</label>
                                </div>
                                {formData.packages.length > 1 && <Button type="button" variant="destructive" onClick={() => handleRemovePackage(index)} className="mt-4">Remove Package</Button>}
                            </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'policies' && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Policies</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Policy</label>
                        <textarea value={formData.cancellationPolicy} onChange={(e) => handleInputChange('cancellationPolicy', e.target.value)} placeholder="Describe your cancellation policy..." rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
                        <textarea value={formData.paymentTerms} onChange={(e) => handleInputChange('paymentTerms', e.target.value)} placeholder="Describe your payment terms..." rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black" />
                    </div>
                </div>
              )}

              {activeTab === 'review' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Service Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-black">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Basic Information</h3>
                      <p><strong>Service Name:</strong> <span className="text-gray-600">{formData.name}</span></p>
                      <p><strong>Description:</strong> <span className="text-gray-600">{formData.description}</span></p>
                      <p><strong>Base Price:</strong> <span className="text-gray-600">₹{formData.basePrice}</span></p>
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
                      <p><strong>Makeup Types:</strong> <span className="text-gray-600">{formData.makeupTypes.join(', ')}</span></p>
                      <p><strong>Packages:</strong> <span className="text-gray-600">{formData.packages.length} package(s) configured</span></p>
                    </div>
                  </div>
                </div>
              )}

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
                      {loading ? 'Updating...' : 'Update Service'}
                    </Button>
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
