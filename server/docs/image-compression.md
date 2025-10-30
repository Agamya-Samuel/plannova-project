# Backend Image Compression

This document explains the backend image compression feature implemented in the Plannova project.

## Overview

The backend now automatically compresses images before uploading them to S3 storage. This feature helps reduce storage costs and bandwidth usage while maintaining acceptable image quality.

## Implementation Details

### Libraries Used

- **Sharp**: A high-performance Node.js image processing library that uses the libvips library under the hood.

### How It Works

1. When an image is uploaded through the `/upload/direct` endpoint, the server intercepts the file buffer
2. The image is processed using Sharp with the following steps:
   - Metadata is extracted to determine original dimensions
   - Images are resized if they exceed the maximum dimensions (default: 1920x1080)
   - Images are compressed with configurable quality settings (default: 65%)
   - Images can be converted to WebP format for better compression (default: enabled)
   - Metadata can be stripped to reduce file size (default: enabled)
3. If the compressed image is smaller than the original, it's used; otherwise, the original is kept
4. The processed image is then uploaded to S3 storage

### Configuration

The image compression can be configured through environment variables:

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `IMAGE_COMPRESSION_ENABLED` | `true` | Enable/disable image compression |
| `IMAGE_COMPRESSION_QUALITY` | `0.85` | JPEG/WebP quality (0.1 - 1.0) |
| `IMAGE_COMPRESSION_MAX_WIDTH` | `1920` | Maximum width in pixels (0 = no limit) |
| `IMAGE_COMPRESSION_MAX_HEIGHT` | `1080` | Maximum height in pixels (0 = no limit) |
| `IMAGE_COMPRESSION_CONVERT_TO_WEBP` | `true` | Convert images to WebP format |
| `IMAGE_COMPRESSION_STRIP_METADATA` | `true` | Strip metadata from images |

### Supported Formats

The compression service supports the following image formats:
- JPEG/JPG
- PNG
- WebP
- TIFF
- AVIF

Note: GIF and SVG files are not compressed to preserve their special properties.

### Benefits

1. **Reduced Storage Costs**: Compressed images take up less space in S3 storage
2. **Lower Bandwidth Usage**: Smaller images require less bandwidth for downloads
3. **Faster Uploads**: Smaller files upload faster
4. **Better Performance**: Smaller images load faster on the frontend
5. **Automatic Format Optimization**: Conversion to WebP provides better compression than traditional formats

### Logging

The compression process logs detailed information including:
- Original and compressed file sizes
- Compression ratio achieved
- Any errors encountered during compression

## Testing

To test the image compression functionality, run:

```bash
npm run test:compression
```

## Error Handling

If image compression fails for any reason:
1. The error is logged as a warning
2. The original image is uploaded unchanged
3. The upload process continues normally

This ensures that compression issues don't prevent users from uploading images.

## Performance Considerations

- Compression is performed asynchronously to avoid blocking the upload process
- Only images are compressed; documents and other file types are uploaded unchanged
- The compression process is optimized for speed while maintaining quality