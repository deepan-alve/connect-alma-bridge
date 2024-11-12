import { useParams } from "react-router-dom";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsAPI } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, UserMinus, Crown } from "lucide-react";

interface GroupMember {
  user_id: number;
  name: string;
  profile_pic: string | null;
  role: string | null;
  member_role: "Admin" | "Member";
}

interface GroupDetail {
  group_id: number;
  name: string;
  description: string;
  created_by: number;
  created_by_name: string;
  is_member: boolean;
  is_admin: boolean;
  is_creator: boolean;
  members: GroupMember[];
}

const GroupDetail = () => {
  const { user } = useAuth();
  const { groupId } = useParams<{ groupId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch group details
  const { data: group, isLoading } = useQuery<GroupDetail>({
    queryKey: ["groups", groupId],
    queryFn: () => groupsAPI.getGroup(Number(groupId)),
    enabled: !!groupId && !!user,
  });

  // Join group mutation
  const joinMutation = useMutation({
    mutationFn: () => groupsAPI.joinGroup(Number(groupId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({
        title: "Joined group!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to join group",
        description: error.response?.data?.error || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Leave group mutation
  const leaveMutation = useMutation({
    mutationFn: () => groupsAPI.leaveGroup(Number(groupId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({
        title: "Left group",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to leave group",
        description: error.response?.data?.error || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Update member role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: "Admin" | "Member" }) =>
      groupsAPI.updateMemberRole(Number(groupId), String(userId), role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId] });
      toast({
        title: "Member role updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update role",
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

  const handleLeaveGroup = () => {
    if (window.confirm("Are you sure you want to leave this group?")) {
      leaveMutation.mutate();
    }
  };

  const handleToggleAdmin = (userId: number, currentRole: string) => {
    const newRole = currentRole === "Admin" ? "Member" : "Admin";
    if (
      window.confirm(
        `Are you sure you want to ${
          newRole === "Admin" ? "promote this member to admin" : "remove admin rights"
        }?`
      )
    ) {
      updateRoleMutation.mutate({ userId, role: newRole });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <Hero />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading group...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <Hero />
        <div className="container mx-auto px-4 py-8">
          <Card className="p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Group not found</h3>
            <Button asChild>
              <a href="/groups">Back to Groups</a>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <div className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-3xl">{group.name}</CardTitle>
                  {group.is_admin && <Badge variant="secondary">Admin</Badge>}
                </div>
                <CardDescription>
                  Created by {group.created_by_name} • {group.members.length}{" "}
                  {group.members.length === 1 ? "member" : "members"}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {!group.is_member ? (
                  <Button
                    onClick={() => joinMutation.mutate()}
                    disabled={joinMutation.isPending}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Join Group
                  </Button>
                ) : !group.is_creator ? (
                  <Button
                    variant="outline"
                    onClick={handleLeaveGroup}
                    disabled={leaveMutation.isPending}
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Leave Group
                  </Button>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{group.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {group.members.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={member.profile_pic || undefined} />
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.name}</p>
                        {member.member_role === "Admin" && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                        {member.user_id === group.created_by && (
                          <Badge variant="outline" className="text-xs">
                            Creator
                          </Badge>
                        )}
                      </div>
                      {member.role && (
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/profile/${member.user_id}`}>View Profile</a>
                    </Button>
                    {group.is_admin &&
                      member.user_id !== group.created_by && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleToggleAdmin(member.user_id, member.member_role)
                          }
                          disabled={updateRoleMutation.isPending}
                        >
                          {member.member_role === "Admin"
                            ? "Remove Admin"
                            : "Make Admin"}
                        </Button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GroupDetail;
