import { Router } from 'express';
import { supabase } from '../supabase.js';
import { authenticate } from '../middleware/auth.js';
import { createReportSchema, validateBody } from '../schemas/report.js';

const router = Router();

/**
 * POST /api/reports
 * Submit a report for a listing or user
 */
router.post('/reports', authenticate, validateBody(createReportSchema), async (req, res, next) => {
  try {
    const { listing_id, reported_user_id, reason, details } = req.body;

    if (listing_id) {
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('id, user_id')
        .eq('id', listing_id)
        .single();

      if (listingError) {
        if (listingError.code === 'PGRST116') {
          return res.status(404).json({ error: 'Listing not found' });
        }
        throw listingError;
      }

      if (listing.user_id === req.user.id) {
        return res.status(400).json({ error: 'You cannot report your own listing' });
      }
    }

    if (reported_user_id && reported_user_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot report your own account' });
    }

    if (reported_user_id) {
      const { data: reportedProfile, error: reportedProfileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', reported_user_id)
        .maybeSingle();

      if (reportedProfileError) {
        throw reportedProfileError;
      }

      if (!reportedProfile) {
        return res.status(404).json({ error: 'Reported user not found' });
      }
    }

    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: req.user.id,
        listing_id: listing_id || null,
        reported_user_id: reported_user_id || null,
        reason,
        details: details || null,
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'You have already submitted an open report for this listing' });
      }
      throw error;
    }

    return res.status(201).json(data);
  } catch (err) {
    return next(err);
  }
});

export default router;
