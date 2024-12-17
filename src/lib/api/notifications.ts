// API: Notifications
import { supabase } from "@/lib/supabase";

export interface Notification {
  notification_id: number;
  user_id: string;
  content: string;
  is_read: boolean;
  timestamp: string;
}

// Fetch user's notifications
export const fetchNotifications = async (userId: string, unreadOnly = false) => {
  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Notification[];
};

// Mark notification as read (uses database function)
export const markNotificationRead = async (notificationId: number) => {
  const { data, error } = await supabase.rpc('mark_notification_read', {
    notif_id: notificationId
  });

  if (error) throw error;
  return data;
};

// Mark all notifications as read (uses database function)
export const markAllNotificationsRead = async () => {
  const { data, error } = await supabase.rpc('mark_all_notifications_read');
  if (error) throw error;
  return data;
};

// Get unread count
export const fetchUnreadCount = async (userId: string) => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
};

// Subscribe to new notifications (real-time)
export const subscribeToNotifications = (
  userId: string,
  callback: (notification: Notification) => void
) => {
  const channel = supabase
    .channel('notifications-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new as Notification);
      }
    )
    .subscribe();

  return channel;
};

// Unsubscribe from notifications
export const unsubscribeFromNotifications = (channel: any) => {
  supabase.removeChannel(channel);
};
