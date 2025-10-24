'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function RefundPolicy() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-8 sm:p-10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Refund & Cancellation Policy</h1>
            <Button 
              onClick={handleGoBack}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              Back
            </Button>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Refund Policy</h2>
                <p className="text-gray-700">
                  Unless explicitly specified otherwise, all purchases done on Plannova are non-refundable. This includes purchases by end-customers of products like &apos;E-invites, Makeup services etc&apos; as well as purchases by event businesses, and vendors.
                </p>
                <p className="text-gray-700 mt-3">
                  However, when a vendor is booked by a user, after discovering them on Plannova, the vendor&apos;s &apos;Refund &amp; cancellation&apos; policy will be applicable on those bookings. In case the same isn&apos;t explicitly shared, we recommend for the same to be checked before booking.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Plannova&apos;s Rights</h2>
                <p className="text-gray-700">
                  Plannova reserves the power to restrict, totally or partially, the access of certain users, and to cancel, suspend, block, edit, or delete certain type of content, or cancel the accounts of users who misuse the Website, if Plannova acquires actual knowledge that the activity or stored information is unlawful or harms property or rights of another, for example (but not restricted to) cases of plagiarism.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">How to Request a Refund or Cancellation</h2>
                <p className="text-gray-700">
                  To request a refund or cancellation, please contact the service provider directly as per their policy. You can also contact our customer support team at support@plannova.com for assistance, but please note that the service provider&apos;s policy will govern any refunds or cancellations.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Changes to This Policy</h2>
                <p className="text-gray-700">
                  We may update our Refund & Cancellation Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Us</h2>
                <p className="text-gray-700">
                  If you have any questions about our Refund & Cancellation Policy, please contact us at:
                </p>
                <p className="text-gray-700 mt-2">
                  <strong>Email:</strong> support@plannova.in
                </p>
                <p className="text-gray-700 mt-1">
                  <strong>Phone:</strong> +1 (555) 123-4567
                </p>
                <p className="text-gray-700 mt-1">
                  <strong>Address:</strong> Plannova Inc., 123 Event Plaza, San Francisco, CA 94102
                </p>
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