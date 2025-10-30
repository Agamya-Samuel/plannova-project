'use client';

import Link from 'next/link';

// VenueTypesSection: Lightweight chips linking to venue types
// Uses URL query so the venues page can filter accordingly
export default function VenueTypesSection() {
  // Keep a small curated list to avoid clutter
  const venueTypes: Array<{ label: string; type: string; cities: string }> = [
    { label: 'Luxury Hotels', type: 'Hotel', cities: 'Mumbai | Bangalore | Delhi' },
    { label: 'Banquet Halls', type: 'Banquet Hall', cities: 'Mumbai | Bangalore | Pune' },
    { label: 'Resorts', type: 'Resort', cities: 'Lonavala | Coorg | Ooty' },
    { label: 'Rooftop Venues', type: 'Rooftop', cities: 'Mumbai | Bangalore | Hyderabad' },
    { label: 'Farmhouses', type: 'Farmhouse', cities: 'Delhi | Gurgaon | Pune' },
    { label: 'Conference Centers', type: 'Conference Center', cities: 'Mumbai | Delhi | Bangalore' },
  ];

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
                <span className="text-pink-600 font-semibold">View →</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


