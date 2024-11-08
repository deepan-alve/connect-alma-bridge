import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileAPI } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ParsedResumeData {
  experiences: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string;
  }>;
  certifications: Array<{
    name: string;
    issuingOrganization: string;
    issueDate: string;
    expirationDate?: string;
  }>;
  skills: string[]; // Array of skill descriptions
}

interface ResumeUploadProps {
  onParsedData?: (data: ParsedResumeData) => void;
}

export const ResumeUpload = ({ onParsedData }: ResumeUploadProps) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('resume', file);
      
      // Step 1: Upload to storage (30%)
      setUploadProgress(30);
      const uploadResponse = await profileAPI.uploadResume(formData);
      
      // Step 2: Parse the PDF (60%)
      setUploadProgress(60);
      const parseResponse = await profileAPI.parseResume(formData);
      
      // Step 3: Complete (100%)
      setUploadProgress(100);
      
      return {
        uploadData: uploadResponse,
        parsedData: parseResponse.data as ParsedResumeData
      };
    },
    onSuccess: ({ parsedData }) => {
      toast({
        title: "Resume uploaded and parsed!",
        description: "We've extracted your experience, education, skills, and certifications. Review and edit below.",
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      
      // Pass parsed data to parent component (EditProfile)
      if (onParsedData) {
        onParsedData(parsedData);
      }
      
      setSelectedFile(null);
      setUploadProgress(0);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to upload resume",
        description: error.message || "Please try again",
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or DOCX file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Resume
        </CardTitle>
        <CardDescription>
          Upload your resume (PDF or DOCX, max 10MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileSelect}
            className="hidden"
            id="resume-upload"
          />
          
          {!selectedFile ? (
            <label htmlFor="resume-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                PDF or DOCX (max. 10MB)
              </p>
            </label>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              {uploadProgress > 0 && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <div className="flex items-center justify-center gap-2">
                    {uploadProgress < 100 && <Sparkles className="h-3 w-3 text-primary animate-pulse" />}
                    <p className="text-xs text-muted-foreground text-center">
                      {uploadProgress === 100 
                        ? 'Complete! Resume parsed successfully.' 
                        : uploadProgress >= 60
                        ? 'Parsing resume with AI...'
                        : 'Uploading resume...'}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-center">
                {uploadProgress === 0 && (
                  <>
                    <Button onClick={handleUpload} disabled={uploadMutation.isPending}>
                      {uploadMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </>
                )}
                {uploadProgress === 100 && (
                  <Button variant="outline" onClick={handleCancel}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Done
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
