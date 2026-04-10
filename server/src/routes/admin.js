import { Router } from 'express';
import { supabase } from '../supabase.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/admin.js';
import { updateReportStatusSchema, validateBody as validateReportBody } from '../schemas/report.js';
import { moderateListingSchema, updateBanStatusSchema, validateBody as validateAdminBody } from '../schemas/admin.js';
import { createAdminLog } from '../utils/adminLogs.js';

const router = Router();

router.use(authenticate, requireAdmin);

/**
 * GET /api/admin/stats
 */
router.get('/admin/stats', async (req, res, next) => {
  try {
    const [usersCountRes, bannedUsersCountRes, listingsCountRes, pendingListingsCountRes, pendingReportsCountRes] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true),
      supabase.from('listings').select('*', { count: 'exact', head: true }),
      supabase.from('listings').select('*', { count: 'exact', head: true }).eq('moderation_status', 'pending'),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    const firstError = [usersCountRes, bannedUsersCountRes, listingsCountRes, pendingListingsCountRes, pendingReportsCountRes]
      .find((result) => result.error)?.error;
    if (firstError) {
      throw firstError;
    }

    return res.json({
      users_total: usersCountRes.count || 0,
      users_banned: bannedUsersCountRes.count || 0,
      listings_total: listingsCountRes.count || 0,
      listings_pending: pendingListingsCountRes.count || 0,
      reports_pending: pendingReportsCountRes.count || 0,
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/admin/users
 */
router.get('/admin/users', async (req, res, next) => {
  try {
    const { search = '', role, banned } = req.query;

    let query = supabase
      .from('profiles')
      .select('id, display_name, role, is_banned, created_at, listing_count:listings(count)')
      .order('created_at', { ascending: false });

    if (role) {
      query = query.eq('role', role);
    }

    if (banned === 'true') {
      query = query.eq('is_banned', true);
    }

    if (banned === 'false') {
      query = query.eq('is_banned', false);
    }

    if (search) {
      const escaped = String(search).replaceAll('%', '\\%').replaceAll('_', '\\_').slice(0, 100);
      query = query.ilike('display_name', `%${escaped}%`);
    }

    const { data: profiles, error } = await query;
    if (error) {
      throw error;
    }

    const profileIds = profiles.map((profile) => profile.id);

    let emailsById = {};
    if (profileIds.length > 0) {
      const users = [];
      const pageSize = 200;
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const { data: userPage, error: usersError } = await supabase.auth.admin.listUsers({
          page,
          perPage: pageSize,
        });

        if (usersError) {
          throw usersError;
        }

        const fetchedUsers = userPage?.users || [];
        users.push(...fetchedUsers);
        hasMore = fetchedUsers.length === pageSize;
        page += 1;
      }

      emailsById = users.reduce((acc, user) => {
        if (profileIds.includes(user.id)) {
          acc[user.id] = user.email;
        }
        return acc;
      }, {});
    }

    const response = profiles.map((profile) => ({
      ...profile,
      email: emailsById[profile.id] || null,
      listing_count: profile.listing_count?.[0]?.count || 0,
    }));

    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

/**
 * PUT /api/admin/users/:id/ban
 */
router.put('/admin/users/:id/ban', validateAdminBody(updateBanStatusSchema), async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const { is_banned, reason } = req.body;

    if (targetUserId === req.user.id && is_banned) {
      return res.status(400).json({ error: 'You cannot ban your own account' });
    }

    const { data: targetProfile, error: targetProfileError } = await supabase
      .from('profiles')
      .select('id, role, is_banned')
      .eq('id', targetUserId)
      .single();

    if (targetProfileError) {
      if (targetProfileError.code === 'PGRST116') {
        return res.status(404).json({ error: 'User not found' });
      }
      throw targetProfileError;
    }

    if (targetProfile.role === 'super_admin' && !req.user.isSuperAdmin) {
      return res.status(403).json({ error: 'Only a super admin can suspend another super admin' });
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ is_banned })
      .eq('id', targetUserId)
      .select('id, display_name, role, is_banned, created_at')
      .single();

    if (updateError) {
      throw updateError;
    }

    if (is_banned) {
      const { error: banError } = await supabase.auth.admin.updateUserById(targetUserId, {
        ban_duration: '876000h',
      });
      if (banError) {
        throw banError;
      }
    } else {
      const { error: unbanError } = await supabase.auth.admin.updateUserById(targetUserId, {
        ban_duration: 'none',
      });
      if (unbanError) {
        throw unbanError;
      }
    }

    await createAdminLog({
      adminId: req.user.id,
      action: is_banned ? 'BAN_USER' : 'UNBAN_USER',
      targetType: 'USER',
      targetId: targetUserId,
      details: {
        reason: reason || null,
      },
    });

    return res.json(updatedProfile);
  } catch (err) {
    return next(err);
  }
});

/**
 * DELETE /api/admin/users/:id
 * Permanent deletion, super admin only
 */
router.delete('/admin/users/:id', requireSuperAdmin, async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: 'You cannot permanently delete your own account' });
    }

    const { data: targetProfile, error: targetProfileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', targetUserId)
      .single();

    if (targetProfileError) {
      if (targetProfileError.code === 'PGRST116') {
        return res.status(404).json({ error: 'User not found' });
      }
      throw targetProfileError;
    }

    if (targetProfile.role === 'super_admin') {
      return res.status(403).json({ error: 'Super admin accounts cannot be permanently deleted via API' });
    }

    const { error: deleteError } = await supabase.auth.admin.deleteUser(targetUserId);
    if (deleteError) {
      throw deleteError;
    }

    await createAdminLog({
      adminId: req.user.id,
      action: 'HARD_DELETE_USER',
      targetType: 'USER',
      targetId: targetUserId,
    });

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/admin/listings
 */
router.get('/admin/listings', async (req, res, next) => {
  try {
    const { status, search = '' } = req.query;

    let query = supabase
      .from('listings')
      .select(`
        id,
        title,
        price,
        moderation_status,
        moderation_note,
        created_at,
        user_id,
        region:regions(id, name),
        category:categories(id, name),
        seller:profiles!user_id(id, display_name, is_banned)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('moderation_status', status);
    }

    if (search) {
      const escaped = String(search).replaceAll('%', '\\%').replaceAll('_', '\\_').slice(0, 100);
      query = query.ilike('title', `%${escaped}%`);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return res.json(data);
  } catch (err) {
    return next(err);
  }
});

/**
 * PUT /api/admin/listings/:id/moderate
 */
router.put('/admin/listings/:id/moderate', validateAdminBody(moderateListingSchema), async (req, res, next) => {
  try {
    const listingId = req.params.id;
    const { moderation_status, moderation_note } = req.body;

    const { data, error } = await supabase
      .from('listings')
      .update({
        moderation_status,
        moderation_note: moderation_note || null,
        moderated_by: req.user.id,
        moderated_at: new Date().toISOString(),
      })
      .eq('id', listingId)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Listing not found' });
      }
      throw error;
    }

    await createAdminLog({
      adminId: req.user.id,
      action: moderation_status === 'approved' ? 'APPROVE_LISTING' : 'REJECT_LISTING',
      targetType: 'LISTING',
      targetId: listingId,
      details: {
        moderation_note: moderation_note || null,
      },
    });

    return res.json(data);
  } catch (err) {
    return next(err);
  }
});

/**
 * DELETE /api/admin/listings/:id
 */
router.delete('/admin/listings/:id', async (req, res, next) => {
  try {
    const listingId = req.params.id;

    const { data: existing, error: existingError } = await supabase
      .from('listings')
      .select('id')
      .eq('id', listingId)
      .single();

    if (existingError) {
      if (existingError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Listing not found' });
      }
      throw existingError;
    }

    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId);

    if (error) {
      throw error;
    }

    await createAdminLog({
      adminId: req.user.id,
      action: 'DELETE_LISTING',
      targetType: 'LISTING',
      targetId: existing.id,
    });

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/admin/reports
 */
router.get('/admin/reports', async (req, res, next) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from('reports')
      .select(`
        id,
        reporter_id,
        listing_id,
        reported_user_id,
        reason,
        details,
        status,
        handled_by,
        handled_at,
        created_at,
        reporter:profiles!reporter_id(id, display_name),
        listing:listings(id, title),
        reported_user:profiles!reported_user_id(id, display_name)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return res.json(data);
  } catch (err) {
    return next(err);
  }
});

/**
 * PUT /api/admin/reports/:id
 */
router.put('/admin/reports/:id', validateReportBody(updateReportStatusSchema), async (req, res, next) => {
  try {
    const reportId = req.params.id;
    const { status } = req.body;

    const updateData = {
      status,
      handled_by: req.user.id,
      handled_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', reportId)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Report not found' });
      }
      throw error;
    }

    await createAdminLog({
      adminId: req.user.id,
      action: status === 'resolved' ? 'RESOLVE_REPORT' : status === 'dismissed' ? 'DISMISS_REPORT' : 'REOPEN_REPORT',
      targetType: 'REPORT',
      targetId: data.id,
      details: {
        status,
      },
    });

    return res.json(data);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /api/admin/logs
 */
router.get('/admin/logs', requireSuperAdmin, async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('admin_logs')
      .select(`
        id,
        admin_id,
        action,
        target_type,
        target_id,
        details,
        created_at,
        admin:profiles!admin_id(id, display_name)
      `)
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      throw error;
    }

    return res.json(data);
  } catch (err) {
    return next(err);
  }
});

export default router;
