import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Image compression configuration interface
export interface ImageCompressionConfig {
  // Enable/disable image compression
  enabled: boolean;
  
  // JPEG/WebP quality (0.1 - 1.0)
  quality: number;
  
  // Maximum width in pixels (0 = no limit)
  maxWidth: number;
  
  // Maximum height in pixels (0 = no limit)
  maxHeight: number;
  
  // Convert images to WebP format for better compression
  convertToWebP: boolean;
  
  // Strip metadata from images to reduce file size
  stripMetadata: boolean;
}

// Default configuration
export const defaultImageCompressionConfig: ImageCompressionConfig = {
  enabled: true,
  quality: 0.65,
  maxWidth: 1920,
  maxHeight: 1080,
  convertToWebP: true,
  stripMetadata: true
};

// Get image compression configuration from environment variables
export const getImageCompressionConfig = (): ImageCompressionConfig => {
  return {
    enabled: process.env.IMAGE_COMPRESSION_ENABLED !== 'false', // Default: true
    quality: parseFloat(process.env.IMAGE_COMPRESSION_QUALITY || '0.65'),
    maxWidth: parseInt(process.env.IMAGE_COMPRESSION_MAX_WIDTH || '1920'),
    maxHeight: parseInt(process.env.IMAGE_COMPRESSION_MAX_HEIGHT || '1080'),
    convertToWebP: process.env.IMAGE_COMPRESSION_CONVERT_TO_WEBP !== 'false', // Default: true
    stripMetadata: process.env.IMAGE_COMPRESSION_STRIP_METADATA !== 'false' // Default: true
  };
};