import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { jobsAPI } from "@/lib/apiClient";
import { Briefcase, Calendar, MapPin, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Application {
  application_id: number;
  job_id: number;
  job_title: string;
  job_description: string;
  job_location: string;
  posted_by_name: string;
  resume_link: string;
  status: string;
  created_at: string;
}

const MyApplications = () => {
  const { user } = useAuth();
  
  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ["applications", "my"],
    queryFn: async () => {
      // For now, return empty array until backend implements this endpoint
      // TODO: Implement getMyApplications endpoint in backend
      return [];
    },
    enabled: !!user,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Submitted":
        return "secondary";
      case "Reviewed":
        return "default";
      case "Interview":
        return "default";
      case "Accepted":
        return "default";
      case "Rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Submitted":
        return "Application Submitted";
      case "Reviewed":
        return "Under Review";
      case "Interview":
        return "Interview Scheduled";
      case "Accepted":
        return "Accepted";
      case "Rejected":
        return "Not Selected";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">My Applications</h1>
          <p className="text-muted-foreground">
            Track the status of your job applications
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <Card className="p-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
            <p className="text-muted-foreground mb-4">
              Start applying to jobs to see them here
            </p>
            <Button asChild>
              <a href="/jobs">Browse Jobs</a>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <Card key={application.application_id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">
                        {application.job_title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {application.posted_by_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {application.job_location}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(application.status)}>
                      {getStatusText(application.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {application.job_description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Applied{" "}
                      {formatDistanceToNow(new Date(application.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                    <div className="flex gap-2">
                      {application.resume_link && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={application.resume_link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Resume
                          </a>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/jobs?job=${application.job_id}`}>
                          View Job
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;
