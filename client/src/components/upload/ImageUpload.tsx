'use client';

import React, { useState, } from 'react';
import Image from 'next/image';
import {X, Eye, Star, } from 'lucide-react';
import { getImageUploadService, } from '@/lib/imageUpload';
import type {
  ImageUploadComponentProps,
  UploadResult,
  UploadStatus,
  VenueImageWithUpload
} from '@/types/upload';
import { Button } from '@/components/ui/button';
import FileUpload from './FileUpload';

interface ImageUploadProps extends ImageUploadComponentProps {
  images?: VenueImageWithUpload[];
  onImagesChange?: (images: VenueImageWithUpload[]) => void;
  onSetPrimary?: (index: number) => void;
  showImagePreview?: boolean;
  allowPrimarySelection?: boolean;
}

export default function ImageUpload({
  uploadType,
  venueId,
  maxFiles = 10,
  // previewEnabled = true,
  // cropEnabled = false,
  // resizeEnabled = true,
  // maxWidth = 1920,
  // maxHeight = 1080,
  // quality = 0.85,
  images = [],
  onImagesChange,
  onSetPrimary,
  showImagePreview = true,
  allowPrimarySelection = true,
  disabled = false,
  className = '',
  onUploadStart,
  onUploadProgress,
  onUploadSuccess,
  onUploadError,
  onUploadComplete
}: ImageUploadProps) {
  const [selectedImages, setSelectedImages] = useState<VenueImageWithUpload[]>(images);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const uploadService = getImageUploadService();

  const handleUploadSuccess = async (results: UploadResult[]) => {
    // Convert upload results to venue images
    const newImages: VenueImageWithUpload[] = results.map((result, index) => ({
      url: result.url,
      alt: result.name.replace(/\.[^/.]+$/, ''), // Remove file extension
      category: 'gallery' as const,
      isPrimary: selectedImages.length === 0 && index === 0, // First image is primary if no existing images
      // Upload metadata
      key: result.key,
      name: result.name,
      type: result.type,
      size: result.size,
      uploadedAt: result.uploadedAt,
      uploadStatus: 'success' as UploadStatus
    }));

    const updatedImages = [...selectedImages, ...newImages];
    setSelectedImages(updatedImages);
    onImagesChange?.(updatedImages);
    onUploadSuccess?.(results);
  };

  const handleRemoveImage = async (index: number) => {
    const imageToRemove = selectedImages[index];
    
    // Delete from S3 if it has a URL
    if (imageToRemove.url && imageToRemove.key) {
      try {
        await uploadService.deleteImageByKey(imageToRemove.key);
      } catch (error) {
        console.error('Failed to delete image from S3:', error);
        // Continue with removal from UI even if S3 deletion fails
      }
    }

    const updatedImages = selectedImages.filter((_, i) => i !== index);
    
    // If we removed the primary image, make the first remaining image primary
    if (imageToRemove.isPrimary && updatedImages.length > 0) {
      updatedImages[0].isPrimary = true;
    }
    
    setSelectedImages(updatedImages);
    onImagesChange?.(updatedImages);
  };

  const handleSetPrimary = (index: number) => {
    if (!allowPrimarySelection) return;
    
    const updatedImages = selectedImages.map((img, i) => ({
      ...img,
      isPrimary: i === index
    }));
    
    setSelectedImages(updatedImages);
    onImagesChange?.(updatedImages);
    onSetPrimary?.(index);
  };

  const handleImagePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* File Upload Component */}
      <FileUpload
        uploadType={uploadType}
        venueId={venueId}
        accept="image/*"
        maxFiles={maxFiles - selectedImages.length}
        allowedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']}
        disabled={disabled || selectedImages.length >= maxFiles}
        onUploadStart={onUploadStart}
        onUploadProgress={onUploadProgress}
        onUploadSuccess={handleUploadSuccess}
        onUploadError={onUploadError}
        onUploadComplete={onUploadComplete}
      />

      {/* Image Grid Preview */}
      {showImagePreview && selectedImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-gray-900">Uploaded Images</h4>
            <span className="text-sm text-gray-500">
              {selectedImages.length} of {maxFiles} images
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedImages.map((image, index) => (
              <div
                key={`${image.url}-${index}`}
                className="relative group border rounded-lg overflow-hidden bg-gray-100 aspect-square"
              >
                {/* Image */}
                <Image
                  src={image.url}
                  alt={image.alt}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                />
                
                {/* Primary Badge */}
                {image.isPrimary && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                    <Star className="h-3 w-3" />
                    <span>Primary</span>
                  </div>
                )}
                
                {/* Upload Status */}
                {image.uploadStatus === 'uploading' && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-sm">Uploading...</div>
                  </div>
                )}
                
                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    {/* Preview Button */}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="bg-white bg-opacity-90 hover:bg-opacity-100"
                      onClick={() => handleImagePreview(image.url)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {/* Set Primary Button */}
                    {allowPrimarySelection && !image.isPrimary && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="bg-white bg-opacity-90 hover:bg-opacity-100"
                        onClick={() => handleSetPrimary(index)}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {/* Remove Button */}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="bg-white bg-opacity-90 hover:bg-opacity-100 text-red-600 hover:text-red-700"
                      onClick={() => handleRemoveImage(index)}
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Image Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 text-xs">
                  <p className="truncate font-medium">{image.alt}</p>
                  {image.size && (
                    <p className="text-gray-300">
                      {(image.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Instructions */}
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Click the eye icon to preview an image</p>
            <p>• Click the star icon to set an image as primary</p>
            <p>• Click the X icon to remove an image</p>
            {allowPrimarySelection && (
              <p>• The primary image will be displayed as the main venue photo</p>
            )}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <Image
              src={previewImage}
              alt="Preview"
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 hover:border-white/50"
              onClick={closePreview}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}