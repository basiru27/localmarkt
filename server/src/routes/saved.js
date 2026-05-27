import { Router } from 'express';
import { supabase } from '../supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/saved/ids — get just the listing IDs the user has saved
router.get('/ids', authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('saved_listings')
      .select('listing_id')
      .eq('user_id', req.user.id);

    if (error) throw error;

    const ids = (data || []).map(s => s.listing_id);
    res.json({ ids });
  } catch (err) {
    next(err);
  }
});

// GET /api/saved — get all saved listings for the authenticated user
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('saved_listings')
      .select(`
        id,
        created_at,
        listing:listing_id (
          id, title, price, condition, is_sold,
          moderation_status, image_url, images, created_at, bumped_at,
          area:area_id (name),
          category:category_id (name),
          seller:profiles!user_id (id, display_name, avatar_url, verified_seller)
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const saved = (data || [])
      .filter(s => s.listing !== null)
      .map(s => ({
        saved_at: s.created_at,
        ...s.listing,
        is_expired: new Date(s.listing.created_at) < new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      }));

    res.json({ saved, total: saved.length });
  } catch (err) {
    next(err);
  }
});

// POST /api/saved/:listingId — save a listing
router.post('/:listingId', authenticate, async (req, res, next) => {
  try {
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id, moderation_status')
      .eq('id', req.params.listingId)
      .single();

    if (listingError || !listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }
    if (listing.moderation_status !== 'approved') {
      return res.status(400).json({ error: 'Cannot save an unapproved listing.' });
    }

    const { error } = await supabase
      .from('saved_listings')
      .insert({ user_id: req.user.id, listing_id: req.params.listingId });

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Listing already saved.' });
      }
      throw error;
    }

    res.status(201).json({ success: true, saved: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/saved/:listingId — unsave a listing
router.delete('/:listingId', authenticate, async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('saved_listings')
      .delete()
      .eq('user_id', req.user.id)
      .eq('listing_id', req.params.listingId);

    if (error) throw error;

    res.json({ success: true, saved: false });
  } catch (err) {
    next(err);
  }
});

export default router;
