import { useState } from "react";
import { ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { skillsAPI } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";

interface SkillEndorsementProps {
  userId: number;
  skillId: number;
  skillName: string;
  endorsementsCount: number;
  isOwnProfile: boolean;
  currentUserId: number;
}

interface Endorser {
  user_id: number;
  name: string;
  profile_pic: string | null;
  role: string | null;
}

export const SkillEndorsement = ({
  userId,
  skillId,
  skillName,
  endorsementsCount,
  isOwnProfile,
  currentUserId,
}: SkillEndorsementProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch endorsers when dialog opens
  const { data: endorsers = [] } = useQuery<Endorser[]>({
    queryKey: ["skill-endorsers", userId, skillId],
    queryFn: () => skillsAPI.getSkillEndorsers(String(userId), skillId),
    enabled: dialogOpen,
  });

  // Endorse skill mutation
  const endorseMutation = useMutation({
    mutationFn: () => skillsAPI.endorseSkill(String(userId), skillId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills", "user", userId] });
      queryClient.invalidateQueries({ queryKey: ["skill-endorsers", userId, skillId] });
      toast({
        title: "Skill endorsed!",
        description: `You endorsed ${skillName}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to endorse skill",
        description: error.response?.data?.error || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Check if current user has endorsed this skill
  const hasEndorsed = endorsers.some(
    (endorser) => endorser.user_id === currentUserId
  );

  const handleEndorse = () => {
    endorseMutation.mutate();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center gap-2">
      {!isOwnProfile && (
        <Button
          variant={hasEndorsed ? "secondary" : "outline"}
          size="sm"
          onClick={handleEndorse}
          disabled={endorseMutation.isPending || hasEndorsed}
        >
          <ThumbsUp className="h-3 w-3 mr-1" />
          {hasEndorsed ? "Endorsed" : "Endorse"}
        </Button>
      )}

      {endorsementsCount > 0 && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
              {endorsementsCount} {endorsementsCount === 1 ? "endorsement" : "endorsements"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Endorsed by</DialogTitle>
              <DialogDescription>
                People who endorsed {skillName}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {endorsers.map((endorser) => (
                  <div key={endorser.user_id} className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={endorser.profile_pic || undefined} />
                      <AvatarFallback>{getInitials(endorser.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{endorser.name}</p>
                      {endorser.role && (
                        <p className="text-sm text-muted-foreground">{endorser.role}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
