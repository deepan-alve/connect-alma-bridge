import { useState } from "react";
import { Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recommendationsAPI } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Recommendation {
  recommendation_id: number;
  recommender_id: number;
  recommender_name: string;
  recommender_profile_pic: string | null;
  recommender_role: string | null;
  text: string;
  date: string;
}

interface RecommendationSectionProps {
  userId: number;
  isOwnProfile: boolean;
  currentUserId: number;
}

export const RecommendationSection = ({
  userId,
  isOwnProfile,
  currentUserId,
}: RecommendationSectionProps) => {
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [writeDialogOpen, setWriteDialogOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [recommendationText, setRecommendationText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch recommendations
  const { data: recommendations = [] } = useQuery<Recommendation[]>({
    queryKey: ["recommendations", userId],
    queryFn: () => recommendationsAPI.getUserRecommendations(String(userId)),
  });

  // Request recommendation mutation
  const requestMutation = useMutation({
    mutationFn: () =>
      recommendationsAPI.requestRecommendation(String(userId), requestMessage),
    onSuccess: () => {
      toast({
        title: "Recommendation request sent!",
      });
      setRequestDialogOpen(false);
      setRequestMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send request",
        description: error.response?.data?.error || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Write recommendation mutation
  const writeMutation = useMutation({
    mutationFn: () =>
      recommendationsAPI.writeRecommendation(String(userId), recommendationText),
    onSuccess: () => {
      toast({
        title: "Recommendation written!",
        description: "It will appear after they approve it.",
      });
      setWriteDialogOpen(false);
      setRecommendationText("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to write recommendation",
        description: error.response?.data?.error || "Please try again",
        variant: "destructive",
      });
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleRequestRecommendation = () => {
    if (requestMessage.trim().length < 10) {
      toast({
        title: "Message too short",
        description: "Please write at least 10 characters",
        variant: "destructive",
      });
      return;
    }
    requestMutation.mutate();
  };

  const handleWriteRecommendation = () => {
    if (recommendationText.trim().length < 10) {
      toast({
        title: "Recommendation too short",
        description: "Please write at least 10 characters",
        variant: "destructive",
      });
      return;
    }
    writeMutation.mutate();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recommendations</h3>
        {!isOwnProfile && (
          <div className="flex gap-2">
            <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Request
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Recommendation</DialogTitle>
                  <DialogDescription>
                    Ask this person to write you a recommendation
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  placeholder="Tell them why you're asking for a recommendation..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  rows={4}
                />
                <DialogFooter>
                  <Button
                    onClick={handleRequestRecommendation}
                    disabled={requestMutation.isPending}
                  >
                    Send Request
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={writeDialogOpen} onOpenChange={setWriteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Write
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Write Recommendation</DialogTitle>
                  <DialogDescription>
                    Share your experience working with this person
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  placeholder="Write your recommendation here..."
                  value={recommendationText}
                  onChange={(e) => setRecommendationText(e.target.value)}
                  rows={6}
                />
                <DialogFooter>
                  <Button
                    onClick={handleWriteRecommendation}
                    disabled={writeMutation.isPending}
                  >
                    Submit Recommendation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {recommendations.length === 0 ? (
        <p className="text-muted-foreground">
          {isOwnProfile
            ? "No recommendations yet"
            : "This person hasn't received any recommendations yet"}
        </p>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <Card key={rec.recommendation_id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={rec.recommender_profile_pic || undefined} />
                    <AvatarFallback>{getInitials(rec.recommender_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">
                      {rec.recommender_name}
                    </CardTitle>
                    <CardDescription>
                      {rec.recommender_role || "Professional"} •{" "}
                      {formatDistanceToNow(new Date(rec.date), {
                        addSuffix: true,
                      })}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{rec.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
