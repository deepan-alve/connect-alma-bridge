import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  subscribeToMessages,
  unsubscribeFromMessages,
} from "@/lib/api/messages";

const Messages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check if we're navigating from Network page with a selected user
  useEffect(() => {
    if (location.state?.selectedUserId) {
      setSelectedPartnerId(location.state.selectedUserId);
    }
  }, [location.state]);

  // Fetch conversations
  const { data: conversations, isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: () => fetchConversations(user!.id),
    enabled: !!user,
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ['messages', user?.id, selectedPartnerId],
    queryFn: () => fetchMessages(user!.id, selectedPartnerId!),
    enabled: !!user && !!selectedPartnerId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ receiverId, text }: { receiverId: string; text: string }) =>
      sendMessage(receiverId, text),
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = subscribeToMessages(user.id, () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    return () => {
      unsubscribeFromMessages(channel);
    };
  }, [user, queryClient]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!messageText.trim() || !selectedPartnerId) return;
    sendMessageMutation.mutate({ receiverId: selectedPartnerId, text: messageText });
  };

  // Get selected partner info - from conversations or from navigation state
  const selectedPartner = conversations?.find((c: any) => c.partnerId === selectedPartnerId)?.partner || 
    (location.state?.selectedUserId === selectedPartnerId ? {
      user_id: location.state.selectedUserId,
      name: location.state.selectedUserName || 'User',
      profile_pic: null,
    } : null);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <Card className="h-[calc(100vh-12rem)]">
          <div className="grid grid-cols-1 md:grid-cols-3 h-full">
            {/* Conversations List */}
            <div className="border-r">
              <CardHeader>
                <CardTitle>Messages</CardTitle>
              </CardHeader>
              <ScrollArea className="h-[calc(100%-5rem)]">
                <div className="space-y-2 p-4">
                  {loadingConversations ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : conversations?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No messages yet
                    </div>
                  ) : (
                    conversations?.map((conv: any) => (
                      <div
                        key={conv.partnerId}
                        onClick={() => setSelectedPartnerId(conv.partnerId)}
                        className={`flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors ${
                          selectedPartnerId === conv.partnerId ? 'bg-muted' : ''
                        }`}
                      >
                        <Avatar>
                          <AvatarImage src={conv.partner.profile_pic} />
                          <AvatarFallback>
                            {conv.partner.name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{conv.partner.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(conv.lastMessageTime).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.lastMessage}
                          </p>
                        </div>
                        {conv.unread && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Message View */}
            <div className="md:col-span-2 flex flex-col">
              {!selectedPartnerId ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Select a conversation to start messaging</p>
                </div>
              ) : (
                <>
                  <CardHeader className="border-b">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={selectedPartner?.profile_pic} />
                        <AvatarFallback>
                          {selectedPartner?.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{selectedPartner?.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{selectedPartner?.role}</p>
                      </div>
                    </div>
                  </CardHeader>

                  <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    {loadingMessages ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages?.map((msg: any) => (
                          <div
                            key={msg.message_id}
                            className={`flex ${
                              msg.sender_id === user?.id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`rounded-lg p-3 max-w-[70%] ${
                                msg.sender_id === user?.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm">{msg.message_text}</p>
                              <span className="text-xs opacity-70 mt-1 block">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  <div className="p-4 border-t">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        disabled={sendMessageMutation.isPending}
                      />
                      <Button 
                        type="submit" 
                        size="icon"
                        disabled={!messageText.trim() || sendMessageMutation.isPending}
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Messages;
