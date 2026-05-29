import { Router } from 'express';
import { supabase } from '../supabase.js';
import { catchAsync } from '../utils/catchAsync.js';

const router = Router();

router.get('/:id', catchAsync(async (req, res) => {
  const { data: profile, error } = await supabase
    .rpc('get_seller_profile', { p_seller_id: req.params.id })
    .single();

  if (error || !profile) {
    return res.status(404).json({ error: 'Seller not found.' });
  }

  res.json({ seller: profile });
}));

router.get('/:id/listings', catchAsync(async (req, res) => {
  const { page = 1, limit = 12 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const { data: listings, error, count } = await supabase
    .from('listings')
    .select(`
      id, title, price, condition, is_sold, image_url, images, created_at, bumped_at,
      area:area_id (name),
      category:category_id (name)
    `, { count: 'exact' })
    .eq('user_id', req.params.id)
    .eq('moderation_status', 'approved')
    .eq('is_sold', false)
    .order('is_sold', { ascending: true })
    .order('bumped_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + Number(limit) - 1);

  if (error) throw error;

  res.json({
    listings: listings || [],
    total: count || 0,
    page: Number(page),
    pages: Math.ceil((count || 0) / Number(limit)),
  });
}));

router.get('/:id/reviews', catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const { data: sellerListings } = await supabase
    .from('listings')
    .select('id')
    .eq('user_id', req.params.id);

  if (!sellerListings || sellerListings.length === 0) {
    return res.json({ reviews: [], total: 0, page: 1, pages: 0 });
  }

  const listingIds = sellerListings.map(l => l.id);

  const { data: reviews, error, count } = await supabase
    .from('reviews')
    .select(`
      id, rating, comment, created_at,
      listing:listing_id (id, title),
      reviewer:reviewer_id (id, display_name, avatar_url)
    `, { count: 'exact' })
    .in('listing_id', listingIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + Number(limit) - 1);

  if (error) throw error;

  res.json({
    reviews: reviews || [],
    total: count || 0,
    page: Number(page),
    pages: Math.ceil((count || 0) / Number(limit)),
  });
}));

export default router;
