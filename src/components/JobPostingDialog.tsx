import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsAPI } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, Loader2 } from "lucide-react";

interface JobPostingDialogProps {
  trigger?: React.ReactNode;
}

export const JobPostingDialog = ({ trigger }: JobPostingDialogProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    apply_deadline: "",
  });

  const [errors, setErrors] = useState({
    title: "",
    description: "",
  });

  const createJobMutation = useMutation({
    mutationFn: (jobData: typeof formData) => jobsAPI.createJob(jobData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast({
        title: "Job posted successfully!",
        description: "Your job posting is now live and visible to students.",
      });
      setFormData({
        title: "",
        description: "",
        location: "",
        apply_deadline: "",
      });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to post job",
        description: error.response?.data?.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const validateForm = () => {
    const newErrors = {
      title: "",
      description: "",
    };

    if (formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }

    if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    setErrors(newErrors);
    return !newErrors.title && !newErrors.description;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    createJobMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      title: "",
      description: "",
      location: "",
      apply_deadline: "",
    });
    setErrors({
      title: "",
      description: "",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Briefcase className="h-4 w-4 mr-2" />
            Post a Job
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Post a Job Opportunity</DialogTitle>
          <DialogDescription>
            Share a job opening with students in your network. All fields marked with * are
            required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Job Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Senior Software Engineer"
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Job Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the role, responsibilities, requirements, and benefits..."
              rows={6}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., San Francisco, CA (Remote)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apply_deadline">Application Deadline</Label>
            <Input
              id="apply_deadline"
              type="date"
              value={formData.apply_deadline}
              onChange={(e) => setFormData({ ...formData, apply_deadline: e.target.value })}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createJobMutation.isPending}>
            {createJobMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Briefcase className="h-4 w-4 mr-2" />
                Post Job
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
