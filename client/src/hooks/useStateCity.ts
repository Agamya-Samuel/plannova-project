'use client';

import { useState, useEffect } from 'react';

// Interface for state data from API
interface State {
  iso2: string;
  name: string;
}

// Interface for city data from API
interface City {
  name: string;
}

/**
 * Custom hook to fetch and manage states and cities from the @countrystatecity package
 * Uses the API routes /api/states and /api/cities to fetch data server-side
 * 
 * @param selectedStateCode - The currently selected state code (ISO2 format)
 * @returns Object containing states array, cities array, loading states, and error handling
 */
export function useStateCity(selectedStateCode?: string) {
  // Store list of all Indian states
  const [states, setStates] = useState<State[]>([]);
  // Store list of cities for the selected state
  const [cities, setCities] = useState<City[]>([]);
  // Loading states for async operations
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  // Error handling
  const [error, setError] = useState<string | null>(null);

  // Load all Indian states from API route (runs once on mount)
  useEffect(() => {
    const loadStates = async () => {
      try {
        setLoadingStates(true);
        setError(null);
        
        // Fetch states from our API route (server-side where package works)
        const response = await fetch('/api/states');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch states: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.states)) {
          setStates(data.states);
        } else {
          throw new Error('Invalid states data format');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load states';
        console.error('Failed to load states:', message);
        setError(message);
        setStates([]);
      } finally {
        setLoadingStates(false);
      }
    };
    
    loadStates();
  }, []);

  // Load cities when state is selected (from API route)
  useEffect(() => {
    const loadCities = async () => {
      // Reset cities when no state is selected
      if (!selectedStateCode) {
        setCities([]);
        return;
      }
      
      try {
        setLoadingCities(true);
        setError(null);
        
        // Fetch cities from our API route
        // Note: API expects state code (ISO2 format), not state name
        const response = await fetch(`/api/cities?state=${selectedStateCode}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch cities: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.cities)) {
          setCities(data.cities);
        } else {
          throw new Error('Invalid cities data format');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load cities';
        console.error('Failed to load cities:', message);
        setError(message);
        setCities([]);
      } finally {
        setLoadingCities(false);
      }
    };
    
    loadCities();
  }, [selectedStateCode]);

  return {
    states,
    cities,
    loadingStates,
    loadingCities,
    error
  };
}

