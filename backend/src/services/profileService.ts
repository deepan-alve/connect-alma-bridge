import { supabase } from '../lib/supabase';

// ============================================
// Work Experience CRUD Operations
// ============================================

export const createExperience = async (userId: string, experienceData: any) => {
  const { data, error } = await supabase
    .from('experiences')
    .insert({
      user_id: userId,
      company: experienceData.company,
      position: experienceData.position,
      location: experienceData.location,
      start_date: experienceData.start_date,
      end_date: experienceData.end_date,
      is_current: experienceData.is_current || false,
      description: experienceData.description,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserExperiences = async (userId: string) => {
  const { data, error } = await supabase
    .from('experiences')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false });

  if (error) throw error;
  return data;
};

export const updateExperience = async (experienceId: number, userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('experiences')
    .update(updates)
    .eq('experience_id', experienceId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteExperience = async (experienceId: number, userId: string) => {
  const { error } = await supabase
    .from('experiences')
    .delete()
    .eq('experience_id', experienceId)
    .eq('user_id', userId);

  if (error) throw error;
  return { success: true };
};

export const deleteAllExperiences = async (userId: string) => {
  const { error } = await supabase
    .from('experiences')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
  return { success: true };
};

// ============================================
// Education CRUD Operations
// ============================================

export const createEducation = async (userId: string, educationData: any) => {
  const { data, error } = await supabase
    .from('education')
    .insert({
      user_id: userId,
      institution: educationData.institution,
      degree: educationData.degree,
      field_of_study: educationData.field_of_study,
      start_date: educationData.start_date,
      end_date: educationData.end_date,
      gpa: educationData.gpa,
      description: educationData.description,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserEducation = async (userId: string) => {
  const { data, error } = await supabase
    .from('education')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false });

  if (error) throw error;
  return data;
};

export const updateEducation = async (educationId: number, userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('education')
    .update(updates)
    .eq('education_id', educationId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteEducation = async (educationId: number, userId: string) => {
  const { error } = await supabase
    .from('education')
    .delete()
    .eq('education_id', educationId)
    .eq('user_id', userId);

  if (error) throw error;
  return { success: true };
};

export const deleteAllEducation = async (userId: string) => {
  const { error } = await supabase
    .from('education')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
  return { success: true };
};

// ============================================
// Certifications CRUD Operations
// ============================================

export const createCertification = async (userId: string, certData: any) => {
  const { data, error } = await supabase
    .from('certifications')
    .insert({
      user_id: userId,
      name: certData.name,
      issuing_organization: certData.issuing_organization,
      issue_date: certData.issue_date,
      expiry_date: certData.expiry_date,
      credential_id: certData.credential_id,
      credential_url: certData.credential_url,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserCertifications = async (userId: string) => {
  const { data, error } = await supabase
    .from('certifications')
    .select('*')
    .eq('user_id', userId)
    .order('issue_date', { ascending: false });

  if (error) throw error;
  return data;
};

export const updateCertification = async (certId: number, userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('certifications')
    .update(updates)
    .eq('certification_id', certId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteCertification = async (certId: number, userId: string) => {
  const { error } = await supabase
    .from('certifications')
    .delete()
    .eq('certification_id', certId)
    .eq('user_id', userId);

  if (error) throw error;
  return { success: true };
};

export const deleteAllCertifications = async (userId: string) => {
  const { error } = await supabase
    .from('certifications')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
  return { success: true };
};

// ============================================
// Get Public Profile (for viewing by others)
// ============================================

export const getPublicProfile = async (userId: string) => {
  // Get user basic info (excluding private fields)
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('user_id, name, role, profile_pic, bio, summary, department, graduation_year, linkedin_url')
    .eq('user_id', userId)
    .single();

  if (userError) throw userError;

  // Get skills
  const { data: skills, error: skillsError } = await supabase
    .from('userskills')
    .select(`
      skill_id,
      endorsements_count,
      skills (
        skill_id,
        skill_name
      )
    `)
    .eq('user_id', userId);

  if (skillsError) throw skillsError;

  // Get experiences
  const { data: experiences, error: expError } = await supabase
    .from('experiences')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false });

  if (expError) throw expError;

  // Get education
  const { data: education, error: eduError } = await supabase
    .from('education')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false });

  if (eduError) throw eduError;

  // Get certifications
  const { data: certifications, error: certError } = await supabase
    .from('certifications')
    .select('*')
    .eq('user_id', userId)
    .order('issue_date', { ascending: false });

  if (certError) throw certError;

  return {
    ...user,
    skills: skills?.map((s: any) => ({
      skill_id: s.skill_id,
      skill_name: (s.skills as any)?.skill_name,
      endorsements_count: s.endorsements_count
    })) || [],
    experiences: experiences || [],
    education: education || [],
    certifications: certifications || []
  };
};

// ============================================
// Resume Upload & Storage
// ============================================

export const uploadResume = async (userId: string, file: any) => {
  const fileExt = file.originalname.split('.').pop();
  const fileName = `${userId}_${Date.now()}.${fileExt}`;
  const filePath = `resumes/${fileName}`;

  // Upload to Supabase Storage
  const { error } = await supabase.storage
    .from('resumes')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (error) throw error;

  // Get signed URL (valid for 1 year)
  const { data: urlData } = await supabase.storage
    .from('resumes')
    .createSignedUrl(filePath, 31536000); // 1 year in seconds

  // Update user's resume_url
  const { error: updateError } = await supabase
    .from('users')
    .update({ resume_url: urlData?.signedUrl })
    .eq('user_id', userId);

  if (updateError) throw updateError;

  return {
    path: filePath,
    url: urlData?.signedUrl
  };
};

export const getResumeUrl = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('resume_url')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data.resume_url;
};
