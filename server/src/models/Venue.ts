import mongoose, { Document, Schema } from 'mongoose';

// Define VenueType enum
export enum VenueType {
  BANQUET_HALL = 'Banquet Hall',
  HOTEL = 'Hotel',
  RESORT = 'Resort',
  OUTDOOR = 'Outdoor',
  PALACE = 'Palace',
  FARMHOUSE = 'Farmhouse'
}

// Define VenueStatus enum
export enum VenueStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
  PENDING_EDIT = 'PENDING_EDIT' // New status for pending edits
}

// Interface for Food Options
export interface IFoodOption {
  name: string;
  description: string;
  price: number;
  cuisine: string[];
  isVeg: boolean;
  isVegan?: boolean;
  servingSize: string;
}

// Interface for Decoration Options
export interface IDecorationOption {
  name: string;
  description: string;
  price: number;
  theme: string;
  includes: string[];
  duration: string;
}

// Interface for Add-on Services
export interface IAddonService {
  name: string;
  description: string;
  price: number;
  category: string; // 'photography', 'music', 'lighting', 'transport', etc.
  includes: string[];
  duration?: string;
}

// Interface for Venue Amenities
export interface IAmenity {
  name: string;
  description?: string;
  included: boolean;
  additionalCost?: number;
}

// Interface for Venue Images
export interface IVenueImage {
  url: string;
  alt: string;
  category: 'main' | 'gallery' | 'room' | 'food' | 'decoration' | 'amenity';
  isPrimary: boolean;
}

// Interface for Contact Information
export interface IContactInfo {
  phone: string;
  email: string;
  website?: string;
}

// Interface for Address
export interface IAddress {
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

// Interface for Availability
export interface IAvailability {
  date: Date;
  isAvailable: boolean;
  slots?: string[];
  specialPrice?: number;
}

// Interface for Blocked Dates (manually marked as unavailable)
export interface IBlockedDate {
  date: Date;
  reason?: string; // Optional reason for blocking (e.g., "Offline booking", "Maintenance")
  blockedAt: Date; // When this date was blocked
}

// Interface for Unblocking History (audit trail for unblocked dates)
export interface IUnblockHistory {
  date: Date; // The date that was unblocked
  reason: string; // Reason for unblocking (e.g., "Cancel Booking", "Reject Booking")
  originalBlockReason?: string; // What was the original blocking reason
  unblockedAt: Date; // When the date was unblocked
  unblockedBy: mongoose.Types.ObjectId; // Provider who unblocked it
}

// Interface for Reviews
export interface IReview {
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  rating: number;
  comment: string;
  images?: string[];
  date: Date;
  verified: boolean;
}

// Main Venue interface
export interface IVenue extends Document {
  providerId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  type: VenueType;
  status: VenueStatus;
  
  // Location & Contact
  address: IAddress;
  contact: IContactInfo;
  
  // Capacity & Pricing
  capacity: {
    min: number;
    max: number;
  };
  basePrice: number;
  pricePerGuest?: number;
  
  // Images
  images: IVenueImage[];
  
  // Amenities & Features
  amenities: IAmenity[];
  features: string[];
  
  // Service Options
  foodOptions: IFoodOption[];
  decorationOptions: IDecorationOption[];
  addonServices: IAddonService[];
  
  // Policies
  cancellationPolicy: string;
  advancePayment: number; // percentage
  
  // Availability
  availability: IAvailability[];
  isAlwaysAvailable: boolean;
  blockedDates: IBlockedDate[]; // Manually blocked dates (offline bookings, maintenance, etc.)
  unblockHistory: IUnblockHistory[]; // Audit trail of unblocked dates
  
  // Reviews & Ratings
  reviews: IReview[];
  averageRating: number;
  totalReviews: number;
  
  // Pending edits for approved venues
  pendingEdits?: Partial<IVenue>; // Store pending edits for approved venues
  pendingEditSubmittedAt?: Date; // When the pending edit was submitted
  
  // Soft Delete Fields
  isDeleted: boolean;
  deletedAt?: Date;
  
  // Metadata
  isActive: boolean;
  isVerified: boolean;
  verificationDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Create the Venue schema
const VenueSchema: Schema<IVenue> = new Schema({
  providerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  type: {
    type: String,
    enum: Object.values(VenueType),
    required: true
  },
  status: {
    type: String,
    enum: Object.values(VenueStatus),
    default: VenueStatus.DRAFT
  },
  
  // Location & Contact
  address: {
    street: { type: String, required: true },
    area: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  contact: {
    phone: { type: String, required: true },
    email: { type: String, required: true },
    website: String
  },
  
  // Capacity & Pricing
  capacity: {
    min: { type: Number, required: true, min: 1 },
    max: { type: Number, required: true, min: 1 }
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  pricePerGuest: {
    type: Number,
    min: 0
  },
  
  // Images
  images: [{
    url: { type: String, required: true },
    alt: { type: String, required: true },
    category: {
      type: String,
      enum: ['main', 'gallery', 'room', 'food', 'decoration', 'amenity'],
      default: 'gallery'
    },
    isPrimary: { type: Boolean, default: false }
  }],
  
  // Amenities & Features
  amenities: [{
    name: { type: String, required: true },
    description: String,
    included: { type: Boolean, default: true },
    additionalCost: { type: Number, min: 0 }
  }],
  features: [{
    type: String,
    trim: true
  }],
  
  // Service Options
  foodOptions: [{
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true, min: 0 },
    cuisine: [String],
    isVeg: { type: Boolean, required: true },
    isVegan: Boolean,
    servingSize: String
  }],
  decorationOptions: [{
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true, min: 0 },
    theme: String,
    includes: [String],
    duration: String
  }],
  addonServices: [{
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true, min: 0 },
    category: String,
    includes: [String],
    duration: String
  }],
  
  // Policies
  cancellationPolicy: {
    type: String,
    required: true
  },
  advancePayment: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  
  // Availability
  availability: [{
    date: { type: Date, required: true },
    isAvailable: { type: Boolean, default: true },
    slots: [String],
    specialPrice: Number
  }],
  isAlwaysAvailable: {
    type: Boolean,
    default: true
  },
  
  // Blocked Dates (manually marked as unavailable)
  blockedDates: [{
    date: { type: Date, required: true },
    reason: { type: String, trim: true },
    blockedAt: { type: Date, default: Date.now }
  }],
  
  // Unblock History (audit trail)
  unblockHistory: [{
    date: { type: Date, required: true },
    reason: { type: String, required: true, trim: true },
    originalBlockReason: { type: String, trim: true },
    unblockedAt: { type: Date, default: Date.now },
    unblockedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  }],
  
  // Reviews & Ratings
  reviews: [{
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000 },
    images: [String],
    date: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false }
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Pending edits for approved venues
  pendingEdits: {
    type: Schema.Types.Mixed,
    default: null
  },
  pendingEditSubmittedAt: {
    type: Date
  },
  
  // Soft Delete Fields
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  },
  
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDate: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
VenueSchema.index({ providerId: 1, status: 1 });
VenueSchema.index({ 'address.city': 1, type: 1, isActive: 1 });
VenueSchema.index({ averageRating: -1 });
VenueSchema.index({ basePrice: 1 });
VenueSchema.index({ 'capacity.min': 1, 'capacity.max': 1 });

// Virtual for provider information
VenueSchema.virtual('provider', {
  ref: 'User',
  localField: 'providerId',
  foreignField: '_id',
  justOne: true
});

// Method to calculate average rating
VenueSchema.methods.calculateAverageRating = function() {
  if (this.reviews.length === 0) {
    this.averageRating = 0;
    this.totalReviews = 0;
  } else {
    const sum = this.reviews.reduce((acc: number, review: IReview) => acc + review.rating, 0);
    this.averageRating = Math.round((sum / this.reviews.length) * 10) / 10;
    this.totalReviews = this.reviews.length;
  }
  return this.save();
};

// Method to add review
VenueSchema.methods.addReview = function(customerId: string, customerName: string, rating: number, comment: string, images?: string[]) {
  this.reviews.push({
    customerId,
    customerName,
    rating,
    comment,
    images: images || [],
    date: new Date(),
    verified: false
  });
  return this.calculateAverageRating();
};

// Pre-save middleware to ensure only one primary image per category
VenueSchema.pre('save', function(next) {
  if (this.isModified('images')) {
    const categories = ['main', 'gallery', 'room', 'food', 'decoration', 'amenity'];
    
    categories.forEach(category => {
      const categoryImages = this.images.filter(img => img.category === category);
      const primaryImages = categoryImages.filter(img => img.isPrimary);
      
      if (primaryImages.length > 1) {
        // Keep only the first primary image, set others to false
        categoryImages.forEach((img, index) => {
          if (img.isPrimary && index > 0) {
            img.isPrimary = false;
          }
        });
      }
    });
  }
  next();
});

// Create and export the model
const Venue = mongoose.model<IVenue>('Venue', VenueSchema);
export default Venue;