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
 * GET /api/listings
 * List all listings with optional filters
 * Query params: category, region, search, page, limit, sort, cursor
 */
router.get('/', async (req, res, next) => {
  try {
    const { category, region, search, page, limit, sort, cursor } = req.query;

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

    if (search) {
      // Search in title and description
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
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
    const { data: existing, error: fetchError } = await supabase
      .from('listings')
      .select('id, user_id')
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
    const { data: existing, error: fetchError } = await supabase
      .from('listings')
      .select('id, user_id')
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

    // Delete the listing
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
