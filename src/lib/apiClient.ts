// Frontend API Client - Connects to Backend API
import { supabase } from './supabase';

// Backend API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper to get auth token
const getAuthToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
};

// Helper for API requests
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAuthToken();

  // Fail fast if there is no auth token to avoid hitting protected endpoints
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
};

// ========================
// MESSAGES API
// ========================

export const messagesAPI = {
  getConversations: async () => {
    const data = await apiRequest('/messages/conversations');
    return data.data;
  },

  getMessages: async (partnerId: string) => {
    const data = await apiRequest(`/messages/${partnerId}`);
    return data.data;
  },

  sendMessage: async (receiverId: string, messageText: string) => {
    const data = await apiRequest('/messages', {
      method: 'POST',
      body: JSON.stringify({ receiverId, messageText }),
    });
    return data.data;
  },
};

// ========================
// CONNECTIONS API
// ========================

export const connectionsAPI = {
  getConnections: async (status?: string) => {
    const query = status ? `?status=${status}` : '';
    const data = await apiRequest(`/connections${query}`);
    return data.data;
  },

  getSuggestions: async () => {
    const data = await apiRequest('/connections/suggestions');
    return data.data;
  },

  sendRequest: async (receiverId: string) => {
    const data = await apiRequest('/connections/request', {
      method: 'POST',
      body: JSON.stringify({ receiverId }),
    });
    return data.data;
  },

  acceptRequest: async (connectionId: number) => {
    const data = await apiRequest(`/connections/accept/${connectionId}`, {
      method: 'POST',
    });
    return data.data;
  },

  rejectRequest: async (connectionId: number) => {
    const data = await apiRequest(`/connections/reject/${connectionId}`, {
      method: 'POST',
    });
    return data.data;
  },
};

// ========================
// JOBS API
// ========================

export const jobsAPI = {
  getJobs: async (filters?: { location?: string; searchTerm?: string }) => {
    const params = new URLSearchParams();
    if (filters?.location) params.append('location', filters.location);
    if (filters?.searchTerm) params.append('searchTerm', filters.searchTerm);
    const query = params.toString() ? `?${params.toString()}` : '';
    
    const data = await apiRequest(`/jobs${query}`);
    return data.data;
  },

  getJob: async (jobId: number) => {
    const data = await apiRequest(`/jobs/${jobId}`);
    return data.data;
  },

  createJob: async (jobData: {
    title: string;
    description?: string;
    location?: string;
    apply_deadline?: string;
  }) => {
    const data = await apiRequest('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
    return data.data;
  },

  applyToJob: async (jobId: number, resumeLink?: string) => {
    const data = await apiRequest(`/jobs/${jobId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ resumeLink }),
    });
    return data.data;
  },

  getJobApplications: async (jobId: number) => {
    const data = await apiRequest(`/jobs/${jobId}/applications`);
    return data.data;
  },

  getUserApplications: async () => {
    const data = await apiRequest('/jobs/my/applications');
    return data.data;
  },

  updateApplicationStatus: async (applicationId: number, status: string) => {
    const data = await apiRequest(`/jobs/applications/${applicationId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return data.data;
  },
};

// ========================
// SKILLS API
// ========================

export const skillsAPI = {
  getAllSkills: async () => {
    return await apiRequest('/skills');
  },

  getUserSkills: async (userId: string) => {
    return await apiRequest(`/skills/user/${userId}`);
  },

  addUserSkill: async (skillId: number) => {
    return await apiRequest('/skills/user', {
      method: 'POST',
      body: JSON.stringify({ skill_id: skillId }),
    });
  },

  addUserSkillByName: async (skillName: string) => {
    return await apiRequest('/skills/user/by-name', {
      method: 'POST',
      body: JSON.stringify({ skill_name: skillName }),
    });
  },

  removeUserSkill: async (skillId: number) => {
    return await apiRequest(`/skills/user/${skillId}`, {
      method: 'DELETE',
    });
  },

  endorseSkill: async (targetUserId: string, skillId: number) => {
    return await apiRequest('/skills/endorse', {
      method: 'POST',
      body: JSON.stringify({ target_user_id: targetUserId, skill_id: skillId }),
    });
  },

  getSkillEndorsers: async (userId: string, skillId: number) => {
    return await apiRequest(`/skills/endorsers/${userId}/${skillId}`);
  },
};

// ========================
// RECOMMENDATIONS API
// ========================

export const recommendationsAPI = {
  requestRecommendation: async (recommenderId: string, message?: string) => {
    return await apiRequest('/recommendations/request', {
      method: 'POST',
      body: JSON.stringify({ recommender_id: recommenderId, message }),
    });
  },

  writeRecommendation: async (recommendedId: string, text: string, requestId?: number) => {
    return await apiRequest('/recommendations', {
      method: 'POST',
      body: JSON.stringify({ recommended_id: recommendedId, text, request_id: requestId }),
    });
  },

  getUserRecommendations: async (userId: string) => {
    return await apiRequest(`/recommendations/user/${userId}`);
  },

  getPendingRequests: async () => {
    return await apiRequest('/recommendations/requests');
  },

  getPendingRecommendations: async () => {
    return await apiRequest('/recommendations/pending');
  },

  updateRecommendationStatus: async (recommendationId: number, status: 'approved' | 'rejected') => {
    return await apiRequest(`/recommendations/${recommendationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// ========================
// GROUPS API
// ========================

export const groupsAPI = {
  getAllGroups: async (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return await apiRequest(`/groups${query}`);
  },

  getMyGroups: async () => {
    return await apiRequest('/groups/my');
  },

  getGroup: async (groupId: number) => {
    return await apiRequest(`/groups/${groupId}`);
  },

  createGroup: async (name: string, description?: string) => {
    return await apiRequest('/groups', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  },

  joinGroup: async (groupId: number) => {
    return await apiRequest(`/groups/${groupId}/join`, {
      method: 'POST',
    });
  },

  leaveGroup: async (groupId: number) => {
    return await apiRequest(`/groups/${groupId}/leave`, {
      method: 'DELETE',
    });
  },

  updateGroup: async (groupId: number, updates: { name?: string; description?: string }) => {
    return await apiRequest(`/groups/${groupId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  deleteGroup: async (groupId: number) => {
    return await apiRequest(`/groups/${groupId}`, {
      method: 'DELETE',
    });
  },

  updateMemberRole: async (groupId: number, userId: string, role: 'Admin' | 'Member') => {
    return await apiRequest(`/groups/${groupId}/members`, {
      method: 'PATCH',
      body: JSON.stringify({ user_id: userId, role }),
    });
  },
};

// ========================
// NOTIFICATIONS API
// ========================

export const notificationsAPI = {
  getNotifications: async (unreadOnly: boolean = false) => {
    const query = unreadOnly ? '?unread_only=true' : '';
    return await apiRequest(`/notifications${query}`);
  },

  getUnreadCount: async () => {
    return await apiRequest('/notifications/count');
  },

  markAsRead: async (notificationId: number) => {
    return await apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  },

  markAllAsRead: async () => {
    return await apiRequest('/notifications/read-all', {
      method: 'PATCH',
    });
  },

  deleteNotification: async (notificationId: number) => {
    return await apiRequest(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  },
};

// ========================
// USERS API
// ========================

export const usersAPI = {
  getDirectory: async (filters?: { search?: string; role?: string; department?: string; graduationYear?: string }) => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.role) params.append('role', filters.role);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.graduationYear) params.append('graduation_year', filters.graduationYear);
    const query = params.toString() ? `?${params.toString()}` : '';
    return await apiRequest(`/users/directory${query}`);
  },

  getUserProfile: async (userId: string) => {
    return await apiRequest(`/users/${userId}`);
  },

  updateProfile: async (updates: {
    name?: string;
    role?: string;
    bio?: string;
    department?: string;
    graduation_year?: string;
    profile_pic?: string;
  }) => {
    return await apiRequest('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  getDepartments: async () => {
    return await apiRequest('/users/meta/departments');
  },

  getGraduationYears: async () => {
    return await apiRequest('/users/meta/graduation-years');
  },
};

// ========================
// PROFILE API (Resume & Enhanced Profile)
// ========================

export const profileAPI = {
  // Resume Upload
  uploadResume: async (formData: FormData) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/profile/resume/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload resume');
    }

    return response.json();
  },

  // Resume Parsing
  parseResume: async (formData: FormData) => {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/profile/resume/parse`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to parse resume');
    }

    return response.json();
  },

  getResumeUrl: async () => {
    const data = await apiRequest('/profile/resume/url');
    return data;
  },

  downloadResume: async (userId: string) => {
    const data = await apiRequest(`/profile/${userId}/resume/download`);
    return data;
  },

  // Experiences
  getExperiences: async (userId: string) => {
    const data = await apiRequest(`/profile/${userId}/experiences`);
    return data;
  },

  createExperience: async (experience: {
    company: string;
    position: string;
    location?: string;
    start_date: string;
    end_date?: string;
    is_current?: boolean;
    description?: string;
  }) => {
    const data = await apiRequest('/profile/experiences', {
      method: 'POST',
      body: JSON.stringify(experience),
    });
    return data;
  },

  updateExperience: async (experienceId: number, updates: any) => {
    const data = await apiRequest(`/profile/experiences/${experienceId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data;
  },

  deleteExperience: async (experienceId: number) => {
    const data = await apiRequest(`/profile/experiences/${experienceId}`, {
      method: 'DELETE',
    });
    return data;
  },

  // Education
  getEducation: async (userId: string) => {
    const data = await apiRequest(`/profile/${userId}/education`);
    return data;
  },

  createEducation: async (education: {
    institution: string;
    degree: string;
    field_of_study?: string;
    start_date: string;
    end_date?: string;
    gpa?: string;
  }) => {
    const data = await apiRequest('/profile/education', {
      method: 'POST',
      body: JSON.stringify(education),
    });
    return data;
  },

  updateEducation: async (educationId: number, updates: any) => {
    const data = await apiRequest(`/profile/education/${educationId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data;
  },

  deleteEducation: async (educationId: number) => {
    const data = await apiRequest(`/profile/education/${educationId}`, {
      method: 'DELETE',
    });
    return data;
  },

  // Certifications
  getCertifications: async (userId: string) => {
    const data = await apiRequest(`/profile/${userId}/certifications`);
    return data;
  },

  createCertification: async (certification: {
    name: string;
    issuing_organization: string;
    issue_date: string;
    expiry_date?: string;
    credential_id?: string;
    credential_url?: string;
  }) => {
    const data = await apiRequest('/profile/certifications', {
      method: 'POST',
      body: JSON.stringify(certification),
    });
    return data;
  },

  updateCertification: async (certificationId: number, updates: any) => {
    const data = await apiRequest(`/profile/certifications/${certificationId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data;
  },

  deleteCertification: async (certificationId: number) => {
    const data = await apiRequest(`/profile/certifications/${certificationId}`, {
      method: 'DELETE',
    });
    return data;
  },

  // Public Profile
  getPublicProfile: async (userId: string) => {
    const data = await apiRequest(`/profile/${userId}/public`);
    return data;
  },

  // Cleanup all profile data (experiences, education, certifications, skills)
  cleanupAllProfileData: async () => {
    const data = await apiRequest('/profile/cleanup/all', {
      method: 'DELETE',
    });
    return data;
  },
};
