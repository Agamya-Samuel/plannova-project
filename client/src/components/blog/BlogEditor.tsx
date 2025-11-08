"use client";

import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api";
import { toast } from "sonner";
import { getImageUploadService } from "@/lib/imageUpload";
import { Upload, X, Image as ImageIcon, Link2, Loader2 } from "lucide-react";
import Image from "next/image";

// BlogEditor: simple, reusable blog create form.
// Use this in admin, provider, and staff areas.
// Keeps logic small and focused. Easy to extend later.

interface BlogPayload {
  title: string;
  coverImageUrl?: string;
  excerpt?: string;
  content?: string;
  status?: "draft" | "published";
}

interface BlogEditorProps {
  defaultStatus?: "draft" | "published";
  blogId?: string; // If provided, load existing blog for editing
  onSave?: () => void;
  onCancel?: () => void;
}

const BlogEditor: React.FC<BlogEditorProps> = ({ defaultStatus = "draft", blogId, onSave, onCancel }) => {
  const [form, setForm] = useState<BlogPayload>({
    title: "",
    coverImageUrl: "",
    excerpt: "",
    content: "",
    status: defaultStatus,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!blogId);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const uploadService = React.useMemo(() => getImageUploadService(), []);

  // Persist edit mode and the target blog id across re-renders
  // Rationale: When editing an existing blog we must ALWAYS update the
  // original document. In some flows, parent state can flip quickly after
  // save (e.g. clearing editing state), which could cause `blogId` to
  // become undefined during the submit cycle. Using refs guarantees that
  // once we detect edit mode, submit will PATCH the same id and never POST.
  const isEditModeRef = useRef<boolean>(!!blogId);
  const editIdRef = useRef<string | null>(blogId ?? null);

  // If a blogId later appears (e.g. when switching into edit), lock it in.
  if (blogId && !isEditModeRef.current) {
    isEditModeRef.current = true;
    editIdRef.current = blogId;
  } else if (blogId && !editIdRef.current) {
    editIdRef.current = blogId;
  }

  const handleChange = (field: keyof BlogPayload, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Process and upload image file
  const processImageUpload = useCallback(async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload image using the upload service
      const result = await uploadService.uploadImage(
        file,
        'blog',
        undefined, // No venueId for blogs
        (progress) => {
          setUploadProgress(progress.percentage);
        }
      );

      // Set the uploaded image URL to the form
      setForm(prev => ({ ...prev, coverImageUrl: result.url }));
      toast.success("Image uploaded successfully");
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      toast.error(`Failed to upload image: ${errorMessage}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [uploadService]);

  // Handle image file upload from input
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processImageUpload(file);
  };

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processImageUpload(file);
    }
  }, [processImageUpload]);

  // Handle remove uploaded image
  const handleRemoveImage = () => {
    setForm(prev => ({ ...prev, coverImageUrl: "" }));
    setImageError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Load existing blog data if blogId is provided (edit mode)
  React.useEffect(() => {
    const loadBlog = async () => {
      if (!blogId) return;
      
      setIsLoading(true);
      try {
        const res = await apiClient.get(`/blogs/${blogId}`);
        const blog = res.data?.data || res.data;
        if (blog) {
          setForm({
            title: blog.title || "",
            coverImageUrl: blog.coverImageUrl || "",
            excerpt: blog.excerpt || "",
            content: blog.content || "",
            status: blog.status || defaultStatus,
          });
        }
      } catch (error) {
        console.error("Error loading blog:", error);
        toast.error("Failed to load blog");
      } finally {
        setIsLoading(false);
      }
    };

    loadBlog();
  }, [blogId, defaultStatus]);

  // Reset image error when URL changes
  React.useEffect(() => {
    if (form.coverImageUrl) {
      setImageError(false);
      // Validate URL format
      try {
        new URL(form.coverImageUrl);
      } catch {
        setImageError(true);
        toast.error("Invalid URL format. Please enter a valid image URL.");
      }
    }
  }, [form.coverImageUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setIsSubmitting(true);
    try {
      // Decide create vs update based on locked edit mode and id
      if (isEditModeRef.current && editIdRef.current) {
        // Update existing blog (ALWAYS PATCH the original id)
        await apiClient.patch(`/blogs/${editIdRef.current}`, form);
        toast.success("Blog updated successfully");
      } else {
        // Create new blog
        await apiClient.post("/blogs", form);
        toast.success("Blog saved successfully");
        setForm({ title: "", coverImageUrl: "", excerpt: "", content: "", status: defaultStatus });
      }
      // Call onSave callback if provided to refresh lists
      if (onSave) {
        onSave();
      }
    } catch (error: unknown) {
      // Extract error message from API response for better user feedback
      let errorMessage = "Failed to save blog";
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { 
          response?: { 
            data?: { 
              error?: string; 
              errors?: Array<{ msg?: string; message?: string; field?: string }>;
              details?: Array<{ msg?: string; message?: string }>;
            } 
          } 
        };
        
        if (apiError.response?.data?.error) {
          errorMessage = apiError.response.data.error;
        }
        
        // Handle validation errors - check both 'errors' and 'details' arrays
        const allErrors = [
          ...(apiError.response?.data?.errors || []),
          ...(apiError.response?.data?.details || [])
        ];
        
        if (allErrors.length > 0) {
          const errorMessages = allErrors
            .map((err: { msg?: string; message?: string; field?: string }) => {
              const msg = err.msg || err.message || 'Invalid value';
              const field = err.field ? `${err.field}: ` : '';
              return `${field}${msg}`;
            })
            .filter(Boolean);
          
          if (errorMessages.length > 0) {
            errorMessage = `Validation failed:\n${errorMessages.join('\n')}`;
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error("Error saving blog:", error);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white text-gray-900">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={form.title}
          onChange={e => handleChange("title", e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white text-gray-900"
          placeholder="Enter blog title"
          required
        />
      </div>

      {/* Cover Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Cover Image</label>
        
        {/* Image Preview */}
        {form.coverImageUrl && (
          <div className="mb-6 relative group">
            <div className="relative w-full h-80 rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg bg-gray-100">
              {!imageError ? (
                <>
                  <Image
                    src={form.coverImageUrl}
                    alt="Cover preview"
                    fill
                    className="object-cover"
                    unoptimized={form.coverImageUrl.includes('s3.tebi.io') || form.coverImageUrl.includes('s3.')}
                    onError={() => {
                      setImageError(true);
                      toast.error("Failed to load image. The URL may be invalid or the image may not be accessible.");
                    }}
                  />
                  {/* Overlay with remove button */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center space-x-2 transition-colors duration-200 shadow-lg"
                    >
                      <X className="h-4 w-4" />
                      <span>Remove Image</span>
                    </button>
                  </div>
                </>
              ) : (
                /* Error state - show error message and options */
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 p-6">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="p-3 bg-red-100 rounded-full">
                        <X className="h-8 w-8 text-red-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Failed to Load Image
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        The image at this URL could not be loaded. Please check the URL or upload a new image.
                      </p>
                      <div className="text-xs text-gray-500 bg-white/50 p-2 rounded break-all max-h-20 overflow-y-auto">
                        {form.coverImageUrl}
                      </div>
                    </div>
                    <div className="flex items-center justify-center space-x-3">
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        Remove URL
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImageError(false);
                          // Force reload attempt
                          const url = form.coverImageUrl;
                          setForm(prev => ({ ...prev, coverImageUrl: "" }));
                          setTimeout(() => {
                            setForm(prev => ({ ...prev, coverImageUrl: url }));
                          }, 100);
                        }}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Section - Only show if no image is uploaded or show upload options */}
        {!form.coverImageUrl && (
          <div className="space-y-4">
            {/* Drag and Drop Zone */}
            <div
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${
                isDragging
                  ? 'border-pink-500 bg-pink-50 scale-[1.02]'
                  : 'border-gray-300 hover:border-pink-400 bg-gray-50 hover:bg-gray-100'
              } ${isUploading || isSubmitting ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
              onClick={() => !isUploading && !isSubmitting && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="cover-image-upload"
                disabled={isUploading || isSubmitting}
              />
              
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                {/* Icon */}
                <div className={`p-4 rounded-full transition-colors duration-200 ${
                  isDragging 
                    ? 'bg-pink-100' 
                    : 'bg-gradient-to-br from-pink-50 to-purple-50'
                }`}>
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 text-pink-600 animate-spin" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-pink-600" />
                  )}
                </div>

                {/* Text Content */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {isUploading ? (
                      <span className="flex items-center space-x-2">
                        <span>Uploading...</span>
                        <span className="text-pink-600">{uploadProgress}%</span>
                      </span>
                    ) : isDragging ? (
                      'Drop your image here'
                    ) : (
                      'Drag & drop your image here'
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {isUploading 
                      ? 'Please wait while we upload your image'
                      : 'or click to browse files'
                    }
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Supported: JPG, PNG, WebP, GIF (Max 10MB)
                  </p>
                </div>

                {/* Upload Progress Bar */}
                {isUploading && (
                  <div className="w-full max-w-xs">
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-300 shadow-sm"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Browse Button */}
                {!isUploading && !isDragging && (
                  <button
                    type="button"
                    className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center space-x-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <Upload className="h-4 w-4" />
                    <span>Browse Files</span>
                  </button>
                )}
              </div>
            </div>

            {/* Divider with "OR" */}
            <div className="relative flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm font-medium text-gray-400 bg-white">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* URL Input Section */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                <Link2 className="h-4 w-4 text-pink-600" />
                <span>Paste Image URL</span>
              </label>
              <div className="space-y-2">
                <input
                  type="url"
                  value={form.coverImageUrl || ""}
                  onChange={e => handleChange("coverImageUrl", e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 bg-white text-gray-900 transition-all duration-200"
                  placeholder="https://example.com/image.jpg"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 flex items-start space-x-1">
                  <span className="mt-0.5">💡</span>
                  <span>Enter a direct URL to an image hosted elsewhere</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Show upload again option when image exists */}
        {form.coverImageUrl && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-3">Want to replace this image?</p>
            <div className="flex items-center space-x-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="replace-image-upload"
                disabled={isUploading || isSubmitting}
              />
              <label
                htmlFor="replace-image-upload"
                className={`inline-flex items-center space-x-2 px-4 py-2 border border-blue-300 rounded-lg cursor-pointer transition-all duration-200 ${
                  isUploading || isSubmitting
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300'
                    : 'bg-white text-blue-700 hover:bg-blue-100 hover:border-blue-400'
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading... {uploadProgress}%</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Upload New Image</span>
                  </>
                )}
              </label>
              <span className="text-sm text-gray-500">or</span>
              <input
                type="url"
                value={form.coverImageUrl}
                onChange={e => handleChange("coverImageUrl", e.target.value)}
                className="flex-1 border border-blue-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 text-sm"
                placeholder="Paste new image URL"
                disabled={isSubmitting}
              />
            </div>
            {isUploading && (
              <div className="mt-3 w-full bg-blue-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
        <textarea
          value={form.excerpt || ""}
          onChange={e => handleChange("excerpt", e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white text-gray-900"
          placeholder="Short summary shown in lists"
          rows={3}
        />
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
        <textarea
          value={form.content || ""}
          onChange={e => handleChange("content", e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white text-gray-900"
          placeholder="Write your blog content here"
          rows={10}
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          value={form.status}
          onChange={e => handleChange("status", e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white text-gray-900"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting} className="px-6">
          {isSubmitting ? (blogId ? "Updating..." : "Saving...") : (blogId ? "Update Blog" : "Save Blog")}
        </Button>
        {blogId && onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="px-6">
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

export default BlogEditor;


