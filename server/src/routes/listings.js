import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { supabase } from '../supabase.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import {
  createListingSchema,
  updateListingSchema,
  validateBody,
} from '../schemas/listing.js';

import { createNotifications } from '../services/notifications.js';
import { deleteStorageImage, deleteStorageImages } from '../utils/storage.js';

const router = Router();

const createListingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many listings created, please try again later.',
  },
});

function sanitizeListingForResponse(listing) {
  if (!listing) return listing;

  const { seller, ...rest } = listing;
  const sanitizedSeller = seller
    ? {
        id: seller.id,
        display_name: seller.display_name,
        created_at: seller.created_at,
        avatar_url: seller.avatar_url,
        bio: seller.bio,
        phone_number: seller.phone_number,
        verified_seller: seller.verified_seller,
      }
    : null;

  return {
    ...rest,
    seller: sanitizedSeller,
  };
}

async function attachRatingStats(listings) {
  const listingIds = listings.map((listing) => listing.id);
  const ratingsMap = {};

  if (listingIds.length > 0) {
    const { data: reviewStats, error: reviewError } = await supabase
      .from('reviews')
      .select('listing_id, rating')
      .in('listing_id', listingIds);

    if (!reviewError && reviewStats) {
      const statsMap = {};
      reviewStats.forEach((review) => {
        if (!statsMap[review.listing_id]) {
          statsMap[review.listing_id] = { total: 0, count: 0 };
        }
        statsMap[review.listing_id].total += review.rating;
        statsMap[review.listing_id].count += 1;
      });

      Object.keys(statsMap).forEach((listingId) => {
        ratingsMap[listingId] = {
          rating_avg: Math.round((statsMap[listingId].total / statsMap[listingId].count) * 10) / 10,
          review_count: statsMap[listingId].count,
        };
      });
    }
  }

  return listings.map((listing) => ({
    ...listing,
    rating_avg: ratingsMap[listing.id]?.rating_avg || null,
    review_count: ratingsMap[listing.id]?.review_count || 0,
  }));
}

function isPubliclyVisibleListing(listing) {
  return listing?.moderation_status === 'approved' && !listing?.seller?.is_banned;
}

function addComputedFields(listing) {
  if (!listing) return listing;
  return {
    ...listing,
    is_expired: !!listing.created_at && new Date(listing.created_at) < new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
  };
}

/**
 * GET /api/listings/stats
 * Get high-level marketplace statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const { count: listingsCount, error: listingsError } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('moderation_status', 'approved');

    if (listingsError) throw listingsError;

    const { data: listingsData, error: listingsDataError } = await supabase
      .from('listings')
      .select('area_id, user_id')
      .eq('moderation_status', 'approved');

    if (listingsDataError) throw listingsDataError;

    const uniqueAreas = new Set(listingsData.map(l => l.area_id).filter(Boolean)).size;
    const uniqueSellers = new Set(listingsData.map(l => l.user_id).filter(Boolean)).size;

    res.json({
      totalListings: listingsCount || 0,
      activeAreas: uniqueAreas || 0,
      activeSellers: uniqueSellers || 0
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/listings/search/suggestions
 * Get search autocomplete suggestions
 */
router.get('/search/suggestions', async (req, res, next) => {
  try {
    const q = req.query.q || '';
    if (q.length < 2) {
      return res.json([]);
    }
    
    const escaped = String(q).replaceAll('%', '\\%').replaceAll('_', '\\_');
    const { data, error } = await supabase
      .from('listings')
      .select('title')
      .eq('moderation_status', 'approved')
      .ilike('title', `%${escaped}%`)
      .limit(20); // Fetch more to ensure we get 5 unique after deduplication

    if (error) throw error;
    
    const uniqueTitles = [...new Set(data.map(d => d.title))].slice(0, 5);
    
    res.json(uniqueTitles);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/listings
 * List all listings with optional filters
 * Query params: category, area_id, search, page, limit, sort, cursor, user_id
 */
router.get('/', async (req, res, next) => {
  try {
    const { category, area_id, search, page, limit, sort, cursor, user_id } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 24, 50);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = supabase
      .from('listings')
      .select(`
        *,
        area:areas(id, name, zone:zones(id, name)),
        category:categories(id, name),
        seller:profiles!inner(id, display_name, created_at, is_banned, avatar_url, bio, phone_number, verified_seller)
      `, { count: 'exact' });

    query = query
      .eq('moderation_status', 'approved')
      .eq('seller.is_banned', false);

    query = query.order('is_sold', { ascending: true });

    if (sort === 'price_asc') {
      query = query.order('price', { ascending: true });
    } else if (sort === 'price_desc') {
      query = query.order('price', { ascending: false });
    } else if (sort === 'views') {
      query = query.order('view_count', { ascending: false, nullsFirst: false });
    } else if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else {
      query = query
        .order('bumped_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });
    }

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    if (category) {
      const catId = parseInt(category, 10);
      if (!Number.isNaN(catId)) query = query.eq('category_id', catId);
    }

    if (area_id) {
      const areaId = parseInt(area_id, 10);
      if (!Number.isNaN(areaId)) query = query.eq('area_id', areaId);
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (search) {
      if (search.trim()) {
        const escaped = String(search.trim()).replaceAll('%', '\\%').replaceAll('_', '\\_');
        query = query.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`);
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

    const sanitizedListings = data.map(sanitizeListingForResponse);
    const dataWithRatings = await attachRatingStats(sanitizedListings);
    const dataWithComputed = dataWithRatings.map(addComputedFields);

    const totalPages = Math.ceil((count || 0) / limitNum);

    res.json({
      data: dataWithComputed,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/listings/mine
 * Get authenticated user's listings (all moderation statuses)
 */
router.get('/mine', authenticate, async (req, res, next) => {
  try {
    const { category, area_id, search, page, limit, is_sold, moderation_status } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 50, 50);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let query = supabase
      .from('listings')
      .select(`
        *,
        area:areas(id, name, zone:zones(id, name)),
        category:categories(id, name),
        seller:profiles!user_id(id, display_name, created_at, avatar_url, bio, phone_number, verified_seller)
      `, { count: 'exact' })
      .eq('user_id', req.user.id);

    if (is_sold !== undefined) {
      query = query.eq('is_sold', is_sold === 'true');
    }

    if (moderation_status) {
      if (moderation_status === 'pending_or_rejected') {
        query = query.in('moderation_status', ['pending', 'rejected']);
      } else {
        query = query.eq('moderation_status', moderation_status);
      }
    }

    if (category) {
      const catId = parseInt(category, 10);
      if (!Number.isNaN(catId)) query = query.eq('category_id', catId);
    }

    if (area_id) {
      const areaId = parseInt(area_id, 10);
      if (!Number.isNaN(areaId)) query = query.eq('area_id', areaId);
    }

    if (search) {
      if (search.trim()) {
        const escaped = String(search.trim()).replaceAll('%', '\\%').replaceAll('_', '\\_');
        query = query.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`);
      }
    }

    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    let dataWithRatings = await attachRatingStats(data.map(sanitizeListingForResponse));

    // Add save_count from saved_listings
    const listingIds = dataWithRatings.map(l => l.id);
    const saveCounts = {};
    if (listingIds.length > 0) {
      const { data: saves } = await supabase
        .from('saved_listings')
        .select('listing_id')
        .in('listing_id', listingIds);

      if (saves) {
        saves.forEach(s => {
          saveCounts[s.listing_id] = (saveCounts[s.listing_id] || 0) + 1;
        });
      }
    }

    dataWithRatings = dataWithRatings.map(l => ({
      ...l,
      save_count: saveCounts[l.id] || 0,
    }));

    const dataWithComputed = dataWithRatings.map(addComputedFields);
    const totalPages = Math.ceil((count || 0) / limitNum);

    res.json({
      data: dataWithComputed,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/listings/analytics
 * Analytics dashboard data with date range support
 */
router.get('/analytics', authenticate, async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const userId = req.user.id;
    const { range = '7' } = req.query;

    const daysMap = { '7': 7, '30': 30, '90': 90 };
    const days = range === 'all' ? null : (daysMap[range] ?? 7);
    const since = days
      ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('id, title, price, images, image_url, moderation_status, is_sold, created_at, bumped_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (listingsError) throw listingsError;

    const listingIds = listings.map(l => l.id);

    if (listingIds.length === 0) {
      return res.json({
        summary: {
          total_views: 0, total_contacts: 0, total_saves: 0,
          active_listings: 0, sold_listings: 0,
        },
        views_over_time: [],
        listing_performance: [],
      });
    }

    const { data: viewEvents, error: viewErr } = await (() => {
      let q = supabase
        .from('listing_events')
        .select('listing_id, created_at')
        .in('listing_id', listingIds)
        .eq('event', 'view');
      if (since) q = q.gte('created_at', since);
      return q;
    })();
    if (viewErr) {
      console.error('[analytics] viewEvents query failed:', viewErr);
      throw viewErr;
    }

    const { data: contactEvents, error: contactErr } = await (() => {
      let q = supabase
        .from('listing_events')
        .select('listing_id, created_at')
        .in('listing_id', listingIds)
        .eq('event', 'contact_click');
      if (since) q = q.gte('created_at', since);
      return q;
    })();
    if (contactErr) {
      console.error('[analytics] contactEvents query failed:', contactErr);
      throw contactErr;
    }

    const { data: saveEvents, error: saveErr } = await (() => {
      let q = supabase
        .from('saved_listings')
        .select('listing_id, created_at')
        .in('listing_id', listingIds);
      if (since) q = q.gte('created_at', since);
      return q;
    })();
    if (saveErr) {
      console.error('[analytics] saveEvents query failed:', saveErr);
      throw saveErr;
    }

    const viewCountMap = {};
    const contactCountMap = {};
    const saveCountMap = {};

    (viewEvents || []).forEach(e => {
      viewCountMap[e.listing_id] = (viewCountMap[e.listing_id] || 0) + 1;
    });
    (contactEvents || []).forEach(e => {
      contactCountMap[e.listing_id] = (contactCountMap[e.listing_id] || 0) + 1;
    });
    (saveEvents || []).forEach(e => {
      saveCountMap[e.listing_id] = (saveCountMap[e.listing_id] || 0) + 1;
    });

    const viewsByDay = {};
    (viewEvents || []).forEach(e => {
      const day = e.created_at.split('T')[0];
      viewsByDay[day] = (viewsByDay[day] || 0) + 1;
    });

    const viewsOverTime = [];
    if (days) {
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const key = date.toISOString().split('T')[0];
        viewsOverTime.push({ date: key, views: viewsByDay[key] || 0 });
      }
    } else {
      Object.entries(viewsByDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([date, views]) => viewsOverTime.push({ date, views }));
    }

    const totalViews = (viewEvents || []).length;
    const totalContacts = (contactEvents || []).length;
    const totalSaves = (saveEvents || []).length;
    const activeListings = listings.filter(
      l => l.moderation_status === 'approved' && !l.is_sold
    ).length;
    const soldListings = listings.filter(l => l.is_sold).length;

    const listingPerformance = listings.map(l => ({
      id: l.id,
      title: l.title,
      price: l.price,
      image: l.image_url || l.images?.[0] || null,
      moderation_status: l.moderation_status,
      is_sold: l.is_sold,
      created_at: l.created_at,
      views: viewCountMap[l.id] || 0,
      contacts: contactCountMap[l.id] || 0,
      saves: saveCountMap[l.id] || 0,
    }));

    res.json({
      summary: {
        total_views: totalViews,
        total_contacts: totalContacts,
        total_saves: totalSaves,
        active_listings: activeListings,
        sold_listings: soldListings,
      },
      views_over_time: viewsOverTime,
      listing_performance: listingPerformance,
      range,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/listings/:id
 * Get a single listing by ID with seller info and rating stats
 */
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        area:areas(id, name, zone:zones(id, name)),
        category:categories(id, name),
        seller:profiles!user_id(id, display_name, created_at, is_banned, avatar_url, bio, phone_number, verified_seller)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Listing not found' });
      }
      throw error;
    }

    const canViewHiddenListing = req.user && (req.user.id === data.user_id || req.user.isAdmin);
    if (!isPubliclyVisibleListing(data) && !canViewHiddenListing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const { data: reviews, error: reviewError } = await supabase
      .from('reviews')
      .select('rating')
      .eq('listing_id', id);

    let rating_avg = null;
    let review_count = 0;

    if (!reviewError && reviews && reviews.length > 0) {
      const total = reviews.reduce((sum, r) => sum + r.rating, 0);
      rating_avg = Math.round((total / reviews.length) * 10) / 10;
      review_count = reviews.length;
    }

    res.json(addComputedFields({
      ...sanitizeListingForResponse(data),
      rating_avg,
      review_count,
    }));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/listings/:id/can-review
 * Check if current user can review this listing (soft gate)
 */
router.get('/:id/can-review', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const listingId = req.params.id;

    const { data: listing } = await supabase
      .from('listings')
      .select('user_id, moderation_status')
      .eq('id', listingId)
      .single();

    if (!listing || listing.moderation_status !== 'approved') {
      return res.json({ can_review: false, reason: 'listing_unavailable' });
    }
    if (listing.user_id === userId) {
      return res.json({ can_review: false, reason: 'own_listing' });
    }

    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('listing_id', listingId)
      .eq('reviewer_id', userId)
      .single();

    if (existing) {
      return res.json({ can_review: false, reason: 'already_reviewed' });
    }

    const { data: contactEvent } = await supabase
      .from('listing_events')
      .select('id')
      .eq('listing_id', listingId)
      .eq('user_id', userId)
      .eq('event', 'contact_click')
      .limit(1)
      .maybeSingle();

    const hasContacted = !!contactEvent;

    return res.json({
      can_review: hasContacted,
      reason: hasContacted ? null : 'no_contact',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/listings
 * Create a new listing (authenticated)
 */
router.post('/', authenticate, createListingLimiter, validateBody(createListingSchema), async (req, res, next) => {
  try {
    const { data: recent } = await supabase
      .from('listings')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('title', req.body.title)
      .gte('created_at', new Date(Date.now() - 30000).toISOString())
      .limit(1);
    
    if (recent?.length > 0) {
      return res.status(409).json({ 
        error: 'Duplicate listing. Please wait before resubmitting.' 
      });
    }

    const listingData = {
      ...req.body,
      user_id: req.user.id,
      moderation_status: 'pending',
      moderated_by: null,
      moderated_at: null,
      moderation_note: null,
    };

    const { data, error } = await supabase
      .from('listings')
      .insert(listingData)
      .select(`
        *,
        area:areas(id, name, zone:zones(id, name)),
        category:categories(id, name)
      `)
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(data);

    // Notify admins asynchronously
    (async () => {
      try {
        const { data: seller } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', req.user.id)
          .single();
        
        const sellerName = seller?.display_name || 'A user';

        const { data: admins } = await supabase
          .from('profiles')
          .select('id')
          .in('role', ['admin', 'super_admin']);
        
        if (admins && admins.length > 0) {
          const notifications = admins.map((admin) => ({
            user_id: admin.id,
            type: 'NEW_LISTING',
            title: 'New Listing Pending Review',
            message: `${sellerName} posted "${data.title}" — needs approval`,
            link: '/admin/listings?status=pending'
          }));
          await createNotifications(notifications);
        }
      } catch (notifyError) {
        console.error('Notification error:', notifyError);
      }
    })();
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/listings/:id/bump
 * Bump a listing to the top of the feed (authenticated, owner only, 24h cooldown)
 * Requires: ALTER TABLE listings ADD COLUMN IF NOT EXISTS bumped_at TIMESTAMPTZ;
 */
router.post('/:id/bump', authenticate, async (req, res, next) => {
  try {
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('user_id, bumped_at, moderation_status')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    if (listing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    if (listing.moderation_status !== 'approved') {
      return res.status(400).json({ error: 'Only approved listings can be bumped.' });
    }

    // Global user cooldown: only one bump per user per 24 hours
    const { data: recentBump, error: recentBumpError } = await supabase
      .from('listings')
      .select('id, title, bumped_at')
      .eq('user_id', req.user.id)
      .not('bumped_at', 'is', null)
      .order('bumped_at', { ascending: false })
      .limit(1)
      .single();

    if (recentBump && !recentBumpError) {
      const lastBump = new Date(recentBump.bumped_at).getTime();
      const now = Date.now();
      const msIn24Hours = 24 * 60 * 60 * 1000;

      if (now - lastBump < msIn24Hours) {
        const msRemaining = msIn24Hours - (now - lastBump);
        const hoursLeft = Math.ceil(msRemaining / (1000 * 60 * 60));
        return res.status(429).json({
          error: `You already bumped "${recentBump.title}" recently. You can bump again in ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}.`,
          retry_after_hours: hoursLeft,
        });
      }
    }

    // Per-listing cooldown safety net
    if (listing.bumped_at) {
      const lastBump = new Date(listing.bumped_at).getTime();
      const now = Date.now();
      const msIn24Hours = 24 * 60 * 60 * 1000;

      if (now - lastBump < msIn24Hours) {
        const msRemaining = msIn24Hours - (now - lastBump);
        const hoursLeft = Math.ceil(msRemaining / (1000 * 60 * 60));
        return res.status(429).json({
          error: `You can bump this listing again in ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}.`,
          retry_after_hours: hoursLeft,
        });
      }
    }

    const { error: updateError } = await supabase
      .from('listings')
      .update({ bumped_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (updateError) throw updateError;

    res.json({ success: true, message: 'Listing bumped to top of feed.' });
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

    const { data: existing, error: fetchError } = await supabase
      .from('listings')
      .select('id, user_id, image_url, images')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Listing not found' });
      }
      throw fetchError;
    }

    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own listings' });
    }

    const oldImageUrl = existing.image_url;
    const newImageUrl = req.body.image_url;
    const imageIsBeingReplaced =
      oldImageUrl &&
      newImageUrl !== undefined &&
      oldImageUrl !== newImageUrl;

    const updateData = {
      ...req.body,
      moderation_status: 'pending',
      moderated_by: null,
      moderated_at: null,
      moderation_note: null,
    };

    const { data, error } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        area:areas(id, name, zone:zones(id, name)),
        category:categories(id, name)
      `)
      .single();

    if (error) {
      throw error;
    }

    if (imageIsBeingReplaced) {
      const match = oldImageUrl.match(/\/listing-images\/(.+)$/);
      if (match) {
        const imagePath = match[1];
        if (!imagePath.startsWith(req.user.id + '/')) {
          return res.status(403).json({ error: 'Unauthorized' });
        }
      }
      await deleteStorageImage(oldImageUrl);
    }

    if (
      existing.images?.length &&
      req.body.images !== undefined
    ) {
      const removedImages = existing.images.filter(
        (url) => !req.body.images.includes(url)
      );
      if (removedImages.length > 0) {
        await deleteStorageImages(removedImages);
      }
    }

    res.json(data);

    // Notify admins asynchronously that listing was resubmitted
    (async () => {
      try {
        const { data: seller } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', req.user.id)
          .single();
        
        const sellerName = seller?.display_name || 'A user';

        const { data: admins } = await supabase
          .from('profiles')
          .select('id')
          .in('role', ['admin', 'super_admin']);
        
        if (admins && admins.length > 0) {
          const notifications = admins.map((admin) => ({
            user_id: admin.id,
            type: 'NEW_LISTING',
            title: 'New Listing Pending Review',
            message: `${sellerName} updated "${data.title}" — needs approval`,
            link: '/admin/listings?status=pending'
          }));
          await createNotifications(notifications);
        }
      } catch (notifyError) {
        console.error('Notification error:', notifyError);
      }
    })();
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

    const { data: existing, error: fetchError } = await supabase
      .from('listings')
      .select('id, user_id, image_url, images')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Listing not found' });
      }
      throw fetchError;
    }

    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own listings' });
    }

    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    if (existing.image_url) {
      const match = existing.image_url.match(/\/listing-images\/(.+)$/);
      if (match) {
        const imagePath = match[1];
        if (!imagePath.startsWith(req.user.id + '/')) {
          return res.status(403).json({ error: 'Unauthorized' });
        }
      }
      await deleteStorageImage(existing.image_url);
    }

    if (existing.images?.length) {
      await deleteStorageImages(existing.images);
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/listings/:id/sold
 * Toggle sold status of a listing (authenticated, owner only)
 */
router.patch('/:id/sold', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_sold } = req.body;

    if (typeof is_sold !== 'boolean') {
      return res.status(400).json({ error: 'is_sold must be a boolean' });
    }

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

    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own listings' });
    }

    const { data, error } = await supabase
      .from('listings')
      .update({ is_sold })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
