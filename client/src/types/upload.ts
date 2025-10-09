// Upload-related types for the frontend

export type UploadType = 'venue' | 'profile' | 'document' | 'catering';

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface UploadResult {
  url: string;
  key: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadConfig {
  allowedImageTypes: string[];
  allowedDocumentTypes: string[];
  maxFileSize: {
    image: number;
    document: number;
  };
  uploadTypes: string[];
}

export interface FileUploadState {
  file: File | null;
  status: UploadStatus;
  progress: number;
  result: UploadResult | null;
  error: string | null;
}

export interface MultiFileUploadState {
  files: File[];
  currentFileIndex: number;
  overallProgress: number;
  status: UploadStatus;
  results: UploadResult[];
  errors: string[];
}

export interface PresignedUrlRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadType: UploadType;
  venueId?: string;
}

export interface PresignedUrlResponse {
  url: string;
  fields: Record<string, string>;
  key: string;
  expiresAt: string;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface UploadComponentProps {
  uploadType: UploadType;
  venueId?: string;
  accept?: string;
  maxFiles?: number;
  maxFileSize?: number;
  allowedTypes?: string[];
  disabled?: boolean;
  className?: string;
  onUploadStart?: () => void;
  onUploadProgress?: (progress: number) => void;
  onUploadSuccess?: (results: UploadResult[]) => void;
  onUploadError?: (error: string) => void;
  onUploadComplete?: () => void;
}

export interface ImageUploadComponentProps extends UploadComponentProps {
  previewEnabled?: boolean;
  cropEnabled?: boolean;
  resizeEnabled?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export interface DropzoneProps {
  onDrop: (acceptedFiles: File[], rejectedFiles: FileRejection[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export interface FileRejection {
  file: File;
  errors: FileError[];
}

export interface FileError {
  code: string;
  message: string;
}

export interface UploadPreviewProps {
  files: File[];
  results: UploadResult[];
  onRemoveFile?: (index: number) => void;
  onSetPrimary?: (index: number) => void;
  onAddCaption?: (index: number, caption: string) => void;
  className?: string;
}

export interface ImagePreviewProps {
  file: File;
  result?: UploadResult;
  isPrimary?: boolean;
  caption?: string;
  onRemove?: () => void;
  onSetPrimary?: () => void;
  onAddCaption?: (caption: string) => void;
  className?: string;
}

export interface UploadProgressBarProps {
  progress: number;
  status: UploadStatus;
  fileName?: string;
  showPercentage?: boolean;
  className?: string;
}

export interface UploadErrorProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

// API Response types
export interface UploadApiError {
  error: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface UploadConfigResponse {
  message: string;
  data: UploadConfig;
}

export interface PresignedUrlApiResponse {
  message: string;
  data: PresignedUrlResponse;
}

export interface DirectUploadResponse {
  message: string;
  data: UploadResult;
}

export interface FileMetadataResponse {
  message: string;
  data: {
    size: number;
    type: string;
    lastModified: Date;
    metadata: Record<string, string>;
  };
}

export interface DeleteFileResponse {
  message: string;
}

// Utility types
export type FileInputChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => void;

export type DragEventHandler = (event: React.DragEvent<HTMLDivElement>) => void;

export type UploadHandler = (files: File[]) => Promise<UploadResult[]>;

export type ProgressHandler = (progress: UploadProgress) => void;

export type ErrorHandler = (error: string | Error) => void;

export type SuccessHandler = (results: UploadResult[]) => void;

// Hook return types
export interface UseFileUploadReturn {
  upload: UploadHandler;
  state: FileUploadState;
  reset: () => void;
  retry: () => void;
}

export interface UseMultiFileUploadReturn {
  upload: UploadHandler;
  state: MultiFileUploadState;
  reset: () => void;
  removeFile: (index: number) => void;
  retry: () => void;
}

export interface UseDropzoneReturn {
  getRootProps: () => Record<string, unknown>;
  getInputProps: () => Record<string, unknown>;
  isDragActive: boolean;
  isDragAccept: boolean;
  isDragReject: boolean;
  acceptedFiles: File[];
  fileRejections: FileRejection[];
}

// Extended venue image type with upload metadata
export interface VenueImageWithUpload {
  _id?: string;
  url: string;
  alt: string;
  category: 'main' | 'gallery' | 'room' | 'food' | 'decoration' | 'amenity';
  isPrimary: boolean;
  // Upload metadata
  key?: string;
  name?: string;
  type?: string;
  size?: number;
  uploadedAt?: string;
  uploadStatus?: UploadStatus;
}