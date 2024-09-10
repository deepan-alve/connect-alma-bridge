import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, UserPlus, MessageSquare, Loader2, Users, UserCheck, UserX } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fetchConnections, fetchSuggestedConnections, sendConnectionRequest } from "@/lib/api/connections";
import { usersAPI, connectionsAPI } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";

const Network = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [yearFilter, setYearFilter] = useState<string>("");

  // Fetch all users in directory (only when authenticated)
  const { data: directoryData, isLoading: loadingDirectory } = useQuery({
    queryKey: ['user-directory', searchTerm, roleFilter, departmentFilter, yearFilter],
    queryFn: () => usersAPI.getDirectory({
      search: searchTerm || undefined,
      role: roleFilter || undefined,
      department: departmentFilter || undefined,
      graduationYear: yearFilter || undefined,
    }),
    enabled: !!user,
  });

  // Fetch departments and years for filters
  const { data: departmentsResponse } = useQuery({
    queryKey: ['departments'],
    queryFn: () => usersAPI.getDepartments(),
    enabled: !!user,
  });
  const departments = departmentsResponse?.data || [];

  const { data: graduationYearsResponse } = useQuery({
    queryKey: ['graduation-years'],
    queryFn: () => usersAPI.getGraduationYears(),
    enabled: !!user,
  });
  const graduationYears = graduationYearsResponse?.data || [];

  // Fetch accepted connections
  const { data: connectionsData, isLoading: loadingConnections } = useQuery({
    queryKey: ['connections', user?.id, 'accepted'],
    queryFn: () => fetchConnections(user!.id, 'accepted'),
    enabled: !!user,
  });

  // Fetch suggested connections
  const { data: suggestionsData, isLoading: loadingSuggestions } = useQuery({
    queryKey: ['suggested-connections', user?.id],
    queryFn: () => fetchSuggestedConnections(user!.id),
    enabled: !!user,
  });

  // Fetch pending connection requests
  const { data: pendingRequestsData, isLoading: loadingPending } = useQuery({
    queryKey: ['connections', user?.id, 'pending'],
    queryFn: () => fetchConnections(user!.id, 'pending'),
    enabled: !!user,
  });

  // Send connection request mutation
  const sendRequestMutation = useMutation({
    mutationFn: sendConnectionRequest,
    onSuccess: () => {
      toast({
        title: "Connection request sent!",
        description: "They will be notified of your request.",
      });
      queryClient.invalidateQueries({ queryKey: ['suggested-connections'] });
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send connection request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Accept connection request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: (connectionId: number) => connectionsAPI.acceptRequest(connectionId),
    onSuccess: () => {
      toast({
        title: "Connection accepted!",
        description: "You are now connected.",
      });
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to accept request.",
        variant: "destructive",
      });
    },
  });

  // Reject connection request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: (connectionId: number) => connectionsAPI.rejectRequest(connectionId),
    onSuccess: () => {
      toast({
        title: "Request rejected",
      });
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject request.",
        variant: "destructive",
      });
    },
  });

  const handleConnect = (userId: string) => {
    sendRequestMutation.mutate(userId);
  };

  const handleAcceptRequest = (connectionId: number) => {
    acceptRequestMutation.mutate(connectionId);
  };

  const handleRejectRequest = (connectionId: number) => {
    rejectRequestMutation.mutate(connectionId);
  };

  const handleStartMessage = (userId: string, userName: string) => {
    // Navigate to messages with the user context
    navigate('/messages', { state: { selectedUserId: userId, selectedUserName: userName } });
  };

  const ConnectionCard = ({ person, showConnect = false }: { person: any; showConnect?: boolean }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={person.avatar} />
            <AvatarFallback>{person.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <Link to="/profile" className="font-semibold text-lg hover:text-primary transition-colors">
              {person.name}
            </Link>
            <p className="text-sm text-muted-foreground line-clamp-1">{person.title}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{person.graduationYear}</Badge>
              <span>{person.department}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {person.mutualConnections} mutual connections
            </p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          {showConnect ? (
            <Button 
              className="flex-1"
              onClick={() => handleConnect(person.user_id)}
              disabled={sendRequestMutation.isPending}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {sendRequestMutation.isPending ? "Connecting..." : "Connect"}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => handleStartMessage(person.user_id, person.name)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Message
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to="/profile">View Profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const PendingRequestCard = ({ request }: { request: any }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={request.avatar} />
            <AvatarFallback>{request.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <Link to="/profile" className="font-semibold text-lg hover:text-primary transition-colors">
              {request.name}
            </Link>
            <p className="text-sm text-muted-foreground line-clamp-1">{request.title}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Badge variant="secondary">{request.graduationYear}</Badge>
              <span>{request.department}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {request.isReceiver ? "Sent you a connection request" : "Waiting for their response"}
            </p>
          </div>
        </div>
        {request.isReceiver ? (
          <div className="flex gap-2 mt-4">
            <Button 
              className="flex-1"
              onClick={() => handleAcceptRequest(request.connection_id)}
              disabled={acceptRequestMutation.isPending}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              {acceptRequestMutation.isPending ? "Accepting..." : "Accept"}
            </Button>
            <Button 
              variant="outline"
              className="flex-1"
              onClick={() => handleRejectRequest(request.connection_id)}
              disabled={rejectRequestMutation.isPending}
            >
              <UserX className="mr-2 h-4 w-4" />
              Decline
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" disabled>
              Pending...
            </Button>
            <Button variant="outline" asChild>
              <Link to="/profile">View Profile</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Format connections data
  const connections = connectionsData?.map((conn: any) => ({
    user_id: conn.otherUser.user_id,
    name: conn.otherUser.name,
    title: conn.otherUser.role || "Alumni",
    graduationYear: conn.otherUser.graduation_year,
    department: conn.otherUser.department,
    mutualConnections: 0,
    avatar: conn.otherUser.profile_pic || "",
  })) || [];

  const suggestions = suggestionsData?.map((user: any) => ({
    user_id: user.user_id,
    name: user.name,
    title: user.role || "Alumni",
    graduationYear: user.graduation_year,
    department: user.department,
    mutualConnections: 0,
    avatar: user.profile_pic || "",
  })) || [];

  // Format pending requests data
  const pendingRequests = pendingRequestsData?.map((conn: any) => ({
    connection_id: conn.connection_id,
    user_id: conn.otherUser.user_id,
    name: conn.otherUser.name,
    title: conn.otherUser.role || "Network Member",
    graduationYear: conn.otherUser.graduation_year,
    department: conn.otherUser.department,
    mutualConnections: 0,
    avatar: conn.otherUser.profile_pic || "",
    isReceiver: conn.user_id_2 === user?.id, // true if current user is the receiver
  })) || [];

  // Format directory data - exclude current user and already connected users
  const connectedUserIds = new Set([
    ...connections.map((c: any) => c.user_id),
    ...(pendingRequests || []).map((r: any) => r.user_id),
  ]);

  const directory = directoryData?.data
    ?.filter((u: any) => {
      // Exclude current user
      if (u.user_id === user?.id) return false;
      // Exclude already connected or pending users
      if (connectedUserIds.has(u.user_id)) return false;
      return true;
    })
    .map((user: any) => ({
      user_id: user.user_id,
      name: user.name,
      title: user.role || "Network Member",
      graduationYear: user.graduation_year,
      department: user.department,
      email: user.email,
      bio: user.bio,
      avatar: user.profile_pic || "",
    })) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-4">My Network</h1>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search connections by name, company, or skills..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="directory" className="space-y-6">
          <TabsList>
            <TabsTrigger value="directory">Network Directory</TabsTrigger>
            <TabsTrigger value="connections">My Connections</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            <TabsTrigger value="pending">Pending Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="directory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  All Network Members ({directory.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="Student">Student</SelectItem>
                      <SelectItem value="Alumnus">Alumni</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((dept: string) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {graduationYears.map((year: string) => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  {loadingDirectory ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : directory.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No users found</p>
                    </div>
                  ) : (
                    directory.map((person: any, index: number) => (
                      <ConnectionCard key={index} person={person} showConnect />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="connections" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Connections ({connections.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingConnections ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : connections.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No connections yet. Start connecting with alumni!</p>
                  </div>
                ) : (
                  connections.map((person: any, index: number) => (
                    <ConnectionCard key={index} person={person} />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>People You May Know</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingSuggestions ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No suggestions available</p>
                  </div>
                ) : (
                  suggestions.map((person: any, index: number) => (
                    <ConnectionCard key={index} person={person} showConnect />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Connection Requests ({pendingRequests.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingPending ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No pending connection requests</p>
                  </div>
                ) : (
                  pendingRequests.map((request: any, index: number) => (
                    <PendingRequestCard key={index} request={request} />
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Network;
