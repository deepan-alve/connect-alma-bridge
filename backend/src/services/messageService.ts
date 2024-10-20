// Message Service - Business Logic
import { supabase } from '../lib/supabase';

export const messageService = {
  // Get all conversations for a user
  async getConversations(userId: string) {
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(user_id, name, profile_pic),
        receiver:users!messages_receiver_id_fkey(user_id, name, profile_pic)
      `)
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    // Group by conversation partner
    const conversationsMap = new Map();
    messages?.forEach((msg: any) => {
      const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      const partner = msg.sender_id === userId ? msg.receiver : msg.sender;

      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          partnerId,
          partner,
          lastMessage: msg.message_text,
          lastMessageTime: msg.timestamp,
        });
      }
    });

    return Array.from(conversationsMap.values());
  },

  // Get messages between two users
  async getMessages(userId: string, partnerId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!messages_sender_id_fkey(user_id, name, profile_pic)
      `)
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`
      )
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Send a message
  async sendMessage(senderId: string, receiverId: string, messageText: string) {
    // Validate users are connected
    const { data: connection } = await supabase
      .from('connections')
      .select('connection_id')
      .or(
        `and(user_id_1.eq.${senderId},user_id_2.eq.${receiverId}),and(user_id_1.eq.${receiverId},user_id_2.eq.${senderId})`
      )
      .eq('status', 'accepted')
      .single();

    if (!connection) {
      throw new Error('You can only message users you are connected with');
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        message_text: messageText,
      })
      .select()
      .single();

    if (error) throw error;

    // Get sender details for notification
    const { data: sender } = await supabase
      .from('users')
      .select('name')
      .eq('user_id', senderId)
      .single();

    // Create notification for receiver with sender name
    await supabase.from('notifications').insert({
      user_id: receiverId,
      content: `New message from ${sender?.name || 'Someone'}`,
      is_read: false,
    });

    return data;
  },
};
