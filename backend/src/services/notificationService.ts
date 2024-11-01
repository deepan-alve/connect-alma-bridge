// Notification Service
import { supabase } from '../lib/supabase';

// Get user's notifications
export const getUserNotifications = async (
  userId: string,
  unreadOnly: boolean = false
) => {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(50);
  
  if (unreadOnly) {
    query = query.eq('is_read', false);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
};

// Mark notification as read
export const markNotificationAsRead = async (
  notificationId: number,
  userId: string
) => {
  // Verify notification belongs to user
  const { data: notification } = await supabase
    .from('notifications')
    .select('user_id')
    .eq('notification_id', notificationId)
    .single();
  
  if (!notification || notification.user_id !== userId) {
    throw new Error('Notification not found or access denied');
  }
  
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('notification_id', notificationId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId: string) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
    .select();
  
  if (error) throw error;
  return data;
};

// Get unread notification count
export const getUnreadCount = async (userId: string) => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  
  if (error) throw error;
  return count || 0;
};

// Delete notification
export const deleteNotification = async (
  notificationId: number,
  userId: string
) => {
  // Verify notification belongs to user
  const { data: notification } = await supabase
    .from('notifications')
    .select('user_id')
    .eq('notification_id', notificationId)
    .single();
  
  if (!notification || notification.user_id !== userId) {
    throw new Error('Notification not found or access denied');
  }
  
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('notification_id', notificationId);
  
  if (error) throw error;
  return { success: true };
};
