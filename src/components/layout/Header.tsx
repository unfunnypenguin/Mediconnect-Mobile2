import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, X, LogOut, User } from 'lucide-react';
import NotificationCenter from '@/components/shared/NotificationCenter';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Sidebar from './Sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  toggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const handleLogout = async () => {
    try {
      await logout();
      // The AuthContext logout function handles redirection
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  // Add this helper function near the top of the component
  const getAvatarDisplay = (user: any) => {
    const getInitials = (name: string) => {
      if (!name) return 'U';
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };

    // If user has a custom photo, use it
    if (user.photo_url) {
      return <AvatarImage src={user.photo_url} alt="Profile" />;
    }

    // If user has selected a color avatar, use the avatar data from AuthContext
    if (user.selected_avatar_id && user.avatar_options) {
      const avatar = user.avatar_options;
      const style = avatar.gradient_value 
        ? { background: avatar.gradient_value }
        : { backgroundColor: avatar.color_value };
      
      return (
        <div 
          className="w-full h-full rounded-full flex items-center justify-center text-white font-medium text-sm"
          style={style}
        >
          {user.name ? getInitials(user.name) : <User className="h-4 w-4" />}
        </div>
      );
    }

    // Default fallback
    return (
      <AvatarFallback>
        <User className="h-4 w-4" />
      </AvatarFallback>
    );
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center">
            {/* Mobile sidebar trigger using Sheet component */}
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="mr-2 md:hidden" 
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open sidebar</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <Sidebar onClose={() => setIsSidebarOpen(false)} />
              </SheetContent>
            </Sheet>
            
            {/* Desktop sidebar trigger */}
            {toggleSidebar && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="mr-2 hidden md:flex" 
                onClick={toggleSidebar}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => navigate('/')}
            >
              <div className="h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center mr-2 font-bold text-base">
                M
              </div>
              <span className="text-primary text-lg font-bold">MediConnect</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Notification Center */}
            <NotificationCenter />
            
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-2 cursor-pointer">
                    <Avatar className="h-8 w-8">
                      {getAvatarDisplay(currentUser)}
                    </Avatar>
                    <span className="text-sm font-medium hidden sm:block">
                      {currentUser.name.split(' ')[0]}
                    </span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(`/${currentUser.role}/profile`)}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/${currentUser.role}/settings`)}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={() => navigate('/login')}
                variant="default"
                size="sm"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
