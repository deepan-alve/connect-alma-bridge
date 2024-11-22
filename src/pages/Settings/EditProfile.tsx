// src/pages/Settings/EditProfile.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUserProfile, updateUserProfile } from "@/lib/supabaseService";
import { useNavigate } from 'react-router-dom';
import { ResumeUpload } from "@/components/ResumeUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus } from "lucide-react";
import { profileAPI, skillsAPI } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";

interface ParsedExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface ParsedEducation {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
}

interface ParsedCertification {
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expirationDate?: string;
}

const EditProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 1. Fetch current profile data to pre-fill the form
  const { data: initialProfile, isLoading } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => fetchUserProfile(user!.id),
    enabled: !!user,
  });

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    department: '',
    graduation_year: '',
  });
  const [experiences, setExperiences] = useState<ParsedExperience[]>([]);
  const [education, setEducation] = useState<ParsedEducation[]>([]);
  const [certifications, setCertifications] = useState<ParsedCertification[]>([]);
  const [skills, setSkills] = useState<string[]>([]); // Skills from resume
  const [error, setError] = useState('');

  // 2. Sync fetched data with local state once loaded
  useEffect(() => {
    if (initialProfile) {
      setFormData({
        name: initialProfile.name || '',
        bio: initialProfile.bio || '',
        department: initialProfile.department || '',
        graduation_year: initialProfile.graduation_year || '',
      });
    }
  }, [initialProfile]);

  // 3. Mutation hook for submitting updates
  const updateMutation = useMutation({
    mutationFn: (updates: any) => updateUserProfile(user!.id, updates),
    onSuccess: () => {
      // Invalidate the 'userProfile' query to force a refresh on the View Profile page
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      navigate('/profile'); // Redirect back to view profile
    },
    onError: (err: any) => {
      setError(`Update failed: ${err.message}`);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle parsed resume data from ResumeUpload component
  const handleParsedResumeData = (parsedData: {
    experiences: ParsedExperience[];
    education: ParsedEducation[];
    certifications: ParsedCertification[];
    skills: string[];
  }) => {
    setExperiences(parsedData.experiences || []);
    setEducation(parsedData.education || []);
    setCertifications(parsedData.certifications || []);
    
    // Split skills - the parser returns long strings like "Languages: TypeScript, Node.js, Python"
    // We need to split these into individual skills
    const splitSkills: string[] = [];
    for (const skillLine of parsedData.skills || []) {
      // Remove category prefix (e.g., "Languages:", "Frameworks & Tools:")
      const withoutPrefix = skillLine.replace(/^[^:]+:\s*/, '');
      // Split by comma, semicolon, or "and"
      const individualSkills = withoutPrefix
        .split(/[,;]|\sand\s/)
        .map(s => s.trim())
        .filter(s => s.length > 0 && s.length <= 50); // Skip empty or too long
      splitSkills.push(...individualSkills);
    }
    setSkills(splitSkills);
    
    toast({
      title: "Resume data loaded!",
      description: "Review and edit the extracted information below before saving.",
    });
  };

  // Save all profile data (basic info + experiences + education + certifications)
  const saveAllProfileData = useMutation({
    mutationFn: async () => {
      // Save basic profile info
      await updateUserProfile(user!.id, {
        name: formData.name,
        bio: formData.bio,
        department: formData.department,
        graduation_year: formData.graduation_year
      });

      // Fetch existing data to avoid duplicates
      const existingEducationResponse = await profileAPI.getEducation(user!.id);
      const existingEducation = existingEducationResponse?.data || [];

      // Only save education that doesn't already exist
      for (const edu of education) {
        if (edu.institution && edu.degree) {
          // Check if this education entry already exists
          const duplicate = existingEducation.some((existing: any) =>
            existing.institution === edu.institution &&
            existing.degree === edu.degree &&
            existing.start_date === edu.startDate
          );

          if (!duplicate) {
            await profileAPI.createEducation({
              institution: edu.institution,
              degree: edu.degree,
              field_of_study: edu.fieldOfStudy || null,
              start_date: edu.startDate || null,
              end_date: edu.endDate || null,
            });
          }
        }
      }

      // Save experiences (check for duplicates)
      const existingExpResponse = await profileAPI.getExperiences(user!.id);
      const existingExperiences = existingExpResponse?.data || [];

      for (const exp of experiences) {
        if (exp.company && exp.position) {
          const duplicate = existingExperiences.some((existing: any) =>
            existing.company === exp.company &&
            existing.position === exp.position &&
            existing.start_date === exp.startDate
          );

          if (!duplicate) {
            await profileAPI.createExperience({
              company: exp.company,
              position: exp.position,
              start_date: exp.startDate || null,
              end_date: exp.endDate || null,
              description: exp.description,
            });
          }
        }
      }

      // Save certifications (check for duplicates)
      const existingCertsResponse = await profileAPI.getCertifications(user!.id);
      const existingCerts = existingCertsResponse?.data || [];

      for (const cert of certifications) {
        if (cert.name && cert.issuingOrganization) {
          const duplicate = existingCerts.some((existing: any) =>
            existing.name === cert.name &&
            existing.issuing_organization === cert.issuingOrganization
          );

          if (!duplicate) {
            await profileAPI.createCertification({
              name: cert.name,
              issuing_organization: cert.issuingOrganization,
              issue_date: cert.issueDate || null,
              expiry_date: cert.expirationDate || null,
            });
          }
        }
      }

      // Save skills (skip duplicates and invalid entries)
      const savedSkills = new Set<string>();
      for (const skillName of skills) {
        const trimmed = skillName?.trim();
        if (trimmed && trimmed.length > 0 && trimmed.length <= 100 && !savedSkills.has(trimmed.toLowerCase())) {
          try {
            await skillsAPI.addUserSkillByName(trimmed);
            savedSkills.add(trimmed.toLowerCase());
          } catch (error: any) {
            // Ignore "already added" errors, continue with other skills
            if (!error.message?.includes('already added')) {
              console.error('Error adding skill:', trimmed, error.message);
            }
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['user-experiences', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-education', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-certifications', user?.id] });
      toast({
        title: "Profile saved successfully!",
        description: "All your information has been updated.",
      });
      navigate('/profile');
    },
    onError: (err: any) => {
      toast({
        title: "Failed to save profile",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    saveAllProfileData.mutate();
  };

  // Cleanup mutation to delete all profile data
  const cleanupAllData = useMutation({
    mutationFn: async () => {
      await profileAPI.cleanupAllProfileData();
    },
    onSuccess: () => {
      // Clear local state
      setExperiences([]);
      setEducation([]);
      setCertifications([]);
      setSkills([]);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['user-experiences', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-education', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-certifications', user?.id] });
      
      toast({
        title: "All data deleted!",
        description: "Your experiences, education, certifications, and skills have been removed.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Failed to delete data",
        description: err.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  if (isLoading) return <div className="loading-spinner">Loading Form...</div>;

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      <h1 className="text-3xl font-bold mb-6">Edit Profile</h1>
      
      {/* Resume Upload Section */}
      <ResumeUpload onParsedData={handleParsedResumeData} />
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update your basic profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <p className="text-red-500">{error}</p>}

            {/* Read-only fields */}
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <input 
                type="text" 
                disabled 
                value={initialProfile?.role || 'N/A'} 
                className="w-full bg-gray-100 p-2 rounded border"
              />
              <p className="text-xs text-muted-foreground mt-1">Role must be changed via university admin.</p>
            </div>

            {/* Editable Fields */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Full Name *</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label htmlFor="department" className="block text-sm font-medium mb-1">Department</label>
              <input 
                type="text" 
                id="department" 
                name="department" 
                value={formData.department} 
                onChange={handleChange} 
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label htmlFor="graduation_year" className="block text-sm font-medium mb-1">Graduation Year</label>
              <input 
                type="text" 
                id="graduation_year" 
                name="graduation_year" 
                value={formData.graduation_year} 
                onChange={handleChange} 
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label htmlFor="bio" className="block text-sm font-medium mb-1">Bio / Summary</label>
              <textarea 
                id="bio" 
                name="bio" 
                rows={4} 
                value={formData.bio} 
                onChange={handleChange} 
                className="w-full p-2 border rounded"
              />
            </div>
          </CardContent>
        </Card>

        {/* Work Experience Section */}
        {experiences.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Work Experience</CardTitle>
              <CardDescription>Review and edit your work history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {experiences.map((exp, index) => (
                <div key={index} className="p-4 border rounded space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => {
                          const newExp = [...experiences];
                          newExp[index].company = e.target.value;
                          setExperiences(newExp);
                        }}
                        placeholder="Company"
                        className="w-full p-2 border rounded font-medium"
                      />
                      <input
                        type="text"
                        value={exp.position}
                        onChange={(e) => {
                          const newExp = [...experiences];
                          newExp[index].position = e.target.value;
                          setExperiences(newExp);
                        }}
                        placeholder="Position"
                        className="w-full p-2 border rounded"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={exp.startDate}
                          onChange={(e) => {
                            const newExp = [...experiences];
                            newExp[index].startDate = e.target.value;
                            setExperiences(newExp);
                          }}
                          placeholder="Start Date"
                          className="p-2 border rounded text-sm"
                        />
                        <input
                          type="text"
                          value={exp.endDate}
                          onChange={(e) => {
                            const newExp = [...experiences];
                            newExp[index].endDate = e.target.value;
                            setExperiences(newExp);
                          }}
                          placeholder="End Date"
                          className="p-2 border rounded text-sm"
                        />
                      </div>
                      <textarea
                        value={exp.description}
                        onChange={(e) => {
                          const newExp = [...experiences];
                          newExp[index].description = e.target.value;
                          setExperiences(newExp);
                        }}
                        placeholder="Description"
                        rows={3}
                        className="w-full p-2 border rounded text-sm"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setExperiences(experiences.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setExperiences([...experiences, { 
                  company: '', position: '', startDate: '', endDate: '', description: '' 
                }])}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Experience
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Education Section */}
        {education.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Education</CardTitle>
              <CardDescription>Review and edit your educational background</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {education.map((edu, index) => (
                <div key={index} className="p-4 border rounded space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => {
                          const newEdu = [...education];
                          newEdu[index].institution = e.target.value;
                          setEducation(newEdu);
                        }}
                        placeholder="Institution"
                        className="w-full p-2 border rounded font-medium"
                      />
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => {
                          const newEdu = [...education];
                          newEdu[index].degree = e.target.value;
                          setEducation(newEdu);
                        }}
                        placeholder="Degree"
                        className="w-full p-2 border rounded"
                      />
                      <input
                        type="text"
                        value={edu.fieldOfStudy}
                        onChange={(e) => {
                          const newEdu = [...education];
                          newEdu[index].fieldOfStudy = e.target.value;
                          setEducation(newEdu);
                        }}
                        placeholder="Field of Study"
                        className="w-full p-2 border rounded"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={edu.startDate}
                          onChange={(e) => {
                            const newEdu = [...education];
                            newEdu[index].startDate = e.target.value;
                            setEducation(newEdu);
                          }}
                          placeholder="Start Date"
                          className="p-2 border rounded text-sm"
                        />
                        <input
                          type="text"
                          value={edu.endDate}
                          onChange={(e) => {
                            const newEdu = [...education];
                            newEdu[index].endDate = e.target.value;
                            setEducation(newEdu);
                          }}
                          placeholder="End Date"
                          className="p-2 border rounded text-sm"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setEducation(education.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEducation([...education, { 
                  institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '' 
                }])}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Education
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Certifications Section */}
        {certifications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
              <CardDescription>Review and edit your certifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {certifications.map((cert, index) => (
                <div key={index} className="p-4 border rounded space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={cert.name}
                        onChange={(e) => {
                          const newCert = [...certifications];
                          newCert[index].name = e.target.value;
                          setCertifications(newCert);
                        }}
                        placeholder="Certification Name"
                        className="w-full p-2 border rounded font-medium"
                      />
                      <input
                        type="text"
                        value={cert.issuingOrganization}
                        onChange={(e) => {
                          const newCert = [...certifications];
                          newCert[index].issuingOrganization = e.target.value;
                          setCertifications(newCert);
                        }}
                        placeholder="Issuing Organization"
                        className="w-full p-2 border rounded"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={cert.issueDate}
                          onChange={(e) => {
                            const newCert = [...certifications];
                            newCert[index].issueDate = e.target.value;
                            setCertifications(newCert);
                          }}
                          placeholder="Issue Date"
                          className="p-2 border rounded text-sm"
                        />
                        <input
                          type="text"
                          value={cert.expirationDate || ''}
                          onChange={(e) => {
                            const newCert = [...certifications];
                            newCert[index].expirationDate = e.target.value;
                            setCertifications(newCert);
                          }}
                          placeholder="Expiration Date (optional)"
                          className="p-2 border rounded text-sm"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setCertifications(certifications.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCertifications([...certifications, { 
                  name: '', issuingOrganization: '', issueDate: '', expirationDate: '' 
                }])}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Certification
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Skills Section */}
        {skills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <CardDescription>Skills extracted from your resume</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {skills.map((skillLine, index) => (
                <div key={index} className="p-4 border rounded space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <textarea
                      value={skillLine}
                      onChange={(e) => {
                        const newSkills = [...skills];
                        newSkills[index] = e.target.value;
                        setSkills(newSkills);
                      }}
                      placeholder="Skill description"
                      className="w-full p-2 border rounded font-medium resize-none"
                      rows={2}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setSkills(skills.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSkills([...skills, ''])}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Skill Line
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex gap-4">
          <Button 
            type="submit" 
            disabled={saveAllProfileData.isPending}
            className="flex-1"
          >
            {saveAllProfileData.isPending ? 'Saving...' : 'Save All Changes'}
          </Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => navigate('/profile')}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete ALL your experiences, education, certifications, and skills? This cannot be undone!')) {
                cleanupAllData.mutate();
              }
            }}
            disabled={cleanupAllData.isPending}
          >
            {cleanupAllData.isPending ? 'Deleting...' : 'Clear All Data'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;