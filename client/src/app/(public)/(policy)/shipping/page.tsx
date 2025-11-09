'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ShippingAndDeliveryPolicy() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-8 sm:p-10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Shipping & Delivery Policy</h1>
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
                <p className="text-gray-700">
                  For International buyers, orders are shipped and delivered through registered international courier companies and/or International speed post only. For domestic buyers, orders are shipped through registered domestic courier companies and /or speed post only. Orders are shipped within Not Applicable or as per the delivery date agreed at the time of order confirmation and delivering of the shipment subject to Courier Company / post office norms.
                </p>
                <p className="text-gray-700 mt-3">
                  DEEPAK KUMAR is not liable for any delay in delivery by the courier company / postal authorities and only guarantees to hand over the consignment to the courier company or postal authorities within Not Applicable rom the date of the order and payment or as per the delivery date agreed at the time of order confirmation.
                </p>
                <p className="text-gray-700 mt-3">
                  Delivery of all orders will be to the address provided by the buyer. Delivery of our services will be confirmed on your mail ID as specified during registration. For any issues in utilizing our services you may contact our helpdesk on 6388850059 or support@plannova.in
                </p>
              </section>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200">
            <p className="text-gray-600 text-sm text-center mb-4">
              © {new Date().getFullYear()} Plannova. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/terms" className="text-pink-600 hover:text-pink-800 text-sm">
                Terms & Conditions
              </Link>
              <Link href="/privacy" className="text-pink-600 hover:text-pink-800 text-sm">
                Privacy Policy
              </Link>
              <Link href="/refund-policy" className="text-pink-600 hover:text-pink-800 text-sm">
                Refund Policy
              </Link>
              <Link href="/cancellation-policy" className="text-pink-600 hover:text-pink-800 text-sm">
                Cancellation Policy
              </Link>
              <Link href="/contact" className="text-pink-600 hover:text-pink-800 text-sm">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}