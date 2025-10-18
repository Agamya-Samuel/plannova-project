'use client';

import React from 'react';
import { Input } from './input';

interface LocationData {
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface LocationInputProps {
  data: LocationData;
  onChange: (data: LocationData) => void;
  className?: string;
}

const states = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Puducherry'
];

export default function LocationInput({
  data,
  onChange,
  className = ""
}: LocationInputProps) {
  const handleFieldChange = (field: keyof LocationData, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
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
          value={data.address}
          onChange={(e) => handleFieldChange('address', e.target.value)}
          placeholder="Enter your service address"
          required
          className="text-black"
        />
        <p className="text-xs text-gray-500 mt-1">This can be your kitchen location or main service area</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City *
          </label>
          <Input
            type="text"
            value={data.city}
            onChange={(e) => handleFieldChange('city', e.target.value)}
            placeholder="Enter city"
            required
            className="text-black"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State *
          </label>
          <select
            value={data.state}
            onChange={(e) => handleFieldChange('state', e.target.value)}
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
            value={data.pincode}
            onChange={(e) => handleFieldChange('pincode', e.target.value)}
            placeholder="Enter pincode"
            required
            className="text-black"
          />
        </div>
      </div>
    </div>
  );
}
