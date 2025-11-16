import mongoose, { Document, Schema } from 'mongoose';

// Blog status enum
export enum BlogStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published'
}

// Blog interface
export interface IBlog extends Document {
  title: string;
  slug?: string; // URL-friendly slug generated from title
  coverImageUrl?: string; // Kept for backward compatibility
  images?: string[]; // Array of image URLs for multiple images
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
  slug: {
    type: String,
    required: false,
    trim: true,
    unique: true,
    sparse: true, // Allow multiple null values but enforce uniqueness for non-null values
    lowercase: true
  },
  coverImageUrl: {
    type: String,
    required: false,
    trim: true
  },
  images: {
    type: [String],
    required: false,
    default: [],
    validate: {
      validator: function(images: string[]) {
        // Validate each image URL in the array
        return images.every(url => {
          if (!url || url.trim() === '') return false;
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        });
      },
      message: 'Each image URL must be a valid URL'
    }
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
BlogSchema.index({ slug: 1 }); // Index for slug-based lookups

// Create and export the Blog model
export const Blog = mongoose.model<IBlog>('Blog', BlogSchema);
export default Blog;

