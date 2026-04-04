import { Router } from 'express';
import { supabase } from '../supabase.js';
import { authenticate } from '../middleware/auth.js';
import {
  createListingSchema,
  updateListingSchema,
  validateBody,
} from '../schemas/listing.js';

const router = Router();

/**
 * Sanitize search input to prevent PostgREST filter injection
 * Escapes special characters used in PostgREST query syntax
 */
function sanitizeSearchInput(input) {
  if (!input || typeof input !== 'string') return '';
  
  // Escape PostgREST special characters: % _ * , . ( ) 
  // Also escape backslash which is used for escaping
  return input
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/%/g, '\\%')    // Escape wildcard %
    .replace(/_/g, '\\_')    // Escape wildcard _
    .replace(/\*/g, '\\*')   // Escape wildcard *
    .slice(0, 100);          // Limit length to prevent abuse
}

/**
 * Delete an image from Supabase Storage
 * Extracts the file path from the public URL and removes it from the bucket
 * @param {string} imageUrl - The public URL of the image
 */
async function deleteStorageImage(imageUrl) {
  if (!imageUrl) return;

  try {
    // Extract path from URL: .../listing-images/{userId}/{filename}
    const match = imageUrl.match(/\/listing-images\/(.+)$/);
    if (!match) return; // Not a storage URL (e.g., external Unsplash URL)

    const filePath = match[1];
    const { error } = await supabase.storage
      .from('listing-images')
      .remove([filePath]);

    if (error) {
      console.error('Failed to delete image from storage:', error);
    }
  } catch (error) {
    // Log but don't throw - image cleanup is best-effort
    console.error('Error during image cleanup:', error);
  }
}

/**
 * GET /api/listings
 * List all listings with optional filters
 * Query params: category, region, search, page, limit, sort, cursor, user_id
 */
router.get('/', async (req, res, next) => {
  try {
    const { category, region, search, page, limit, sort, cursor, user_id } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 24;
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = supabase
      .from('listings')
      .select(`
        *,
        region:regions(id, name),
        category:categories(id, name)
      `, { count: 'exact' });

    // Apply sorting
    if (sort === 'price_asc') {
      query = query.order('price', { ascending: true });
    } else if (sort === 'price_desc') {
      query = query.order('price', { ascending: false });
    } else if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply cursor
    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    // Apply filters
    if (category) {
      query = query.eq('category_id', parseInt(category));
    }

    if (region) {
      query = query.eq('region_id', parseInt(region));
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (search) {
      // Search in title and description (sanitized to prevent injection)
      const sanitized = sanitizeSearchInput(search);
      if (sanitized) {
        query = query.or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
      }
    }

    if (!cursor) {
      query = query.range(from, to);
    } else {
      query = query.limit(limitNum);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const totalPages = Math.ceil((count || 0) / limitNum);

    res.json({
      data,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: count || 0,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/listings/:id
 * Get a single listing by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        region:regions(id, name),
        category:categories(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Listing not found' });
      }
      throw error;
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/listings
 * Create a new listing (authenticated)
 */
router.post('/', authenticate, validateBody(createListingSchema), async (req, res, next) => {
  try {
    const listingData = {
      ...req.body,
      user_id: req.user.id,
    };

    const { data, error } = await supabase
      .from('listings')
      .insert(listingData)
      .select(`
        *,
        region:regions(id, name),
        category:categories(id, name)
      `)
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/listings/:id
 * Update a listing (authenticated, owner only)
 */
router.put('/:id', authenticate, validateBody(updateListingSchema), async (req, res, next) => {
  try {
    const { id } = req.params;

    // First, check if the listing exists and belongs to the user
    // Also fetch image_url to check if we need to clean up old image
    const { data: existing, error: fetchError } = await supabase
      .from('listings')
      .select('id, user_id, image_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Listing not found' });
      }
      throw fetchError;
    }

    // Ownership check
    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own listings' });
    }

    // Check if image is being replaced
    const oldImageUrl = existing.image_url;
    const newImageUrl = req.body.image_url;
    const imageIsBeingReplaced = 
      oldImageUrl && 
      newImageUrl !== undefined && 
      oldImageUrl !== newImageUrl;

    // Update the listing
    const { data, error } = await supabase
      .from('listings')
      .update(req.body)
      .eq('id', id)
      .select(`
        *,
        region:regions(id, name),
        category:categories(id, name)
      `)
      .single();

    if (error) {
      throw error;
    }

    // Clean up old image if it was replaced (best-effort)
    if (imageIsBeingReplaced) {
      await deleteStorageImage(oldImageUrl);
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/listings/:id
 * Delete a listing (authenticated, owner only)
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // First, check if the listing exists and belongs to the user
    // Also fetch image_url for storage cleanup
    const { data: existing, error: fetchError } = await supabase
      .from('listings')
      .select('id, user_id, image_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Listing not found' });
      }
      throw fetchError;
    }

    // Ownership check
    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own listings' });
    }

    // Delete the listing from database
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    // Clean up the image from storage (best-effort, don't fail if this errors)
    await deleteStorageImage(existing.image_url);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
