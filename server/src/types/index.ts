// Shared type definitions for the server

export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: string;
  errors?: any[];
}

export interface DatabaseConfig {
  uri: string;
  options?: any;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
}

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  corsOrigins: string[];
}

// S3 and Upload related types
export interface S3Config {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
}

export interface UploadFile {
  id?: string;
  url: string;
  key: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface PresignedPostRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadType: 'venue' | 'profile' | 'document';
  venueId?: string;
}

export interface PresignedPostResponse {
  url: string;
  fields: Record<string, string>;
  key: string;
  expiresAt: string;
}

export interface UploadProgress {
  uploadId: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

export interface FileValidation {
  maxSize: number;
  allowedTypes: string[];
  required?: boolean;
}

export interface UploadConfig {
  image: FileValidation;
  document: FileValidation;
  maxFilesPerUpload: number;
  allowedUploadTypes: ('venue' | 'profile' | 'document')[];
}

// Extended venue image interface
export interface VenueImage extends UploadFile {
  caption?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

// Upload statistics
export interface UploadStats {
  totalUploads: number;
  totalSize: number;
  uploadsByType: Record<string, number>;
  recentUploads: UploadFile[];
}