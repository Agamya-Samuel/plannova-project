import mongoose, { Document, Schema } from 'mongoose';

// Define BookingStatus enum
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled'
}

// Interface for Booking
export interface IBooking extends Document {
  customerId: mongoose.Types.ObjectId;
  venueId: mongoose.Types.ObjectId;
  date: Date;
  time: string;
  status: BookingStatus;
  totalPrice: number;
  guestCount: number;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
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
  venueId: {
    type: Schema.Types.ObjectId,
    ref: 'Venue',
    required: true,
    index: true
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
  totalPrice: {
    type: Number,
    required: true,
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
  }
}, {
  timestamps: true
});

// Indexes for better query performance


BookingSchema.index({ date: 1 });

// Create and export the model
const Booking = mongoose.model<IBooking>('Booking', BookingSchema);