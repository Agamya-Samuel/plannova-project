// S3 image upload service using backend API

import apiClient from './api';

// Upload result interface
interface UploadResult {
  url: string;
  key: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
}

// Upload progress interface
interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Upload configuration
interface UploadConfig {
  allowedImageTypes: string[];
  allowedDocumentTypes: string[];
  maxFileSize: {
    image: number;
    document: number;
  };
  uploadTypes: string[];
}

// Upload types
type UploadType = 'venue' | 'profile' | 'document' | 'catering' | 'photography' | 'videography' | 'bridal-makeup' | 'decoration';

class S3ImageUploadService {
  private uploadConfig: UploadConfig | null = null;

  /**
   * Get upload configuration from backend
   */
  async getUploadConfig(): Promise<UploadConfig> {
    if (this.uploadConfig) {
      return this.uploadConfig!;
    }

    try {
      const response = await apiClient.get('/upload/config');
      this.uploadConfig = response.data.data;
      return this.uploadConfig!;
    } catch (error) {
      console.error('Failed to get upload config:', error);
      // Return default config if API fails
      return {
        allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
        allowedDocumentTypes: ['application/pdf'],
        maxFileSize: {
          image: 10 * 1024 * 1024, // 10MB
          document: 25 * 1024 * 1024, // 25MB
        },
        uploadTypes: ['venue', 'profile', 'document', 'catering', 'photography', 'videography', 'bridal-makeup']
      };
    }
  }

  /**
   * Validate file before upload
   */
  async validateFile(file: File): Promise<{ valid: boolean; error?: string }> {
    try {
      const config = await this.getUploadConfig();
      
      // Check file type
      const isImage = config.allowedImageTypes.includes(file.type);
      const isDocument = config.allowedDocumentTypes.includes(file.type);
      
      if (!isImage && !isDocument) {
        return {
          valid: false,
          error: `Invalid file type. Allowed types: ${[...config.allowedImageTypes, ...config.allowedDocumentTypes].join(', ')}`
        };
      }
      
      // Check file size
      const maxSize = isImage ? config.maxFileSize.image : config.maxFileSize.document;
      if (file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        return {
          valid: false,
          error: `File size exceeds limit. Maximum size: ${maxSizeMB}MB`
        };
      }
      
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Failed to validate file'
      };
    }
  }

  /**
   * Upload a single image using presigned URL from backend
   */
  async uploadImage(
    file: File, 
    uploadType: UploadType = 'venue',
    venueId?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      console.log('Starting presigned URL upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadType,
        venueId
      });

      // Validate file
      const validation = await this.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error || 'File validation failed');
      }

      // Upload via server to avoid CORS issues with Tebi S3
      return await this.uploadViaServer(file, uploadType, venueId, onProgress);
      
    } catch (error: unknown) {
      console.error('Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Upload failed: ${errorMessage}`);
    }
  }




  /**
   * Upload via server (fallback for CORS issues)
   */
  private async uploadViaServer(
    file: File,
    uploadType: UploadType,
    venueId?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadType', uploadType);
    if (venueId) {
      formData.append('venueId', venueId);
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percentage: Math.round((e.loaded / e.total) * 100)
          });
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response.data);
        } else {
          reject(new Error(`Server upload failed with status: ${xhr.status}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Server upload failed - network error'));
      });
      
      // Include authentication token
      const token = localStorage.getItem('token');
      
      xhr.open('POST', `${apiClient.defaults.baseURL}/upload/direct`);
      
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      
      xhr.send(formData);
    });
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(
    files: FileList, 
    uploadType: UploadType = 'venue',
    venueId?: string,
    onProgress?: (progress: number, current: number, total: number) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    const total = files.length;

    for (let i = 0; i < total; i++) {
      try {
        const result = await this.uploadImage(
          files[i], 
          uploadType, 
          venueId,
          (fileProgress) => {
            // Calculate overall progress
            const baseProgress = (i / total) * 100;
            const currentFileProgress = (fileProgress.percentage / total);
            const overallProgress = Math.round(baseProgress + currentFileProgress);
            
            if (onProgress) {
              onProgress(overallProgress, i + 1, total);
            }
          }
        );
        
        results.push(result);
      } catch (error) {
        console.error(`Error uploading file ${files[i].name}:`, error);
        throw error; // Stop on first error
      }
    }

    return results;
  }

  /**
   * Delete an image from S3
   */
  async deleteImage(url: string): Promise<void> {
    try {
      console.log('Deleting image from S3:', url);
      
      await apiClient.delete('/upload/by-url', {
        data: { url }
      });
      
      console.log('Image deleted successfully');
    } catch (error: unknown) {
      console.error('Error deleting image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Delete failed: ${errorMessage}`);
    }
  }

  /**
   * Delete an image by S3 key
   */
  async deleteImageByKey(key: string): Promise<void> {
    try {
      console.log('Deleting image by key:', key);
      
      await apiClient.delete(`/upload/${encodeURIComponent(key)}`);
      
      console.log('Image deleted successfully');
    } catch (error: unknown) {
      console.error('Error deleting image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Delete failed: ${errorMessage}`);
    }
  }

  /**
   * Test connection to upload service
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.getUploadConfig();
      return {
        success: true,
        message: 'S3 upload service is connected and ready'
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Connection test failed: ${errorMessage}`
      };
    }
  }

  /**
   * Get file metadata from S3
   */
  async getFileMetadata(key: string) {
    try {
      const response = await apiClient.get(`/upload/metadata/${encodeURIComponent(key)}`);
      return response.data.data;
    } catch (error: unknown) {
      console.error('Error getting file metadata:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to get metadata: ${errorMessage}`);
    }
  }
}

// Create singleton instance
let imageUploadService: S3ImageUploadService | null = null;

export const getImageUploadService = (): S3ImageUploadService => {
  if (!imageUploadService) {
    imageUploadService = new S3ImageUploadService();
  }
  return imageUploadService;
};

// Test connection convenience function
export const testConnection = async (): Promise<{ success: boolean; message: string }> => {
  const service = getImageUploadService();
  return await service.testConnection();
};

// Utility function for image optimization (client-side)
export const optimizeImageForUpload = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    // For non-image files, return as-is
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

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
    } catch {
      // If URL creation fails, return original file
      resolve(file);
    }
  });
};

// Export types for external use
export type { UploadResult, UploadProgress, UploadConfig, UploadType };

export default S3ImageUploadService;