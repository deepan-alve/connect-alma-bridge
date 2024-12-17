// API: Messaging Operations (Using Backend API)
import { messagesAPI } from "@/lib/apiClient";
import { supabase } from "@/lib/supabase";

export interface Message {
  message_id: number;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  timestamp: string;
}

// Fetch conversations (unique users you've messaged)
export const fetchConversations = async (userId: string) => {
  return await messagesAPI.getConversations();
};

// Fetch messages in a conversation
export const fetchMessages = async (userId: string, partnerId: string) => {
  return await messagesAPI.getMessages(partnerId);
};

// Send message
export const sendMessage = async (receiverId: string, messageText: string) => {
  return await messagesAPI.sendMessage(receiverId, messageText);
};

// Subscribe to new messages (real-time)
export const subscribeToMessages = (
  userId: string,
  callback: (message: any) => void
) => {
  const channel = supabase
    .channel('messages-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return channel;
};

// Unsubscribe from messages
export const unsubscribeFromMessages = (channel: any) => {
  supabase.removeChannel(channel);
};
