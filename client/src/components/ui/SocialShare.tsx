'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  MessageCircle, 
  Mail, 
  Link as LinkIcon,
  Share2,
  X
} from 'lucide-react';
import { toast } from 'sonner';

// SocialShare: A professional sharing component that uses native Web Share API when available,
// or falls back to a custom share menu with all social media options.
// This provides a clean, official sharing experience similar to mobile and desktop native share dialogs.

interface SocialShareProps {
  // The URL to share - will be constructed from current page if not provided
  url?: string;
  // Title of the content being shared
  title: string;
  // Optional description/excerpt for the content
  description?: string;
  // Optional image URL for better social media previews
  imageUrl?: string;
  // Custom styling classes for the share button
  className?: string;
  // Button variant: 'button' (default) or 'icon'
  variant?: 'button' | 'icon';
}

export default function SocialShare({
  url,
  title,
  description = '',
  imageUrl,
  className = '',
  variant = 'button'
}: SocialShareProps) {
  // Track if share menu is open
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Track if link was copied to show feedback
  const [copied, setCopied] = useState(false);
  // Reference to the menu container for click outside detection
  const menuRef = useRef<HTMLDivElement>(null);
  // Reference to the button to calculate position
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get the current page URL if not provided
  const getShareUrl = (): string => {
    if (url) return url;
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  };

  // Get the share text combining title and description
  const getShareText = (): string => {
    const text = description ? `${title} - ${description}` : title;
    // Truncate to reasonable length for social media
    return text.length > 200 ? text.substring(0, 197) + '...' : text;
  };

  // Check if Web Share API is available (mobile devices, some browsers)
  const isWebShareAvailable = (): boolean => {
    return typeof navigator !== 'undefined' && 'share' in navigator;
  };

  // Use native Web Share API when available
  const handleNativeShare = async () => {
    if (!isWebShareAvailable()) {
      // Fallback to custom menu if Web Share API is not available
      setIsMenuOpen(true);
      return;
    }

    try {
      const shareData: ShareData = {
        title: title,
        text: description || title,
        url: getShareUrl(),
      };

      // Add image if available (some browsers support this)
      if (imageUrl) {
        try {
          // Try to fetch and convert image to blob for sharing
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const file = new File([blob], 'share-image.jpg', { type: blob.type });
          // Some browsers support files property for sharing images
          (shareData as ShareData & { files?: File[] }).files = [file];
        } catch {
          // If image sharing fails, continue without image
          console.log('Image sharing not supported, continuing without image');
        }
      }

      await navigator.share(shareData);
      // Close menu if it was open
      setIsMenuOpen(false);
    } catch (err: unknown) {
      // User cancelled or error occurred
      const error = err as { name?: string };
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', err);
        // Fallback to custom menu on error
        setIsMenuOpen(true);
      }
    }
  };

  // Share on Facebook
  // Facebook uses Open Graph meta tags from the page, but we ensure the URL is shared correctly
  const shareOnFacebook = () => {
    const shareUrl = getShareUrl();
    // Facebook will automatically fetch Open Graph tags including og:image from the page
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    setIsMenuOpen(false);
  };

  // Share on Twitter/X
  // Twitter uses Twitter Card meta tags, but we can include image in some cases
  const shareOnTwitter = () => {
    const shareUrl = getShareUrl();
    const shareText = getShareText();
    // Twitter will use Twitter Card meta tags from the page for image preview
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    setIsMenuOpen(false);
  };

  // Share on LinkedIn
  // LinkedIn uses Open Graph meta tags from the page
  const shareOnLinkedIn = () => {
    const shareUrl = getShareUrl();
    const shareText = getShareText();
    // LinkedIn will automatically fetch Open Graph tags including og:image from the page
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareText)}`;
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
    setIsMenuOpen(false);
  };

  // Share on WhatsApp
  // WhatsApp can display image previews from Open Graph tags, and we include image URL in message
  const shareOnWhatsApp = () => {
    const shareUrl = getShareUrl();
    const shareText = getShareText();
    // Include image URL in WhatsApp message if available for better preview
    const message = imageUrl 
      ? `${shareText}\n\n${imageUrl}\n\n${shareUrl}`
      : `${shareText}\n\n${shareUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setIsMenuOpen(false);
  };

  // Share via Email
  // Include image URL in email body for better presentation
  const shareViaEmail = () => {
    const shareUrl = getShareUrl();
    const shareText = getShareText();
    const subject = encodeURIComponent(title);
    // Include image URL in email body if available
    const emailBody = imageUrl
      ? `${shareText}\n\nImage: ${imageUrl}\n\nRead more: ${shareUrl}`
      : `${shareText}\n\n${shareUrl}`;
    const body = encodeURIComponent(emailBody);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setIsMenuOpen(false);
  };

  // Copy link to clipboard
  const copyToClipboard = async () => {
    const shareUrl = getShareUrl();
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setIsMenuOpen(false);
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy link. Please try again.');
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Close menu on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  // Share menu item component
  const ShareMenuItem = ({ 
    onClick, 
    icon: Icon, 
    label, 
    iconColor = 'text-gray-700'
  }: { 
    onClick: () => void; 
    icon: React.ElementType; 
    label: string; 
    iconColor?: string;
  }) => (
    <button
      onClick={onClick}
      className="
        w-full flex items-center gap-4 px-4 py-3
        hover:bg-gray-50 active:bg-gray-100
        transition-colors duration-150
        text-left
      "
      aria-label={`Share on ${label}`}
    >
      <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0`} />
      <span className="text-gray-900 font-medium">{label}</span>
    </button>
  );

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Share Button */}
      <button
        ref={buttonRef}
        onClick={handleNativeShare}
        className={`
          ${variant === 'icon' 
            ? 'p-2 rounded-full hover:bg-gray-100' 
            : 'px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-medium'
          }
          flex items-center gap-2
          transition-all duration-200
          active:scale-95
        `}
        aria-label="Share"
        aria-expanded={isMenuOpen}
        aria-haspopup="true"
      >
        <Share2 className={`${variant === 'icon' ? 'h-5 w-5' : 'h-4 w-4'}`} />
        {variant === 'button' && <span>Share</span>}
      </button>

      {/* Share Menu Dropdown */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu Container - Positioned above the button on desktop, centered on mobile */}
          <div className="
            fixed md:absolute z-50 
            md:w-64 w-[calc(100vw-2rem)] max-w-sm
            bg-white rounded-xl shadow-2xl
            border border-gray-200
            overflow-hidden
            animate-in fade-in slide-in-from-top-2 duration-200
            md:bottom-full md:mb-2 md:right-0
            left-1/2 -translate-x-1/2 md:translate-x-0
            top-1/2 -translate-y-1/2 md:top-auto md:translate-y-0
          ">
            {/* Menu Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Share</h3>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close share menu"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <ShareMenuItem
                onClick={shareOnFacebook}
                icon={Facebook}
                label="Facebook"
                iconColor="text-[#1877F2]"
              />
              
              <ShareMenuItem
                onClick={shareOnTwitter}
                icon={Twitter}
                label="Twitter"
                iconColor="text-[#1DA1F2]"
              />
              
              <ShareMenuItem
                onClick={shareOnLinkedIn}
                icon={Linkedin}
                label="LinkedIn"
                iconColor="text-[#0077B5]"
              />
              
              <ShareMenuItem
                onClick={shareOnWhatsApp}
                icon={MessageCircle}
                label="WhatsApp"
                iconColor="text-[#25D366]"
              />
              
              <ShareMenuItem
                onClick={shareViaEmail}
                icon={Mail}
                label="Email"
                iconColor="text-gray-600"
              />
              
              <div className="border-t border-gray-200 my-1" />
              
              <button
                onClick={copyToClipboard}
                className="
                  w-full flex items-center gap-4 px-4 py-3
                  hover:bg-gray-50 active:bg-gray-100
                  transition-colors duration-150
                  text-left
                "
                aria-label="Copy link"
              >
                <LinkIcon className={`h-5 w-5 ${copied ? 'text-green-600' : 'text-gray-700'} flex-shrink-0`} />
                <span className="text-gray-900 font-medium">
                  {copied ? 'Link Copied!' : 'Copy Link'}
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
