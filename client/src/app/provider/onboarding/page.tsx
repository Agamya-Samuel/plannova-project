'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { ServiceCategory } from '../../../types/auth';
import { MapPin, Utensils, Camera, Video, Music, Heart, Flower } from 'lucide-react';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';

// Service categories with icons and descriptions
const serviceCategories = [
  {
    id: 'venue' as ServiceCategory,
    name: 'Venue Service',
    icon: MapPin,
    description: 'Wedding venues, reception halls, and event spaces'
  },
  {
    id: 'catering' as ServiceCategory,
    name: 'Catering Service',
    icon: Utensils,
    description: 'Food services, catering packages, and culinary experiences'
  },
  {
    id: 'photography' as ServiceCategory,
    name: 'Photography Service',
    icon: Camera,
    description: 'Wedding photography, portrait sessions, and photo services'
  },
  {
    id: 'videography' as ServiceCategory,
    name: 'Videography Service',
    icon: Video,
    description: 'Wedding videography, highlight reels, and video services'
  },
  {
    id: 'music' as ServiceCategory,
    name: 'Music & Entertainment Service',
    icon: Music,
    description: 'DJ, bands, and entertainment services'
  },
  {
    id: 'makeup' as ServiceCategory,
    name: 'Bridal Makeup Service',
    icon: Heart,
    description: 'Bridal makeup, hair styling, and beauty services'
  },
  {
    id: 'decoration' as ServiceCategory,
    name: 'Decoration Service',
    icon: Flower,
    description: 'Event decoration and floral arrangements'
  }
];

export default function ProviderOnboardingPage() {
  const router = useRouter();
  const { user, updateServiceCategories } = useAuth();
  const [selectedCategories, setSelectedCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if user is not a provider or already completed onboarding
  useEffect(() => {
    if (user && user.role !== 'PROVIDER') {
      router.push('/dashboard');
    } else if (user && user.serviceCategories && user.serviceCategories.length > 0) {
      // Redirect to the appropriate service section based on selected category
      const selectedService = user.serviceCategories[0];
      switch (selectedService) {
        case 'venue':
          router.push('/provider/venues');
          break;
        case 'catering':
          router.push('/provider/catering');
          break;
        case 'photography':
          router.push('/provider/photography');
          break;
        case 'videography':
          router.push('/provider/videography');
          break;
        case 'music':
          router.push('/provider/entertainment');
          break;
        case 'makeup':
          router.push('/provider/beauty');
          break;
        case 'decoration':
          router.push('/provider/decoration');
          break;
        default:
          router.push('/dashboard');
      }
    }
  }, [user, router]);

  const handleSubmit = async () => {
    if (selectedCategories.length === 0) {
      setError('Please select at least one service category');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      // Allow multiple service categories to be selected
      await updateServiceCategories(selectedCategories);
      
      // Redirect to the first selected service section
      const firstCategory = selectedCategories[0];
      switch (firstCategory) {
        case 'venue':
          router.push('/provider/venues');
          break;
        case 'catering':
          router.push('/provider/catering');
          break;
        case 'photography':
          router.push('/provider/photography');
          break;
        case 'videography':
          router.push('/provider/videography');
          break;
        case 'music':
          router.push('/provider/entertainment');
          break;
        case 'makeup':
          router.push('/provider/beauty');
          break;
        case 'decoration':
          router.push('/provider/decoration');
          break;
        default:
          router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save service categories');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== 'PROVIDER') {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Provider Onboarding</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Welcome! To get started, please select the service categories you offer.
              You can add or remove services later in your settings.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">What services do you offer?</h2>
            <p className="text-gray-600 mb-8">
              Select one or more service categories - you can update this later in your settings.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {serviceCategories.map((category) => {
                const IconComponent = category.icon;
                const isSelected = selectedCategories.includes(category.id);
                
                return (
                  <div
                    key={category.id}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCategories(selectedCategories.filter(cat => cat !== category.id));
                      } else {
                        setSelectedCategories([...selectedCategories, category.id]);
                      }
                    }}
                    className={`border-2 rounded-xl p-6 cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'border-pink-500 bg-pink-50 ring-2 ring-pink-200' 
                        : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className={`p-3 rounded-lg ${isSelected ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600'}`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                      </div>
                      {isSelected && (
                        <div className="ml-auto">
                          <div className="h-6 w-6 rounded-full bg-pink-500 flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-white"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-blue-50 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">Important Information</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                    <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                  </div>
                  <span>You can select one or more service categories</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                    <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                  </div>
                  <span>Based on your first selection, we will redirect you to the relevant management section</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                    <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                  </div>
                  <span>You can add detailed service information and pricing after this step</span>
                </li>
              </ul>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={isLoading || selectedCategories.length === 0}
                className={`px-8 py-3 rounded-xl font-medium transition-all ${
                  isLoading || selectedCategories.length === 0
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-pink-600 text-white hover:bg-pink-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isLoading ? 'Saving...' : 'Continue to Service Dashboard'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}