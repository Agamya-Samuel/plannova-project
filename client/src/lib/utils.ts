import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes a phone number to E.164 format
 * If the number doesn't have a country code, assumes it's an Indian number (+91)
 * @param phoneNumber - The phone number to normalize (can be in various formats)
 * @returns The phone number in E.164 format (e.g., +919693690545) or empty string if invalid
 */
export function normalizePhoneNumber(phoneNumber: string | undefined | null): string {
  if (!phoneNumber) return '';
  
  // Remove all whitespace and special characters except +
  const cleaned = phoneNumber.trim().replace(/\s+/g, '');
  
  // If already in E.164 format (starts with +), return as is
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  
  // If it starts with country code without + (e.g., 919693690545), add +
  if (cleaned.startsWith('91') && cleaned.length >= 12) {
    return `+${cleaned}`;
  }
  
  // If it's just digits (Indian number without country code), add +91
  if (/^\d+$/.test(cleaned) && cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  
  // If it's 11 digits and starts with 0 (common Indian format like 09693690545), remove 0 and add +91
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `+91${cleaned.substring(1)}`;
  }
  
  // Return as is if we can't determine the format (let the phone input library handle it)
  return cleaned;
}

/**
 * Ensures an image URL is a full URL (http:// or https://) for Next.js Image component
 * If the URL is an S3 key (starts with "uploads/"), it converts it to a full URL
 * This is a safety measure in case the backend doesn't transform the URL
 * @param urlOrKey - The image URL or S3 key
 * @returns A full URL that Next.js Image can use
 */
export function ensureImageUrl(urlOrKey: string | undefined | null): string {
  if (!urlOrKey) {
    return '/placeholder-image.jpg'; // Fallback placeholder
  }

  // If already a full URL (starts with http:// or https://), return as is
  if (urlOrKey.startsWith('http://') || urlOrKey.startsWith('https://')) {
    return urlOrKey;
  }

  // If it's an S3 key (starts with "uploads/"), we need to convert it to a full URL
  // Since we don't have direct access to S3 config in frontend, we'll use the API base URL
  // and construct a proxy endpoint, or use environment variables if available
  if (urlOrKey.startsWith('uploads/')) {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const s3Endpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT;
    const s3Bucket = process.env.NEXT_PUBLIC_S3_BUCKET;
    const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL;

    // Remove leading slash if present
    const cleanKey = urlOrKey.startsWith('/') ? urlOrKey.slice(1) : urlOrKey;

    // Try to use CDN URL first (production)
    if (cdnUrl && cdnUrl.trim() !== '') {
      const baseUrl = cdnUrl.endsWith('/') ? cdnUrl.slice(0, -1) : cdnUrl;
      return `${baseUrl}/${cleanKey}`;
    }

    // Try to use S3 endpoint (development)
    if (nodeEnv === 'development' && s3Endpoint && s3Bucket) {
      const endpoint = s3Endpoint.endsWith('/') ? s3Endpoint.slice(0, -1) : s3Endpoint;
      return `${endpoint}/${s3Bucket}/${cleanKey}`;
    }

    // Fallback: Log warning and return a data URL placeholder to prevent Next.js error
    // The backend should be transforming these, so this shouldn't normally happen
    console.warn('Image URL is an S3 key but no S3 endpoint or CDN URL configured. Backend should transform this:', urlOrKey);
    // Return a placeholder to prevent Next.js error
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+PC9zdmc+';
  }

  // If it starts with "/", it's a relative path - return as is (Next.js will handle it)
  if (urlOrKey.startsWith('/')) {
    return urlOrKey;
  }

  // Otherwise, treat as relative path and add leading slash
  return `/${urlOrKey}`;
}