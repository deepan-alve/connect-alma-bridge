// Skill Management Service
import { supabase } from '../lib/supabase';

// Get all available skills
export const getAllSkills = async () => {
  const { data, error } = await supabase
    .from('skills')
    .select('*')
    .order('skill_name');
  
  if (error) throw error;
  return data;
};

// Get user's skills with endorsement counts
export const getUserSkills = async (userId: string) => {
  const { data, error } = await supabase
    .from('userskills')
    .select(`
      *,
      skill:skills(skill_id, skill_name)
    `)
    .eq('user_id', userId);
  
  if (error) throw error;
  return data;
};

// Add skill to user profile
export const addUserSkill = async (userId: string, skillId: number) => {
  // Check if skill already exists for user
  const { data: existing } = await supabase
    .from('userskills')
    .select('*')
    .eq('user_id', userId)
    .eq('skill_id', skillId)
    .single();
  
  if (existing) {
    throw new Error('Skill already added to profile');
  }
  
  const { data, error } = await supabase
    .from('userskills')
    .insert({
      user_id: userId,
      skill_id: skillId,
      endorsements_count: 0
    })
    .select(`
      *,
      skill:skills(skill_id, skill_name)
    `)
    .single();
  
  if (error) throw error;
  return data;
};

// Add skill by name (create skill if doesn't exist, then add to user)
export const addUserSkillByName = async (userId: string, skillName: string) => {
  // First, check if skill exists
  let { data: skill } = await supabase
    .from('skills')
    .select('*')
    .ilike('skill_name', skillName)
    .single();
  
  // If skill doesn't exist, create it
  if (!skill) {
    const { data: newSkill, error: createError } = await supabase
      .from('skills')
      .insert({ skill_name: skillName })
      .select()
      .single();
    
    if (createError) throw createError;
    skill = newSkill;
  }
  
  // Now add skill to user
  return addUserSkill(userId, skill.skill_id);
};

// Remove skill from user profile
export const removeUserSkill = async (userId: string, skillId: number) => {
  const { error } = await supabase
    .from('userskills')
    .delete()
    .eq('user_id', userId)
    .eq('skill_id', skillId);
  
  if (error) throw error;
  return { success: true };
};

// Remove all skills from user profile
export const removeAllUserSkills = async (userId: string) => {
  const { error } = await supabase
    .from('userskills')
    .delete()
    .eq('user_id', userId);
  
  if (error) throw error;
  return { success: true };
};

// Endorse a user's skill
export const endorseSkill = async (
  endorserId: string,
  targetUserId: string,
  skillId: number
) => {
  // Prevent self-endorsement
  if (endorserId === targetUserId) {
    throw new Error('Cannot endorse your own skills');
  }
  
  // Check if skill exists for target user
  const { data: userSkill } = await supabase
    .from('userskills')
    .select('*')
    .eq('user_id', targetUserId)
    .eq('skill_id', skillId)
    .single();
  
  if (!userSkill) {
    throw new Error('User does not have this skill in their profile');
  }
  
  // Check if already endorsed (use a separate endorsements tracking table)
  // For simplicity, we'll create an endorsements table on the fly
  const { data: existingEndorsement } = await supabase
    .from('skill_endorsements')
    .select('*')
    .eq('endorser_id', endorserId)
    .eq('endorsed_user_id', targetUserId)
    .eq('skill_id', skillId)
    .single();
  
  if (existingEndorsement) {
    throw new Error('You have already endorsed this skill');
  }
  
  // Insert endorsement record
  const { error: insertError } = await supabase
    .from('skill_endorsements')
    .insert({
      endorser_id: endorserId,
      endorsed_user_id: targetUserId,
      skill_id: skillId
    });
  
  if (insertError) throw insertError;
  
  // Increment endorsement count
  const { data, error } = await supabase
    .from('userskills')
    .update({
      endorsements_count: userSkill.endorsements_count + 1
    })
    .eq('user_id', targetUserId)
    .eq('skill_id', skillId)
    .select()
    .single();
  
  if (error) throw error;
  
  // Create notification for endorsed user
  await supabase
    .from('notifications')
    .insert({
      user_id: targetUserId,
      content: `Someone endorsed your skill!`,
      is_read: false
    });
  
  return data;
};

// Get endorsers for a specific skill
export const getSkillEndorsers = async (userId: string, skillId: number) => {
  const { data, error } = await supabase
    .from('skill_endorsements')
    .select(`
      *,
      endorser:users!skill_endorsements_endorser_id_fkey(user_id, name, profile_pic, role)
    `)
    .eq('endorsed_user_id', userId)
    .eq('skill_id', skillId);
  
  if (error) throw error;
  return data;
};
