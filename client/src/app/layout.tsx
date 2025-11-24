import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import FloatingNavDock from "@/components/layout/FloatingNavDock";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";
import { UMAMI_WEBSITE_ID, UMAMI_SCRIPT_URL } from "@/constants/umami";

// Configure Geist Sans font with fallbacks for better resilience
// If Google Fonts is unavailable during build, these fallbacks will be used
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Use fallback font until custom font loads
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Arial", "sans-serif"],
});

// Configure Geist Mono font with fallbacks for better resilience
// If Google Fonts is unavailable during build, these fallbacks will be used
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // Use fallback font until custom font loads
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
});

export const metadata: Metadata = {
  title: "Plannova - Event Venue Booking",
  description: "Find and book the perfect event venue for your special occasion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const showUmami = UMAMI_WEBSITE_ID && UMAMI_SCRIPT_URL;
  
  return (
    <html lang="en" className="bg-white" style={{ backgroundColor: '#ffffff' }}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900`}
        style={{ backgroundColor: '#ffffff', color: '#111827' }}
      >
        {showUmami && (
          <Script
            async
            src={UMAMI_SCRIPT_URL}
            data-website-id={UMAMI_WEBSITE_ID}
          />
        )}
        <AuthProvider>
          <Navbar />
          <main className="bg-white min-h-screen" style={{ backgroundColor: '#ffffff' }}>{children}</main>
          <FloatingNavDock />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}