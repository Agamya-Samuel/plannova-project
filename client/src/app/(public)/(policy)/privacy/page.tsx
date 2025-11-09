'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function PrivacyPolicy() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-8 sm:p-10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
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
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Introduction</h2>
                <p className="text-gray-700">
                  Plannova (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;, &quot;Plannova&quot;) is committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website plannova.com (the &quot;Site&quot;) or use our services.
                </p>
                <p className="text-gray-700 mt-3">
                  By using our Site or services, you consent to the data practices described in this statement. We undertake to be compliant with all necessary legal requirements and are committed to protecting your personal data.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Information We Collect</h2>
                <p className="text-gray-700">
                  In the course of our business of helping you plan your events, we collect certain information from you. The types of personal information we may collect include:
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-700">
                  <li><strong>Identity Information:</strong> Name, gender, age</li>
                  <li><strong>Contact Information:</strong> Email address, phone number, mailing address</li>
                  <li><strong>Technical Information:</strong> Device details, IP address, browsing information</li>
                  <li><strong>Usage Information:</strong> Preferences, intent, search history, interactions with our services</li>
                  <li><strong>Communication Information:</strong> SMS, app install and usage data</li>
                  <li><strong>Profile Information:</strong> Images for personalizing your profile, reviews submitted</li>
                </ul>
                <p className="text-gray-700 mt-3">
                  We collect this information when you register on our Site, place an order, subscribe to our newsletter, respond to a survey, fill out a form, or enter information on our Site.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">How We Use Your Information</h2>
                <p className="text-gray-700">
                  We use the information we collect about you for the following purposes:
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-700">
                  <li>To personalize your experience and to allow us to deliver the type of content and product offerings in which you are most interested</li>
                  <li>To improve our website in order to better serve you</li>
                  <li>To allow us to better service you in responding to your customer service requests</li>
                  <li>To quickly process your transactions</li>
                  <li>To send periodic emails regarding your order or other products and services</li>
                  <li>To follow up with them after correspondence (live chat, email, or phone inquiries)</li>
                  <li>To provide you with information, products or services that you request from us</li>
                  <li>To fulfill any other purpose for which you provide it</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Sharing and Disclosure</h2>
                <p className="text-gray-700">
                  We do not sell, trade, or otherwise transfer to outside parties your Personally Identifiable Information unless we provide users with advance notice. This does not include website hosting partners and other parties who assist us in operating our website, conducting our business, or serving our users, so long as those parties agree to keep this information confidential.
                </p>
                <p className="text-gray-700 mt-3">
                  We may also release information when its release is appropriate to comply with the law, enforce our site policies, or protect ours or others&apos; rights, property or safety.
                </p>
                <p className="text-gray-700 mt-3">
                  However, non-personally identifiable visitor information may be provided to other parties for marketing, advertising, or other uses.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Third-Party Services</h2>
                <p className="text-gray-700">
                  We use various third-party services to help us operate our business and the Site or to assist us in understanding how our users engage with our content. These third parties may use cookies, web beacons, and other technologies to collect information about your use of our Site and other websites, including your IP address, browser type, internet service provider, referring/exit pages, and date/time stamps.
                </p>
                <p className="text-gray-700 mt-3">
                  These services include but are not limited to:
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-2 text-gray-700">
                  <li><strong>Analytics:</strong> Firebase, Google Analytics, Clevertap</li>
                  <li><strong>Communication:</strong> Sendgrid, Mailchimp, Karix, One direct, Gupshup, Branch.io</li>
                  <li><strong>Payment Processing:</strong> Reputed third-party gateways (we do not store credit card information)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Security</h2>
                <p className="text-gray-700">
                  We implement a variety of security measures to maintain the safety of your personal information. Your personal information is contained behind secured networks and is only accessible by a limited number of persons who have special access rights to such systems, and are required to keep the information confidential.
                </p>
                <p className="text-gray-700 mt-3">
                  We treat data as an asset that must be protected against loss and unauthorized access. We employ many different security techniques to protect such data from unauthorized access by members inside and outside the company. However, &quot;perfect security&quot; does not exist on the Internet, or anywhere else in the world! You therefore agree that any security breaches beyond the control of our standard security procedures are at your sole risk and discretion.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Content on the Site</h2>
                <p className="text-gray-700">
                  Plannova features some of the latest trends in events and tries to give its users exposure to quality hand-picked content. In our endeavor, we feature pictures and stories from various real events and vendors. Vendors are expected to take utmost care to obtain permission/hold copyright of images given to us.
                </p>
                <p className="text-gray-700 mt-3">
                  In the unlikely event of anyone having any objection to content put up on our site, they are free to contact us immediately and we&apos;ll be happy to consider their request and take necessary action.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">User Account and Password</h2>
                <p className="text-gray-700">
                  You are responsible for all actions taken with your login information and password, including fees. Therefore, we do not recommend that you disclose your account password or login information to any third parties.
                </p>
                <p className="text-gray-700 mt-3">
                  If you lose control of your password, you may lose substantial control over your personally identifiable information and may be subject to legally binding actions taken on your behalf. Therefore, if your password has been compromised for any reason, you should immediately change your password.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Deletion</h2>
                <p className="text-gray-700">
                  Users can request deletion of data across all platforms. Requests for deletion can be sent via both Android and iOS applications. Alternatively, a user can write to us at privacy@plannova.com.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Updates to Privacy Policy</h2>
                <p className="text-gray-700">
                  We reserve the right to revise these Privacy Policies from time to time by updating this posting. Such revised policies will take effect as of the date of posting. We encourage you to frequently check this page for any changes to stay informed about how we are protecting your information.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact Us</h2>
                <p className="text-gray-700">
                  If you have any questions about this Privacy Policy, please contact us at:
                </p>
                <p className="text-gray-700 mt-2">
                  <strong>Email:</strong> privacy@plannova.in
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