'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import { getImageUploadService } from '@/lib/imageUpload';
import type {
  UploadComponentProps,
  UploadResult,
  UploadStatus,
  FileValidationResult
} from '@/types/upload';
import { Button } from '@/components/ui/button';

interface FileUploadProps extends UploadComponentProps {
  multiple?: boolean;
  showPreview?: boolean;
}

export default function FileUpload({
  uploadType,
  venueId,
  accept,
  maxFiles = 10,
  maxFileSize,
  allowedTypes,
  multiple = true,
  showPreview = true,
  disabled = false,
  className = '',
  onUploadStart,
  onUploadProgress,
  onUploadSuccess,
  onUploadError,
  onUploadComplete
}: FileUploadProps) {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadService = getImageUploadService();

  const validateFiles = async (files: File[]): Promise<FileValidationResult> => {
    if (files.length === 0) {
      return { valid: false, error: 'No files selected' };
    }

    if (files.length > maxFiles) {
      return { valid: false, error: `Maximum ${maxFiles} files allowed` };
    }

    // Validate each file
    for (const file of files) {
      const validation = await uploadService.validateFile(file);
      if (!validation.valid) {
        return validation;
      }

      // Check file size if specified
      if (maxFileSize && file.size > maxFileSize) {
        const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
        return {
          valid: false,
          error: `File "${file.name}" exceeds maximum size of ${maxSizeMB}MB`
        };
      }

      // Check file type if specified
      if (allowedTypes && !allowedTypes.includes(file.type)) {
        return {
          valid: false,
          error: `File "${file.name}" has unsupported type. Allowed types: ${allowedTypes.join(', ')}`
        };
      }
    }

    return { valid: true };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setError(null);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setError(null);
      setUploadStatus('uploading');
      setUploadProgress(0);
      onUploadStart?.();

      // Validate files
      const validation = await validateFiles(selectedFiles);
      if (!validation.valid) {
        setError(validation.error || 'File validation failed');
        setUploadStatus('error');
        onUploadError?.(validation.error || 'File validation failed');
        return;
      }

      const results: UploadResult[] = [];
      const total = selectedFiles.length;

      for (let i = 0; i < total; i++) {
        const file = selectedFiles[i];
        
        const result = await uploadService.uploadImage(
          file,
          uploadType,
          venueId,
          (progress) => {
            // Calculate overall progress
            const baseProgress = (i / total) * 100;
            const currentFileProgress = (progress.percentage / total);
            const overallProgress = Math.round(baseProgress + currentFileProgress);
            
            setUploadProgress(overallProgress);
            onUploadProgress?.(overallProgress);
          }
        );

        results.push(result);
      }

      setUploadResults(results);
      setUploadStatus('success');
      setUploadProgress(100);
      setSelectedFiles([]);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadSuccess?.(results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      setUploadStatus('error');
      onUploadError?.(errorMessage);
    } finally {
      onUploadComplete?.();
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleClear = () => {
    setSelectedFiles([]);
    setUploadResults([]);
    setError(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Upload className="h-5 w-5 text-gray-400" />;
    }
  };

  const getAcceptString = () => {
    if (accept) return accept;
    if (allowedTypes) return allowedTypes.join(',');
    return (uploadType === 'venue' || uploadType === 'catering') ? 'image/*' : '*/*';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Input */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-pink-400 transition-colors">
        <div className="space-y-3">
          {getStatusIcon()}
          
          <div>
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-sm font-medium text-gray-900 hover:text-pink-600"
            >
              Choose files to upload
            </label>
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept={getAcceptString()}
              multiple={multiple}
              disabled={disabled || uploadStatus === 'uploading'}
              onChange={handleFileSelect}
              className="hidden"
            />
            <p className="text-xs text-gray-500 mt-1">
              {maxFiles > 1 ? `Up to ${maxFiles} files` : 'Single file'}
              {maxFileSize && ` • Max ${Math.round(maxFileSize / (1024 * 1024))}MB each`}
            </p>
          </div>
        </div>
      </div>

      {/* Selected Files Preview */}
      {showPreview && selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Selected Files:</h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveFile(index)}
                  disabled={uploadStatus === 'uploading'}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploadStatus === 'uploading' && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Uploading...</span>
            <span className="text-gray-600">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-pink-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {uploadStatus === 'success' && uploadResults.length > 0 && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <p className="text-green-800 text-sm">
            Successfully uploaded {uploadResults.length} file{uploadResults.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-3">
        {selectedFiles.length > 0 && (
          <Button
            onClick={handleUpload}
            disabled={disabled || uploadStatus === 'uploading'}
            className="flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>
              {uploadStatus === 'uploading' ? 'Uploading...' : 'Upload Files'}
            </span>
          </Button>
        )}
        
        {(selectedFiles.length > 0 || uploadResults.length > 0) && (
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={uploadStatus === 'uploading'}
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}