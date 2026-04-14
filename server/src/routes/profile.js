import { Router } from 'express';
import { supabase } from '../supabase.js';
import { authenticate } from '../middleware/auth.js';
import { updateProfileSchema, validateBody } from '../schemas/user.js';

const router = Router();

router.use(authenticate);

/**
 * GET /api/profile
 * Get the current user's profile
 */
router.get('/profile', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, email, role, created_at, phone_number, avatar_url, bio')
      .eq('id', req.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Profile not found' });
      }
      throw error;
    }

    return res.json(data);
  } catch (err) {
    return next(err);
  }
});

/**
 * PUT /api/profile
 * Update the current user's profile
 */
router.put('/profile', validateBody(updateProfileSchema), async (req, res, next) => {
  try {
    const { display_name, phone_number, bio, avatar_url } = req.body;

    const { data, error } = await supabase
      .from('profiles')
      .update({
        display_name,
        phone_number,
        bio,
        avatar_url,
      })
      .eq('id', req.user.id)
      .select('id, display_name, email, role, created_at, phone_number, avatar_url, bio')
      .single();

    if (error) {
      throw error;
    }

    return res.json(data);
  } catch (err) {
    return next(err);
  }
});

export default router;
