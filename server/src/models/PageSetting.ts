import mongoose, { Document, Schema } from 'mongoose';

export interface IPageSetting extends Document {
  key: string; // unique identifier for page, e.g., 'home'
  title: string;
  description?: string;
  backgroundImages: string[];
  textGradientFrom?: string;
  textGradientTo?: string;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PageSettingSchema: Schema<IPageSetting> = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: false, trim: true },
  backgroundImages: [{ type: String, required: true }],
  textGradientFrom: { type: String, required: false },
  textGradientTo: { type: String, required: false },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true,
  collection: 'page_settings'
});

const PageSetting = mongoose.model<IPageSetting>('PageSetting', PageSettingSchema);
export default PageSetting;

