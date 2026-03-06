'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
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

// Share menu item component - defined outside to avoid recreation on each render
interface ShareMenuItemProps {
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  iconColor?: string;
}

const ShareMenuItem = ({
  onClick,
  icon: Icon,
  label,
  iconColor = 'text-gray-700'
}: ShareMenuItemProps) => (
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

export default function SocialShare({
  url,
  title,
  description = '',
  imageUrl, // Currently unused - reserved for future use or commented-out native share code
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

  // Build formatted share message in the requested format:
  // Title + Content excerpt + "Read more: [URL]"
  // This is used by all share platforms for consistency
  const buildFormattedShareMessage = (maxContentLength: number = 200): string => {
    const shareUrl = getShareUrl();

    // Ensure title is always included - use fallback if empty
    const blogTitle = title && title.trim() ? title.trim() : 'Blog Post';

    // Get blog content - use description (full content) if available
    const blogContent = description && description.trim() && description !== title
      ? description.trim()
      : '';

    // Build message in the requested format:
    // 1. Blog title (ALWAYS included)
    // 2. Blog content (truncated if too long)
    // 3. "Read more: [URL]"
    let message = `${blogTitle}\n\n`;

    // Add content if available (truncate to specified length)
    if (blogContent) {
      const truncatedContent = blogContent.length > maxContentLength
        ? blogContent.substring(0, maxContentLength) + '...'
        : blogContent;
      message += `${truncatedContent}\n\n`;
    }

    // Add "Read more:" prefix before URL
    message += `Read more: ${shareUrl}`;

    return message;
  };

  // Use native Web Share API when available
  // For blog sharing, we prefer custom menu for better control over message format
  const handleNativeShare = async () => {
    // ALWAYS show custom menu for blogs to ensure title and content are included
    // Native share API often ignores text field when url is provided
    setIsMenuOpen(true);
    return;

    // Original native share code (commented out - use custom menu instead)
    /*
    if (!isWebShareAvailable()) {
      // Fallback to custom menu if Web Share API is not available
      setIsMenuOpen(true);
      return;
    }

    try {
      // NEW APPROACH: Put everything in the text field to ensure title and content are included
      // Some platforms ignore text when url is provided separately, so we include URL in text too
      const shareUrl = getShareUrl();

      // Ensure title is always included - use fallback if empty
      const blogTitle = title && title.trim() ? title.trim() : 'Blog Post';

      const blogContent = description && description.trim() && description !== title
        ? description.trim()
        : '';

      // Build complete message with title, content, and URL all in text field
      // Format: Title first, then content, then "Read more: [URL]"
      let shareText = `${blogTitle}\n\n`;

      // Add content if available (truncate for chat messages)
      if (blogContent) {
        // Truncate content to ~200 characters for better chat display
        const maxContentLength = 200;
        const truncatedContent = blogContent.length > maxContentLength
          ? blogContent.substring(0, maxContentLength) + '...'
          : blogContent;
        shareText += `${truncatedContent}\n\n`;
      }

      // Add "Read more:" prefix before URL - URL is included in text field
      shareText += `Read more: ${shareUrl}`;

      // Debug: Log what we're sharing to verify title is included
      console.log('Native share - Complete text:', shareText);
      console.log('Native share - Title:', blogTitle);
      console.log('Native share - URL:', shareUrl);

      // CRITICAL FIX: Use ONLY text field, NO separate url field
      // Many platforms ignore text when url is provided separately
      // By putting URL in text field and NOT providing separate url, we force platform to use text
      // The URL is still in the text, so it will be clickable in most apps
      const shareData: ShareData = {
        title: blogTitle, // Title for apps that use this field
        text: shareText, // Complete message: title + content + "Read more: URL" (URL included in text)
        // NOTE: Intentionally NOT including separate url field
        // This forces platforms to use the text field which contains everything
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
    */
  };

  // Share on Facebook
  // NOTE: Facebook's sharer.php only accepts URL parameter - it doesn't support pre-filling text
  // We copy the formatted message to clipboard so user can paste it manually
  const shareOnFacebook = () => {
    const shareUrl = getShareUrl();
    const formattedMessage = buildFormattedShareMessage(200);

    // Copy formatted message to clipboard FIRST (before opening Facebook)
    // This ensures user has the message ready to paste
    navigator.clipboard.writeText(formattedMessage).then(() => {
      // Open Facebook sharer
      // Facebook will use Open Graph tags from the page for preview
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
      window.open(facebookUrl, '_blank', 'width=600,height=400');
      setIsMenuOpen(false);

      // Show clear instructions to user
      toast.success(
        'Formatted message copied! Facebook opened - paste the message (Ctrl+V / Cmd+V) in the post box.',
        {
          duration: 6000,
        }
      );
    }).catch(() => {
      // If clipboard fails, still open Facebook but show different message
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
      window.open(facebookUrl, '_blank', 'width=600,height=400');
      setIsMenuOpen(false);

      toast.warning(
        'Facebook opened! Note: Facebook doesn\'t support pre-filling text. The URL will show a preview card.',
        {
          duration: 5000,
        }
      );
    });
  };

  // Share on Twitter/X
  // Format: Blog title, content excerpt, then "Read more: [URL]"
  // Twitter has a 280 character limit, so we truncate content appropriately
  const shareOnTwitter = () => {
    // Twitter adds "https://t.co/..." which is ~23 chars, so we need to account for that
    // Also account for "Read more: " prefix (11 chars) and URL in the message
    const urlLength = 23; // Twitter shortens URLs to ~23 chars
    const prefixLength = 11; // "Read more: " prefix
    const titleLength = (title && title.trim() ? title.trim() : 'Blog Post').length + 2; // Title + "\n\n"

    // Calculate available space for content (280 - title - "Read more: URL" - buffer)
    const maxContentLength = 280 - titleLength - prefixLength - urlLength - 10; // 10 char buffer

    // Build formatted message with appropriate content length for Twitter
    const formattedMessage = buildFormattedShareMessage(Math.max(50, maxContentLength)); // Min 50 chars

    // Twitter will use Twitter Card meta tags from the page for image preview
    // Put everything in text parameter (Twitter will extract URL automatically)
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(formattedMessage)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    setIsMenuOpen(false);
  };

  // Share on LinkedIn
  // NOTE: LinkedIn's share API doesn't support pre-filling text via summary parameter reliably
  // We copy the formatted message to clipboard so user can paste it manually
  const shareOnLinkedIn = () => {
    const shareUrl = getShareUrl();
    // LinkedIn supports longer text, so we can use more content (300 chars)
    const formattedMessage = buildFormattedShareMessage(300);

    // Copy formatted message to clipboard FIRST (before opening LinkedIn)
    // This ensures user has the message ready to paste
    navigator.clipboard.writeText(formattedMessage).then(() => {
      // Open LinkedIn sharer
      // LinkedIn will use Open Graph tags from the page for preview
      const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
      window.open(linkedInUrl, '_blank', 'width=600,height=400');
      setIsMenuOpen(false);

      // Show clear instructions to user
      toast.success(
        'Formatted message copied! LinkedIn opened - paste the message (Ctrl+V / Cmd+V) in the post box.',
        {
          duration: 6000,
        }
      );
    }).catch(() => {
      // If clipboard fails, still open LinkedIn but show different message
      const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
      window.open(linkedInUrl, '_blank', 'width=600,height=400');
      setIsMenuOpen(false);

      toast.warning(
        'LinkedIn opened! Note: LinkedIn doesn\'t support pre-filling text. The URL will show a preview card.',
        {
          duration: 5000,
        }
      );
    });
  };

  // Share on WhatsApp
  // Format: Blog title, content excerpt, then "Read more: [URL]"
  // This matches the format requested by user for chat sharing
  const shareOnWhatsApp = () => {
    // Use the same formatted message as other platforms
    const formattedMessage = buildFormattedShareMessage(200);

    // Debug: Log what we're sharing to verify title is included
    console.log('WhatsApp share message:', formattedMessage);

    // Encode the entire message and share
    const encodedMessage = encodeURIComponent(formattedMessage);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
    setIsMenuOpen(false);
  };

  // Copy link to clipboard
  // Format: Blog title, content excerpt, then "Read more: [URL]"
  // This ensures when pasted in chat, users see title, content preview, and clickable URL
  const copyToClipboard = async () => {
    try {
      // Use the same formatted message as other platforms for consistency
      const textToCopy = buildFormattedShareMessage(200);

      // Debug: Log what we're copying to verify title is included
      console.log('Copying to clipboard:', textToCopy);

      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success('Link with title copied to clipboard!');
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
          {/* Backdrop - z-[55] to be above dock but below menu */}
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55]"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu Container - Positioned above the button on desktop, centered on mobile */}
          {/* z-[60] ensures it appears above floating dock (z-50) */}
          <div className="
            fixed md:absolute z-[60]
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
