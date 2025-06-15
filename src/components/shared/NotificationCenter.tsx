import React, { useState, useEffect } from 'react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BellIcon, MessageSquareIcon, CalendarIcon, CheckIcon, AlertTriangleIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

export type NotificationType = 'message' | 'appointment' | 'system' | 'healthcare_alert' | 'appointment_request';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  linkTo?: string;
  related_id?: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface NotificationCenterProps {
  notifications?: Notification[];
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications = []
}) => {
  const [notifs, setNotifs] = useState<Notification[]>(notifications);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user?.id) {
          console.log("No authenticated user found for notifications");
          return;
        }

        console.log("Fetching notifications for user:", user.id);

        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50); // Increased limit to see more notifications

        if (error) {
          console.error('Error fetching notifications:', error);
          throw error;
        }

        console.log("Raw notifications data:", data);
        console.log("Number of notifications found:", data?.length || 0);

        const transformedNotifications: Notification[] = data?.map(notification => ({
          id: notification.id,
          type: notification.type as NotificationType,
          title: notification.title,
          message: notification.message,
          timestamp: new Date(notification.created_at),
          read: notification.read,
          linkTo: notification.action_url || undefined,
          related_id: notification.related_id || undefined
        })) || [];

        console.log("Transformed notifications:", transformedNotifications);
        setNotifs(transformedNotifications);
      } catch (error: any) {
        console.error('Error fetching notifications:', error);
        toast.error('Failed to load notifications');
      }
    };

    fetchNotifications();

    // Set up real-time subscription for new notifications - listen to the specific user's notifications
    const subscription = supabase
      .channel('notifications_channel')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${supabase.auth.getUser().then(u => u.data.user?.id)}`
        },
        async (payload) => {
          console.log('New notification received:', payload);
          
          // Get current user to verify this notification is for them
          const { data: { user } } = await supabase.auth.getUser();
          if (payload.new.user_id === user?.id) {
            const newNotification: Notification = {
              id: payload.new.id,
              type: payload.new.type as NotificationType,
              title: payload.new.title,
              message: payload.new.message,
              timestamp: new Date(payload.new.created_at),
              read: false,
              linkTo: payload.new.action_url || undefined,
              related_id: payload.new.related_id || undefined
            };
            
            setNotifs(prev => [newNotification, ...prev]);
            
            // Show toast for different notification types
            if (payload.new.type === 'healthcare_alert') {
              toast.info("New Healthcare Alert!", {
                description: payload.new.message.substring(0, 50) + '...',
                icon: <AlertTriangleIcon className="h-4 w-4" />,
                duration: 5000
              });
            } else if (payload.new.type === 'message') {
              toast.info("New Message!", {
                description: payload.new.message,
                icon: <MessageSquareIcon className="h-4 w-4" />,
                duration: 4000
              });
            } else if (payload.new.type === 'appointment_request') {
              toast.info("New Appointment Request!", {
                description: payload.new.message,
                icon: <CalendarIcon className="h-4 w-4" />,
                duration: 4000
              });
            } else if (payload.new.type === 'system') {
              toast.info("New System Notification!", {
                description: payload.new.message,
                icon: <BellIcon className="h-4 w-4" />,
                duration: 4000
              });
            }
          }
        }
      )
      .subscribe();

    // Also listen to all notifications without filter as backup
    const fallbackSubscription = supabase
      .channel('all_notifications_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        async (payload) => {
          console.log('Fallback notification received:', payload);
          const { data: { user } } = await supabase.auth.getUser();
          if (payload.new.user_id === user?.id) {
            // Refresh notifications to be safe
            const { data } = await supabase
              .from('notifications')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(50);

            if (data) {
              const transformedNotifications: Notification[] = data.map(notification => ({
                id: notification.id,
                type: notification.type as NotificationType,
                title: notification.title,
                message: notification.message,
                timestamp: new Date(notification.created_at),
                read: notification.read,
                linkTo: notification.action_url || undefined,
                related_id: notification.related_id || undefined
              }));
              setNotifs(transformedNotifications);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
      supabase.removeChannel(fallbackSubscription);
    };
  }, []);
  
  const unreadCount = notifs.filter(n => !n.read).length;
  
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id);

      setNotifs(prev => 
        prev.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
    
    // Navigate based on notification type
    if (notification.type === 'healthcare_alert') {
      navigate('/notifications');
    } else if (notification.type === 'message' && notification.linkTo) {
      navigate(notification.linkTo);
    } else if (notification.type === 'appointment_request') {
      navigate('/doctor/appointments');
    } else if (notification.type === 'system' && notification.linkTo) {
      navigate(notification.linkTo);
    } else if (notification.linkTo) {
      navigate(notification.linkTo);
    }
    
    // Close the popover or sheet
    setOpen(false);
  };
  
  const markAllAsRead = async () => {
    try {
      const unreadIds = notifs.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length === 0) return;

      await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);

      setNotifs(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };
  
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'message':
        return <MessageSquareIcon className="h-4 w-4 text-blue-500" />;
      case 'appointment':
      case 'appointment_request':
        return <CalendarIcon className="h-4 w-4 text-green-500" />;
      case 'healthcare_alert':
        return <AlertTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'system':
      default:
        return <BellIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative">
      {/* Mobile-first: Use Sheet for notifications on small screens */}
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-500 text-white text-xs flex items-center justify-center animate-pulse" />
              )}
              <span className="sr-only">View notifications</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-md p-4 flex flex-col">
            <SheetHeader className="flex flex-row items-center justify-between pb-4">
              <SheetTitle className="text-xl font-bold">Notifications ({unreadCount})</SheetTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="text-blue-600 hover:text-blue-700 h-auto px-2"
              >
                Mark all as read
              </Button>
            </SheetHeader>
            <Separator />
            <ScrollArea className="flex-1 pr-2 mt-4">
              {notifs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No new notifications</p>
              ) : (
                <div className="space-y-4">
                  {notifs.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 p-3 rounded-md transition-colors ${!notification.read ? 'bg-blue-50/50 hover:bg-blue-100' : 'hover:bg-gray-100'} cursor-pointer`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`font-semibold ${!notification.read ? 'text-blue-800' : 'text-gray-800'} text-base leading-tight`}>
                            {notification.title}
                          </p>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
                          {notification.message}
                        </p>
                        {notification.linkTo && (
                          <span className="text-xs text-blue-500 hover:underline mt-1 block">View Details</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Use Popover for notifications on larger screens */}
      <div className="hidden md:block">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <BellIcon className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-500 text-white text-xs flex items-center justify-center animate-pulse" />
              )}
              <span className="sr-only">View notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0">
            <div className="flex items-center justify-between p-4">
              <h4 className="font-bold text-lg">Notifications ({unreadCount})</h4>
              <Button
                variant="link"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                Mark all as read
              </Button>
            </div>
            <Separator />
            <ScrollArea className="h-[300px]">
              {notifs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No new notifications</p>
              ) : (
                <div className="p-4 space-y-3">
                  {notifs.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 p-3 rounded-md transition-colors ${!notification.read ? 'bg-blue-50/50 hover:bg-blue-100' : 'hover:bg-gray-100'} cursor-pointer`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`font-semibold ${!notification.read ? 'text-blue-800' : 'text-gray-800'} leading-tight`}>
                            {notification.title}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
                          {notification.message}
                        </p>
                        {notification.linkTo && (
                          <span className="text-xs text-blue-500 hover:underline mt-1 block">View Details</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default NotificationCenter;
