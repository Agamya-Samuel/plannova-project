import sharp from 'sharp';
import { ImageCompressionConfig, getImageCompressionConfig } from '../config/imageCompression.js';

// Result interface for image compression
export interface ImageCompressionResult {
  success: boolean;
  buffer?: Buffer;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  error?: string;
  format?: string;
}

/**
 * Compress an image buffer using Sharp
 * @param buffer The original image buffer
 * @param mimeType The MIME type of the image
 * @param config Optional compression configuration
 * @returns Promise<ImageCompressionResult> The compression result
 */
export const compressImageBuffer = async (
  buffer: Buffer,
  mimeType: string,
  config?: ImageCompressionConfig
): Promise<ImageCompressionResult> => {
  // Use provided config or get from environment
  const compressionConfig = config || getImageCompressionConfig();
  
  // If compression is disabled, return original buffer
  if (!compressionConfig.enabled) {
    return {
      success: true,
      buffer,
      originalSize: buffer.length,
      compressedSize: buffer.length,
      compressionRatio: 1
    };
  }
  
  // Only compress image files
  if (!mimeType.startsWith('image/')) {
    return {
      success: true,
      buffer,
      originalSize: buffer.length,
      compressedSize: buffer.length,
      compressionRatio: 1
    };
  }
  
  // Skip compression for SVG and unsupported formats
  if (mimeType === 'image/svg+xml' || mimeType === 'image/gif') {
    return {
      success: true,
      buffer,
      originalSize: buffer.length,
      compressedSize: buffer.length,
      compressionRatio: 1
    };
  }
  
  try {
    // Create Sharp instance with the image buffer
    const sharpInstance = sharp(buffer, { failOnError: false });
    
    // Get metadata to determine dimensions
    const metadata = await sharpInstance.metadata();
    
    // Apply resizing if configured
    if (compressionConfig.maxWidth > 0 || compressionConfig.maxHeight > 0) {
      const maxWidth = compressionConfig.maxWidth > 0 ? compressionConfig.maxWidth : undefined;
      const maxHeight = compressionConfig.maxHeight > 0 ? compressionConfig.maxHeight : undefined;
      
      // Only resize if the image is larger than the max dimensions
      if (
        (maxWidth && metadata.width && metadata.width > maxWidth) ||
        (maxHeight && metadata.height && metadata.height > maxHeight)
      ) {
        sharpInstance.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
    }
    
    // Determine output format
    let outputFormat = metadata.format;
    if (compressionConfig.convertToWebP && outputFormat !== 'webp') {
      outputFormat = 'webp';
    }
    
    // Apply format-specific options
    switch (outputFormat) {
      case 'jpeg':
      case 'jpg':
        sharpInstance.jpeg({
          quality: Math.round(compressionConfig.quality * 100),
          progressive: true,
          optimizeScans: true,
          chromaSubsampling: '4:2:0'
        });
        break;
        
      case 'png':
        sharpInstance.png({
          compressionLevel: 9,
          adaptiveFiltering: true
        });
        break;
        
      case 'webp':
        sharpInstance.webp({
          quality: Math.round(compressionConfig.quality * 100),
          effort: 4,
          smartSubsample: true
        });
        break;
        
      default:
        // For other formats, use the original format with quality settings if applicable
        if (['jpeg', 'jpg', 'png', 'webp'].includes(outputFormat || '')) {
          sharpInstance[outputFormat as 'jpeg' | 'png' | 'webp']({
            quality: Math.round(compressionConfig.quality * 100)
          });
        }
        break;
    }
    
    // Strip metadata if configured
    if (compressionConfig.stripMetadata) {
      sharpInstance.withMetadata({});
    }
    
    // Process the image
    const compressedBuffer = await sharpInstance.toBuffer();
    
    // Calculate compression ratio
    const originalSize = buffer.length;
    const compressedSize = compressedBuffer.length;
    const compressionRatio = compressedSize / originalSize;
    
    // Only return compressed buffer if it's actually smaller
    if (compressedSize < originalSize) {
      return {
        success: true,
        buffer: compressedBuffer,
        originalSize,
        compressedSize,
        compressionRatio,
        format: outputFormat
      };
    } else {
      // If compression doesn't reduce size, return original buffer
      return {
        success: true,
        buffer,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
        format: metadata.format
      };
    }
  } catch (error) {
    // If compression fails, return original buffer
    console.error('Image compression failed:', error);
    return {
      success: false,
      buffer,
      originalSize: buffer.length,
      compressedSize: buffer.length,
      compressionRatio: 1,
      error: error instanceof Error ? error.message : 'Unknown compression error'
    };
  }
};

/**
 * Check if a MIME type is a supported image format for compression
 * @param mimeType The MIME type to check
 * @returns boolean Whether the MIME type is supported
 */
export const isSupportedImageFormat = (mimeType: string): boolean => {
  const supportedFormats = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/tiff',
    'image/avif'
  ];
  
  return supportedFormats.includes(mimeType);
};

export default {
  compressImageBuffer,
  isSupportedImageFormat
};