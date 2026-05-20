import { Router } from 'express';
import { supabase } from '../supabase.js';
import { authenticate } from '../middleware/auth.js';
import { updateProfileSchema, validateBody } from '../schemas/user.js';

const router = Router();

router.use('/profile', authenticate);

/**
 * GET /api/profile
 * Get the current user's profile
 */
router.get('/profile', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, email, role, created_at, phone_number, avatar_url, bio, notifications')
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
    const { display_name, phone_number, bio, avatar_url, notifications } = req.body;

    const { data, error } = await supabase
      .from('profiles')
      .update({
        display_name,
        phone_number,
        bio,
        avatar_url,
        notifications,
      })
      .eq('id', req.user.id)
      .select('id, display_name, email, role, created_at, phone_number, avatar_url, bio, notifications')
      .single();

    if (error) {
      throw error;
    }

    return res.json(data);
  } catch (err) {
    return next(err);
  }
});

/**
 * DELETE /api/profile/avatar
 * Delete the current user's avatar (storage file + profile field).
 * Uses service role key to bypass RLS on storage.
 */
router.delete('/profile/avatar', async (req, res, next) => {
  try {
    // Get current profile to find the avatar URL
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', req.user.id)
      .single();

    if (profileError) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Delete from storage if URL exists
    if (profile?.avatar_url) {
      const urlParts = profile.avatar_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      if (fileName) {
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([fileName]);

        if (deleteError) {
          console.error('Storage delete error:', deleteError);
          // Don't block the profile update if storage delete fails
        }
      }
    }

    // Update profile to clear avatar_url
    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', req.user.id)
      .select('id, display_name, email, role, created_at, phone_number, avatar_url, bio, notifications')
      .single();

    if (updateError) throw updateError;

    return res.json(data);
  } catch (err) {
    return next(err);
  }
});

export default router;
