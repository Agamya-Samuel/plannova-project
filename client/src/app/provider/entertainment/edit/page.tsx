'use client';

import React, { useState, useEffect, Suspense } from 'react';
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
  // Music
} from 'lucide-react';
import { ImageUpload } from '@/components/upload';
import type { VenueImageWithUpload } from '@/types/upload';
import BasicInfoInput from '@/components/ui/BasicInfoInput';
import LocationInput from '@/components/ui/LocationInput';
import ContactInput from '@/components/ui/ContactInput';
import { isValidPhoneNumber } from 'react-phone-number-input';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

import { PaymentMethodSelector } from '@/components/provider/PaymentMethodSelector';

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

interface EntertainmentServiceFormData {
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
  entertainmentTypes: string[];
  packages: PackageFormData[];
  addons: AddonFormData[];
  images: Array<{ url: string; alt: string; isPrimary: boolean }>;
  paymentMethod: 'ONLINE_CASH' | 'CASH';
}

const entertainmentTypeOptions = ['DJ', 'Live Band', 'Dhol', 'MC/Host', 'Sound System', 'Lighting'];

// const states = [
//   'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
//   'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
//   'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
//   'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
//   'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Puducherry'
// ];

function EditEntertainmentServiceContent() {
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

  const [formData, setFormData] = useState<EntertainmentServiceFormData>({
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
    entertainmentTypes: [],
    packages: [{ name: '', description: '', includes: [''], duration: '', price: 0, isPopular: false }],
    addons: [{ name: '', description: '', price: 0 }],
    images: [],
    paymentMethod: 'ONLINE_CASH'
  });

  const fetchEntertainmentService = React.useCallback(async () => {
    try {
      setFetching(true);
      const response = await apiClient.get(`/entertainment/${serviceId}`);
      const service = response.data.data;
      setFormData({
        name: service.name,
        description: service.description,
        serviceLocation: service.serviceLocation,
        contact: {
          phone: service.contact?.phone || '',
          whatsapp: service.contact?.whatsapp || '',
          email: service.contact?.email || user?.email || ''
        },
        basePrice: service.basePrice,
        cancellationPolicy: service.cancellationPolicy || '',
        paymentTerms: service.paymentTerms || '',
        entertainmentTypes: service.entertainmentTypes || [],
        packages: service.packages?.length > 0 
          ? service.packages.map((p: { price: number }) => ({ ...p, price: Number(p.price) }))
          : [{ name: '', description: '', includes: [''], duration: '', price: 0, isPopular: false }],
        addons: service.addons?.length > 0
          ? service.addons.map((a: { price: number }) => ({ ...a, price: Number(a.price) }))
          : [{ name: '', description: '', price: 0 }],
        images: service.images || [],
        paymentMethod: service.paymentMethod || 'ONLINE_CASH'
      });
      // Mark all tabs as visited since we're loading existing data
      setVisitedTabs(new Set(['basic', 'location', 'contact', 'images', 'services', 'policies', 'review']));
    } catch (err: unknown) {
      let errorMessage = 'Failed to fetch entertainment service';
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
  }, [serviceId, user?.email]);

  useEffect(() => {
    if (serviceId) {
      fetchEntertainmentService();
    } else {
      router.push('/provider/entertainment');
    }
  }, [serviceId, fetchEntertainmentService, router]);

  React.useEffect(() => {
    if (user?.email && !formData.contact.email) {
      setFormData(prev => ({
        ...prev,
        contact: { ...prev.contact, email: user.email }
      }));
    }
  }, [user?.email, formData.contact.email]);

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Info },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'images', label: 'Images', icon: ImageIcon },
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
        if (formData.entertainmentTypes.length === 0) validationErrors.push('At least one entertainment type is required');
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
        return formData.entertainmentTypes.length > 0 && formData.packages.every(p => p.name.trim() && p.price > 0);
      case 'policies':
        return true; // Policies are optional
      default:
        return false;
    }
  };

  const handleImagesChange = (newImages: VenueImageWithUpload[]) => {
    const formattedImages = newImages.map(({ url, alt, isPrimary }) => ({ url, alt, isPrimary }));
    setFormData(prev => ({ ...prev, images: formattedImages }));
  };

  const handleSubmit = async (e: React.FormEvent, status: 'DRAFT' | 'PENDING' = 'DRAFT') => {
    e.preventDefault();
    if (!isExplicitSubmit) return;
    if (!validateCurrentTab()) {
      toast.error("Please fill all required fields before submitting.");
      return;
    }
    setLoading(true);
    try {
      const serviceData: EntertainmentServiceFormData = {
        ...formData,
        packages: formData.packages.map(p => ({ ...p, price: Number(p.price) })),
        addons: formData.addons.filter(a => a.name.trim() !== '').map(a => ({ ...a, price: Number(a.price) })),
        basePrice: Number(formData.basePrice)
      };
      const response = await apiClient.put(`/entertainment/${serviceId}`, { ...serviceData, status });
      
      // Save payment configuration
      try {
        await apiClient.post(`/vendor-service-config/${serviceId}`, {
          serviceType: 'entertainment',
          paymentMode: formData.paymentMethod
        });
      } catch (configError) {
        console.error('Failed to save payment configuration:', configError);
      }
      
      toast.success('Entertainment service updated successfully!');
      router.push('/provider/entertainment');
    } catch (err: unknown) {
      let errorMessage = 'Failed to update entertainment service';
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

  const handleManualSubmit = (status: 'DRAFT' | 'PENDING' = 'DRAFT') => {
    setIsExplicitSubmit(true);
    // Create a synthetic event and call handleSubmit directly with the status
    const event = new Event('submit') as unknown as React.FormEvent;
    handleSubmit(event, status);
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
                  <h1 className="text-4xl font-bold text-gray-900">Edit Entertainment Service</h1>
                  <p className="text-gray-600 text-lg">Update your entertainment service profile</p>
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
                <BasicInfoInput
                  data={{
                    name: formData.name,
                    description: formData.description,
                    basePrice: formData.basePrice,
                    paymentMethod: formData.paymentMethod
                  }}
                  onChange={(data) => {
                    setFormData(prev => ({
                      ...prev,
                      name: data.name,
                      description: data.description,
                      basePrice: data.basePrice || prev.basePrice,
                      paymentMethod: data.paymentMethod || prev.paymentMethod
                    }));
                  }}
                  serviceType="Entertainment"
                />
              )}

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
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Images</h2>
                  <ImageUpload
                    uploadType="entertainment"
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
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Entertainment Types</h3>
                    <div className="flex flex-wrap gap-2">
                      {entertainmentTypeOptions.map(type => (
                        <button 
                          key={type} 
                          type="button" 
                          onClick={() => setFormData(prev => ({ 
                            ...prev, 
                            entertainmentTypes: prev.entertainmentTypes.includes(type) 
                              ? prev.entertainmentTypes.filter(t => t !== type) 
                              : [...prev.entertainmentTypes, type] 
                          }))}
                          className={`px-4 py-2 rounded-full border text-sm font-medium ${
                            formData.entertainmentTypes.includes(type) 
                              ? 'bg-pink-600 text-white' 
                              : 'bg-white text-gray-700'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Packages</h3>
                      <Button type="button" onClick={() => setFormData(prev => ({ ...prev, packages: [...prev.packages, { name: '', description: '', includes: [''], duration: '', price: 0, isPopular: false }] }))}>
                        <Plus className="h-4 w-4 mr-2" />Add Package
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {formData.packages.map((pkg, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input placeholder="Package Name" value={pkg.name} onChange={e => { const newPkgs = [...formData.packages]; newPkgs[index].name = e.target.value; setFormData(prev => ({ ...prev, packages: newPkgs })); }} className="text-black" />
                            <Input type="number" placeholder="Price" value={pkg.price} onChange={e => { const newPkgs = [...formData.packages]; newPkgs[index].price = Number(e.target.value); setFormData(prev => ({ ...prev, packages: newPkgs })); }} className="text-black" />
                          </div>
                          <textarea placeholder="Description" value={pkg.description} onChange={e => { const newPkgs = [...formData.packages]; newPkgs[index].description = e.target.value; setFormData(prev => ({ ...prev, packages: newPkgs })); }} className="w-full mt-4 p-2 border rounded text-black" />
                          <Input placeholder="Duration" value={pkg.duration} onChange={e => { const newPkgs = [...formData.packages]; newPkgs[index].duration = e.target.value; setFormData(prev => ({ ...prev, packages: newPkgs })); }} className="mt-4 text-black" />
                          <div className="mt-4">
                            <label className="font-medium text-black">Includes:</label>
                            {pkg.includes.map((item, i) => (
                              <div key={i} className="flex items-center gap-2 mt-2">
                                <Input value={item} onChange={e => { const newPkgs = [...formData.packages]; newPkgs[index].includes[i] = e.target.value; setFormData(prev => ({ ...prev, packages: newPkgs })); }} className="text-black" />
                                <Button type="button" variant="destructive" size="sm" onClick={() => { const newPkgs = [...formData.packages]; if (newPkgs[index].includes.length > 1) { newPkgs[index].includes.splice(i, 1); setFormData(prev => ({ ...prev, packages: newPkgs })); } }}>X</Button>
                              </div>
                            ))}
                            <Button type="button" size="sm" onClick={() => { const newPkgs = [...formData.packages]; newPkgs[index].includes.push(''); setFormData(prev => ({ ...prev, packages: newPkgs })); }} className="mt-2">Add Item</Button>
                          </div>
                          <div className="flex items-center mt-4">
                            <input type="checkbox" checked={pkg.isPopular} onChange={e => { const newPkgs = [...formData.packages]; newPkgs[index].isPopular = e.target.checked; setFormData(prev => ({ ...prev, packages: newPkgs })); }} />
                            <label className="ml-2">Mark as Popular</label>
                          </div>
                          {formData.packages.length > 1 && <Button type="button" variant="destructive" onClick={() => setFormData(prev => ({ ...prev, packages: prev.packages.filter((_, i) => i !== index) }))} className="mt-4">Remove Package</Button>}
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
                    <textarea value={formData.cancellationPolicy} onChange={(e) => setFormData(prev => ({ ...prev, cancellationPolicy: e.target.value }))} placeholder="Describe your cancellation policy..." rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
                    <textarea value={formData.paymentTerms} onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))} placeholder="Describe your payment terms..." rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-black" />
                  </div>
                </div>
              )}

              {activeTab === 'review' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Review Your Service Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-black">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Basic Information</h3>
                      <p><strong>Service Name:</strong> {formData.name}</p>
                      <p><strong>Description:</strong> {formData.description}</p>
                      <p><strong>Base Price:</strong> ₹{formData.basePrice}</p>
                      <p><strong>Payment Method:</strong> {formData.paymentMethod === 'ONLINE_CASH' ? 'Online + Cash Payment' : 'Cash Payment Only'}</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Location & Contact</h3>
                      <p><strong>Address:</strong> {formData.serviceLocation.address}, {formData.serviceLocation.city}, {formData.serviceLocation.state} - {formData.serviceLocation.pincode}</p>
                      <p><strong>Phone:</strong> {formData.contact.phone}</p>
                      <p><strong>Email:</strong> {formData.contact.email}</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Images</h3>
                      <p>{formData.images.length} image(s) uploaded</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Services & Packages</h3>
                      <p><strong>Entertainment Types:</strong> {formData.entertainmentTypes.join(', ')}</p>
                      <p><strong>Packages:</strong> {formData.packages.length} package(s) configured</p>
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

export default function EditEntertainmentService() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-600"></div>
        </div>
      </ProtectedRoute>
    }>
      <EditEntertainmentServiceContent />
    </Suspense>
  );
}
