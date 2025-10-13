'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Camera, Plus, X, Upload } from 'lucide-react';
import { ImageUpload } from '@/components/upload';
import type { VenueImageWithUpload } from '@/types/upload';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

export default function CreatePhotographyService() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [basePrice, setBasePrice] = useState('');
  const [minGuests, setMinGuests] = useState('');
  const [cancellationPolicy, setCancellationPolicy] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [photographyTypes, setPhotographyTypes] = useState<string[]>([]);
  const [newPhotographyType, setNewPhotographyType] = useState('');
  const [packages, setPackages] = useState<Array<{
    name: string;
    description: string;
    includes: string[];
    duration: string;
    price: string;
    isPopular: boolean;
  }>>([{ name: '', description: '', includes: [''], duration: '', price: '', isPopular: false }]);
  const [addons, setAddons] = useState<Array<{
    name: string;
    description: string;
    price: string;
  }>>([{ name: '', description: '', price: '' }]);
  const [images, setImages] = useState<VenueImageWithUpload[]>([]);

  const photographyTypeOptions = [
    'Wedding Photography',
    'Pre-Wedding Shoot',
    'Post-Wedding Shoot',
    'Engagement Shoot',
    'Maternity Shoot',
    'Portrait Photography',
    'Event Photography',
    'Commercial Photography',
    'Fashion Photography',
    'Product Photography'
  ];

  const handleAddPhotographyType = () => {
    if (newPhotographyType && !photographyTypes.includes(newPhotographyType)) {
      setPhotographyTypes([...photographyTypes, newPhotographyType]);
      setNewPhotographyType('');
    }
  };

  const handleRemovePhotographyType = (type: string) => {
    setPhotographyTypes(photographyTypes.filter(t => t !== type));
  };

  const handleAddPackage = () => {
    setPackages([...packages, { name: '', description: '', includes: [''], duration: '', price: '', isPopular: false }]);
  };

  const handleRemovePackage = (index: number) => {
    if (packages.length > 1) {
      const newPackages = [...packages];
      newPackages.splice(index, 1);
      setPackages(newPackages);
    }
  };

  const handlePackageChange = (index: number, field: string, value: string | boolean) => {
    const newPackages = [...packages];
    (newPackages[index] as any)[field] = value;
    setPackages(newPackages);
  };

  const handlePackageIncludesChange = (packageIndex: number, includeIndex: number, value: string) => {
    const newPackages = [...packages];
    newPackages[packageIndex].includes[includeIndex] = value;
    setPackages(newPackages);
  };

  const handleAddPackageInclude = (packageIndex: number) => {
    const newPackages = [...packages];
    newPackages[packageIndex].includes.push('');
    setPackages(newPackages);
  };

  const handleRemovePackageInclude = (packageIndex: number, includeIndex: number) => {
    const newPackages = [...packages];
    if (newPackages[packageIndex].includes.length > 1) {
      newPackages[packageIndex].includes.splice(includeIndex, 1);
      setPackages(newPackages);
    }
  };

  const handleAddAddon = () => {
    setAddons([...addons, { name: '', description: '', price: '' }]);
  };

  const handleRemoveAddon = (index: number) => {
    if (addons.length > 1) {
      const newAddons = [...addons];
      newAddons.splice(index, 1);
      setAddons(newAddons);
    }
  };

  const handleAddonChange = (index: number, field: string, value: string) => {
    const newAddons = [...addons];
    (newAddons[index] as any)[field] = value;
    setAddons(newAddons);
  };

  const handleImagesChange = (newImages: VenueImageWithUpload[]) => {
    setImages(newImages);
  };

  const validateForm = () => {
    if (!name.trim()) {
      setError('Service name is required');
      return false;
    }
    if (description.length < 10) {
      setError('Description must be at least 10 characters');
      return false;
    }
    if (!address.trim()) {
      setError('Address is required');
      return false;
    }
    if (!city.trim()) {
      setError('City is required');
      return false;
    }
    if (!state.trim()) {
      setError('State is required');
      return false;
    }
    if (!pincode.trim()) {
      setError('Pincode is required');
      return false;
    }
    if (!phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!basePrice || parseFloat(basePrice) <= 0) {
      setError('Base price must be a positive number');
      return false;
    }
    if (photographyTypes.length === 0) {
      setError('At least one photography type is required');
      return false;
    }
    if (packages.some(p => !p.name.trim() || !p.price || parseFloat(p.price) <= 0)) {
      setError('All packages must have a name and valid price');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const serviceData = {
        name,
        description,
        serviceLocation: {
          address,
          city,
          state,
          pincode
        },
        contact: {
          phone,
          whatsapp: whatsapp || undefined,
          email
        },
        basePrice: parseFloat(basePrice),
        minGuests: minGuests ? parseInt(minGuests) : undefined,
        cancellationPolicy: cancellationPolicy || undefined,
        paymentTerms: paymentTerms || undefined,
        photographyTypes,
        packages: packages.map(p => ({
          name: p.name,
          description: p.description,
          includes: p.includes.filter(i => i.trim() !== ''),
          duration: p.duration || undefined,
          price: parseFloat(p.price),
          isPopular: p.isPopular
        })),
        addons: addons.map(a => ({
          name: a.name,
          description: a.description || undefined,
          price: parseFloat(a.price)
        })).filter(a => a.name.trim() && a.price > 0),
        images: images.map(img => ({
          url: img.url,
          alt: img.alt,
          isPrimary: img.isPrimary
        }))
      };

      const response = await apiClient.post('/photography', serviceData);
      toast.success('Photography service created successfully!');
      router.push('/provider/photography');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to create photography service';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error creating photography service:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-pink-600 hover:text-pink-800 mb-4"
            >
              <X className="h-4 w-4 mr-2" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Create Photography Service</h1>
            <p className="mt-2 text-gray-600">
              Add a new photography service to your portfolio
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
            {/* Basic Information */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Camera className="h-5 w-5 mr-2 text-pink-600" />
                Basic Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900 placeholder-gray-500"
                    placeholder="e.g., Premium Wedding Photography"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900 placeholder-gray-500"
                    placeholder="e.g., 15000"
                    min="0"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900 placeholder-gray-500"
                    placeholder="Describe your photography service in detail..."
                  />
                </div>
              </div>
            </div>

            {/* Images Upload */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Upload className="h-5 w-5 mr-2 text-pink-600" />
                Service Images
              </h2>
              
              <div className="border border-gray-200 rounded-lg p-6">
                <ImageUpload
                  uploadType="catering"
                  maxFiles={10}
                  images={images}
                  onImagesChange={handleImagesChange}
                  showImagePreview={true}
                  allowPrimarySelection={true}
                />
              </div>
            </div>

            {/* Location Information */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Location Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900 placeholder-gray-500"
                    placeholder="Street address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900 placeholder-gray-500"
                    placeholder="City"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900 placeholder-gray-500"
                    placeholder="State"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900 placeholder-gray-500"
                    placeholder="Pincode"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Contact Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900 placeholder-gray-500"
                    placeholder="Phone number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900 placeholder-gray-500"
                    placeholder="WhatsApp number (optional)"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900 placeholder-gray-500"
                    placeholder="Email address"
                  />
                </div>
              </div>
            </div>

            {/* Photography Types */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Photography Types</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Photography Types *
                </label>
                <div className="flex">
                  <select
                    value={newPhotographyType}
                    onChange={(e) => setNewPhotographyType(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900 placeholder-gray-500"
                  >
                    <option value="">Select a photography type</option>
                    {photographyTypeOptions.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddPhotographyType}
                    className="px-4 py-2 bg-pink-600 text-white rounded-r-lg hover:bg-pink-700 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {photographyTypes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {photographyTypes.map((type) => (
                    <span 
                      key={type} 
                      className="inline-flex items-center px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm"
                    >
                      {type}
                      <button
                        type="button"
                        onClick={() => handleRemovePhotographyType(type)}
                        className="ml-2 text-pink-600 hover:text-pink-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Packages */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Packages</h2>
                <button
                  type="button"
                  onClick={handleAddPackage}
                  className="inline-flex items-center px-3 py-1 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Package
                </button>
              </div>
              
              {packages.map((pkg, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Package {index + 1}</h3>
                    {packages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePackage(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Package Name *
                      </label>
                      <input
                        type="text"
                        value={pkg.name}
                        onChange={(e) => handlePackageChange(index, 'name', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900 placeholder-gray-500"
                        placeholder="e.g., Basic Wedding Package"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (₹) *
                      </label>
                      <input
                        type="number"
                        value={pkg.price}
                        onChange={(e) => handlePackageChange(index, 'price', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900 placeholder-gray-500"
                        placeholder="e.g., 25000"
                        min="0"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={pkg.description}
                        onChange={(e) => handlePackageChange(index, 'description', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900 placeholder-gray-500"
                        placeholder="Describe what's included in this package..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration
                      </label>
                      <input
                        type="text"
                        value={pkg.duration}
                        onChange={(e) => handlePackageChange(index, 'duration', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900 placeholder-gray-500"
                        placeholder="e.g., 8 hours"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={pkg.isPopular}
                        onChange={(e) => handlePackageChange(index, 'isPopular', e.target.checked)}
                        className="h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Mark as Popular Package
                      </label>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        What's Included
                      </label>
                      {pkg.includes.map((include, includeIndex) => (
                        <div key={includeIndex} className="flex mb-2">
                          <input
                            type="text"
                            value={include}
                            onChange={(e) => handlePackageIncludesChange(index, includeIndex, e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900 placeholder-gray-500"
                            placeholder="e.g., 100 edited photos"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePackageInclude(index, includeIndex)}
                            disabled={pkg.includes.length <= 1}
                            className="px-3 bg-gray-200 text-gray-700 rounded-r-lg hover:bg-gray-300 disabled:opacity-50"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleAddPackageInclude(index)}
                        className="inline-flex items-center text-pink-600 hover:text-pink-800 text-sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Included Item
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Addons */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Add-ons</h2>
                <button
                  type="button"
                  onClick={handleAddAddon}
                  className="inline-flex items-center px-3 py-1 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Add-on
                </button>
              </div>
              
              {addons.map((addon, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Add-on {index + 1}</h3>
                    {addons.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAddon(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add-on Name
                      </label>
                      <input
                        type="text"
                        value={addon.name}
                        onChange={(e) => handleAddonChange(index, 'name', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900 placeholder-gray-500"
                        placeholder="e.g., Additional Photographer"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        value={addon.price}
                        onChange={(e) => handleAddonChange(index, 'price', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900 placeholder-gray-500"
                        placeholder="e.g., 5000"
                        min="0"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={addon.description}
                        onChange={(e) => handleAddonChange(index, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900 placeholder-gray-500"
                        placeholder="Describe this add-on..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Policies */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Policies</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cancellation Policy
                  </label>
                  <textarea
                    value={cancellationPolicy}
                    onChange={(e) => setCancellationPolicy(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900 placeholder-gray-500"
                    placeholder="Describe your cancellation policy..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Terms
                  </label>
                  <textarea
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-gray-900 placeholder-gray-500"
                    placeholder="Describe your payment terms..."
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/provider/photography')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Photography Service'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}