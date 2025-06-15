import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogOut, Settings, Bell, MessageSquare, Calendar, Stethoscope, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DoctorDashboard from '@/components/doctor/DoctorDashboard';
import PatientList from '@/components/doctor/PatientList';
import AppointmentCalendar from '@/components/doctor/AppointmentCalendar';
import DoctorChatList from '@/components/doctor/DoctorChatList';
import HealthcareAlertsView from '@/components/doctor/HealthcareAlertsView';
import ProfileSettings from '@/components/shared/ProfileSettings';
import { useToast } from '@/components/ui/use-toast';

interface DoctorHomeProps {
  section?: string;
}

const DoctorHome: React.FC<DoctorHomeProps> = ({ section }) => {
  const params = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
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

  const menuItems = [
    { name: 'Dashboard', icon: <Stethoscope className="h-5 w-5" />, path: 'dashboard' },
    { name: 'Patients', icon: <Users className="h-5 w-5" />, path: 'patients' },
    { name: 'Appointments', icon: <Calendar className="h-5 w-5" />, path: 'appointments' },
    { name: 'Chat', icon: <MessageSquare className="h-5 w-5" />, path: 'chat' },
    { name: 'Alerts', icon: <Bell className="h-5 w-5" />, path: 'healthcare-alerts' },
    { name: 'Settings', icon: <Settings className="h-5 w-5" />, path: 'settings' },
  ];
  
  const renderSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return <DoctorDashboard />;
      case 'patients':
        return <PatientList />;
      case 'appointments':
        return <AppointmentCalendar />;
      case 'chat':
        return <DoctorChatList />;
      case 'healthcare-alerts':
        return <HealthcareAlertsView />;
      case 'settings':
        return <ProfileSettings />;
      default:
        return <DoctorDashboard />;
    }
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
                <AvatarImage src="/placeholder-user.jpg" alt="Doctor Avatar" />
                <AvatarFallback className="bg-primary text-primary-foreground">DR</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold text-lg">Dr. [Doctor Name]</span>
                <span className="text-sm text-muted-foreground">Doctor</span>
              </div>
            </div>
            <nav className="flex flex-col flex-grow space-y-2">
              {menuItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={`justify-start gap-3 px-4 py-2 text-base ${currentSection === item.path ? 'bg-muted font-semibold' : ''}`}
                  onClick={() => {
                    navigate(`/doctor/${item.path}`);
                    setSheetOpen(false);
                  }}
                >
                  {item.icon}
                  {item.name}
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
        <h1 className="text-xl font-semibold">Doctor Home</h1>
        <Button variant="ghost" size="icon" className="text-primary-foreground">
          <Bell className="h-6 w-6" />
          <span className="sr-only">Notifications</span>
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-4 overflow-x-hidden">
        {renderSection()}
      </main>
    </div>
  );
};

export default DoctorHome;
