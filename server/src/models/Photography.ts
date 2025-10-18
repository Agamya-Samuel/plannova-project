import mongoose, { Document, Schema } from 'mongoose';

// Define approval status enum
export enum ApprovalStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PENDING_EDIT = 'PENDING_EDIT' // New status for pending edits
}

// Define the Photography interface
export interface IPhotography extends Document {
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
    whatsapp?: string;
    email: string;
  };
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  photographyTypes: string[]; // Wedding, Pre-wedding, Post-wedding, etc.
  packages: Array<{
    name: string;
    description: string;
    includes: string[];
    duration?: string;
    price: number;
    isPopular?: boolean;
  }>;
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
  pendingEdits?: Partial<IPhotography>;
  pendingEditSubmittedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Create the Photography schema
const PhotographySchema: Schema<IPhotography> = new Schema({
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
    whatsapp: {
      type: String,
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
  photographyTypes: [{
    type: String,
    required: true
  }],
  packages: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    includes: [{
      type: String
    }],
    duration: {
      type: String,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    isPopular: {
      type: Boolean,
      default: false
    }
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
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // This adds createdAt and updatedAt automatically
  collection: 'photography_services'
});

// Create and export the Photography model
export const Photography = mongoose.model<IPhotography>('Photography', PhotographySchema);
export default Photography;