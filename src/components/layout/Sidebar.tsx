import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  MapPin,
  BrainCog,
  Settings,
  UserSearch,
  X,
  LogOut,
  FileText,
  AlertTriangle,
  Pill,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  SidebarProvider,
  Sidebar as ShadcnSidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel
} from '@/components/ui/sidebar';

interface SidebarProps {
  onClose?: () => void;
}

const AppSidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isPatient = currentUser?.role === 'patient';
  const basePath = isPatient ? '/patient' : '/doctor';
  
  const patientLinks = [
    { icon: LayoutDashboard, label: 'Overview', path: `${basePath}/dashboard` },
    { icon: BrainCog, label: 'AI Symptom Check', path: `${basePath}/symptom-checker` },
    { icon: UserSearch, label: 'Find Doctors', path: `${basePath}/doctors` },
    { icon: Calendar, label: 'Appointments', path: `${basePath}/appointments` },
    { icon: Pill, label: 'Medication', path: `${basePath}/medication-refills` },
    { icon: MapPin, label: 'Find Healthcare', path: `${basePath}/map` },
    { icon: MessageSquare, label: 'Messages', path: `${basePath}/chat` },
    { icon: FileText, label: 'Complaints', path: `${basePath}/complaints` },
    { icon: AlertTriangle, label: 'SOS Emergency', path: `${basePath}/sos-emergency` },
    { icon: Settings, label: 'Settings', path: `${basePath}/settings` },
  ];
  
  const doctorLinks = [
    { icon: LayoutDashboard, label: 'Dashboard', path: `${basePath}/dashboard` },
    { icon: MessageSquare, label: 'Messages', path: `${basePath}/chat` },
    { icon: Calendar, label: 'Appointments', path: `${basePath}/appointments` },
    { icon: Settings, label: 'Settings', path: `${basePath}/settings` },
  ];
  
  const links = isPatient ? patientLinks : doctorLinks;
  
  if (!currentUser) return null;
  
  const handleNavigation = (path: string) => {
    navigate(path);
    if (onClose) onClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      if (onClose) onClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  return (
    <ShadcnSidebar className="h-full bg-background border-r">
      <SidebarHeader className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg">
            {isPatient ? 'M' : (currentUser.first_name?.charAt(0) || 'D') + (currentUser.last_name?.charAt(0) || 'R')}
          </div>
          <span className="text-primary text-lg font-bold">
            {isPatient ? 'MediConnect' : currentUser.name || `Dr. ${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim()}
          </span>
        </div>
        {onClose && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="md:hidden"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        )}
      </SidebarHeader>
      
      <SidebarContent className="py-4">
        <SidebarMenu>
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <SidebarMenuItem key={link.path}>
                <SidebarMenuButton 
                  isActive={isActive}
                  onClick={() => handleNavigation(link.path)}
                >
                  <link.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span>{link.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
        
      <SidebarFooter className="border-t p-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
      </SidebarFooter>
      
      {currentUser && (
        <div className="p-4 border-t border-gray-200 flex items-center">
          <div 
            className="flex items-center w-full cursor-pointer"
            onClick={() => handleNavigation(`${basePath}/settings`)}
          >
            <div className="flex-shrink-0 mr-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-800 truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
            </div>
          </div>
        </div>
      )}
    </ShadcnSidebar>
  );
};

export default AppSidebar;
