'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useStateCity } from '@/hooks/useStateCity';

// Interface for state data
interface State {
  iso2: string;
  name: string;
}

/**
 * Props for StateCitySelect component
 */
interface StateCitySelectProps {
  // Current selected state value (can be state name or ISO2 code)
  selectedState: string;
  // Current selected city value
  selectedCity: string;
  // Callback when state changes - receives state name
  onStateChange: (stateName: string) => void;
  // Callback when city changes - receives city name
  onCityChange: (cityName: string) => void;
  // Optional className for styling
  className?: string;
  // Optional label for state field
  stateLabel?: string;
  // Optional label for city field
  cityLabel?: string;
  // Whether fields are required
  required?: boolean;
  // Whether city field should be disabled when no state is selected
  disableCityWhenNoState?: boolean;
}

/**
 * Helper function to find state by value (ISO2 code or name)
 * Moved outside component to avoid recreation on every render
 */
const findStateByValue = (value: string, statesList: State[]): State | undefined => {
  if (!value || statesList.length === 0) return undefined;
  
  // First try to find by ISO2 code
  const byCode = statesList.find(s => s.iso2.toUpperCase() === value.toUpperCase());
  if (byCode) return byCode;
  
  // Then try to find by name
  return statesList.find(s => s.name === value);
};

/**
 * Reusable component for state and city selection using @countrystatecity package
 * 
 * This component:
 * - Fetches states from /api/states API route
 * - Fetches cities from /api/cities API route when state is selected
 * - Handles state selection by ISO2 code but displays state name
 * - Provides dropdowns for both state and city selection
 * - Automatically resets city when state changes
 */
export default function StateCitySelect({
  selectedState,
  selectedCity,
  onStateChange,
  onCityChange,
  className = '',
  stateLabel = 'State *',
  cityLabel = 'City *',
  required = true,
  disableCityWhenNoState = true
}: StateCitySelectProps) {

  // Local state to track the state code (ISO2) for fetching cities
  // This is set immediately when user selects a state, or derived from selectedState prop
  const [stateCodeForCities, setStateCodeForCities] = useState<string>('');
  
  // Internal state to track the selected state ISO2 code for the select element
  // This ensures the select value updates immediately when user selects a state
  // without waiting for the parent's state update to propagate back
  const [selectedStateIso2, setSelectedStateIso2] = useState<string>('');

  // IMPORTANT: Use the hook ONLY ONCE to avoid creating multiple hook instances
  // The hook loads states (always on mount) and cities (when stateCodeForCities is provided)
  // Previously, calling it twice caused state synchronization issues
  const { states, cities, loadingStates, loadingCities } = useStateCity(stateCodeForCities);
  
  // Find the current state from the loaded states based on selectedState prop
  // This helps sync the state code when component receives a state name from parent
  const currentState = useMemo(() => {
    return findStateByValue(selectedState, states);
  }, [selectedState, states]);

  // Update internal state and state code when current state is found from prop
  // This ensures cities are loaded when component receives selectedState prop
  useEffect(() => {
    if (currentState) {
      // Update both the select value and state code if we found a matching state
      if (currentState.iso2 !== stateCodeForCities) {
        setStateCodeForCities(currentState.iso2);
      }
      if (currentState.iso2 !== selectedStateIso2) {
        setSelectedStateIso2(currentState.iso2);
      }
    } else if (!selectedState) {
      // Clear both if selectedState prop is cleared
      if (stateCodeForCities) {
        setStateCodeForCities('');
      }
      if (selectedStateIso2) {
        setSelectedStateIso2('');
      }
    }
  }, [currentState, selectedState, stateCodeForCities, selectedStateIso2]);

  // Handle state selection change
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIso2 = e.target.value;
    
    // Update internal state immediately so the select shows the selected value right away
    setSelectedStateIso2(selectedIso2);
    
    if (!selectedIso2) {
      onStateChange('');
      onCityChange(''); // Reset city when state is cleared
      setStateCodeForCities(''); // Clear state code immediately
      return;
    }

    // Find the state by ISO2 code and pass the state name to the callback
    const state = states.find(s => s.iso2 === selectedIso2);
    if (state) {
      // Update state code immediately so cities can be fetched right away
      setStateCodeForCities(state.iso2);
      onStateChange(state.name);
      onCityChange(''); // Reset city when state changes
    }
  };

  // Handle city selection change
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onCityChange(e.target.value);
  };

  // Use internal state for select value to ensure immediate update
  // Fall back to currentState.iso2 if internal state is not set (for initial render)
  const currentStateIso2 = selectedStateIso2 || currentState?.iso2 || '';

  return (
    <>
      {/* State Selection Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {stateLabel}
        </label>
        <select
          value={currentStateIso2}
          onChange={handleStateChange}
          className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 ${className}`}
          required={required}
          disabled={loadingStates}
        >
          <option value="" className="text-gray-900">
            {loadingStates ? 'Loading states...' : 'Select state'}
          </option>
          {states.map(state => (
            <option key={state.iso2} value={state.iso2} className="text-gray-900">
              {state.name}
            </option>
          ))}
        </select>
      </div>

      {/* City Selection Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {cityLabel}
        </label>
        <select
          value={selectedCity}
          onChange={handleCityChange}
          className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-900 ${className}`}
          required={required}
          disabled={disableCityWhenNoState ? !currentStateIso2 || loadingCities : loadingCities}
        >
          <option value="" className="text-gray-900">
            {loadingCities 
              ? 'Loading cities...' 
              : !currentStateIso2 
                ? 'Select state first' 
                : 'Select city'}
          </option>
          {cities.map(city => (
            <option key={city.name} value={city.name} className="text-gray-900">
              {city.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

