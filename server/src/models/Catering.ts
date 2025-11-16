import mongoose, { Document, Schema } from 'mongoose';

// Define approval status enum
export enum ApprovalStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PENDING_EDIT = 'PENDING_EDIT' // New status for pending edits
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

// Define the Catering interface
export interface ICatering extends Document {
  name: string;
  description: string;
  provider: mongoose.Types.ObjectId; // Reference to User document
  serviceLocation: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  contact: {
    phone: string;
    email: string;
  };
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  cuisineTypes: string[];
  serviceTypes: string[];
  dietaryOptions: string[];
  addons: Array<{
    name: string;
    description: string;
    price: number;
  }>;
  basePrice: number;
  minGuests?: number;
  cancellationPolicy?: string;
  paymentTerms?: string;
  rating: number;
  reviewCount: number;
  status: ApprovalStatus;
  // Add pending edits field for approved services
  pendingEdits?: Partial<ICatering>;
  pendingEditSubmittedAt?: Date;
  // Blocked dates for offline bookings
  blockedDates: IBlockedDate[]; // Manually blocked dates (offline bookings, maintenance, etc.)
  unblockHistory: IUnblockHistory[]; // Audit trail of unblocked dates
  // Soft Delete Fields
  isDeleted: boolean;
  deletedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Create the Catering schema
const CateringSchema: Schema<ICatering> = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  provider: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceLocation: {
    address: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    pincode: {
      type: String,
      required: true,
      trim: true
    }
  },
  contact: {
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    }
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      required: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  cuisineTypes: [{
    type: String,
    required: true
  }],
  serviceTypes: [{
    type: String,
    required: true
  }],
  dietaryOptions: [{
    type: String
  }],
  addons: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  minGuests: {
    type: Number,
    min: 1
  },
  cancellationPolicy: {
    type: String,
    trim: true
  },
  paymentTerms: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: Object.values(ApprovalStatus),
    default: ApprovalStatus.PENDING
  },
  // Add pending edits field for approved services
  pendingEdits: {
    type: Schema.Types.Mixed,
    default: null
  },
  pendingEditSubmittedAt: {
    type: Date
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
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // This adds createdAt and updatedAt automatically
  collection: 'catering_services'
});

// Create and export the Catering model
export const Catering = mongoose.model<ICatering>('Catering', CateringSchema);
export default Catering;