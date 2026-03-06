import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Explicitly set the root directory for Turbopack to avoid conflicts with multiple lockfiles
  // Only set turbopack.root when not in Vercel environment
  ...(process.env.VERCEL ? {} : {
    turbopack: {
      root: path.resolve('.')
    }
  }),
  // eslint: {
  //   // Allow production builds to complete even with ESLint errors
  //   ignoreDuringBuilds: true,
  // },
  typescript: {
    // Allow production builds to complete even with TypeScript errors
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      // Allow images from anywhere (Pinterest, Drive proxies, Cloudinary, etc.)
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn-prod.plannova.in',
        port: '',
        pathname: '/**',

      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's3.tebi.io',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;