// User Directory Service - Get all users in the network
import { supabase } from '../lib/supabase';

export const userService = {
  // Get all users with filters
  async getAllUsers(filters?: {
    search?: string;
    role?: string;
    department?: string;
    graduationYear?: string;
  }) {
    let query = supabase
      .from('users')
      .select('user_id, name, email, role, profile_pic, bio, department, graduation_year')
      .order('name', { ascending: true });

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,role.ilike.%${filters.search}%,department.ilike.%${filters.search}%`);
    }

    if (filters?.role) {
      query = query.eq('role', filters.role);
    }

    if (filters?.department) {
      query = query.eq('department', filters.department);
    }

    if (filters?.graduationYear) {
      query = query.eq('graduation_year', filters.graduationYear);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return data;
  },

  // Get user profile by ID
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        skills:userskills(
          skill_id,
          endorsements_count,
          skill:skills(skill_id, skill_name)
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    // Flatten the skills structure for easier frontend consumption
    if (data && data.skills) {
      data.skills = data.skills.map((userSkill: any) => ({
        skill_id: userSkill.skill?.skill_id || userSkill.skill_id,
        skill_name: userSkill.skill?.skill_name || '',
        endorsements_count: userSkill.endorsements_count || 0
      }));
    }

    return data;
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: {
    name?: string;
    role?: string;
    bio?: string;
    department?: string;
    graduation_year?: string;
    profile_pic?: string;
  }) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return data;
  },

  // Get departments list
  async getDepartments() {
    const { data, error } = await supabase
      .from('users')
      .select('department')
      .not('department', 'is', null);

    if (error) {
      throw new Error(`Failed to fetch departments: ${error.message}`);
    }

    // Get unique departments
    const uniqueDepartments = [...new Set(data.map(u => u.department))];
    return uniqueDepartments;
  },

  // Get graduation years
  async getGraduationYears() {
    const { data, error } = await supabase
      .from('users')
      .select('graduation_year')
      .not('graduation_year', 'is', null)
      .order('graduation_year', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch graduation years: ${error.message}`);
    }

    // Get unique years
    const uniqueYears = [...new Set(data.map(u => u.graduation_year))];
    return uniqueYears;
  },
};
