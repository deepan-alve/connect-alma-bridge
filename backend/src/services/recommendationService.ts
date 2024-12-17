// Recommendation Service
import { supabase } from '../lib/supabase';

// Request a recommendation
export const requestRecommendation = async (
  requesterId: string,
  recommenderId: string,
  message?: string
) => {
  // Prevent self-recommendation
  if (requesterId === recommenderId) {
    throw new Error('Cannot request recommendation from yourself');
  }
  
  // Check if already requested
  const { data: existing } = await supabase
    .from('recommendation_requests')
    .select('*')
    .eq('requester_id', requesterId)
    .eq('recommender_id', recommenderId)
    .eq('status', 'pending')
    .single();
  
  if (existing) {
    throw new Error('You already have a pending recommendation request with this user');
  }
  
  // Create recommendation request
  const { data, error } = await supabase
    .from('recommendation_requests')
    .insert({
      requester_id: requesterId,
      recommender_id: recommenderId,
      message: message || '',
      status: 'pending'
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Create notification
  const { data: requester } = await supabase
    .from('users')
    .select('name')
    .eq('user_id', requesterId)
    .single();
  
  await supabase
    .from('notifications')
    .insert({
      user_id: recommenderId,
      content: `${requester?.name} requested a recommendation from you`,
      is_read: false
    });
  
  return data;
};

// Write a recommendation
export const writeRecommendation = async (
  recommenderId: string,
  recommendedId: string,
  text: string,
  requestId?: number
) => {
  if (!text || text.trim().length === 0) {
    throw new Error('Recommendation text cannot be empty');
  }
  
  // Create recommendation (initially not approved)
  const { data, error } = await supabase
    .from('recommendations')
    .insert({
      recommender_id: recommenderId,
      recommended_id: recommendedId,
      text: text.trim(),
      status: 'pending'
    })
    .select(`
      *,
      recommender:users!recommendations_recommender_id_fkey(user_id, name, profile_pic, role)
    `)
    .single();
  
  if (error) throw error;
  
  // If this was in response to a request, mark request as completed
  if (requestId) {
    await supabase
      .from('recommendation_requests')
      .update({ status: 'completed' })
      .eq('request_id', requestId);
  }
  
  // Create notification for recommended user
  const { data: recommender } = await supabase
    .from('users')
    .select('name')
    .eq('user_id', recommenderId)
    .single();
  
  await supabase
    .from('notifications')
    .insert({
      user_id: recommendedId,
      content: `${recommender?.name} wrote you a recommendation. Review and approve it.`,
      is_read: false
    });
  
  return data;
};

// Approve/reject a recommendation
export const updateRecommendationStatus = async (
  recommendationId: number,
  userId: string,
  status: 'approved' | 'rejected'
) => {
  // Verify user is the one being recommended
  const { data: recommendation } = await supabase
    .from('recommendations')
    .select('*')
    .eq('recommendation_id', recommendationId)
    .single();
  
  if (!recommendation) {
    throw new Error('Recommendation not found');
  }
  
  if (recommendation.recommended_id !== userId) {
    throw new Error('You can only approve/reject your own recommendations');
  }
  
  const { data, error } = await supabase
    .from('recommendations')
    .update({ status })
    .eq('recommendation_id', recommendationId)
    .select(`
      *,
      recommender:users!recommendations_recommender_id_fkey(user_id, name, profile_pic, role)
    `)
    .single();
  
  if (error) throw error;
  return data;
};

// Get user's approved recommendations
export const getUserRecommendations = async (userId: string) => {
  const { data, error } = await supabase
    .from('recommendations')
    .select(`
      *,
      recommender:users!recommendations_recommender_id_fkey(user_id, name, profile_pic, role, graduation_year)
    `)
    .eq('recommended_id', userId)
    .eq('status', 'approved')
    .order('date', { ascending: false });
  
  if (error) throw error;
  return data;
};

// Get pending recommendation requests (for recommender)
export const getPendingRecommendationRequests = async (recommenderId: string) => {
  const { data, error } = await supabase
    .from('recommendation_requests')
    .select(`
      *,
      requester:users!recommendation_requests_requester_id_fkey(user_id, name, profile_pic, role, department)
    `)
    .eq('recommender_id', recommenderId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

// Get pending recommendations to approve (for recommended user)
export const getPendingRecommendations = async (userId: string) => {
  const { data, error } = await supabase
    .from('recommendations')
    .select(`
      *,
      recommender:users!recommendations_recommender_id_fkey(user_id, name, profile_pic, role)
    `)
    .eq('recommended_id', userId)
    .eq('status', 'pending')
    .order('date', { ascending: false });
  
  if (error) throw error;
  return data;
};
