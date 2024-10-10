// Connection Service - Business Logic
import { supabase } from '../lib/supabase';

export const connectionService = {
  // Get user's connections
  async getConnections(userId: string, status?: string) {
    let query = supabase
      .from('connections')
      .select(`
        *,
        user1:users!connections_user_id_1_fkey(user_id, name, role, profile_pic, department, graduation_year),
        user2:users!connections_user_id_2_fkey(user_id, name, role, profile_pic, department, graduation_year)
      `)
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Return the "other" user in each connection
    return data.map((conn: any) => ({
      ...conn,
      otherUser: conn.user_id_1 === userId ? conn.user2 : conn.user1,
    }));
  },

  // Send connection request
  async sendConnectionRequest(senderId: string, receiverId: any) {
    // Validate not connecting to self
    receiverId = String(receiverId);
    if (senderId === receiverId) {
      throw new Error('You cannot connect with yourself');
    }

    // Check if already connected or pending
    const { data: existing } = await supabase
      .from('connections')
      .select('connection_id, status')
      .or(
        `and(user_id_1.eq.${senderId},user_id_2.eq.${receiverId}),and(user_id_1.eq.${receiverId},user_id_2.eq.${senderId})`
      )
      .single();

    if (existing) {
      if (existing.status === 'accepted') {
        throw new Error('You are already connected');
      } else if (existing.status === 'pending') {
        throw new Error('Connection request already pending');
      }
    }

    // Create connection request
    const { data, error } = await supabase
      .from('connections')
      .insert({
        user_id_1: senderId,
        user_id_2: receiverId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // Get sender details for notification
    const { data: sender } = await supabase
      .from('users')
      .select('name, role, department, graduation_year')
      .eq('user_id', senderId)
      .single();

    // Create structured notification with sender details and connection id so frontend can act on it
    const notificationPayload = {
      type: 'connection_request',
      connection_id: data.connection_id,
      sender_id: senderId,
      sender_name: sender?.name || 'Someone',
      sender_role: sender?.role || null,
      sender_department: sender?.department || null,
    };

    await supabase.from('notifications').insert({
      user_id: receiverId,
      content: JSON.stringify(notificationPayload),
      is_read: false,
    });

    return data;
  },

  // Accept connection request
  async acceptConnectionRequest(connectionId: number, userId: string) {
    // Verify user is the receiver (user_id_2)
    const { data: connection } = await supabase
      .from('connections')
      .select('*')
      .eq('connection_id', connectionId)
      .eq('user_id_2', userId)
      .eq('status', 'pending')
      .single();

    if (!connection) {
      throw new Error('Connection request not found or already processed');
    }

    // Update status
    const { data, error } = await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('connection_id', connectionId)
      .select()
      .single();

    if (error) throw error;

    // Get accepter details for notification
    const { data: accepter } = await supabase
      .from('users')
      .select('name, role')
      .eq('user_id', userId)
      .single();

    // Notify sender with accepter details
    await supabase.from('notifications').insert({
      user_id: connection.user_id_1,
      content: `${accepter?.name || 'Someone'} accepted your connection request`,
      is_read: false,
    });

    return data;
  },

  // Reject connection request
  async rejectConnectionRequest(connectionId: number, userId: string) {
    const { data: connection } = await supabase
      .from('connections')
      .select('*')
      .eq('connection_id', connectionId)
      .eq('user_id_2', userId)
      .eq('status', 'pending')
      .single();

    if (!connection) {
      throw new Error('Connection request not found or already processed');
    }

    const { data, error } = await supabase
      .from('connections')
      .update({ status: 'rejected' })
      .eq('connection_id', connectionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get suggested connections
  async getSuggestedConnections(userId: string) {
    // Get current user's info
    const { data: currentUser } = await supabase
      .from('users')
      .select('department, graduation_year')
      .eq('user_id', userId)
      .single();

    if (!currentUser) return [];

    // Get existing connection user IDs
    const { data: existingConnections } = await supabase
      .from('connections')
      .select('user_id_1, user_id_2')
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

    const connectedUserIds = existingConnections?.flatMap((conn) =>
      [conn.user_id_1, conn.user_id_2].filter((id) => id !== userId)
    ) || [];

    // Find suggestions
    let query = supabase
      .from('users')
      .select('user_id, name, role, profile_pic, department, graduation_year, bio')
      .neq('user_id', userId);

    if (connectedUserIds.length > 0) {
      query = query.not('user_id', 'in', `(${connectedUserIds.join(',')})`);
    }

    query = query.or(
      `department.eq.${currentUser.department},graduation_year.eq.${currentUser.graduation_year}`
    );

    const { data, error } = await query.limit(10);
    if (error) throw error;
    return data;
  },
};
