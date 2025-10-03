import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// S3 Configuration Interface
export interface S3Config {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
}

// Get S3 configuration from environment variables
export const getS3Config = (): S3Config => {
  const region = process.env.AWS_S3_REGION;
  const bucket = process.env.AWS_S3_BUCKET;
  const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY;
  const endpoint = process.env.AWS_S3_ENDPOINT;

  if (!region) {
    throw new Error('AWS_S3_REGION environment variable is required');
  }

  if (!bucket) {
    throw new Error('AWS_S3_BUCKET environment variable is required');
  }

  if (!accessKeyId) {
    throw new Error('AWS_S3_ACCESS_KEY_ID environment variable is required');
  }

  if (!secretAccessKey) {
    throw new Error('AWS_S3_SECRET_ACCESS_KEY environment variable is required');
  }

  return {
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
    endpoint,
  };
};

// Create S3 Client instance
export const createS3Client = (): S3Client => {
  const config = getS3Config();
  
  const clientConfig: any = {
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  };

  // Add endpoint if provided (useful for local development with LocalStack or MinIO)
  if (config.endpoint) {
    clientConfig.endpoint = config.endpoint;
    clientConfig.forcePathStyle = true; // Required for local S3-compatible services
    clientConfig.useAccelerateEndpoint = false; // Disable acceleration for custom endpoints
    clientConfig.useGlobalEndpoint = false; // Use regional endpoint
  }

  return new S3Client(clientConfig);
};

// S3 client singleton
let s3Client: S3Client | null = null;

export const getS3Client = (): S3Client => {
  if (!s3Client) {
    s3Client = createS3Client();
  }
  return s3Client;
};

// Validate S3 connection (optional utility)
export const validateS3Connection = async (): Promise<boolean> => {
  try {
    const client = getS3Client();
    const config = getS3Config();
    
    // Try to list objects in the bucket (limit to 1 to minimize cost)
    const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
    await client.send(new ListObjectsV2Command({
      Bucket: config.bucket,
      MaxKeys: 1,
    }));
    
    return true;
  } catch (error) {
    console.error('S3 connection validation failed:', error);
    return false;
  }
};

// Generate file key for S3 storage
export const generateFileKey = (
  userId: string,
  type: 'venue' | 'profile' | 'document',
  filename: string,
  venueId?: string
): string => {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  if (type === 'venue' && venueId) {
    return `uploads/venues/${venueId}/${timestamp}_${sanitizedFilename}`;
  }
  
  return `uploads/${type}/${userId}/${timestamp}_${sanitizedFilename}`;
};

// Get full S3 URL for a given key
export const getS3Url = (key: string): string => {
  const config = getS3Config();
  
  if (config.endpoint) {
    // For local development or custom endpoints
    return `${config.endpoint}/${config.bucket}/${key}`;
  }
  
  // Standard AWS S3 URL
  return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
};

// Extract S3 key from URL
export const extractS3Key = (url: string): string | null => {
  try {
    const config = getS3Config();
    
    if (config.endpoint) {
      // Handle custom endpoint URLs
      const endpointPattern = new RegExp(`${config.endpoint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/${config.bucket}/(.+)`);
      const match = url.match(endpointPattern);
      return match ? match[1] : null;
    }
    
    // Handle standard AWS S3 URLs
    const s3Pattern = new RegExp(`https://${config.bucket}\\.s3\\.${config.region}\\.amazonaws\\.com/(.+)`);
    const match = url.match(s3Pattern);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting S3 key from URL:', error);
    return null;
  }
};