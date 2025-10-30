'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, MapPin, Phone, Save, ChevronLeft, ChevronRight, Check, AlertCircle, Info, Image as ImageIcon, Package, ShieldCheck, Plus } from 'lucide-react';
import { ImageUpload } from '@/components/upload';
import type { VenueImageWithUpload } from '@/types/upload';
import BasicInfoInput from '@/components/ui/BasicInfoInput';
import LocationInput from '@/components/ui/LocationInput';
import ContactInput from '@/components/ui/ContactInput';
import { isValidPhoneNumber } from 'react-phone-number-input';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

interface PackageFormData { name: string; description: string; includes: string[]; duration: string; price: number; isPopular: boolean; }
interface AddonFormData { name: string; description: string; price: number; }

interface EntertainmentServiceFormData {
  name: string;
  description: string;
  serviceLocation: { address: string; city: string; state: string; pincode: string };
  contact: { phone: string; whatsapp: string; email: string };
  basePrice: number;
  cancellationPolicy: string;
  paymentTerms: string;
  entertainmentTypes: string[];
  packages: PackageFormData[];
  addons: AddonFormData[];
  images: Array<{ url: string; alt: string; isPrimary: boolean }>;
}

const entertainmentTypeOptions = ['DJ', 'Live Band', 'Dhol', 'MC/Host', 'Sound System', 'Lighting'];

export default function CreateEntertainmentService() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['basic']));
  const [isExplicitSubmit, setIsExplicitSubmit] = useState(false);

  const [formData, setFormData] = useState<EntertainmentServiceFormData>({
    name: '',
    description: '',
    serviceLocation: { address: '', city: '', state: '', pincode: '' },
    contact: { phone: '', whatsapp: '', email: user?.email || '' },
    basePrice: 0,
    cancellationPolicy: '',
    paymentTerms: '',
    entertainmentTypes: [],
    packages: [{ name: '', description: '', includes: [''], duration: '', price: 0, isPopular: false }],
    addons: [{ name: '', description: '', price: 0 }],
    images: []
  });

  React.useEffect(() => {
    if (user?.email && !formData.contact.email) {
      setFormData(prev => ({ ...prev, contact: { ...prev.contact, email: user.email } }));
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

  const currentTabIndex = tabs.findIndex(t => t.id === activeTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === tabs.length - 1;

  const validateCurrentTab = () => {
    const errs: string[] = [];
    switch (activeTab) {
      case 'basic':
        if (!formData.name.trim()) errs.push('Service name is required');
        if (formData.description.length < 10) errs.push('Description must be at least 10 characters');
        if (!formData.basePrice || formData.basePrice <= 0) errs.push('Base price must be a positive number');
        break;
      case 'location':
        if (!formData.serviceLocation.address.trim()) errs.push('Address is required');
        if (!formData.serviceLocation.city.trim()) errs.push('City is required');
        if (!formData.serviceLocation.state.trim()) errs.push('State is required');
        if (!formData.serviceLocation.pincode.trim()) errs.push('Pincode is required');
        break;
      case 'contact':
        if (!formData.contact.phone.trim()) errs.push('Phone number is required');
        else if (!isValidPhoneNumber(formData.contact.phone)) errs.push('Please enter a valid phone number');
        if (formData.contact.whatsapp.trim() && !isValidPhoneNumber(formData.contact.whatsapp)) errs.push('Please enter a valid WhatsApp number');
        if (!formData.contact.email.trim()) errs.push('Email is required');
        break;
      case 'images':
        if (formData.images.length === 0) errs.push('At least one image is required');
        break;
      case 'services':
        if (formData.entertainmentTypes.length === 0) errs.push('At least one entertainment type is required');
        if (formData.packages.some(p => !p.name.trim() || !p.price || p.price <= 0)) errs.push('All packages must have a name and valid price');
        break;
    }
    if (errs.length) { setError(errs.join(', ')); return false; }
    setError('');
    return true;
  };

  const isTabCompleted = (id: string) => {
    if (!visitedTabs.has(id)) return false;
    switch (id) {
      case 'basic':
        return !!(formData.name.trim() && formData.description.length >= 10 && formData.basePrice > 0);
      case 'location':
        return !!(formData.serviceLocation.address && formData.serviceLocation.city && formData.serviceLocation.state && formData.serviceLocation.pincode);
      case 'contact':
        return !!(formData.contact.phone && formData.contact.email);
      case 'images':
        return formData.images.length > 0;
      case 'services':
        return formData.entertainmentTypes.length > 0 && formData.packages.every(p => p.name.trim() && p.price > 0);
      case 'policies':
        return true;
      default:
        return false;
    }
  };

  const goToNextTab = () => {
    if (!validateCurrentTab()) return;
    if (!isLastTab) {
      const nextTab = tabs[currentTabIndex + 1];
      setActiveTab(nextTab.id);
      setVisitedTabs(prev => new Set(prev).add(nextTab.id));
    }
  };

  const goToPreviousTab = () => { if (!isFirstTab) setActiveTab(tabs[currentTabIndex - 1].id); };

  const handleImagesChange = (imgs: VenueImageWithUpload[]) => {
    setFormData(prev => ({ ...prev, images: imgs.map(({ url, alt, isPrimary }) => ({ url, alt, isPrimary })) }));
  };

  const handleManualSubmit = () => {
    setIsExplicitSubmit(true);
    const form = document.querySelector('form');
    form?.requestSubmit();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isExplicitSubmit) return;
    if (!validateCurrentTab()) { toast.error('Please fill all required fields before submitting.'); return; }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        packages: formData.packages.map(p => ({ ...p, price: Number(p.price) })),
        addons: formData.addons.filter(a => a.name.trim()).map(a => ({ ...a, price: Number(a.price) })),
        basePrice: Number(formData.basePrice)
      };
      await apiClient.post('/entertainment', { ...payload, status: 'DRAFT' });
      toast.success('Entertainment service created successfully!');
      router.push('/provider/entertainment');
    } catch {
      toast.error('Failed to create entertainment service');
    } finally {
      setLoading(false);
      setIsExplicitSubmit(false);
    }
  };

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
                  <h1 className="text-4xl font-bold text-gray-900">Create Entertainment Service</h1>
                  <p className="text-gray-600 text-lg">Set up your entertainment service profile</p>
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
                    <div className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-300" style={{ width: `${((currentTabIndex + 1) / tabs.length) * 100}%` }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-600">{currentTabIndex + 1} of {tabs.length}</span>
                </div>
              </div>

              <div className="flex justify-between">
                {tabs.map(tab => {
                  const isCurrent = activeTab === tab.id;
                  const completed = isTabCompleted(tab.id);
                  const canAccess = completed || isCurrent || visitedTabs.has(tab.id);
                  return (
                    <div key={tab.id} className="flex flex-col items-center space-y-2">
                      <button
                        onClick={() => { if (canAccess) { setActiveTab(tab.id); setError(''); } }}
                        disabled={!canAccess}
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm transition-all duration-200 ${
                          isCurrent ? 'bg-pink-600 text-white shadow-lg' : completed ? 'bg-green-500 text-white' : canAccess ? 'bg-gray-200 text-gray-600 hover:bg-gray-300 cursor-pointer' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {completed && !isCurrent ? <Check className="h-5 w-5" /> : <tab.icon className="h-5 w-5" />}
                      </button>
                      <span className={`text-xs text-center max-w-16 leading-tight ${isCurrent ? 'text-pink-600 font-medium' : completed ? 'text-green-600 font-medium' : canAccess ? 'text-gray-600' : 'text-gray-400'}`}>{tab.label}</span>
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
                  data={{ name: formData.name, description: formData.description, basePrice: formData.basePrice }}
                  onChange={(d) => setFormData(prev => ({ ...prev, name: d.name, description: d.description, basePrice: d.basePrice || prev.basePrice }))}
                  serviceType="Entertainment"
                />
              )}

              {activeTab === 'location' && (
                <LocationInput data={formData.serviceLocation} onChange={(loc) => setFormData(prev => ({ ...prev, serviceLocation: loc }))} />
              )}

              {activeTab === 'contact' && (
                <ContactInput data={formData.contact} onChange={(c) => setFormData(prev => ({ ...prev, contact: c }))} />
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
                        <button key={type} type="button" onClick={() => setFormData(prev => ({ ...prev, entertainmentTypes: prev.entertainmentTypes.includes(type) ? prev.entertainmentTypes.filter(t => t !== type) : [...prev.entertainmentTypes, type] }))} className={`px-4 py-2 rounded-full border text-sm font-medium ${formData.entertainmentTypes.includes(type) ? 'bg-pink-600 text-white' : 'bg-white text-gray-700'}`}>
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Packages</h3>
                      <Button type="button" onClick={() => setFormData(prev => ({ ...prev, packages: [...prev.packages, { name: '', description: '', includes: [''], duration: '', price: 0, isPopular: false }] }))}><Plus className="h-4 w-4 mr-2" />Add Package</Button>
                    </div>
                    <div className="space-y-4">
                      {formData.packages.map((pkg, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input placeholder="Package Name" value={pkg.name} onChange={e => { const v = e.target.value; setFormData(prev => { const arr = [...prev.packages]; arr[index].name = v; return { ...prev, packages: arr }; }); }} className="text-black" />
                            <Input type="number" placeholder="Price" value={pkg.price} onChange={e => { const v = Number(e.target.value); setFormData(prev => { const arr = [...prev.packages]; arr[index].price = v; return { ...prev, packages: arr }; }); }} className="text-black" />
                          </div>
                          <textarea placeholder="Description" value={pkg.description} onChange={e => { const v = e.target.value; setFormData(prev => { const arr = [...prev.packages]; arr[index].description = v; return { ...prev, packages: arr }; }); }} className="w-full mt-4 p-2 border rounded text-black" />
                          <Input placeholder="Duration" value={pkg.duration} onChange={e => { const v = e.target.value; setFormData(prev => { const arr = [...prev.packages]; arr[index].duration = v; return { ...prev, packages: arr }; }); }} className="mt-4 text-black" />
                          <div className="mt-4">
                            <label className="font-medium text-black">Includes:</label>
                            {pkg.includes.map((item, i) => (
                              <div key={i} className="flex items-center gap-2 mt-2">
                                <Input value={item} onChange={e => { const v = e.target.value; setFormData(prev => { const arr = [...prev.packages]; arr[index].includes[i] = v; return { ...prev, packages: arr }; }); }} className="text-black" />
                                <Button type="button" variant="destructive" size="sm" onClick={() => { setFormData(prev => { const arr = [...prev.packages]; if (arr[index].includes.length > 1) arr[index].includes.splice(i, 1); return { ...prev, packages: arr }; }); }}>X</Button>
                              </div>
                            ))}
                            <Button type="button" size="sm" onClick={() => setFormData(prev => { const arr = [...prev.packages]; arr[index].includes.push(''); return { ...prev, packages: arr }; })} className="mt-2">Add Item</Button>
                          </div>
                          <div className="flex items-center mt-4">
                            <input type="checkbox" checked={pkg.isPopular} onChange={e => { const v = e.target.checked; setFormData(prev => { const arr = [...prev.packages]; arr[index].isPopular = v; return { ...prev, packages: arr }; }); }} />
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
                    <Button type="button" disabled={loading} onClick={handleManualSubmit} className="bg-gradient-to-r from-pink-600 to-purple-600">{loading ? 'Creating...' : 'Create Service'}</Button>
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


