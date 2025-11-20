import mongoose, { Document, Schema } from 'mongoose';

export enum ApprovalStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PENDING_EDIT = 'PENDING_EDIT'
}

export interface IBridalMakeup extends Document {
  name: string;
  description: string;
  provider: mongoose.Types.ObjectId;
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
    category: string;
    isPrimary: boolean;
  }>;
  makeupTypes: string[];
  packages: Array<{
    name: string;
    description: string;
    includes: string[];
    duration?: string;
    price: number;
    isPopular: boolean;
  }>;
  addons: Array<{
    name: string;
    description: string;
    price: number;
  }>;
  basePrice: number;
  pricePerGuest?: number;
  minGuests?: number;
  cancellationPolicy?: string;
  paymentTerms?: string;
  rating: number;
  reviewCount: number;
  status: ApprovalStatus;
  // Soft Delete Fields
  isDeleted: boolean;
  deletedAt?: Date;
  isActive: boolean;
  pendingEdits?: Partial<IBridalMakeup>;
  pendingEditSubmittedAt?: Date;
  // Blocked dates for offline bookings or unavailability
  blockedDates?: Array<{
    date: Date;
    reason?: string;
    blockedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const BridalMakeupSchema = new Schema<IBridalMakeup>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 10
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
      default: ''
    },
    category: {
      type: String,
      default: 'portfolio'
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  makeupTypes: [{
    type: String,
    required: true,
    trim: true
  }],
  packages: [{
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
    includes: [{
      type: String,
      trim: true
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
      required: true,
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
  pricePerGuest: {
    type: Number,
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
  },
  pendingEdits: {
    type: Schema.Types.Mixed,
    default: undefined
  },
  pendingEditSubmittedAt: {
    type: Date
  },
  // Blocked dates for offline bookings or unavailability
  blockedDates: [{
    date: {
      type: Date,
      required: true
    },
    reason: {
      type: String,
      default: 'Offline booking'
    },
    blockedAt: {
      type: Date,
      default: Date.now
    }
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
  }
}, {
  timestamps: true
});

// Indexes for better query performance
BridalMakeupSchema.index({ provider: 1, isActive: 1 });
BridalMakeupSchema.index({ status: 1, isActive: 1 });
BridalMakeupSchema.index({ 'serviceLocation.city': 1, 'serviceLocation.state': 1 });
BridalMakeupSchema.index({ makeupTypes: 1 });
BridalMakeupSchema.index({ basePrice: 1 });
BridalMakeupSchema.index({ rating: -1 });
BridalMakeupSchema.index({ createdAt: -1 });

// Ensure only one primary image per service
BridalMakeupSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length > 1) {
      // If multiple primary images, keep only the first one
      this.images.forEach((img, index) => {
        if (index > 0) {
          img.isPrimary = false;
        }
      });
    } else if (primaryImages.length === 0) {
      // If no primary image, make the first one primary
      this.images[0].isPrimary = true;
    }
  }
  next();
});

export default mongoose.model<IBridalMakeup>('BridalMakeup', BridalMakeupSchema);








