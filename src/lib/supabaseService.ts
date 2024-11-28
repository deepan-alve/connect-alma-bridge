// src/lib/supabaseService.ts

import { supabase } from "@/lib/supabase"; // Your initialized Supabase client

// Define the shape of the data for an update operation
interface ProfileUpdate {
  name: string;
  bio: string;
  department: string;
  graduation_year: string;
}

/**
 * Fetches the public profile data for a specific user ID.
 * @param userId The UUID of the user from Supabase Auth.
 */
export const fetchUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('name, role, department, graduation_year, bio, profile_pic')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
  return data;
};

/**
 * Updates the user's profile information.
 * @param userId The UUID of the user from Supabase Auth.
 * @param updates An object containing the fields to update.
 */
export const updateUserProfile = async (userId: string, updates: ProfileUpdate) => {
  if (!userId) {
    throw new Error("User ID is required to update profile.");
  }
  
  // Note: RLS must allow the user to UPDATE their row where user_id = auth.uid()
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('user_id', userId); 

  if (error) {
    console.error('Supabase profile update error:', error);
    throw error;
  }
  return true;
};