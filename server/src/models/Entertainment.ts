import mongoose, { Document, Schema } from 'mongoose';
import { ApprovalStatus } from './Photography.js';

// Entertainment service model mirrors Photography with domain-specific field name
// We reuse ApprovalStatus to keep staff flows consistent across services

export interface IEntertainment extends Document {
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
    isPrimary: boolean;
  }>;
  entertainmentTypes: string[]; // e.g., DJ, Live Band, Dhol, MC/Host
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
  pricePerGuest?: number;
  minGuests?: number;
  cancellationPolicy?: string;
  paymentTerms?: string;
  rating: number;
  reviewCount: number;
  status: ApprovalStatus;
  pendingEdits?: Partial<IEntertainment>;
  pendingEditSubmittedAt?: Date;
  blockedDates?: Array<{
    date: Date;
    reason?: string;
    blockedAt: Date;
  }>;
  // Soft Delete Fields
  isDeleted: boolean;
  deletedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EntertainmentSchema: Schema<IEntertainment> = new Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  provider: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  serviceLocation: {
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true }
  },
  contact: {
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true }
  },
  images: [{
    url: { type: String, required: true },
    alt: { type: String, required: true },
    isPrimary: { type: Boolean, default: false }
  }],
  entertainmentTypes: [{ type: String, required: true }],
  packages: [{
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    includes: [{ type: String }],
    duration: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    isPopular: { type: Boolean, default: false }
  }],
  addons: [{
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 }
  }],
  basePrice: { type: Number, required: true, min: 0 },
  pricePerGuest: { type: Number, min: 0 },
  minGuests: { type: Number, min: 1 },
  cancellationPolicy: { type: String, trim: true },
  paymentTerms: { type: String, trim: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: Object.values(ApprovalStatus), default: ApprovalStatus.PENDING },
  pendingEdits: { type: Schema.Types.Mixed, default: null },
  pendingEditSubmittedAt: { type: Date },
  blockedDates: [{
    date: { type: Date, required: true },
    reason: { type: String, default: 'Offline booking' },
    blockedAt: { type: Date, default: Date.now }
  }],
  // Soft Delete Fields
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'entertainment_services'
});

export const Entertainment = mongoose.model<IEntertainment>('Entertainment', EntertainmentSchema);
export default Entertainment;








