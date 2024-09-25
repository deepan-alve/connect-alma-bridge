import React, { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsAPI, connectionsAPI } from "@/lib/apiClient";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface NotificationItem {
  notification_id: number;
  content: string;
  is_read: boolean;
  timestamp: string;
}

export const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch notifications (only when authenticated)
  const { data: notifications = [] } = useQuery<NotificationItem[]>({
    queryKey: ["notifications"],
    queryFn: () => notificationsAPI.getNotifications(),
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Fetch unread count
  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationsAPI.getUnreadCount(),
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Mutations
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationsAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
      toast({ title: "All notifications marked as read" });
    },
  });

  const acceptConnectionMutation = useMutation({
    mutationFn: (connectionId: number) => connectionsAPI.acceptRequest(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connections"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  const handleNotificationClick = (n: NotificationItem) => {
    // Try to parse structured content (we store JSON for some notification types)
    let payload: any = null;
    try {
      payload = JSON.parse(n.content);
    } catch (e) {
      payload = null;
    }

    // If it's a structured connection_request, accept it and navigate to messages
    if (payload && payload.type === "connection_request" && payload.connection_id) {
      if (!user) return;
      acceptConnectionMutation.mutate(Number(payload.connection_id), {
        onSuccess: () => {
          markAsReadMutation.mutate(n.notification_id);
          setOpen(false);
          navigate("/messages");
          toast({ title: "Connection accepted", description: "You are now connected and can message the user." });
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err?.message || "Failed to accept connection", variant: "destructive" });
        },
      });
      return;
    }

    // Default behavior: mark as read
    if (!n.is_read) {
      markAsReadMutation.mutate(n.notification_id);
    }

    const contentLower = (n.content || "").toString().toLowerCase();
    if (contentLower.includes("message") || contentLower.includes("applied to your job") || contentLower.includes("connection request")) {
      setOpen(false);
      navigate("/messages");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
            >
              Mark all as read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No notifications</div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.notification_id}
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                    !notification.is_read ? "bg-muted/30" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <p className="text-sm">
                    {(() => {
                      // If notification content is structured JSON, render a friendly message
                      try {
                        const p = JSON.parse(notification.content);
                        if (p && p.type === "connection_request") {
                          return `${p.sender_name} sent you a connection request`;
                        }
                        return notification.content;
                      } catch (e) {
                        return notification.content;
                      }
                    })()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
