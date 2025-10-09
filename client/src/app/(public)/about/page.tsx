'use client';

import { Button } from "@/components/ui/button";
import { Heart, Users, Camera, ShoppingCart, Sparkles, BookOpen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AboutUs() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-8 sm:p-10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">About Us</h1>
            <Button 
              onClick={handleGoBack}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              Back
            </Button>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

            <div className="space-y-8">
              <section>
                <p className="text-gray-700 text-lg">
                  India&apos;s favourite wedding planning website & app with over 1.5 million monthly dedicated users. Plannova is a swanky alternative to the outdated wedding planning process. A one-stop-shop for all things weddings, you can find inspiration, ideas and vendors within your budget. Plannova has been trusted by over 2 million brides & grooms all over the world to plan their big day. So sit back, log on to Plannova, and plan the wedding of your dreams!
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Make Planning Decisions</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-pink-50 p-6 rounded-lg">
                    <div className="flex items-center mb-4">
                      <Users className="h-8 w-8 text-pink-600 mr-3" />
                      <h3 className="text-xl font-semibold text-gray-900">Vendors</h3>
                    </div>
                    <p className="text-gray-700">
                      From photographers to wedding priests, Plannova has 80,000+ active vendors for you to choose from. Browse their portfolio, prices, genuine client reviews & much more to do your research and book just about any wedding vendor you might require.
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <div className="flex items-center mb-4">
                      <ShoppingCart className="h-8 w-8 text-purple-600 mr-3" />
                      <h3 className="text-xl font-semibold text-gray-900">Plannova Bridal Gallery / Shop</h3>
                    </div>
                    <p className="text-gray-700">
                      The Plannova Bridal Gallery is your one-stop wedding shop. Choose from 2000+ outfits and chat with the designer&apos;s team directly to find the outfit of your dreams. Kick-start your wedding shopping here from the comfort of your home!
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <div className="flex items-center mb-4">
                      <Sparkles className="h-8 w-8 text-blue-600 mr-3" />
                      <h3 className="text-xl font-semibold text-gray-900">Genie</h3>
                    </div>
                    <p className="text-gray-700">
                      Plannova Genie services can help you find the right vendor to fit your budget & style! Our Genie expert saves you the time & hassle of browsing through hundreds of profiles by suggesting only the most relevant vendors for your specific requirements.
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-6 rounded-lg">
                    <div className="flex items-center mb-4">
                      <Heart className="h-8 w-8 text-green-600 mr-3" />
                      <h3 className="text-xl font-semibold text-gray-900">Plannova Mynt</h3>
                    </div>
                    <p className="text-gray-700">
                      An exclusive loyalty program by Plannova for our brides-to-be and grooms-to-be, this allows access to special offers and benefits from 100+ premium brands across various categories like bridal wear, travel, jewellery, beauty and more!
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Still early stages in your journey? Get inspired and discover your own wedding style</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-yellow-50 p-6 rounded-lg">
                    <div className="flex items-center mb-4">
                      <Camera className="h-8 w-8 text-yellow-600 mr-3" />
                      <h3 className="text-xl font-semibold text-gray-900">Photos</h3>
                    </div>
                    <p className="text-gray-700">
                      With over 4 million photos, we just enough to have your wedding mood board in place! Right from trending bridal lehenga designs to fascinating decor details and stunning pre-wedding shoots, Plannova&apos;s Photo Gallery serves you a collection of the most dreamy wedding photos that perfectly sum up &apos;All Things Weddings&apos;.
                    </p>
                    <p className="text-gray-700 mt-3 italic">
                      P.S - Don&apos;t blame us if you&apos;re spoilt for choices
                    </p>
                  </div>
                  
                  <div className="bg-red-50 p-6 rounded-lg">
                    <div className="flex items-center mb-4">
                      <Heart className="h-8 w-8 text-red-600 mr-3" />
                      <h3 className="text-xl font-semibold text-gray-900">Real Weddings</h3>
                    </div>
                    <p className="text-gray-700">
                      Every couple has a tale to tell. Whether it is a wedding thriller or a magical fairytale, we have immortalised tons of real couples&apos; stories on our Real Weddings section. With over 1,000 stories to cherish and bonus inspiration for us!
                    </p>
                  </div>
                  
                  <div className="bg-indigo-50 p-6 rounded-lg">
                    <div className="flex items-center mb-4">
                      <BookOpen className="h-8 w-8 text-indigo-600 mr-3" />
                      <h3 className="text-xl font-semibold text-gray-900">Blog</h3>
                    </div>
                    <p className="text-gray-700">
                      That would be your chock-a-block for all your wedding &quot;wows&quot;! 5000+ blogs dedicated to a mixed-platter of the latest wedding trends & ideas to serve you with just the right amount of wedding inspiration you need to kickstart your wedding planning.
                    </p>
                  </div>
                </div>
              </section>

              <section className="text-center py-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Ready to Plan Your Dream Wedding?</h2>
                <p className="text-gray-700 mb-6">
                  Join millions of couples who have found their perfect wedding vendors through Plannova
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link href="/auth/register">
                    <Button className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3 text-lg">
                      Sign Up Today
                    </Button>
                  </Link>
                  <Link href="/vendors">
                    <Button variant="outline" className="border-2 border-pink-600 text-pink-600 hover:bg-pink-50 px-8 py-3 text-lg">
                      Browse Vendors
                    </Button>
                  </Link>
                </div>
              </section>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200">
            <p className="text-gray-600 text-sm text-center">
              © {new Date().getFullYear()} Plannova. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}