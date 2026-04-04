import imageCompression from 'browser-image-compression';
import { supabase } from './supabase';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_WIDTH = 800;
const MAX_COMPRESSED_SIZE = 300 * 1024; // 300KB
const BUCKET_NAME = 'listing-images';

export class ImageUploadError extends Error {
  constructor(message, code = 'UPLOAD_ERROR') {
    super(message);
    this.name = 'ImageUploadError';
    this.code = code;
  }
}

export async function validateImage(file) {
  if (!file) {
    throw new ImageUploadError('No file provided');
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ImageUploadError('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ImageUploadError('File size exceeds 5MB limit.');
  }

  return true;
}

export async function compressImage(file) {
  const options = {
    maxSizeMB: MAX_COMPRESSED_SIZE / (1024 * 1024),
    maxWidthOrHeight: MAX_WIDTH,
    useWebWorker: true,
    fileType: 'image/jpeg',
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    throw new ImageUploadError('Failed to compress image');
  }
}

export async function uploadImage(file, userId) {
  // Validate the image
  await validateImage(file);

  // Compress the image
  const compressedFile = await compressImage(file);

  // Generate unique filename
  const fileExt = 'jpg';
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, compressedFile, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    
    // Provide more specific error messages based on error type
    const errorMessage = error.message?.toLowerCase() || '';
    const statusCode = error.statusCode || error.status;
    
    if (errorMessage.includes('bucket') || errorMessage.includes('not found') || statusCode === 404) {
      throw new ImageUploadError(
        'Image storage is not configured. Please ensure the "listing-images" bucket exists in Supabase.',
        'BUCKET_NOT_FOUND'
      );
    } else if (errorMessage.includes('policy') || errorMessage.includes('permission') || 
               errorMessage.includes('row-level security') || statusCode === 403) {
      throw new ImageUploadError(
        'Permission denied. Please ensure you are logged in and storage policies are configured.',
        'PERMISSION_DENIED'
      );
    } else if (errorMessage.includes('duplicate') || errorMessage.includes('already exists')) {
      throw new ImageUploadError(
        'An image with this name already exists. Please try again.',
        'DUPLICATE'
      );
    } else if (errorMessage.includes('size') || errorMessage.includes('too large') || statusCode === 413) {
      throw new ImageUploadError(
        'Image file is too large. Please use a smaller image (max 5MB).',
        'FILE_TOO_LARGE'
      );
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('failed')) {
      throw new ImageUploadError(
        'Network error. Please check your internet connection and try again.',
        'NETWORK_ERROR'
      );
    } else {
      throw new ImageUploadError(
        `Upload failed: ${error.message || 'Unknown error'}. Please try again.`,
        'UNKNOWN'
      );
    }
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Delete an image from Supabase Storage
 * NOTE: Image cleanup is now handled server-side in the listings API.
 * This function is kept for potential future use or manual cleanup needs.
 */
export async function deleteImage(imageUrl) {
  if (!imageUrl) return;

  try {
    // Extract path from URL
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/listing-images\/(.+)$/);
    if (!pathMatch) return;

    const filePath = pathMatch[1];
    await supabase.storage.from(BUCKET_NAME).remove([filePath]);
  } catch (error) {
    console.error('Failed to delete image:', error);
  }
}
