import { useState } from "react";
import { Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { skillsAPI } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";

interface Skill {
  skill_id: number;
  skill_name: string;
}

interface UserSkill {
  skill_id: number;
  skill_name: string;
  endorsements_count: number;
}

interface SkillsManagementProps {
  userId: number;
  isOwnProfile: boolean;
}

export const SkillsManagement = ({ userId, isOwnProfile }: SkillsManagementProps) => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all available skills
  const { data: allSkills = [] } = useQuery<Skill[]>({
    queryKey: ["skills", "all"],
    queryFn: () => skillsAPI.getAllSkills(),
  });

  // Fetch user's skills
  const { data: userSkills = [] } = useQuery<UserSkill[]>({
    queryKey: ["skills", "user", userId],
    queryFn: () => skillsAPI.getUserSkills(String(userId)),
  });

  // Add skill mutation
  const addSkillMutation = useMutation({
    mutationFn: (skillId: number) => skillsAPI.addUserSkill(skillId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills", "user", userId] });
      toast({
        title: "Skill added to your profile",
      });
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add skill",
        description: error.response?.data?.error || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Remove skill mutation
  const removeSkillMutation = useMutation({
    mutationFn: (skillId: number) => skillsAPI.removeUserSkill(skillId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills", "user", userId] });
      toast({
        title: "Skill removed from your profile",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove skill",
        description: error.response?.data?.error || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Filter out skills user already has
  const availableSkills = allSkills.filter(
    (skill) => !userSkills.find((us) => us.skill_id === skill.skill_id)
  );

  const handleAddSkill = (skillId: number) => {
    addSkillMutation.mutate(skillId);
  };

  const handleRemoveSkill = (skillId: number) => {
    if (window.confirm("Are you sure you want to remove this skill?")) {
      removeSkillMutation.mutate(skillId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Skills</h3>
        {isOwnProfile && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Skill
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="end">
              <Command>
                <CommandInput placeholder="Search skills..." />
                <CommandEmpty>No skills found.</CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-auto">
                  {availableSkills.map((skill) => (
                    <CommandItem
                      key={skill.skill_id}
                      onSelect={() => handleAddSkill(skill.skill_id)}
                    >
                      <Check className="mr-2 h-4 w-4 opacity-0" />
                      {skill.skill_name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {userSkills.length === 0 ? (
        <p className="text-muted-foreground">
          {isOwnProfile ? "Add skills to your profile" : "No skills added yet"}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {userSkills.map((skill) => (
            <Badge key={skill.skill_id} variant="secondary" className="text-sm py-1 px-3">
              <span>{skill.skill_name}</span>
              {skill.endorsements_count > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({skill.endorsements_count})
                </span>
              )}
              {isOwnProfile && (
                <button
                  onClick={() => handleRemoveSkill(skill.skill_id)}
                  className="ml-2 hover:text-destructive"
                  disabled={removeSkillMutation.isPending}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
