'use client';

import React from 'react';
import { Input } from './input';

interface BasicInfoData {
  name: string;
  description: string;
  basePrice?: number;
}

interface BasicInfoInputProps {
  data: BasicInfoData;
  onChange: (data: BasicInfoData) => void;
  serviceType: string;
  className?: string;
}

export default function BasicInfoInput({
  data,
  onChange,
  serviceType,
  className = ""
}: BasicInfoInputProps) {
  const handleFieldChange = (field: keyof BasicInfoData, value: string | number) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {serviceType} Service Name *
        </label>
        <Input
          type="text"
          value={data.name}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          placeholder={`e.g., Premium ${serviceType} Services, Royal ${serviceType} Company`}
          required
          className="text-black"
        />
        <p className="text-xs text-gray-500 mt-1">Choose a memorable name that reflects your brand</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          value={data.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          placeholder={`Describe your ${serviceType.toLowerCase()} service, specialties, experience, and what makes you unique...`}
          rows={4}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-black placeholder-gray-400"
          required
          minLength={10}
          maxLength={2000}
        />
        <div className="flex justify-between text-sm text-black mt-1">
          <span>Minimum 10 characters required</span>
          <span className={`${data.description.length > 2000 ? 'text-red-600 font-medium' : 'text-black'}`}>
            {data.description.length}/2000
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">Include your specialties, experience, and what makes your service unique</p>
      </div>

      {data.basePrice !== undefined && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Starting Price (₹) *
          </label>
          <Input
            type="number"
            value={data.basePrice}
            onChange={(e) => handleFieldChange('basePrice', Number(e.target.value))}
            placeholder="e.g., 15000"
            min="0"
            required
            className="text-black"
          />
          <p className="text-xs text-gray-500 mt-1">This is your starting price - you can adjust for different packages</p>
        </div>
      )}
    </div>
  );
}
