import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

/**
 * GET /api/zones
 * List all zones (Greater Banjul Area zones)
 */
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .order('name');

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/zones/:id/areas
 * List all areas in a given zone
 */
router.get('/:id/areas', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('areas')
      .select('*')
      .eq('zone_id', parseInt(id))
      .order('name');

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
