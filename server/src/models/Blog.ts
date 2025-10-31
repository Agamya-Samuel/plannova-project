import mongoose, { Document, Schema } from 'mongoose';

// Blog status enum
export enum BlogStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published'
}

// Blog interface
export interface IBlog extends Document {
  title: string;
  coverImageUrl?: string;
  excerpt?: string;
  content?: string;
  status: BlogStatus;
  author: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Blog schema definition
const BlogSchema = new Schema<IBlog>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  coverImageUrl: {
    type: String,
    required: false,
    trim: true
  },
  excerpt: {
    type: String,
    required: false,
    trim: true,
    maxlength: 1000
  },
  content: {
    type: String,
    required: false,
    trim: true
  },
  status: {
    type: String,
    enum: Object.values(BlogStatus),
    default: BlogStatus.DRAFT,
    required: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true, // This adds createdAt and updatedAt automatically
  collection: 'blogs'
});

// Create indexes for better query performance
BlogSchema.index({ status: 1, createdAt: -1 });
BlogSchema.index({ author: 1 });

// Create and export the Blog model
export const Blog = mongoose.model<IBlog>('Blog', BlogSchema);
export default Blog;

