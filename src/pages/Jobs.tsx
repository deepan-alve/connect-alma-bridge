import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { FilterSidebar } from "@/components/FilterSidebar";
import { JobCard } from "@/components/JobCard";
import { JobPostingDialog } from "@/components/JobPostingDialog";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { fetchJobs } from "@/lib/api/jobs";
import { usersAPI } from "@/lib/apiClient";

const Jobs = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  // Fetch user profile to check role
  const { data: profileResponse } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: () => usersAPI.getUserProfile(user!.id),
    enabled: !!user,
  });

  // Check if user is alumni (can post jobs)
  const isAlumni = profileResponse?.data?.role === "Alumnus";
  
  // Check if user is student (can apply to jobs)
  const isStudent = profileResponse?.data?.role?.toLowerCase() === "student";

  // Fetch jobs from Supabase
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['jobs', { searchTerm, location: locationFilter }],
    queryFn: () => fetchJobs({ searchTerm, location: locationFilter }),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Format job data for JobCard component
  const formattedJobs = jobs?.map(job => ({
    jobId: job.job_id,
    title: job.title,
    company: job.poster?.name || "Unknown",
    location: job.location || "Not specified",
    postedBy: `${job.poster?.name} (${job.poster?.role || 'Alumni'})`,
    postedDate: new Date(job.created_at).toLocaleDateString(),
    description: job.description || "",
    skills: [], // Can add skills later if needed
    isStudent,
  })) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <FilterSidebar />
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Job Openings</h2>
                  <p className="text-muted-foreground">
                    Posted by Alumni · {isLoading ? "..." : `${formattedJobs.length} Results`}
                  </p>
                </div>
                {isAlumni && <JobPostingDialog />}
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search job titles, companies, skills..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <p className="text-destructive">Error loading jobs. Please try again.</p>
              </div>
            )}

            {/* Jobs List */}
            {!isLoading && !error && formattedJobs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No jobs posted yet. Check back soon!</p>
              </div>
            )}

            <div className="space-y-4">
              {formattedJobs.map((job, index) => (
                <JobCard key={index} {...job} />
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Jobs;
