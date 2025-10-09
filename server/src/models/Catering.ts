import mongoose, { Document, Schema } from 'mongoose';

// Define approval status enum
export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
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
    whatsapp?: string;
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