import { supabase } from '../supabase.js';

export async function createAdminLog({ adminId, action, targetType, targetId, details = {} }) {
  const payload = {
    admin_id: adminId,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
  };

  const { error } = await supabase
    .from('admin_logs')
    .insert(payload);

  if (error) {
    throw error;
  }
}
