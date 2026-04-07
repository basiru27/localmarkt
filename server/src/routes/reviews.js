import { Router } from 'express';
import { supabase } from '../supabase.js';
import { authenticate } from '../middleware/auth.js';
import {
  createReviewSchema,
  updateReviewSchema,
  validateBody,
} from '../schemas/review.js';

const router = Router();

/**
 * GET /api/listings/:listingId/reviews
 * Get all reviews for a listing
 */
router.get('/listings/:listingId/reviews', async (req, res, next) => {
  try {
    const { listingId } = req.params;

    // Verify listing exists
    const { error: listingError } = await supabase
      .from('listings')
      .select('id')
      .eq('id', listingId)
      .single();

    if (listingError) {
      if (listingError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Listing not found' });
      }
      throw listingError;
    }

    // Get reviews with reviewer profile info
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviewer_id(id, display_name, created_at)
      `)
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/listings/:listingId/reviews
 * Create a review for a listing (authenticated, cannot review own listing)
 */
router.post('/listings/:listingId/reviews', authenticate, validateBody(createReviewSchema), async (req, res, next) => {
  try {
    const { listingId } = req.params;
    const { rating, comment } = req.body;

    // Get listing to check ownership
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id')
      .eq('id', listingId)
      .single();

    if (listingError) {
      if (listingError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Listing not found' });
      }
      throw listingError;
    }

    // Prevent self-review
    if (listing.user_id === req.user.id) {
      return res.status(403).json({ error: 'You cannot review your own listing' });
    }

    // Check if user already reviewed this listing
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('listing_id', listingId)
      .eq('reviewer_id', req.user.id)
      .single();

    if (existingReview) {
      return res.status(409).json({ error: 'You have already reviewed this listing' });
    }

    // Create the review
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        listing_id: listingId,
        reviewer_id: req.user.id,
        rating,
        comment,
      })
      .select(`
        *,
        reviewer:profiles!reviewer_id(id, display_name, created_at)
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
 * PUT /api/reviews/:reviewId
 * Update a review (authenticated, owner only)
 */
router.put('/reviews/:reviewId', authenticate, validateBody(updateReviewSchema), async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    // Check if review exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from('reviews')
      .select('id, reviewer_id')
      .eq('id', reviewId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Review not found' });
      }
      throw fetchError;
    }

    // Ownership check
    if (existing.reviewer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own reviews' });
    }

    // Update the review
    const { data, error } = await supabase
      .from('reviews')
      .update(req.body)
      .eq('id', reviewId)
      .select(`
        *,
        reviewer:profiles!reviewer_id(id, display_name, created_at)
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
 * DELETE /api/reviews/:reviewId
 * Delete a review (authenticated, owner only)
 */
router.delete('/reviews/:reviewId', authenticate, async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    // Check if review exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from('reviews')
      .select('id, reviewer_id')
      .eq('id', reviewId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Review not found' });
      }
      throw fetchError;
    }

    // Ownership check
    if (existing.reviewer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }

    // Delete the review
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      throw error;
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
