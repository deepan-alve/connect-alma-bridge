import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SkillBadge } from "@/components/SkillBadge";
import { MessageSquare, CheckCircle2, Users, Quote, Pencil, Loader2, Download } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { usersAPI, profileAPI } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch user profile
  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: () => usersAPI.getUserProfile(user!.id),
    enabled: !!user,
  });

  // Fetch experiences
  const { data: experiencesResponse } = useQuery({
    queryKey: ["user-experiences", user?.id],
    queryFn: () => profileAPI.getExperiences(user!.id),
    enabled: !!user,
  });

  // Fetch education
  const { data: educationResponse } = useQuery({
    queryKey: ["user-education", user?.id],
    queryFn: () => profileAPI.getEducation(user!.id),
    enabled: !!user,
  });

  // Fetch certifications
  const { data: certificationsResponse } = useQuery({
    queryKey: ["user-certifications", user?.id],
    queryFn: () => profileAPI.getCertifications(user!.id),
    enabled: !!user,
  });

  const profile = profileResponse?.data;
  const experiences = experiencesResponse?.data || [];
  const education = educationResponse?.data || [];
  const certifications = certificationsResponse?.data || [];

  // Debug logging
  console.log('Profile Data:', {
    profile,
    skills: profile?.skills,
    skillsCount: profile?.skills?.length || 0,
    experiences,
    education,
    certifications,
    experiencesCount: experiences.length,
    educationCount: education.length,
  });

  const handleDownloadResume = async () => {
    try {
      const response = await profileAPI.downloadResume(user!.id);
      const resumeUrl = response.data.resume_url;
      
      if (resumeUrl) {
        // Open in new tab to download
        window.open(resumeUrl, '_blank');
        toast({
          title: "Resume download started",
          description: "Your resume is being downloaded.",
        });
      } else {
        toast({
          title: "No resume found",
          description: "This user hasn't uploaded a resume yet.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message || "Failed to download resume",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <Hero />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <Hero />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Profile not found</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      
      <div className="container mx-auto px-4 py-8">
        {/* Edit Profile Button at top */}
        <div className="flex justify-end mb-4">
          <Button onClick={() => navigate('/settings/edit-profile')}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <aside className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <Avatar className="h-32 w-32">
                      <AvatarImage src={profile.profile_pic} />
                      <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center border-4 border-card">
                      <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                    </div>
                  </div>
                  
                  <h1 className="text-2xl font-bold mb-1">{profile.name}</h1>
                  <p className="text-sm text-muted-foreground mb-1">
                    {profile.role || "Network Member"}
                  </p>
                  {profile.department && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {profile.department}
                    </p>
                  )}
                  {profile.graduation_year && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Class of {profile.graduation_year}
                    </p>
                  )}
                  
                  {profile.bio && (
                    <p className="text-sm mb-4">
                      {profile.bio}
                    </p>
                  )}
                  
                  <Button className="w-full mb-2" size="lg" asChild>
                    <Link to="/messages">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Message
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full mb-2">
                    Recommend
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleDownloadResume}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Resume
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Right Column - Details */}
          <main className="lg:col-span-2 space-y-6">
            {/* About */}
            {profile.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">
                    {profile.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Skills & Endorsements */}
            {profile.skills && profile.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Skills & Endorsements
                    <Button variant="ghost" size="sm" onClick={() => navigate('/settings/edit-profile')}>
                      Add Skill
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.skills.map((skill: any) => (
                    <SkillBadge 
                      key={skill.skill_id}
                      name={skill.skill_name} 
                      endorsements={skill.endorsements_count || 0} 
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Experience */}
            {experiences.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Experience
                    <Button variant="ghost" size="sm" onClick={() => navigate('/settings/edit-profile')}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {experiences.map((exp: any) => (
                      <div key={exp.experience_id} className="space-y-2">
                        <h3 className="font-semibold">{exp.position}</h3>
                        <p className="text-sm text-muted-foreground">{exp.company}</p>
                        {exp.start_date && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            {' - '}
                            {exp.end_date 
                              ? new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                              : 'Present'
                            }
                          </p>
                        )}
                        {exp.description && (
                          <p className="text-sm whitespace-pre-wrap">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Education */}
            {education.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Education
                    <Button variant="ghost" size="sm" onClick={() => navigate('/settings/edit-profile')}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {education.map((edu: any) => (
                      <div key={edu.education_id} className="space-y-2">
                        <h3 className="font-semibold">{edu.institution}</h3>
                        <p className="text-sm text-muted-foreground">{edu.degree}</p>
                        {edu.field_of_study && (
                          <p className="text-sm text-muted-foreground">{edu.field_of_study}</p>
                        )}
                        {edu.start_date && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(edu.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            {' - '}
                            {edu.end_date 
                              ? new Date(edu.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                              : 'Present'
                            }
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Certifications
                    <Button variant="ghost" size="sm" onClick={() => navigate('/settings/edit-profile')}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {certifications.map((cert: any) => (
                      <div key={cert.certification_id} className="space-y-1">
                        <h3 className="font-semibold">{cert.name}</h3>
                        <p className="text-sm text-muted-foreground">{cert.issuing_organization}</p>
                        {cert.issue_date && (
                          <p className="text-xs text-muted-foreground">
                            Issued: {new Date(cert.issue_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            {cert.expiry_date && ` • Expires: ${new Date(cert.expiry_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Profile;
