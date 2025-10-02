// Venue-related types for the frontend
export interface VenueImage {
  _id?: string;
  url: string;
  alt: string;
  category: 'main' | 'gallery' | 'room' | 'food' | 'decoration' | 'amenity';
  isPrimary: boolean;
}

export interface VenueAddress {
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface VenueContact {
  phone: string;
  email: string;
  whatsapp?: string;
  website?: string;
}

export interface VenueCapacity {
  min: number;
  max: number;
}

export interface Amenity {
  _id?: string;
  name: string;
  description?: string;
  included: boolean;
  additionalCost?: number;
}

export interface FoodOption {
  _id?: string;
  name: string;
  description: string;
  price: number;
  cuisine: string[];
  isVeg: boolean;
  isVegan?: boolean;
  servingSize: string;
}

export interface DecorationOption {
  _id?: string;
  name: string;
  description: string;
  price: number;
  theme: string;
  includes: string[];
  duration: string;
}

export interface AddonService {
  _id?: string;
  name: string;
  description: string;
  price: number;
  category: string;
  includes: string[];
  duration?: string;
}

export interface VenueAvailability {
  date: Date;
  isAvailable: boolean;
  slots?: string[];
  specialPrice?: number;
}

export interface VenueReview {
  _id?: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  images?: string[];
  date: Date;
  verified: boolean;
}

export type VenueStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type VenueType = 'Banquet Hall' | 'Hotel' | 'Resort' | 'Outdoor' | 'Palace' | 'Farmhouse';

export interface Venue {
  _id: string;
  providerId: string;
  name: string;
  description: string;
  type: VenueType;
  status: VenueStatus;
  
  // Location & Contact
  address: VenueAddress;
  contact: VenueContact;
  
  // Capacity & Pricing
  capacity: VenueCapacity;
  basePrice: number;
  pricePerGuest?: number;
  
  // Images
  images: VenueImage[];
  
  // Amenities & Features
  amenities: Amenity[];
  features: string[];
  
  // Service Options
  foodOptions: FoodOption[];
  decorationOptions: DecorationOption[];
  addonServices: AddonService[];
  
  // Policies
  cancellationPolicy: string;
  advancePayment: number;
  
  // Availability
  availability: VenueAvailability[];
  isAlwaysAvailable: boolean;
  
  // Reviews & Ratings
  reviews: VenueReview[];
  averageRating: number;
  totalReviews: number;
  
  // Metadata
  isActive: boolean;
  isVerified: boolean;
  verificationDate?: Date;
  createdAt: string;
  updatedAt: string;
  
  // Populated fields (when provider is populated)
  provider?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export interface VenueFilters {
  city?: string;
  type?: VenueType | '';
  minCapacity?: number;
  maxCapacity?: number;
  minPrice?: number;
  maxPrice?: number;
  features?: string[];
  sortBy?: 'name' | 'price' | 'rating' | 'capacity' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface VenuePagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface VenuesResponse {
  venues: Venue[];
  pagination: VenuePagination;
}

// Form data types
export interface VenueFormData {
  name: string;
  description: string;
  type: VenueType | '';
  address: VenueAddress;
  contact: VenueContact;
  capacity: VenueCapacity;
  basePrice: number;
  pricePerGuest?: number;
  advancePayment: number;
  cancellationPolicy: string;
  amenities: Amenity[];
  features: string[];
  foodOptions: FoodOption[];
  decorationOptions: DecorationOption[];
  addonServices: AddonService[];
}

// Customer booking related types
export interface VenueBookingSelection {
  venueId: string;
  eventDate: Date;
  guestCount: number;
  selectedFoodOptions: string[];
  selectedDecorationOptions: string[];
  selectedAddonServices: string[];
  specialRequests?: string;
}

export interface VenueBookingQuote {
  venueId: string;
  basePrice: number;
  guestCharges: number;
  foodCharges: number;
  decorationCharges: number;
  addonCharges: number;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
}

// API response types
export interface CreateVenueResponse {
  message: string;
  venue: Venue;
}

export interface UpdateVenueResponse {
  message: string;
  venue: Venue;
}

export interface DeleteVenueResponse {
  message: string;
}

export interface SubmitVenueResponse {
  message: string;
  venue: Venue;
}

export interface AddReviewResponse {
  message: string;
}