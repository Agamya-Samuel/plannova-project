/**
 * Venue Types Constants
 * 
 * This file defines the standard venue types available throughout the application.
 * These types are used in:
 * - Venue creation/edit forms
 * - Venues listing page filters
 * - Home page category display
 * 
 * IMPORTANT: When updating these types, ensure all pages using venue types are updated.
 */

// Standard venue types that can be selected when creating/editing a venue
export const VENUE_TYPES = [
  'Banquet Hall',
  'Hotel',
  'Resort',
  'Outdoor',
  'Palace',
  'Farmhouse'
] as const;

// Type for venue type strings
export type VenueType = typeof VENUE_TYPES[number];

