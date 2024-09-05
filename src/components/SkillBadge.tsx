import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus } from "lucide-react";

interface SkillBadgeProps {
  name: string;
  endorsements: number;
  maxEndorsements?: number;
  canEndorse?: boolean;
}

export const SkillBadge = ({ 
  name, 
  endorsements, 
  maxEndorsements = 100,
  canEndorse = true 
}: SkillBadgeProps) => {
  const percentage = (endorsements / maxEndorsements) * 100;

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:border-primary transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium">{name}</span>
          <Badge variant="secondary" className="text-xs">
            {endorsements}
          </Badge>
        </div>
        <Progress value={percentage} className="h-1.5" />
      </div>
      {canEndorse && (
        <Button size="sm" variant="ghost" className="ml-4">
          <Plus className="h-4 w-4 mr-1" />
          Endorse
        </Button>
      )}
    </div>
  );
};
