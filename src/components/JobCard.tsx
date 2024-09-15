import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Bookmark } from "lucide-react";
import { JobApplicationDialog } from "@/components/JobApplicationDialog";

interface JobCardProps {
  jobId: number;
  title: string;
  company: string;
  location: string;
  postedBy: string;
  postedDate: string;
  description: string;
  skills?: string[];
  isStudent?: boolean;
}

export const JobCard = ({ 
  jobId,
  title, 
  company, 
  location, 
  postedBy, 
  postedDate,
  description,
  skills = [],
  isStudent = false
}: JobCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl text-primary hover:text-accent cursor-pointer transition-colors">
              {title}
            </CardTitle>
            <CardDescription className="mt-1">{company}</CardDescription>
          </div>
          <Button variant="ghost" size="icon">
            <Bookmark className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {location}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {postedDate}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          Posted by: {postedBy}
        </p>
        <p className="text-sm line-clamp-2 mb-3">{description}</p>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <Badge key={index} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="gap-2">
        {isStudent ? (
          <JobApplicationDialog 
            jobId={jobId} 
            jobTitle={title}
            trigger={<Button className="flex-1">Apply Now</Button>}
          />
        ) : (
          <Button className="flex-1" disabled>Apply Now</Button>
        )}
        <Button variant="outline">View Details</Button>
      </CardFooter>
    </Card>
  );
};
