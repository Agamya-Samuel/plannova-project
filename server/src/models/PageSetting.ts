import mongoose, { Document, Schema } from 'mongoose';

export interface IPageSetting extends Document {
  key: string; // unique identifier for page, e.g., 'home'
  title: string;
  description?: string;
  backgroundImages: string[]; // Legacy field - kept for backward compatibility
  backgroundImagesMobile: string[]; // Images optimized for mobile devices
  backgroundImagesLaptop: string[]; // Images optimized for laptop/desktop devices
  textGradientFrom?: string;
  textGradientTo?: string;
  typingOptions?: string[]; // Array of options to cycle through with typing effect (e.g., "wedding platform", "corporate wedding")
  backgroundBlur?: number; // Background blur level: 0-100 (0 = no blur, 100 = maximum blur)
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PageSettingSchema: Schema<IPageSetting> = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: false, trim: true },
  backgroundImages: [{ type: String, required: false }], // Legacy field - kept for backward compatibility
  backgroundImagesMobile: [{ type: String, required: false }], // Images optimized for mobile devices
  backgroundImagesLaptop: [{ type: String, required: false }], // Images optimized for laptop/desktop devices
  textGradientFrom: { type: String, required: false },
  textGradientTo: { type: String, required: false },
  typingOptions: [{ type: String, required: false, trim: true }], // Options for typing effect (e.g., "wedding platform", "corporate wedding")
  backgroundBlur: { type: Number, required: false, min: 0, max: 100 }, // Background blur level: 0-100 (0 = no blur, 100 = maximum blur)
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'page_settings'
});

const PageSetting = mongoose.model<IPageSetting>('PageSetting', PageSettingSchema);
export default PageSetting;

