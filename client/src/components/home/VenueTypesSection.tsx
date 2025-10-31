'use client';

import Link from 'next/link';
import { VENUE_TYPES } from '@/constants/venueTypes';

// VenueTypesSection: Lightweight chips linking to venue types
// Uses URL query so the venues page can filter accordingly
// Only shows venue types that are available in the venue creation form
export default function VenueTypesSection() {
  // Map venue types to display-friendly labels and cities
  // Only include types that exist in the venue creation form
  const venueTypeLabels: { [key: string]: { label: string; cities: string } } = {
    'Hotel': { label: 'Luxury Hotels', cities: 'Mumbai | Bangalore | Delhi' },
    'Banquet Hall': { label: 'Banquet Halls', cities: 'Mumbai | Bangalore | Pune' },
    'Resort': { label: 'Resorts', cities: 'Lonavala | Coorg | Ooty' },
    'Outdoor': { label: 'Outdoor Venues', cities: 'Mumbai | Chennai | Delhi' },
    'Palace': { label: 'Palaces', cities: 'Jaipur | Jodhpur | Udaipur' },
    'Farmhouse': { label: 'Farmhouses', cities: 'Delhi | Gurgaon | Pune' }
  };

  // Create array from the shared venue types constant
  const venueTypes = VENUE_TYPES.map(type => ({
    label: venueTypeLabels[type]?.label || type,
    type: type,
    cities: venueTypeLabels[type]?.cities || 'Mumbai | Delhi | Bangalore'
  }));

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">Explore by Venue Type</h2>
          <p className="text-gray-600">Quickly jump to popular venue types</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {venueTypes.map((v) => (
            <Link
              key={v.label}
              href={`/venues?type=${encodeURIComponent(v.type)}`}
              className="group block rounded-2xl border border-gray-200 bg-white hover:border-pink-200 hover:shadow-md transition-all duration-300 p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 group-hover:text-pink-700">{v.label}</h3>
                  <p className="text-xs md:text-sm text-gray-600">{v.cities}</p>
                </div>
                <span className="text-pink-600 font-semibold">View more →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


