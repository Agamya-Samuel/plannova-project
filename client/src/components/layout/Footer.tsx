import Link from "next/link";
import { Heart } from "lucide-react";
import { COMMIT_HASH } from "@/lib/commitHash";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">Plannova</h3>
            <p className="text-gray-300 mb-4 max-w-md">
              Making your event planning journey seamless and memorable with the best venues and services.
            </p>
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Plannova. All rights reserved.
            </p>
            {/* Display commit hash */}
            <p className="text-gray-500 text-xs mt-2">
              Version: {COMMIT_HASH}
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/venues" className="text-gray-300 hover:text-white transition-colors">
                  Venues
                </Link>
              </li>
              <li>
                <Link href="/vendors" className="text-gray-300 hover:text-white transition-colors">
                  Vendors
                </Link>
              </li>
              <li>
                <Link href="/past-events" className="text-gray-300 hover:text-white transition-colors">
                  Past Events
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="text-gray-300 hover:text-white transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/cancellation-policy" className="text-gray-300 hover:text-white transition-colors">
                  Cancellation Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-gray-300 hover:text-white transition-colors">
                  Shipping & Delivery Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            Made with <Heart className="inline h-4 w-4 text-pink-500" /> for people planning their perfect events
          </p>
        </div>
      </div>
    </footer>
  );
}