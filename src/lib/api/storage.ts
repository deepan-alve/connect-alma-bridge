// API: File Storage (Avatars & Resumes)
import { supabase } from "@/lib/supabase";

// Upload avatar
export const uploadAvatar = async (userId: string, file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/avatar.${fileExt}`;

  // Upload to avatars bucket
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true });

  if (error) throw error;

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  // Update user profile
  await supabase
    .from('users')
    .update({ profile_pic: publicUrl })
    .eq('user_id', userId);

  return publicUrl;
};

// Upload resume
export const uploadResume = async (userId: string, file: File, jobId?: number) => {
  const fileExt = file.name.split('.').pop();
  const timestamp = Date.now();
  const fileName = jobId 
    ? `${userId}/${jobId}_${timestamp}.${fileExt}`
    : `${userId}/resume_${timestamp}.${fileExt}`;

  // Upload to resumes bucket (private)
  const { data, error } = await supabase.storage
    .from('resumes')
    .upload(fileName, file);

  if (error) throw error;

  // Get signed URL (expires in 1 hour)
  const { data: signedData, error: signedError } = await supabase.storage
    .from('resumes')
    .createSignedUrl(fileName, 3600);

  if (signedError) throw signedError;

  return {
    path: fileName,
    signedUrl: signedData.signedUrl
  };
};

// Get signed URL for resume
export const getResumeUrl = async (resumePath: string) => {
  const { data, error } = await supabase.storage
    .from('resumes')
    .createSignedUrl(resumePath, 3600); // 1 hour expiration

  if (error) throw error;
  return data.signedUrl;
};

// Delete avatar
export const deleteAvatar = async (userId: string) => {
  // Get current avatar path from user profile
  const { data: user } = await supabase
    .from('users')
    .select('profile_pic')
    .eq('user_id', userId)
    .single();

  if (user?.profile_pic) {
    // Extract filename from URL
    const fileName = user.profile_pic.split('/').slice(-2).join('/');
    
    const { error } = await supabase.storage
      .from('avatars')
      .remove([fileName]);

    if (error) throw error;

    // Update user profile
    await supabase
      .from('users')
      .update({ profile_pic: null })
      .eq('user_id', userId);
  }
};

// Delete resume
export const deleteResume = async (resumePath: string) => {
  const { error } = await supabase.storage
    .from('resumes')
    .remove([resumePath]);

  if (error) throw error;
};
