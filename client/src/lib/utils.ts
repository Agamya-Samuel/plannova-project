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