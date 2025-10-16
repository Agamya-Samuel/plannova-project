'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { 
  Video, 
  ArrowLeft, 
  Plus, 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  MessageCircle,
  Loader2,
  Upload,
  Trash2
} from 'lucide-react';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import ImageUpload from '@/components/upload/ImageUpload';

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
  paymentTerms: ''
};

const videographyTypeOptions = [
  'Wedding Videography',
  'Pre-wedding Videography',
  'Post-wedding Videography',
  'Corporate Videography',
  'Event Videography',
  'Documentary Videography',
  'Music Video',
  'Commercial Videography',
  'Drone Videography',
  'Live Streaming'
];

export default function CreateVideographyServicePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState<VideographyFormData>(initialFormData);
  const [images, setImages] = useState<Array<{ url: string; alt: string; isPrimary: boolean }>>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setFormData(prev => {
      const parentData = prev[parent as keyof VideographyFormData] as any;
      return {
        ...prev,
        [parent]: {
          ...parentData,
          [field]: value
        }
      };
    });
  };

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

  const updatePackage = (index: number, field: string, value: any) => {
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

  const addAddon = () => {
    setFormData(prev => ({
      ...prev,
      addons: [...prev.addons, {
        name: '',
        description: '',
        price: 0
      }]
    }));
  };

  const removeAddon = (index: number) => {
    setFormData(prev => ({
      ...prev,
      addons: prev.addons.filter((_, i) => i !== index)
    }));
  };

  const updateAddon = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      addons: prev.addons.map((addon, i) => 
        i === index ? { ...addon, [field]: value } : addon
      )
    }));
  };

  const handleImageUpload = (uploadedImages: Array<{ url: string; alt: string; isPrimary: boolean }>) => {
    setImages(uploadedImages);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const setPrimaryImage = (index: number) => {
    setImages(prev => prev.map((img, i) => ({
      ...img,
      isPrimary: i === index
    })));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Service name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.description.length < 10) newErrors.description = 'Description must be at least 10 characters';
    if (!formData.serviceLocation.address.trim()) newErrors.address = 'Address is required';
    if (!formData.serviceLocation.city.trim()) newErrors.city = 'City is required';
    if (!formData.serviceLocation.state.trim()) newErrors.state = 'State is required';
    if (!formData.serviceLocation.pincode.trim()) newErrors.pincode = 'Pincode is required';
    if (!formData.contact.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.contact.email.trim()) newErrors.email = 'Email is required';
    if (!formData.contact.email.includes('@')) newErrors.email = 'Valid email is required';
    if (formData.videographyTypes.length === 0) newErrors.videographyTypes = 'At least one videography type is required';
    if (formData.basePrice <= 0) newErrors.basePrice = 'Base price must be greater than 0';
    if (formData.packages.length === 0) newErrors.packages = 'At least one package is required';

    // Validate packages
    formData.packages.forEach((pkg, index) => {
      if (!pkg.name.trim()) newErrors[`package_${index}_name`] = 'Package name is required';
      if (pkg.price <= 0) newErrors[`package_${index}_price`] = 'Package price must be greater than 0';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadImagesToS3 = async (files: File[]): Promise<Array<{ url: string; alt: string; isPrimary: boolean }>> => {
    const uploadedImages = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Get presigned URL for upload
        const presignedResponse = await apiClient.post('/upload/presigned-url', {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadType: 'videography'
        });
        
        const { url, fields, key } = presignedResponse.data;
        
        // Create form data for S3 upload
        const formData = new FormData();
        Object.entries(fields).forEach(([key, value]) => {
          formData.append(key, value as string);
        });
        formData.append('file', file);
        
        // Upload to S3
        const uploadResponse = await fetch(url, {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }
        
        // Get the final URL
        const finalUrl = `${url}/${key}`;
        
        uploadedImages.push({
          url: finalUrl,
          alt: file.name,
          isPrimary: i === 0 // First image is primary
        });
        
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        throw error;
      }
    }
    
    return uploadedImages;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    if (images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    try {
      setLoading(true);
      
      // For now, we'll use the temporary URLs from the preview
      // In a real implementation, you would upload the actual files to S3
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
        images: images
      };

      const response = await apiClient.post('/videography', submitData);
      
      toast.success('Videography service created successfully!');
      router.push('/provider/videography');
    } catch (error: any) {
      console.error('Error creating videography service:', error);
      const errorMessage = error.response?.data?.error || 'Failed to create videography service';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/provider/videography')}
              className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Videography Services
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Create New Videography Service</h1>
            <p className="text-gray-600 mt-2">Add your videography service to attract customers</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.name ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Enter your videography service name"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => handleInputChange('basePrice', parseFloat(e.target.value) || 0)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.basePrice ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Enter starting price"
                    min="0"
                  />
                  {errors.basePrice && <p className="text-red-500 text-sm mt-1">{errors.basePrice}</p>}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                    errors.description ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Describe your videography services, style, and what makes you unique"
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Guests
                </label>
                <input
                  type="number"
                  value={formData.minGuests}
                  onChange={(e) => handleInputChange('minGuests', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Minimum number of guests"
                  min="0"
                />
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Service Location</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={formData.serviceLocation.address}
                    onChange={(e) => handleNestedInputChange('serviceLocation', 'address', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.address ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Enter your service address"
                  />
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.serviceLocation.city}
                    onChange={(e) => handleNestedInputChange('serviceLocation', 'city', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.city ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Enter city"
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={formData.serviceLocation.state}
                    onChange={(e) => handleNestedInputChange('serviceLocation', 'state', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.state ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Enter state"
                  />
                  {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    value={formData.serviceLocation.pincode}
                    onChange={(e) => handleNestedInputChange('serviceLocation', 'pincode', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.pincode ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Enter pincode"
                  />
                  {errors.pincode && <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Contact Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.contact.phone}
                    onChange={(e) => handleNestedInputChange('contact', 'phone', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.phone ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Enter phone number"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={formData.contact.whatsapp}
                    onChange={(e) => handleNestedInputChange('contact', 'whatsapp', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter WhatsApp number (optional)"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.contact.email}
                    onChange={(e) => handleNestedInputChange('contact', 'email', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="Enter email address"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>
              </div>
            </div>

            {/* Videography Types */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Videography Types *</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {videographyTypeOptions.map((type) => (
                  <label key={type} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.videographyTypes.includes(type)}
                      onChange={(e) => handleVideographyTypeChange(type, e.target.checked)}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
              {errors.videographyTypes && <p className="text-red-500 text-sm mt-2">{errors.videographyTypes}</p>}
            </div>

            {/* Images */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Portfolio Images *</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Upload your portfolio images</p>
                <p className="text-sm text-gray-500">Supported formats: JPEG, PNG, WebP (Max 10 images)</p>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;
                    
                    try {
                      const uploadedImages: Array<{ url: string; alt: string; isPrimary: boolean }> = [];
                      for (const file of files) {
                        // Create a temporary URL for preview
                        const tempUrl = URL.createObjectURL(file);
                        uploadedImages.push({
                          url: tempUrl,
                          alt: file.name,
                          isPrimary: uploadedImages.length === 0 // First image is primary
                        });
                      }
                      setImages(prev => [...prev, ...uploadedImages]);
                    } catch (error) {
                      console.error('Error handling file upload:', error);
                      toast.error('Error uploading images');
                    }
                  }}
                  className="mt-4"
                />
              </div>
              
              {images.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.url}
                          alt={image.alt}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(index)}
                            className={`px-3 py-1 text-xs rounded ${
                              image.isPrimary 
                                ? 'bg-green-600 text-white' 
                                : 'bg-white text-gray-900 hover:bg-gray-100'
                            }`}
                          >
                            {image.isPrimary ? 'Primary' : 'Set Primary'}
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Packages */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Packages & Pricing *</h2>
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
                <div key={index} className="border border-gray-200 rounded-xl p-6 mb-6">
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
                      <input
                        type="text"
                        value={pkg.name}
                        onChange={(e) => updatePackage(index, 'name', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                          errors[`package_${index}_name`] ? 'border-red-500' : 'border-gray-200'
                        }`}
                        placeholder="Enter package name"
                      />
                      {errors[`package_${index}_name`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`package_${index}_name`]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (₹) *
                      </label>
                      <input
                        type="number"
                        value={pkg.price}
                        onChange={(e) => updatePackage(index, 'price', parseFloat(e.target.value) || 0)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                          errors[`package_${index}_price`] ? 'border-red-500' : 'border-gray-200'
                        }`}
                        placeholder="Enter package price"
                        min="0"
                      />
                      {errors[`package_${index}_price`] && (
                        <p className="text-red-500 text-sm mt-1">{errors[`package_${index}_price`]}</p>
                      )}
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Describe what's included in this package"
                    />
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={pkg.duration}
                      onChange={(e) => updatePackage(index, 'duration', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., 8 hours, Full day, etc."
                    />
                  </div>

                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <label className="block text-sm font-medium text-gray-700">
                        What's Included
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
                        <input
                          type="text"
                          value={include}
                          onChange={(e) => updatePackageIncludes(index, includeIndex, e.target.value)}
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              {errors.packages && <p className="text-red-500 text-sm mt-2">{errors.packages}</p>}
            </div>

            {/* Add-ons */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Additional Services</h2>
                <Button
                  type="button"
                  onClick={addAddon}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>

              {formData.addons.map((addon, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Add-on {index + 1}</h3>
                    <Button
                      type="button"
                      onClick={() => removeAddon(index)}
                      className="text-red-600 hover:text-red-700"
                      variant="outline"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Name
                      </label>
                      <input
                        type="text"
                        value={addon.name}
                        onChange={(e) => updateAddon(index, 'name', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter service name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price (₹)
                      </label>
                      <input
                        type="number"
                        value={addon.price}
                        onChange={(e) => updateAddon(index, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Enter service price"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={addon.description}
                      onChange={(e) => updateAddon(index, 'description', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Describe the additional service"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Policies */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Policies</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cancellation Policy
                  </label>
                  <textarea
                    value={formData.cancellationPolicy}
                    onChange={(e) => handleInputChange('cancellationPolicy', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe your cancellation policy"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Terms
                  </label>
                  <textarea
                    value={formData.paymentTerms}
                    onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe your payment terms and conditions"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                onClick={() => router.push('/provider/videography')}
                variant="outline"
                className="px-8 py-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Service'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
