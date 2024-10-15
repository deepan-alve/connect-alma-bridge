// Job Service - Business Logic
import { supabase } from '../lib/supabase';

export const jobService = {
  // Get all jobs with filters
  async getJobs(filters?: { location?: string; searchTerm?: string }) {
    let query = supabase
      .from('jobs')
      .select(`
        *,
        poster:users!jobs_posted_by_fkey(user_id, name, profile_pic, role)
      `)
      .order('created_at', { ascending: false });

    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    if (filters?.searchTerm) {
      query = query.or(
        `title.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get single job
  async getJob(jobId: number) {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        *,
        poster:users!jobs_posted_by_fkey(user_id, name, profile_pic, role, department, graduation_year)
      `)
      .eq('job_id', jobId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create job (alumni only)
  async createJob(
    posterId: string,
    jobData: {
      title: string;
      description?: string;
      location?: string;
      apply_deadline?: string;
    }
  ) {
    // Get the user's numeric user_id from the users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id')
      .eq('user_id', posterId)
      .single();

    if (userError || !user) {
      throw new Error('User not found in database. Please complete your profile first.');
    }

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        ...jobData,
        posted_by: user.user_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Create job error:', error);
      throw error;
    }
    return data;
  },

  // Apply to job (students only)
  async applyToJob(jobId: number, applicantId: string, resumeLink?: string) {
    // Check if already applied
    const { data: existing } = await supabase
      .from('applications')
      .select('application_id')
      .eq('job_id', jobId)
      .eq('applicant_id', applicantId)
      .single();

    if (existing) {
      throw new Error('You have already applied to this job');
    }

    // Check if job exists and is still open
    const { data: job } = await supabase
      .from('jobs')
      .select('apply_deadline, posted_by')
      .eq('job_id', jobId)
      .single();

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.apply_deadline && new Date(job.apply_deadline) < new Date()) {
      throw new Error('Job application deadline has passed');
    }

    const { data, error } = await supabase
      .from('applications')
      .insert({
        job_id: jobId,
        applicant_id: applicantId,
        resume_link: resumeLink,
        status: 'Submitted',
      })
      .select()
      .single();

    if (error) throw error;

    // Get applicant details for notification
    const { data: applicant } = await supabase
      .from('users')
      .select('name, role, department, graduation_year')
      .eq('user_id', applicantId)
      .single();

    // Get job title for notification
    const { data: jobDetails } = await supabase
      .from('jobs')
      .select('title')
      .eq('job_id', jobId)
      .single();

    // Create a notification for the job poster
    await supabase.from('notifications').insert({
      user_id: job.posted_by,
      content: `${applicant?.name || 'A student'} (${applicant?.department || 'Student'}, ${applicant?.graduation_year || ''}) applied to your job: "${jobDetails?.title || 'Job Posting'}". You can now message them directly!`,
      is_read: false,
    });

    // Create an automatic message from applicant to job poster
    // This creates a conversation thread so they can start chatting
    const messageText = `Hi! I just applied to your job posting "${jobDetails?.title || 'your job posting'}". I'm very interested in this opportunity and would love to discuss it further. ${resumeLink ? `Here's my resume: ${resumeLink}` : 'I look forward to hearing from you!'}`;
    
    await supabase.from('messages').insert({
      sender_id: applicantId,
      receiver_id: job.posted_by,
      message_text: messageText,
    });

    // Also notify the job poster about the new message
    await supabase.from('notifications').insert({
      user_id: job.posted_by,
      content: `New message from ${applicant?.name || 'applicant'} regarding "${jobDetails?.title || 'your job posting'}"`,
      is_read: false,
    });

    return data;
  },

  // Get applications for a job (job poster only)
  async getJobApplications(jobId: number, posterId: string) {
    // Verify poster owns the job
    const { data: job } = await supabase
      .from('jobs')
      .select('posted_by')
      .eq('job_id', jobId)
      .single();

    if (!job || job.posted_by !== posterId) {
      throw new Error('You do not have permission to view these applications');
    }

    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        applicant:users!applications_applicant_id_fkey(user_id, name, email, profile_pic, department, graduation_year)
      `)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get user's applications
  async getUserApplications(userId: string) {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        job:jobs(*, poster:users!jobs_posted_by_fkey(name, profile_pic))
      `)
      .eq('applicant_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Update application status (job poster only)
  async updateApplicationStatus(
    applicationId: number,
    newStatus: string,
    posterId: string
  ) {
    // Verify poster owns the job
    const { data: application } = await supabase
      .from('applications')
      .select('job_id, applicant_id, job:jobs(posted_by)')
      .eq('application_id', applicationId)
      .single();

    if (!application || (application.job as any).posted_by !== posterId) {
      throw new Error('You do not have permission to update this application');
    }

    const { data, error } = await supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('application_id', applicationId)
      .select()
      .single();

    if (error) throw error;

    // Notify applicant
    await supabase.from('notifications').insert({
      user_id: application.applicant_id,
      content: `Your application status was updated to: ${newStatus}`,
      is_read: false,
    });

    return data;
  },
};
