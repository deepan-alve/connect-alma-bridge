// Group Management Service
import { supabase } from '../lib/supabase';

// Get all groups
export const getAllGroups = async (search?: string) => {
  let query = supabase
    .from('groups')
    .select(`
      *,
      creator:users!groups_created_by_fkey(user_id, name, profile_pic),
      member_count:groupmembers(count)
    `)
    .order('created_at', { ascending: false });
  
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
};

// Get single group with members
export const getGroup = async (groupId: number) => {
  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      creator:users!groups_created_by_fkey(user_id, name, profile_pic),
      members:groupmembers(
        *,
        user:users(user_id, name, profile_pic, role, department, graduation_year)
      )
    `)
    .eq('group_id', groupId)
    .single();
  
  if (error) throw error;
  return data;
};

// Get user's groups
export const getUserGroups = async (userId: string) => {
  const { data, error } = await supabase
    .from('groupmembers')
    .select(`
      *,
      group:groups(
        *,
        creator:users!groups_created_by_fkey(name, profile_pic),
        member_count:groupmembers(count)
      )
    `)
    .eq('user_id', userId)
    .order('joined_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

// Create a new group
export const createGroup = async (
  userId: string,
  name: string,
  description?: string
) => {
  if (!name || name.trim().length === 0) {
    throw new Error('Group name is required');
  }
  
  // Create group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({
      name: name.trim(),
      description: description?.trim() || '',
      created_by: userId
    })
    .select()
    .single();
  
  if (groupError) throw groupError;
  
  // Add creator as admin member
  const { error: memberError } = await supabase
    .from('groupmembers')
    .insert({
      group_id: group.group_id,
      user_id: userId,
      role: 'Admin'
    });
  
  if (memberError) throw memberError;
  
  return group;
};

// Join a group
export const joinGroup = async (userId: string, groupId: number) => {
  // Check if already a member
  const { data: existing } = await supabase
    .from('groupmembers')
    .select('*')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();
  
  if (existing) {
    throw new Error('You are already a member of this group');
  }
  
  const { data, error } = await supabase
    .from('groupmembers')
    .insert({
      group_id: groupId,
      user_id: userId,
      role: 'Member'
    })
    .select(`
      *,
      group:groups(name)
    `)
    .single();
  
  if (error) throw error;
  
  // Notify group creator
  const { data: group } = await supabase
    .from('groups')
    .select('created_by, name')
    .eq('group_id', groupId)
    .single();
  
  const { data: user } = await supabase
    .from('users')
    .select('name')
    .eq('user_id', userId)
    .single();
  
  if (group && user) {
    await supabase
      .from('notifications')
      .insert({
        user_id: group.created_by,
        content: `${user.name} joined your group "${group.name}"`,
        is_read: false
      });
  }
  
  return data;
};

// Leave a group
export const leaveGroup = async (userId: string, groupId: number) => {
  // Check if user is the creator
  const { data: group } = await supabase
    .from('groups')
    .select('created_by')
    .eq('group_id', groupId)
    .single();
  
  if (group?.created_by === userId) {
    throw new Error('Group creator cannot leave. Delete the group instead.');
  }
  
  const { error } = await supabase
    .from('groupmembers')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);
  
  if (error) throw error;
  return { success: true };
};

// Update group (admin only)
export const updateGroup = async (
  userId: string,
  groupId: number,
  updates: { name?: string; description?: string }
) => {
  // Verify user is admin
  const { data: membership } = await supabase
    .from('groupmembers')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();
  
  if (!membership || membership.role !== 'Admin') {
    throw new Error('Only group admins can update group details');
  }
  
  const { data, error } = await supabase
    .from('groups')
    .update(updates)
    .eq('group_id', groupId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Delete group (creator only)
export const deleteGroup = async (userId: string, groupId: number) => {
  // Verify user is creator
  const { data: group } = await supabase
    .from('groups')
    .select('created_by')
    .eq('group_id', groupId)
    .single();
  
  if (!group) {
    throw new Error('Group not found');
  }
  
  if (group.created_by !== userId) {
    throw new Error('Only the group creator can delete the group');
  }
  
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('group_id', groupId);
  
  if (error) throw error;
  return { success: true };
};

// Update member role (admin only)
export const updateMemberRole = async (
  adminUserId: string,
  groupId: number,
  targetUserId: string,
  newRole: 'Admin' | 'Member'
) => {
  // Verify requester is admin
  const { data: adminMembership } = await supabase
    .from('groupmembers')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', adminUserId)
    .single();
  
  if (!adminMembership || adminMembership.role !== 'Admin') {
    throw new Error('Only group admins can change member roles');
  }
  
  const { data, error } = await supabase
    .from('groupmembers')
    .update({ role: newRole })
    .eq('group_id', groupId)
    .eq('user_id', targetUserId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};
