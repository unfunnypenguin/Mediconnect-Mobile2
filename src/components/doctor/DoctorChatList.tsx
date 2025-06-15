import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Bell, Shield } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';

type PatientMessage = {
  sessionId: string;
  patientId: string;
  patientName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  type: 'chat';
};

type HealthcareAlert = {
  id: string;
  message_content: string;
  sent_at: string;
  type: 'alert';
};

type GroupedHealthcareAlerts = {
  id: string;
  latestMessage: string;
  latestTime: string;
  totalCount: number;
  type: 'grouped_alerts';
};

type ChatItem = PatientMessage | GroupedHealthcareAlerts;

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const DoctorChatList: React.FC = () => {
  const { currentUser } = useAuth();
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchChatData() {
      if (!currentUser?.id) return;
      
      setLoading(true);
      console.log('Fetching chat data for doctor:', currentUser.id);
      
      try {
        // Fetch patient chats
        const { data: sessions, error: sessionsError } = await supabase
          .from('chat_sessions')
          .select('id, patient_id')
          .eq('doctor_id', currentUser.id);

        if (sessionsError) {
          console.error('Error fetching sessions:', sessionsError);
          toast({
            title: "Error",
            description: "Failed to load patient conversations.",
            variant: "destructive"
          });
          return;
        }

        const patientChats: PatientMessage[] = [];
        
        if (sessions?.length) {
          for (const session of sessions) {
            const { data: patientProfile } = await supabase
              .from('profiles')
              .select('id, first_name, last_name')
              .eq('id', session.patient_id)
              .single();

            const { data: lastMessage } = await supabase
              .from('chat_messages')
              .select('content, created_at, sender_id')
              .eq('session_id', session.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single();

            const { count: unreadCount } = await supabase
              .from('chat_messages')
              .select('*', { count: 'exact', head: true })
              .eq('session_id', session.id)
              .eq('sender_id', session.patient_id)
              .eq('read', false);

            if (patientProfile && lastMessage) {
              patientChats.push({
                sessionId: session.id,
                patientId: session.patient_id,
                patientName: `${patientProfile.first_name} ${patientProfile.last_name}`,
                lastMessage: lastMessage.content,
                lastMessageTime: lastMessage.created_at,
                unreadCount: unreadCount || 0,
                type: 'chat'
              });
            }
          }
        }

        // Fetch healthcare alerts
        const { data: alerts, error: alertsError } = await supabase
          .from('healthcare_alerts')
          .select('id, message_content, sent_at')
          .order('sent_at', { ascending: false })
          .limit(10);

        if (alertsError) {
          console.error('Error fetching healthcare alerts:', alertsError);
        }

        // Group all healthcare alerts into a single item
        let groupedAlerts: GroupedHealthcareAlerts | null = null;
        if (alerts && alerts.length > 0) {
          groupedAlerts = {
            id: 'healthcare_alerts_group',
            latestMessage: alerts[0].message_content,
            latestTime: alerts[0].sent_at,
            totalCount: alerts.length,
            type: 'grouped_alerts'
          };
        }

        // Combine patient chats and grouped alerts
        const allItems: ChatItem[] = [...patientChats];
        if (groupedAlerts) {
          allItems.push(groupedAlerts);
        }

        // Sort all items by time
        allItems.sort((a, b) => {
          const aTime = a.type === 'chat' ? a.lastMessageTime : a.latestTime;
          const bTime = b.type === 'chat' ? b.lastMessageTime : b.latestTime;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        });
        
        console.log('Fetched chat items:', allItems);
        setChatItems(allItems);
        
      } catch (error) {
        console.error('Error in fetchChatData:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading conversations.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchChatData();
  }, [currentUser?.id, toast]);

  const filteredItems = chatItems.filter(item => {
    if (item.type === 'chat') {
      return item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             item.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
      return item.latestMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
             'healthcare alert'.toLowerCase().includes(searchTerm.toLowerCase());
    }
  });

  const handleChatClick = (sessionId: string) => {
    navigate(`/chat/${sessionId}`);
  };

  const handleHealthcareAlertsClick = () => {
    navigate('/doctor/healthcare-alerts');
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderChatItem = (item: ChatItem) => {
    if (item.type === 'chat') {
      return (
        <li
          key={item.sessionId}
          className="flex items-center gap-3 py-3 px-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors border-b border-gray-50 last:border-b-0"
          onClick={() => handleChatClick(item.sessionId)}
        >
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-blue-500 text-white font-semibold">
              {getInitials(item.patientName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-gray-900 truncate">
                {item.patientName}
              </div>
              <div className="flex items-center gap-2">
                {item.unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {item.unreadCount}
                  </span>
                )}
                <div className="text-xs text-gray-400">
                  {formatTime(item.lastMessageTime)}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600 truncate mt-1">
              {item.lastMessage}
            </div>
          </div>
        </li>
      );
    } else {
      return (
        <li
          key={item.id}
          className="flex items-center gap-3 py-3 px-3 bg-orange-50 border border-orange-200 rounded-lg border-b border-gray-50 last:border-b-0 mb-2 cursor-pointer hover:bg-orange-100 transition-colors"
          onClick={handleHealthcareAlertsClick}
        >
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-orange-500 text-white">
              <Shield className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-orange-800 flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Healthcare Alerts ({item.totalCount})
              </div>
              <div className="text-xs text-orange-600">
                {formatTime(item.latestTime)}
              </div>
            </div>
            <div className="text-sm text-orange-700 mt-1">
              Latest: {item.latestMessage}
            </div>
            <div className="text-xs text-orange-500 mt-1 italic">
              System messages - No reply needed
            </div>
          </div>
        </li>
      );
    }
  };

  return (
    <div className="p-4 border rounded-lg h-full bg-white w-full">
      <h2 className="font-semibold text-lg mb-3">Messages & Alerts</h2>
      <Input
        placeholder="Search conversations and alerts..."
        className="mb-4"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />
      
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="animate-spin" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center text-gray-400 py-10">
          {chatItems.length === 0 ? 'No conversations or alerts yet.' : 'No items match your search.'}
        </div>
      ) : (
        <ul className="space-y-1">
          {filteredItems.map(renderChatItem)}
        </ul>
      )}
    </div>
  );
};

export default DoctorChatList;
