'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ProfileImageProps {
  src?: string | null;
  alt: string;
  size: 'sm' | 'md' | 'lg';
  firstName?: string;
  lastName?: string;
  className?: string;
}

const sizeClasses = {
  sm: { container: 'w-8 h-8', text: 'text-sm' },
  md: { container: 'w-10 h-10', text: 'text-base' },
  lg: { container: 'w-20 h-20', text: 'text-2xl' },
};

export const ProfileImage: React.FC<ProfileImageProps> = ({
  src,
  alt,
  size,
  firstName = '',
  lastName = '',
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Debug: Log what we received
  React.useEffect(() => {
    console.log('🖼️ ProfileImage component received:', {
      src,
      alt,
      firstName,
      lastName,
      hasValidSrc: !!(src && src.trim()),
    });
  }, [src, alt, firstName, lastName]);

  const handleImageError = () => {
    console.log('❌ Profile image failed to load:', src);
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    console.log('✅ Profile image loaded successfully:', src);
    setIsLoading(false);
  };

  const showFallback = !src || imageError;
  const initials = `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`;
  const sizeConfig = sizeClasses[size];

  if (showFallback) {
    return (
      <div
        className={`${sizeConfig.container} bg-gradient-to-r from-pink-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold ${
          size === 'lg' ? 'border-4 border-white/30 shadow-lg' : 'border-2 border-pink-200'
        } ${className}`}
      >
        <span className={sizeConfig.text}>
          {initials || '?'}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative ${sizeConfig.container} ${className}`}>
      {/* Loading placeholder */}
      {isLoading && (
        <div className={`absolute inset-0 ${sizeConfig.container} bg-gradient-to-r from-pink-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold`}>
          <span className={sizeConfig.text}>
            {initials || '?'}
          </span>
        </div>
      )}
      
      {/* Actual image */}
      <Image
        src={src}
        alt={alt}
        width={size === 'lg' ? 80 : size === 'md' ? 40 : 32}
        height={size === 'lg' ? 80 : size === 'md' ? 40 : 32}
        className={`rounded-full object-cover ${
          size === 'lg' ? 'border-4 border-white/30 shadow-lg' : 'border-2 border-pink-200'
        } ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        unoptimized // This allows external URLs to work without domain configuration
      />
    </div>
  );
};

export default ProfileImage;