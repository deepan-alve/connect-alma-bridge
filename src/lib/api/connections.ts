// API: Connection Management (Using Backend API)
import { connectionsAPI } from "@/lib/apiClient";

export interface Connection {
  connection_id: number;
  user_id_1: string;
  user_id_2: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

// Fetch user's connections
export const fetchConnections = async (userId: string, status?: string) => {
  return await connectionsAPI.getConnections(status);
};

// Fetch connection requests received
export const fetchConnectionRequests = async (userId: string) => {
  return await connectionsAPI.getConnections('pending');
};

// Send connection request
export const sendConnectionRequest = async (receiverId: string) => {
  return await connectionsAPI.sendRequest(receiverId);
};

// Accept connection request
export const acceptConnectionRequest = async (connectionId: number) => {
  return await connectionsAPI.acceptRequest(connectionId);
};

// Reject connection request
export const rejectConnectionRequest = async (connectionId: number) => {
  return await connectionsAPI.rejectRequest(connectionId);
};

// Fetch suggested connections
export const fetchSuggestedConnections = async (userId: string) => {
  return await connectionsAPI.getSuggestions();
};
