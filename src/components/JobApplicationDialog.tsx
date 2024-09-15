import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsAPI } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
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
import { Loader2, Send, MessageSquare } from "lucide-react";

interface JobApplicationDialogProps {
  jobId: number;
  jobTitle: string;
  trigger?: React.ReactNode;
}

export const JobApplicationDialog = ({ jobId, jobTitle, trigger }: JobApplicationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [resumeLink, setResumeLink] = useState("");
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const applyMutation = useMutation({
    mutationFn: () => jobsAPI.applyToJob(jobId, resumeLink || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      setApplicationSubmitted(true);
      toast({
        title: "Application submitted!",
        description: "A message has been sent to the job poster. You can continue the conversation in Messages.",
      });
      setResumeLink("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit application",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    applyMutation.mutate();
  };

  const handleGoToMessages = () => {
    setOpen(false);
    setApplicationSubmitted(false);
    navigate("/messages");
  };

  const handleClose = () => {
    setOpen(false);
    setApplicationSubmitted(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Apply Now</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Apply to {jobTitle}</DialogTitle>
          <DialogDescription>
            {applicationSubmitted 
              ? "Your application has been submitted! A message has been sent to the job poster."
              : "Submit your application for this position. You can optionally include a link to your resume."
            }
          </DialogDescription>
        </DialogHeader>

        {!applicationSubmitted ? (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="resumeLink">Resume Link (Optional)</Label>
                <Input
                  id="resumeLink"
                  type="url"
                  value={resumeLink}
                  onChange={(e) => setResumeLink(e.target.value)}
                  placeholder="https://drive.google.com/..."
                />
                <p className="text-xs text-muted-foreground">
                  Provide a link to your resume (Google Drive, Dropbox, etc.)
                </p>
              </div>
              <div className="rounded-md bg-blue-50 dark:bg-blue-950 p-3 text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">📬 Direct Communication</p>
                <p className="text-xs">
                  When you apply, an automatic message will be sent to the job poster, 
                  starting a conversation so you can chat directly!
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={applyMutation.isPending}>
                {applyMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="rounded-md bg-green-50 dark:bg-green-950 p-4 text-center">
                <div className="text-4xl mb-2">✅</div>
                <p className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  Application Submitted Successfully!
                </p>
                <p className="text-sm text-green-800 dark:text-green-200">
                  The job poster has been notified and a conversation has been started. 
                  You can now message them directly to discuss the opportunity!
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                Close
              </Button>
              <Button onClick={handleGoToMessages} className="w-full sm:w-auto">
                <MessageSquare className="h-4 w-4 mr-2" />
                Go to Messages
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
