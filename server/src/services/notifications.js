import { supabase } from '../supabase.js';

export const createNotification = async ({ 
  user_id, 
  type, 
  title, 
  message, 
  link 
}) => {
  const { error } = await supabase
    .from('notifications')
    .insert({ user_id, type, title, message, link });
  
  if (error) {
    console.error('Failed to create notification:', error.message);
  }
};

// Create notifications for multiple users at once
export const createNotifications = async (notifications) => {
  const { error } = await supabase
    .from('notifications')
    .insert(notifications);
  
  if (error) {
    console.error('Failed to create notifications:', error.message);
  }
};