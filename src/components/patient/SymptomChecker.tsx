
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brain, Send, Loader2, Bot, User, MessageSquare, Calendar, Phone, MapPin, Clock, GraduationCap, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  aiResponse?: AIResponse;
}

interface AIResponse {
  response: string;
  urgency?: string;
  shouldShowDoctors?: boolean;
  recommendedDoctors?: Array<{
    id: string;
    name: string;
    specialty: string;
    institution: string;
    province: string;
    email: string;
    bio?: string;
    photoUrl?: string;
    qualifications?: string[];
    experienceYears?: number;
  }>;
}

const SymptomChecker = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Hello! I'm your AI health assistant. I'm here to help you understand your symptoms and connect you with qualified healthcare professionals. Please tell me about any symptoms or health concerns you're experiencing.",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: currentMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsAnalyzing(true);

    try {
      console.log('Sending message to AI:', currentMessage.trim());
      
      const { data, error } = await supabase.functions.invoke('ai-symptom-checker', {
        body: {
          message: currentMessage.trim()
        }
      });

      if (error) {
        console.error('Function error:', error);
        throw error;
      }

      console.log('Received AI response:', data);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'ai',
        timestamp: new Date(),
        aiResponse: data
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Show success toast if doctors are recommended
      if (data.recommendedDoctors && data.recommendedDoctors.length > 0) {
        toast.success(`Found ${data.recommendedDoctors.length} available doctor${data.recommendedDoctors.length > 1 ? 's' : ''} for you!`);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to get response. Please try again.');
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm currently experiencing technical difficulties. Please try again in a moment, or contact your healthcare provider if you have urgent concerns.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleContactDoctor = async (doctorId: string) => {
    if (!currentUser?.id) {
      toast.error('Please log in to message doctors');
      return;
    }

    try {
      // First, check if there's an existing chat session between this patient and doctor
      const { data: existingSession, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('patient_id', currentUser.id)
        .eq('doctor_id', doctorId)
        .single();

      let sessionId;

      if (existingSession) {
        // Use existing session
        sessionId = existingSession.id;
        console.log('Found existing session:', sessionId);
      } else {
        // Create new session
        const { data: newSession, error: createError } = await supabase
          .from('chat_sessions')
          .insert({
            patient_id: currentUser.id,
            doctor_id: doctorId
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating chat session:', createError);
          toast.error('Failed to start conversation. Please try again.');
          return;
        }

        sessionId = newSession.id;
        console.log('Created new session:', sessionId);
      }

      // Navigate to the chat with the session ID
      navigate(`/chat/${sessionId}`);
      
    } catch (error) {
      console.error('Error handling doctor contact:', error);
      toast.error('Failed to start conversation. Please try again.');
    }
  };

  const handleScheduleAppointment = (doctorId: string) => {
    navigate(`/patient/appointments?doctor=${doctorId}`);
  };

  const handleCallDoctor = (email: string) => {
    toast.info(`Contact doctor at: ${email}`);
  };

  const quickQuestions = [
    "I have a headache",
    "I'm feeling chest pain",
    "I have a fever",
    "I'm feeling anxious",
    "I have back pain"
  ];

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-200px)] flex flex-col">
      <Card className="shadow-md flex-1 flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Health Assistant
          </CardTitle>
          <p className="text-sm text-gray-600">
            Describe your symptoms and get personalized doctor recommendations
          </p>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-3">
                <div className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.sender === 'ai' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-[70%] rounded-lg p-3 ${
                    message.sender === 'user' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <span className="text-xs opacity-70 mt-2 block">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  {message.sender === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-500 text-white">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>

                {/* Emergency Alert */}
                {message.sender === 'ai' && message.aiResponse?.urgency === 'emergency' && (
                  <div className="ml-11">
                    <Card className="bg-red-50 border-red-200">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 text-red-800 font-medium">
                          <AlertTriangle className="h-4 w-4" />
                          EMERGENCY - Seek immediate medical attention
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Recommended Doctors */}
                {message.sender === 'ai' && message.aiResponse?.recommendedDoctors && message.aiResponse.recommendedDoctors.length > 0 && (
                  <div className="ml-11">
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700">Available doctors who can help:</p>
                      {message.aiResponse.recommendedDoctors.map((doctor) => (
                        <Card key={doctor.id} className="bg-blue-50 border-blue-200">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={doctor.photoUrl} alt={doctor.name} />
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                  {doctor.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              
                              <div className="flex-1 space-y-2">
                                <div>
                                  <h5 className="font-semibold text-gray-900">{doctor.name}</h5>
                                  <p className="text-sm text-blue-700 font-medium">{doctor.specialty}</p>
                                </div>
                                
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <MapPin className="h-3 w-3" />
                                  <span>{doctor.institution}, {doctor.province}</span>
                                </div>
                                
                                {doctor.experienceYears && doctor.experienceYears > 0 && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Clock className="h-3 w-3" />
                                    <span>{doctor.experienceYears} years of experience</span>
                                  </div>
                                )}
                                
                                {doctor.bio && (
                                  <p className="text-sm text-gray-600">{doctor.bio}</p>
                                )}
                                
                                {doctor.qualifications && doctor.qualifications.length > 0 && (
                                  <div className="flex items-start gap-2">
                                    <GraduationCap className="h-3 w-3 mt-1 text-gray-500" />
                                    <div className="flex flex-wrap gap-1">
                                      {doctor.qualifications.slice(0, 2).map((qual, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-xs">
                                          {qual}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex gap-2 pt-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleContactDoctor(doctor.id)}
                                    className="flex-1"
                                  >
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    Message
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleScheduleAppointment(doctor.id)}
                                    className="flex-1"
                                  >
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Schedule
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleCallDoctor(doctor.email)}
                                  >
                                    <Phone className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Disclaimer for AI responses */}
                {message.sender === 'ai' && message.aiResponse?.shouldShowDoctors && (
                  <div className="ml-11">
                    <Card className="bg-amber-50 border-amber-200">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-amber-800">
                            This is an AI assistant providing general health information only. Always consult qualified healthcare professionals for medical advice, diagnosis, or treatment.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            ))}
            
            {isAnalyzing && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-600">Analyzing your symptoms...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="border-t p-4 bg-gray-50">
              <p className="text-sm text-gray-600 mb-3">Quick questions to get started:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentMessage(question)}
                    className="text-xs"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Describe your symptoms... (e.g., 'I have a headache and feel nauseous')"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isAnalyzing}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={isAnalyzing || !currentMessage.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SymptomChecker;
