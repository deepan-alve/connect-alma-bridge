// API: Job Board Operations (Using Backend API)
import { jobsAPI } from "@/lib/apiClient";

export interface Job {
  job_id: number;
  posted_by: string;
  title: string;
  description?: string;
  location?: string;
  apply_deadline?: string;
  created_at: string;
}

export interface Application {
  application_id: number;
  job_id: number;
  applicant_id: string;
  resume_link?: string;
  status: 'Submitted' | 'Reviewed' | 'Interview' | 'Accepted' | 'Rejected';
  created_at: string;
}

// Fetch all jobs with poster info
export const fetchJobs = async (filters?: {
  location?: string;
  searchTerm?: string;
}) => {
  return await jobsAPI.getJobs(filters);
};

// Fetch single job
export const fetchJob = async (jobId: number) => {
  return await jobsAPI.getJob(jobId);
};

// Create job
export const createJob = async (job: {
  title: string;
  description?: string;
  location?: string;
  apply_deadline?: string;
}) => {
  return await jobsAPI.createJob(job);
};

// Apply to job
export const applyToJob = async (jobId: number, resumeLink?: string) => {
  return await jobsAPI.applyToJob(jobId, resumeLink);
};

// Fetch applications for a job (for job poster)
export const fetchJobApplications = async (jobId: number) => {
  return await jobsAPI.getJobApplications(jobId);
};

// Fetch user's applications (for student)
export const fetchUserApplications = async (userId: string) => {
  return await jobsAPI.getUserApplications();
};

// Update application status
export const updateApplicationStatus = async (
  applicationId: number,
  newStatus: Application['status']
) => {
  return await jobsAPI.updateApplicationStatus(applicationId, newStatus);
};
