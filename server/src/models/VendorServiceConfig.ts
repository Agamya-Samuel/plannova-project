import mongoose, { Document, Schema } from 'mongoose';

// Define PaymentMode enum
export enum PaymentMode {
  CASH = 'CASH',
  ONLINE_CASH = 'ONLINE_CASH'
}

// Define ServiceType enum (matching the one in Booking model)
export enum ServiceType {
  VENUE = 'venue',
  CATERING = 'catering',
  PHOTOGRAPHY = 'photography',
  VIDEOGRAPHY = 'videography',
  BRIDAL_MAKEUP = 'bridal-makeup',
  DECORATION = 'decoration',
  ENTERTAINMENT = 'entertainment'
}

// Interface for VendorServiceConfig
export interface IVendorServiceConfig extends Document {
  vendorId: mongoose.Types.ObjectId;
  serviceType: ServiceType;
  paymentMode: PaymentMode;
  createdAt: Date;
  updatedAt: Date;
}

// Create the VendorServiceConfig schema
const VendorServiceConfigSchema: Schema<IVendorServiceConfig> = new Schema({
  vendorId: {
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
  paymentMode: {
    type: String,
    enum: Object.values(PaymentMode),
    default: PaymentMode.ONLINE_CASH
  }
}, {
  timestamps: true
});

// Indexes for better query performance
VendorServiceConfigSchema.index({ vendorId: 1, serviceType: 1 }, { unique: true });

// Create and export the model
const VendorServiceConfig = mongoose.model<IVendorServiceConfig>('VendorServiceConfig', VendorServiceConfigSchema);
export default VendorServiceConfig;