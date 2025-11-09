'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ContactUs() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-8 sm:p-10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Contact Us</h1>
            <Button 
              onClick={handleGoBack}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              Back
            </Button>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-sm text-gray-500 mb-8">Last updated on Nov 9th 2025</p>

            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Get in Touch</h2>
                <p className="text-gray-700">
                  You may contact us using the information below:
                </p>
                
                <div className="mt-6 space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Merchant Legal Entity Name</h3>
                    <p className="text-gray-700">DEEPAK KUMAR</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900">Registered Address</h3>
                    <p className="text-gray-700">
                      Gram - Toderpur, Bansgaon, Azamgargh<br />
                      Azamgarh UTTAR PRADESH 276126
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900">Operational Address</h3>
                    <p className="text-gray-700">
                      Gram - Toderpur, Bansgaon, Azamgargh<br />
                      Azamgarh UTTAR PRADESH 276126
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900">Telephone</h3>
                    <p className="text-gray-700">6388850059</p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900">Email</h3>
                    <p className="text-gray-700">support@plannova.in</p>
                  </div>
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