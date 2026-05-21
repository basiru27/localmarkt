import { supabase } from '../supabase.js';

export async function deleteStorageImage(imageUrl) {
  if (!imageUrl) return;

  try {
    const match = imageUrl.match(/\/listing-images\/(.+)$/);
    if (!match) return;

    const filePath = match[1];
    const { error } = await supabase.storage
      .from('listing-images')
      .remove([filePath]);

    if (error) {
      console.error('Failed to delete image from storage:', error);
    }
  } catch (error) {
    console.error('Error during image cleanup:', error);
  }
}

export async function deleteStorageImages(imageUrls) {
  if (!imageUrls || imageUrls.length === 0) return;

  try {
    const paths = imageUrls
      .map((url) => url?.match(/\/listing-images\/(.+)$/)?.[1])
      .filter(Boolean);

    if (paths.length === 0) return;

    const { error } = await supabase.storage
      .from('listing-images')
      .remove(paths);

    if (error) {
      console.error('Failed to delete images from storage:', error);
    }
  } catch (error) {
    console.error('Error during image cleanup:', error);
  }
}
