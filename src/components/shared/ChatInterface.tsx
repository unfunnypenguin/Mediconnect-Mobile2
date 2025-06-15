import React, { useState, useRef, useEffect } from 'react';
import { User, Doctor, Availability } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquareIcon,
  SendIcon,
  PaperclipIcon,
  MicIcon,
  UserIcon,
  PlusIcon,
  BotIcon,
  UserCircleIcon,
  CalendarIcon,
  Phone,
  Video,
  Info
} from 'lucide-react';
import { getDayOfWeekString } from './ChatUtils';
import { useToast } from '@/components/ui/use-toast';

interface ChatInterfaceProps {
  partner?: User | Doctor;
  isAI?: boolean;
  initialMessages?: {
    id: string;
    content: string;
    sender: 'user' | 'other' | 'bot';
    timestamp: Date;
  }[];
  onSendMessage: (message: string) => void;
  // New optional props for calls and info, for integration with parent components like Chat.tsx
  onPhoneCall?: () => void;
  onVideoCall?: () => void;
  onInfoClick?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  partner,
  isAI = false,
  initialMessages = [],
  onSendMessage,
  onPhoneCall,
  onVideoCall,
  onInfoClick
}) => {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Default partner for when none is provided
  const defaultPartner: User = {
    id: 'ai-assistant',
    email: 'ai@healthcare.com',
    name: 'Healthcare Assistant',
    role: 'patient', // Changed from 'bot' to 'patient' to match allowed types
    dateCreated: new Date()
  };
  
  // Use the provided partner or the default one
  const chatPartner = partner || defaultPartner;

  useEffect(() => {
    // Scroll to bottom on initial load and when new messages are added
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatContainerRef.current?.scroll({
      top: chatContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  };

  const handleSendMessage = () => {
    if (newMessage.trim() !== '') {
      const messageToSend = {
        id: `msg-${Date.now()}`,
        content: newMessage,
        sender: 'user' as const, // Using 'as const' to ensure type safety
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, messageToSend]);
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const getSenderAvatar = (sender: 'user' | 'other' | 'bot') => {
    if (sender === 'user') {
      // Assuming the current user has an avatar setup, use a placeholder or logic from ProfileSettings if available.
      // For this generic component, we'll use a simple fallback.
      return (
        <Avatar className="h-8 w-8">
          <AvatarFallback>You</AvatarFallback>
        </Avatar>
      );
    } else if (sender === 'bot') {
      return (
        <Avatar className="h-8 w-8">
          <AvatarImage src="https://robohash.org/ai-bot?size=50x50" alt="AI Bot" />
          <AvatarFallback><BotIcon className="h-4 w-4" /></AvatarFallback>
        </Avatar>
      );
    } else {
      // For other users/doctors, attempt to get initials or use a generic icon
      const initials = chatPartner.name?.split(' ').map(n => n[0]).join('').toUpperCase();
      return (
        <Avatar className="h-8 w-8">
          <AvatarImage src={(chatPartner as Doctor).photo_url || ""} alt="Partner Avatar" />
          <AvatarFallback>{initials || <UserCircleIcon className="h-4 w-4" />}</AvatarFallback>
        </Avatar>
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          {getSenderAvatar(isAI ? 'bot' : 'other')}
          <div className="space-y-0.5 font-medium">
            <p className="text-base font-semibold leading-tight">{chatPartner.name}</p>
            {chatPartner.role === 'doctor' && 'specialty' in chatPartner && (
              <p className="text-xs text-muted-foreground">
                {(chatPartner as Doctor).specialty}
              </p>
            )}
            {chatPartner.role === 'doctor' && 'availability' in chatPartner && (
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Available:
                  {Array.isArray((chatPartner as Doctor).availability) && 
                    (chatPartner as Doctor).availability?.map((slot: Availability, index: number) => (
                      <span key={index} className="ml-1">
                        {getDayOfWeekString(slot.dayOfWeek)} ({slot.startTime}-{slot.endTime})
                        {index < ((chatPartner as Doctor).availability?.length || 0) - 1 ? ', ' : ''}
                      </span>
                    ))
                  }
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isAI && onPhoneCall && (
            <Button variant="ghost" size="icon" onClick={onPhoneCall}>
              <Phone className="h-4 w-4" />
              <span className="sr-only">Phone Call</span>
            </Button>
          )}
          {!isAI && onVideoCall && (
            <Button variant="ghost" size="icon" onClick={onVideoCall}>
              <Video className="h-4 w-4" />
              <span className="sr-only">Video Call</span>
            </Button>
          )}
          {onInfoClick && (
            <Button variant="ghost" size="icon" onClick={onInfoClick}>
              <Info className="h-4 w-4" />
              <span className="sr-only">Info</span>
            </Button>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex flex-col max-w-[80%] ${
              message.sender === 'user' ? 'items-end' : 'items-start'
            }`}>
              <div className={`rounded-xl p-3 text-sm shadow-sm ${
                message.sender === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-none'
                  : 'bg-muted rounded-bl-none'
              }`}>
                {message.content}
              </div>
              <span className={`text-xs text-muted-foreground mt-1 ${
                message.sender === 'user' ? 'text-right pr-1' : 'text-left pl-1'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <div className="bg-white border-t border-gray-200 p-3 sticky bottom-0 z-10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <PaperclipIcon className="h-5 w-5" />
            <span className="sr-only">Attach file</span>
          </Button>
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 pr-10 text-base h-9"
          />
          <Button variant="ghost" size="icon" onClick={handleSendMessage} className="h-9 w-9">
            <SendIcon className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
