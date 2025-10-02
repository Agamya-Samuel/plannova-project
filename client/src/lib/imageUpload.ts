// Simple image upload service using placeholders

interface UploadResult {
  url: string;
  key: string;
  bucket: string;
}

class ImageUploadService {
  /**
   * Upload a single image (placeholder implementation)
   */
  async uploadImage(
    file: File, 
    folder: string = 'venues',
    venue_id?: string
  ): Promise<UploadResult> {
    try {
      console.log('Uploading image (placeholder mode):', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        folder,
        venue_id
      });

      // Validate file type
      const allowedTypes = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (!fileExtension || !allowedTypes.includes(fileExtension)) {
        throw new Error('Invalid file type. Only JPG, PNG, WebP, and GIF images are allowed.');
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File size too large. Maximum allowed size is 10MB.');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const key = venue_id 
        ? `${folder}/${venue_id}/${timestamp}_${randomString}.${fileExtension}`
        : `${folder}/${timestamp}_${randomString}.${fileExtension}`;

      // Create a placeholder image URL with file name
      const encodedFileName = encodeURIComponent(file.name.split('.')[0]);
      const placeholderUrl = `https://via.placeholder.com/800x600/f472b6/ffffff?text=${encodedFileName}`;
      
      console.log('Generated placeholder URL:', placeholderUrl);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        url: placeholderUrl,
        key: key,
        bucket: 'placeholder-bucket'
      };
    } catch (error: any) {
      console.error('Error processing image:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(
    files: FileList, 
    folder: string = 'venues',
    venue_id?: string,
    onProgress?: (progress: number, current: number, total: number) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    const total = files.length;

    for (let i = 0; i < total; i++) {
      try {
        if (onProgress) {
          onProgress(Math.round(((i + 1) / total) * 100), i + 1, total);
        }

        const result = await this.uploadImage(files[i], folder, venue_id);
        results.push(result);
      } catch (error) {
        console.error(`Error uploading file ${files[i].name}:`, error);
        throw error; // Stop on first error
      }
    }

    return results;
  }

  /**
   * Delete an image (placeholder implementation)
   */
  async deleteImage(key: string): Promise<void> {
    console.log('Deleting image (placeholder mode):', key);
    // Simulate delete delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Get public URL for an uploaded image
   */
  getPublicUrl(key: string): string {
    return `https://via.placeholder.com/800x600/f472b6/ffffff?text=${encodeURIComponent(key)}`;
  }

  /**
   * Test connection (always returns success for placeholder mode)
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'Placeholder mode - no external service required'
    };
  }
}

// Create singleton instance
let imageUploadService: ImageUploadService | null = null;

export const getImageUploadService = (): ImageUploadService => {
  if (!imageUploadService) {
    imageUploadService = new ImageUploadService();
  }
  return imageUploadService;
};

// Test connection (always succeeds for placeholder mode)
export const testConnection = async (): Promise<{ success: boolean; message: string }> => {
  const service = getImageUploadService();
  return await service.testConnection();
};

// Utility function for image optimization (simplified)
export const optimizeImageForUpload = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    // For placeholder mode, just return the original file
    // In a real implementation, you could still do client-side optimization
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate dimensions (max 1920x1080)
      const maxWidth = 1920;
      const maxHeight = 1080;
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const optimizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(optimizedFile);
        } else {
          // If optimization fails, return original file
          resolve(file);
        }
      }, file.type, 0.85); // 85% quality
    };

    img.onerror = () => {
      // If image loading fails, return original file
      resolve(file);
    };
    
    try {
      img.src = URL.createObjectURL(file);
    } catch (error) {
      // If URL creation fails, return original file
      resolve(file);
    }
  });
};

export default ImageUploadService;