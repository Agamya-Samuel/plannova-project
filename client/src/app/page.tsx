'use client';

import Link from "next/link";
import Image from "next/image";
import { Button } from "../components/ui/button";
import { Search, MapPin, Users, Star, Heart, Calendar } from "lucide-react";
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  const handleCategoryClick = (categoryTitle: string) => {
    // Map category titles to venue types for filtering
    const venueTypeMap: { [key: string]: string } = {
      'Luxury Hotels': 'Hotel',
      'Banquet Halls': 'Banquet Hall',
      'Garden Venues': 'Resort'
    };
    
    const venueType = venueTypeMap[categoryTitle];
    if (venueType) {
      // Navigate to venues page with filter parameter
      router.push(`/venues?type=${encodeURIComponent(venueType)}`);
    } else {
      // Fallback to general venues page
      router.push('/venues');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Background Image */}
      <div className="relative min-h-[80vh] bg-gradient-to-r from-pink-600 to-purple-600 overflow-hidden">
        {/* Background Image Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1519741497674-611481863552?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')"
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-600/80 to-purple-600/80" />
        
        {/* Hero Content */}
        <div className="relative z-10 flex items-center justify-center min-h-[80vh] px-4">
          <div className="text-center text-white max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Your Wedding, <span className="text-pink-200">Your Way</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-pink-100 max-w-2xl mx-auto">
              Find the best wedding venues with thousands of trusted reviews
            </p>
            
            {/* Search Bar */}
            <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-4xl mx-auto mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <select className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-700">
                    <option>Select city</option>
                    <option>Mumbai</option>
                    <option>Delhi</option>
                    <option>Bangalore</option>
                    <option>Chennai</option>
                    <option>Pune</option>
                  </select>
                </div>
                
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <select className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent text-gray-700">
                    <option>Select venue type</option>
                    <option>Banquet Halls</option>
                    <option>Hotels</option>
                    <option>Resorts</option>
                    <option>Outdoor Venues</option>
                    <option>Destination Wedding</option>
                  </select>
                </div>
                
                <Button 
                  size="lg" 
                  className="bg-pink-600 hover:bg-pink-700 text-white py-3 px-8 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105"
                >
                  <Search className="mr-2 h-5 w-5" />
                  Get Started
                </Button>
              </div>
            </div>
            
            {/* Popular Searches */}
            <div className="text-left max-w-4xl mx-auto">
              <p className="text-pink-100 mb-3 font-medium">Popular Searches:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Wedding Venues in Mumbai",
                  "Banquet Halls in Delhi",
                  "Destination Weddings",
                  "Beach Resorts",
                  "Palace Weddings"
                ].map((search, index) => (
                  <span 
                    key={index}
                    className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm hover:bg-white/30 cursor-pointer transition-all duration-300"
                  >
                    {search}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Venue Categories */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Venue Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the perfect venue for your special day
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Luxury Hotels",
                image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                venues: "250+ Venues",
                location: "Mumbai | Bangalore | Delhi"
              },
              {
                title: "Banquet Halls",
                image: "https://images.unsplash.com/photo-1542665952-14513db15293?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                venues: "180+ Venues",
                location: "Mumbai | Bangalore | Pune"
              },
              {
                title: "Garden Venues",
                image: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
                venues: "120+ Venues",
                location: "Mumbai | Chennai | Delhi"
              }
            ].map((category, index) => (
              <div 
                key={index} 
                className="group cursor-pointer"
                onClick={() => handleCategoryClick(category.title)}
              >
                <div className="relative overflow-hidden rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-105">
                  <Image 
                    src={category.image} 
                    alt={category.title}
                    width={800}
                    height={256}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-6 left-6 text-white">
                    <h3 className="text-2xl font-bold mb-2">{category.title}</h3>
                    <p className="text-pink-200 font-medium">{category.venues}</p>
                    <p className="text-sm text-gray-300">{category.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why Choose Plannova */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Plannova?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We make your wedding planning journey seamless and memorable
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Star className="h-12 w-12 text-pink-600" />,
                title: "Verified Reviews",
                description: "Read authentic reviews from real couples"
              },
              {
                icon: <Heart className="h-12 w-12 text-pink-600" />,
                title: "Curated Selection",
                description: "Hand-picked venues for your perfect day"
              },
              {
                icon: <Calendar className="h-12 w-12 text-pink-600" />,
                title: "Easy Booking",
                description: "Book instantly with real-time availability"
              },
              {
                icon: <Users className="h-12 w-12 text-pink-600" />,
                title: "Expert Support",
                description: "Dedicated support throughout your journey"
              }
            ].map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow duration-300">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Plan Your Dream Wedding?
          </h2>
          <p className="text-xl text-pink-100 mb-8 max-w-2xl mx-auto">
            Join thousands of couples who found their perfect wedding venue through Plannova
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" className="bg-white text-pink-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold rounded-xl transition-all duration-300 transform hover:scale-105">
                Sign Up Today
              </Button>
            </Link>
            <Link href="/venues">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-pink-600 px-8 py-3 text-lg font-semibold rounded-xl transition-all duration-300">
                Browse Venues
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
