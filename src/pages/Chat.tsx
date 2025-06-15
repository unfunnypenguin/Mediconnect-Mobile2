import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, ArrowLeft, Phone, Video, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type UserProfile = {
  id: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  photo_url?: string;
  selected_avatar_id?: string;
  avatar_options?: { id: string; name: string; color_value: string; gradient_value: string; };
};

const Chat = () => {
  const { id: sessionId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Get current user profile
  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id,first_name,last_name,role,photo_url,selected_avatar_id,avatar_options(id,name,color_value,gradient_value)')
            .eq('id', authUser.id)
            .single();
          
          console.log('Current user profile:', profile);
          setUser(profile || { id: authUser.id });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    }
    fetchUser();
  }, []);

  // Fetch messages and chat partner information
  useEffect(() => {
    if (!sessionId || !user) return;
    
    async function fetchMessages() {
      setLoading(true);
      console.log('Fetching messages for session:', sessionId);
      
      try {
        // Fetch messages for session
        const { data: messagesData, error: messagesError } = await supabase
          .from('chat_messages')
          .select('id,sender_id,content,created_at')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });
        
        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
        } else {
          console.log('Fetched messages:', messagesData);
          setMessages(messagesData || []);
        }

        // Fetch chat session info to find the partner
        const { data: sessionInfo, error: sessionError } = await supabase
          .from('chat_sessions')
          .select('patient_id,doctor_id')
          .eq('id', sessionId)
          .single();
        
        if (sessionError) {
          console.error('Error fetching session info:', sessionError);
        } else if (sessionInfo && user) {
          console.log('Session info:', sessionInfo);
          const partnerId = sessionInfo.patient_id === user.id
            ? sessionInfo.doctor_id
            : sessionInfo.patient_id;
          
          if (partnerId) {
            const { data: partnerProfile } = await supabase
              .from('profiles')
              .select('id,first_name,last_name,role,photo_url,selected_avatar_id,avatar_options(id,name,color_value,gradient_value)')
              .eq('id', partnerId)
              .single();
            
            console.log('Partner profile:', partnerProfile);
            setPartner(partnerProfile || null);
          }
        }
      } catch (error) {
        console.error('Error in fetchMessages:', error);
        toast({
          title: "Error",
          description: "Failed to load chat messages.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();

    // Set up real-time subscription for new messages
    console.log('Setting up real-time subscription for session:', sessionId);
    const channel = supabase
      .channel(`chat-messages-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('New message received via real-time:', payload.new);
          const newMessage = payload.new as Message;
          setMessages(prev => {
            // Check if message already exists to avoid duplicates
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (exists) {
              console.log('Message already exists, not adding duplicate');
              return prev;
            }
            console.log('Adding new message to state');
            return [...prev, newMessage];
          });
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    return () => {
      console.log('Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [sessionId, user?.id, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !sessionId || !user || sending) {
      console.log('Cannot send message:', { newMessage: newMessage.trim(), sessionId, user, sending });
      return;
    }
    
    console.log('Sending message:', newMessage);
    setSending(true);
    
    try {
      const messageData = {
        session_id: sessionId,
        sender_id: user.id,
        content: newMessage.trim(),
      };

      console.log('Message data being sent:', messageData);

      const { data, error } = await supabase
        .from('chat_messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive"
        });
      } else {
        console.log('Message sent successfully:', data);
        setNewMessage('');
        
        // Manually add the message if real-time doesn't pick it up immediately
        setTimeout(() => {
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === data.id);
            if (!exists) {
              console.log('Adding sent message manually to ensure it appears');
              return [...prev, data];
            }
            return prev;
          });
        }, 100);
      }
    } catch (error) {
      console.error('Unexpected error sending message:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePhoneCall = () => {
    toast({
      title: "Phone Call",
      description: `Initiating voice call with ${partner?.first_name || 'user'}...`,
    });
  };

  const handleVideoCall = () => {
    toast({
      title: "Video Call", 
      description: `Starting video call with ${partner?.first_name || 'user'}...`,
    });
  };

  const handleInfoClick = () => {
    toast({
      title: "Chat Info",
      description: "Chat details and settings",
    });
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getAvatarDisplay = (profile: UserProfile | null) => {
    if (!profile) return <AvatarFallback>U</AvatarFallback>;

    if (profile.photo_url) {
      return <AvatarImage src={profile.photo_url} alt="Profile" />;
    }

    if (profile.selected_avatar_id && profile.avatar_options) {
      const avatar = profile.avatar_options;
      const style = avatar.gradient_value 
        ? { background: avatar.gradient_value }
        : { backgroundColor: avatar.color_value };
      
      return (
        <div 
          className="w-full h-full rounded-full flex items-center justify-center text-white font-medium text-sm"
          style={style}
        >
          {profile.first_name ? getInitials(profile.first_name, profile.last_name) : 'U'}
        </div>
      );
    }

    return <AvatarFallback>{getInitials(profile.first_name, profile.last_name)}</AvatarFallback>;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading chat...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-destructive">Error: User not authenticated.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Button>
          <Avatar className="h-9 w-9">
            {getAvatarDisplay(partner)}
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold leading-tight">
              {partner ? `${partner.first_name} ${partner.last_name || ''}` : 'Loading...'}
            </h2>
            <p className="text-sm text-muted-foreground">{partner?.role || 'User'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handlePhoneCall}>
            <Phone className="h-5 w-5" />
            <span className="sr-only">Phone Call</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleVideoCall}>
            <Video className="h-5 w-5" />
            <span className="sr-only">Video Call</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={handleInfoClick}>
            <Info className="h-5 w-5" />
            <span className="sr-only">Info</span>
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender_id === user.id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`flex items-end max-w-[80%] sm:max-w-[70%] md:max-w-[60%] lg:max-w-[50%] ${ 
                msg.sender_id === user.id ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar for partner messages */}
              {msg.sender_id !== user.id && (
                <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
                  {getAvatarDisplay(partner)}
                </Avatar>
              )}
              <div
                className={`rounded-xl p-3 shadow-sm text-sm ${ 
                  msg.sender_id === user.id
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-muted rounded-bl-none'
                }`}
              >
                {msg.content}
                <div
                  className={`text-xs mt-1 ${ 
                    msg.sender_id === user.id ? 'text-primary-foreground/80 text-right' : 'text-muted-foreground text-left'
                  }`}
                >
                  {formatTime(msg.created_at)}
                </div>
              </div>
              {/* Avatar for own messages (optional, if desired for visual consistency) */}
              {msg.sender_id === user.id && (
                <Avatar className="h-8 w-8 ml-2 flex-shrink-0">
                  {getAvatarDisplay(user)}
                </Avatar>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-10">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Type your message..."
            className="flex-1 pr-10 text-base"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={sending}
          />
          <Button type="button" size="icon" onClick={handleSend} disabled={sending}>
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="h-5 w-5" />
            )}
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
