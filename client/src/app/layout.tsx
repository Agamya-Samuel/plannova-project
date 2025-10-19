import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";
import { UMAMI_WEBSITE_ID, UMAMI_SCRIPT_URL } from "@/constants/umami";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Plannova - Wedding Hall Booking",
  description: "Find and book the perfect wedding venue for your special day",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const showUmami = UMAMI_WEBSITE_ID && UMAMI_SCRIPT_URL;
  
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
          <main>{children}</main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}