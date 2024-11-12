import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsAPI } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, Plus } from "lucide-react";

interface Group {
  group_id: number;
  name: string;
  description: string;
  created_by: number;
  created_by_name: string;
  member_count: number;
  is_member: boolean;
}

const Groups = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all groups
  const { data: allGroups = [], isLoading: allGroupsLoading } = useQuery<Group[]>({
    queryKey: ["groups", "all", searchQuery],
    queryFn: () => groupsAPI.getAllGroups(searchQuery),
    enabled: !!user,
  });

  // Fetch my groups
  const { data: myGroups = [], isLoading: myGroupsLoading } = useQuery<Group[]>({
    queryKey: ["groups", "my"],
    queryFn: () => groupsAPI.getMyGroups(),
    enabled: !!user,
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: () =>
      groupsAPI.createGroup(newGroupName, newGroupDescription),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast({
        title: "Group created!",
        description: "You are now the admin of this group.",
      });
      setCreateDialogOpen(false);
      setNewGroupName("");
      setNewGroupDescription("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create group",
        description: error.response?.data?.error || "Please try again",
        variant: "destructive",
      });
    },
  });

  // Join group mutation
  const joinGroupMutation = useMutation({
    mutationFn: (groupId: number) => groupsAPI.joinGroup(groupId),
    onSuccess: () => {
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

  const handleCreateGroup = () => {
    if (newGroupName.trim().length < 3) {
      toast({
        title: "Name too short",
        description: "Group name must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }
    createGroupMutation.mutate();
  };

  const handleJoinGroup = (groupId: number) => {
    joinGroupMutation.mutate(groupId);
  };

  const GroupCard = ({ group }: { group: Group }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{group.name}</CardTitle>
            <CardDescription>
              Created by {group.created_by_name}
            </CardDescription>
          </div>
          {group.is_member && (
            <Badge variant="secondary">Member</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {group.description}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {group.member_count} {group.member_count === 1 ? "member" : "members"}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a href={`/groups/${group.group_id}`}>View</a>
          </Button>
          {!group.is_member && (
            <Button
              size="sm"
              onClick={() => handleJoinGroup(group.group_id)}
              disabled={joinGroupMutation.isPending}
            >
              Join
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Professional Groups</h1>
            <p className="text-muted-foreground">
              Connect with alumni who share your interests
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogDescription>
                  Start a professional group for your interests
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Data Science Alumni"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What is this group about?"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateGroup}
                  disabled={createGroupMutation.isPending}
                >
                  Create Group
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Groups</TabsTrigger>
            <TabsTrigger value="my">My Groups</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search groups..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {allGroupsLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading groups...</p>
              </div>
            ) : allGroups.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No groups found</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "Try a different search term"
                    : "Be the first to create a group!"}
                </p>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {allGroups.map((group) => (
                  <GroupCard key={group.group_id} group={group} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my" className="space-y-6">
            {myGroupsLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading your groups...</p>
              </div>
            ) : myGroups.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
                <p className="text-muted-foreground mb-4">
                  Join or create a group to get started
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group
                </Button>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {myGroups.map((group) => (
                  <GroupCard key={group.group_id} group={group} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Groups;
