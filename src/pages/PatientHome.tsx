import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard, BrainCog, UserSearch, Calendar, MapPin,
  MessageSquare, Settings, Pill, AlertTriangle, FileText,
  Menu, LogOut
} from 'lucide-react';
import PatientDashboard from '@/components/patient/PatientDashboard';
import DoctorList from '@/components/patient/DoctorList';
import DoctorChatList from '@/components/patient/DoctorChatList';
import SymptomChecker from '@/components/patient/SymptomChecker';
import AppointmentScheduler from '@/components/patient/AppointmentScheduler';
import MedicationRefillTracker from '@/components/patient/MedicationRefillTracker';
import SOSEmergency from '@/components/patient/SOSEmergency';
import MapView from '@/components/shared/MapView';
import ChatInterface from '@/components/shared/ChatInterface';
import ProfileSettings from '@/components/shared/ProfileSettings';
import ComplaintsList from '@/components/patient/ComplaintsList';
import ComplaintForm from '@/components/patient/ComplaintForm';
import { BottomNav, BottomNavItem } from '@/components/ui/navigation-menu';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';

interface PatientHomeProps {
  section?: string;
}

const PatientHome: React.FC<PatientHomeProps> = ({ section }) => {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  const currentSection = section || params.section || 'dashboard';

  const [sheetOpen, setSheetOpen] = useState(false);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
      toast({
        title: "Success",
        description: "Logged out successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const navItems = [
    { icon: <LayoutDashboard className="h-5 w-5" />, label: 'Overview', path: '/patient/dashboard' },
    { icon: <BrainCog className="h-5 w-5" />, label: 'AI Symptoms', path: '/patient/symptom-checker' },
    { icon: <UserSearch className="h-5 w-5" />, label: 'Doctors', path: '/patient/doctors' },
    { icon: <Calendar className="h-5 w-5" />, label: 'Appointments', path: '/patient/appointments' },
    { icon: <Pill className="h-5 w-5" />, label: 'Medication', path: '/patient/medication-refills' },
    { icon: <FileText className="h-5 w-5" />, label: 'Complaints', path: '/patient/complaints' },
    { icon: <AlertTriangle className="h-5 w-5" />, label: 'SOS Emergency', path: '/patient/sos-emergency' },
    { icon: <MapPin className="h-5 w-5" />, label: 'Healthcare', path: '/patient/map' },
    { icon: <MessageSquare className="h-5 w-5" />, label: 'Messages', path: '/patient/chat' },
    { icon: <Settings className="h-5 w-5" />, label: 'Settings', path: '/patient/settings' },
  ];

  const renderSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return <PatientDashboard />;
      case 'doctors':
        return <DoctorList />;
      case 'symptom-checker':
        return <SymptomChecker />;
      case 'appointments':
        return <AppointmentScheduler />;
      case 'medication-refills':
        return <MedicationRefillTracker />;
      case 'complaints':
        return <ComplaintsList />;
      case 'new-complaint':
        return <ComplaintForm onSuccess={() => navigate('/patient/complaints')} />;
      case 'sos-emergency':
        return <SOSEmergency />;
      case 'map':
        return <MapView />;
      case 'chat':
        return <DoctorChatList />;
      case 'chat-interface':
        return (
          <ChatInterface 
            initialMessages={[
              {
                id: 'msg-1',
                content: "Hello! I'm your healthcare assistant. How can I help you today?",
                sender: 'bot',
                timestamp: new Date()
              }
            ]}
            onSendMessage={(message) => console.log('Sending message:', message)}
            isAI={true}
          />
        );
      case 'settings':
        return <ProfileSettings />;
      default:
        return <PatientDashboard />;
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const getAvatarDisplay = () => {
    if (currentUser?.photo_url) {
      return <AvatarImage src={currentUser.photo_url} alt="Profile" />;
    }

    if (currentUser?.selected_avatar_id && currentUser?.avatar_options) {
      const avatar = currentUser.avatar_options;
      const style = avatar.gradient_value 
        ? { background: avatar.gradient_value }
        : { backgroundColor: avatar.color_value };
      
      return (
        <div 
          className="w-full h-full rounded-full flex items-center justify-center text-white font-medium text-sm"
          style={style}
        >
          {currentUser?.first_name ? getInitials(currentUser.first_name, currentUser.last_name) : 'U'}
        </div>
      );
    }

    return <AvatarFallback>{currentUser?.first_name ? getInitials(currentUser.first_name, currentUser.last_name) : 'U'}</AvatarFallback>;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between shadow-md md:hidden sticky top-0 z-40">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-primary-foreground">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-4 flex flex-col bg-white text-gray-900">
            <div className="flex items-center space-x-3 mb-6 p-2">
              <Avatar className="h-10 w-10 border-2 border-primary">
                {getAvatarDisplay()}
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold text-lg">{currentUser?.first_name} {currentUser?.last_name}</span>
                <span className="text-sm text-muted-foreground capitalize">{currentUser?.role || 'Patient'}</span>
              </div>
            </div>
            <nav className="flex flex-col flex-grow space-y-2">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={`justify-start gap-3 px-4 py-2 text-base ${location.pathname === item.path ? 'bg-muted font-semibold' : ''}`}
                  onClick={() => {
                    navigate(item.path);
                    setSheetOpen(false);
                  }}
                >
                  {item.icon}
                  {item.label}
                </Button>
              ))}
            </nav>
            <div className="mt-auto border-t pt-4">
              <Button
                variant="ghost"
                className="justify-start gap-3 px-4 py-2 text-base text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <h1 className="text-xl font-semibold">Patient Home</h1>
        <div></div> {/* Placeholder for right-side elements if any */}
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-4 overflow-x-hidden pb-24 md:px-8 md:ml-0">
        {renderSection()}
      </main>
      
      {/* Bottom Navigation Bar */}
      <BottomNav className="md:hidden">
        {navItems.map((item) => (
          <BottomNavItem 
            key={item.path} 
            onClick={() => navigate(item.path)}
            active={location.pathname === item.path}
          >
            {item.icon}
            <span>{item.label}</span>
          </BottomNavItem>
        ))}
      </BottomNav>
    </div>
  );
};

export default PatientHome;
