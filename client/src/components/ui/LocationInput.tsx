'use client';

import React from 'react';
import { Input } from './input';
import StateCitySelect from './StateCitySelect';

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

/**
 * LocationInput component for service location entry
 * Uses StateCitySelect component which fetches states and cities from @countrystatecity package
 */
export default function LocationInput({
  data,
  onChange,
  className = ""
}: LocationInputProps) {
  // Handle field changes for address and pincode
  const handleFieldChange = (field: keyof LocationData, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  // Handle state change from StateCitySelect component
  const handleStateChange = (stateName: string) => {
    handleFieldChange('state', stateName);
  };

  // Handle city change from StateCitySelect component
  const handleCityChange = (cityName: string) => {
    handleFieldChange('city', cityName);
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
        {/* State selection using @countrystatecity package */}
        <StateCitySelect
          selectedState={data.state}
          selectedCity={data.city}
          onStateChange={handleStateChange}
          onCityChange={handleCityChange}
          stateLabel="State *"
          cityLabel="City *"
          required={true}
        />
        
        {/* Pincode field */}
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
