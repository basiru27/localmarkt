import imageCompression from 'browser-image-compression';
import { supabase } from './supabase';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_WIDTH = 800;
const MAX_COMPRESSED_SIZE = 300 * 1024; // 300KB

export class ImageUploadError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ImageUploadError';
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
    .from('listing-images')
    .upload(fileName, compressedFile, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    throw new ImageUploadError('Failed to upload image');
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('listing-images').getPublicUrl(data.path);

  return publicUrl;
}

export async function deleteImage(imageUrl) {
  if (!imageUrl) return;

  try {
    // Extract path from URL
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/listing-images\/(.+)$/);
    if (!pathMatch) return;

    const filePath = pathMatch[1];
    await supabase.storage.from('listing-images').remove([filePath]);
  } catch (error) {
    console.error('Failed to delete image:', error);
  }
}
