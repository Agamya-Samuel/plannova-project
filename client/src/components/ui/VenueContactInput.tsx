'use client';

import React from 'react';
import { Input } from './input';
import PhoneInputField from './PhoneInputField';

interface VenueContactData {
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
}

interface VenueContactInputProps {
  data: VenueContactData;
  onChange: (data: VenueContactData) => void;
  className?: string;
}

export default function VenueContactInput({
  data,
  onChange,
  className = ""
}: VenueContactInputProps) {
  const handleFieldChange = (field: keyof VenueContactData, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PhoneInputField
          label="Phone Number"
          value={data.phone}
          onChange={(value) => handleFieldChange('phone', value)}
          placeholder="Enter phone number"
          required
          helperText="This will be your primary contact number"
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <Input
            type="email"
            value={data.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            placeholder="venue@example.com"
            required
            className="text-black"
          />
          <p className="text-xs text-gray-500 mt-1">We&apos;ll use this email for important notifications and bookings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PhoneInputField
          label="WhatsApp Number"
          value={data.whatsapp}
          onChange={(value) => handleFieldChange('whatsapp', value)}
          placeholder="Enter WhatsApp number"
          helperText="Optional - for WhatsApp business inquiries"
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website URL
          </label>
          <Input
            type="url"
            value={data.website}
            onChange={(e) => handleFieldChange('website', e.target.value)}
            placeholder="https://www.yourvenuewebsite.com"
            className="text-black"
          />
          <p className="text-xs text-gray-500 mt-1">Optional - your venue&apos;s website</p>
        </div>
      </div>
    </div>
  );
}
