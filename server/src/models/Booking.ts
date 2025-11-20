import mongoose, { Document, Schema } from 'mongoose';

// Define BookingStatus enum
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
  COMPLETED = 'completed'
}

// Define PaymentStatus enum
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
  FAILED = 'failed'
}

// Define ServiceType enum
export enum ServiceType {
  VENUE = 'venue',
  CATERING = 'catering',
  PHOTOGRAPHY = 'photography',
  VIDEOGRAPHY = 'videography',
  BRIDAL_MAKEUP = 'bridal-makeup',
  DECORATION = 'decoration',
  ENTERTAINMENT = 'entertainment'
}

// Define BookingType enum
export enum BookingType {
  ONLINE = 'ONLINE',
  CASH = 'CASH'
}

// Define PaymentMode enum
export enum PaymentMode {
  CASH = 'CASH',
  ONLINE = 'ONLINE'
}

// Interface for Booking
export interface IBooking extends Document {
  customerId: mongoose.Types.ObjectId;
  providerId: mongoose.Types.ObjectId;
  serviceType: ServiceType;
  serviceId: mongoose.Types.ObjectId; // ID of the specific service (venue, casing, etc.)
  date: Date;
  time: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  bookingType: BookingType;
  paymentMode: PaymentMode;
  totalPrice: number;
  advanceAmount?: number;
  remainingAmount?: number;
  guestCount: number;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  specialRequests?: string;
  // Group ID for related bookings (e.g., multiple dates for the same service)
  bookingGroupId?: string;
  // Soft Delete Fields
  isDeleted: boolean;
  deletedAt?: Date;
  // Deprecated fields (for backward compatibility)
  venueId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Create the Booking schema
const BookingSchema: Schema<IBooking> = new Schema({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  providerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  serviceType: {
    type: String,
    enum: Object.values(ServiceType),
    required: true,
    index: true
  },
  serviceId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true
  },
  // Deprecated field for backward compatibility
  venueId: {
    type: Schema.Types.ObjectId,
    ref: 'Venue',
    required: false
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(BookingStatus),
    default: BookingStatus.PENDING
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING
  },
  bookingType: {
    type: String,
    enum: Object.values(BookingType),
    default: BookingType.ONLINE
  },
  paymentMode: {
    type: String,
    enum: Object.values(PaymentMode),
    default: PaymentMode.ONLINE
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  advanceAmount: {
    type: Number,
    min: 0
  },
  remainingAmount: {
    type: Number,
    min: 0
  },
  guestCount: {
    type: Number,
    required: true,
    min: 1
  },
  contactPerson: {
    type: String,
    required: true,
    trim: true
  },
  contactPhone: {
    type: String,
    required: true
  },
  contactEmail: {
    type: String,
    required: true
  },
  specialRequests: {
    type: String,
    trim: true
  },
  // Group ID for related bookings (e.g., multiple dates for the same service)
  bookingGroupId: {
    type: String,
    index: true
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
  }
}, {
  timestamps: true
});

// Indexes for better query performance
BookingSchema.index({ date: 1 });
BookingSchema.index({ providerId: 1, status: 1 });
BookingSchema.index({ serviceType: 1, serviceId: 1 });
BookingSchema.index({ serviceId: 1, date: 1, status: 1 }); // For availability checks
BookingSchema.index({ bookingType: 1 });
BookingSchema.index({ paymentMode: 1 });

// Create and export the model
const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
export default Booking;
