// API: User Profile Operations
import { supabase } from "@/lib/supabase";

export interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  role: string;
  profile_pic?: string;
  bio?: string;
  department?: string;
  graduation_year?: string;
}

// Fetch user profile by ID
export const fetchUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data as UserProfile;
};

// Fetch current user's profile
export const fetchCurrentUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  return fetchUserProfile(user.id);
};

// Update user profile
export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Search users (for alumni directory)
export const searchUsers = async (filters: {
  searchTerm?: string;
  department?: string;
  graduationYear?: string;
  role?: string;
}) => {
  let query = supabase
    .from('users')
    .select('user_id, name, email, role, profile_pic, department, graduation_year, bio');

  if (filters.searchTerm) {
    query = query.or(`name.ilike.%${filters.searchTerm}%,department.ilike.%${filters.searchTerm}%`);
  }
  if (filters.department) {
    query = query.eq('department', filters.department);
  }
  if (filters.graduationYear) {
    query = query.eq('graduation_year', filters.graduationYear);
  }
  if (filters.role) {
    query = query.eq('role', filters.role);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as UserProfile[];
};

// Fetch user's skills
export const fetchUserSkills = async (userId: string) => {
  const { data, error } = await supabase
    .from('userskills')
    .select('skill_id, endorsements_count, skills(skill_name)')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
};

// Add skill to user
export const addUserSkill = async (userId: string, skillId: number) => {
  const { data, error } = await supabase
    .from('userskills')
    .insert({ user_id: userId, skill_id: skillId, endorsements_count: 0 })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Fetch all available skills
export const fetchAllSkills = async () => {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('skill_name');

  if (error) throw error;
  return data;
};

// Endorse a skill (uses database function)
export const endorseSkill = async (targetUserId: string, skillId: number) => {
  const { data, error } = await supabase.rpc('endorse_skill', {
    target_user_id: targetUserId,
    target_skill_id: skillId
  });

  if (error) throw error;
  return data;
};
