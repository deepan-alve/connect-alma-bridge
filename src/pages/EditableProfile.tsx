import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersAPI } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Save, X, Loader2 } from "lucide-react";

const EditableProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    bio: "",
    department: "",
    graduation_year: "",
    profile_pic: "",
  });

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: () => usersAPI.getUserProfile(user!.id),
    enabled: !!user,
  });

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile && (profile as any).data) {
      const profileData = (profile as any).data;
      setFormData({
        name: profileData.name || "",
        role: profileData.role || "",
        bio: profileData.bio || "",
        department: profileData.department || "",
        graduation_year: profileData.graduation_year || "",
        profile_pic: profileData.profile_pic || "",
      });
    }
  }, [profile]);

  // Fetch departments and years
  const { data: departmentsResponse } = useQuery({
    queryKey: ["departments"],
    queryFn: () => usersAPI.getDepartments(),
  });
  const departments = departmentsResponse?.data || [];

  const { data: graduationYearsResponse } = useQuery({
    queryKey: ["graduation-years"],
    queryFn: () => usersAPI.getGraduationYears(),
  });
  const graduationYears = graduationYearsResponse?.data || [];

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (updates: typeof formData) => usersAPI.updateProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast({
        title: "Profile updated!",
        description: "Your changes have been saved successfully.",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.response?.data?.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (profile && (profile as any).data) {
      const profileData = (profile as any).data;
      setFormData({
        name: profileData.name || "",
        role: profileData.role || "",
        bio: profileData.bio || "",
        department: profileData.department || "",
        graduation_year: profileData.graduation_year || "",
        profile_pic: profileData.profile_pic || "",
      });
    }
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Profile</h1>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Profile Picture */}
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={formData.profile_pic} />
                  <AvatarFallback>{getInitials(formData.name)}</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div className="w-full">
                    <Label htmlFor="profile_pic">Profile Picture URL</Label>
                    <Input
                      id="profile_pic"
                      value={formData.profile_pic}
                      onChange={(e) =>
                        setFormData({ ...formData, profile_pic: e.target.value })
                      }
                      placeholder="https://..."
                    />
                  </div>
                )}
              </div>

              {/* Profile Details */}
              <div className="flex-1 space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-2xl font-bold">{formData.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="role">Professional Role</Label>
                  {isEditing ? (
                    <Input
                      id="role"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      placeholder="e.g., Software Engineer, Product Manager"
                    />
                  ) : (
                    <p className="text-muted-foreground">{formData.role || "Not specified"}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <span className="text-xs text-muted-foreground">(Cannot be changed)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department">Department</Label>
                    {isEditing ? (
                      <Select
                        value={formData.department}
                        onValueChange={(value) =>
                          setFormData({ ...formData, department: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept: string) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-muted-foreground">
                        {formData.department || "Not specified"}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="graduation_year">Graduation Year</Label>
                    {isEditing ? (
                      <Select
                        value={formData.graduation_year}
                        onValueChange={(value) =>
                          setFormData({ ...formData, graduation_year: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {graduationYears.map((year: string) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-muted-foreground">
                        {formData.graduation_year || "Not specified"}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  {isEditing ? (
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      rows={4}
                      placeholder="Tell others about yourself, your experience, and interests..."
                    />
                  ) : (
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {formData.bio || "No bio added yet"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {!isEditing && (
          <div className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>Skills & Endorsements:</strong> Manage your skills in the Skills
                  section below
                </p>
                <p>
                  <strong>Recommendations:</strong> Request and manage recommendations in the
                  Recommendations section
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditableProfile;
