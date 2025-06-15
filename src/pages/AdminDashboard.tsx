import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel
} from '@/components/ui/sidebar';
import {
  Users, UserCheck, UserX, Settings, LogOut, Clock, User, ListCheck, LayoutDashboard, AlertTriangle, MenuIcon
} from 'lucide-react';
import PendingVerifications, { PendingVerificationsRef } from '@/components/admin/PendingVerifications';
import ApprovedDoctors, { ApprovedDoctorsRef } from '@/components/admin/ApprovedDoctors';
import RejectedApplications, { RejectedApplicationsRef } from '@/components/admin/RejectedApplications';
import ComplaintsManagement from '@/components/admin/ComplaintsManagement';
import AdminSettings from '@/components/admin/AdminSettings';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import AdminDashboardHome from '@/components/admin/AdminDashboardHome';
import { useAuth } from '@/context/AuthContext';
import { isAdminAuthenticated } from '@/utils/adminAuth';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

type AdminSection = 'home' | 'pending' | 'approved' | 'rejected' | 'complaints' | 'settings';

const AdminDashboard = () => {
  const { user, loading, logout } = useAuth();
  const { section } = useParams<{ section?: string }>();
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // Refs to trigger refreshes in child components
  const pendingRef = useRef<PendingVerificationsRef | null>(null);
  const approvedRef = useRef<ApprovedDoctorsRef | null>(null);
  const rejectedRef = useRef<RejectedApplicationsRef | null>(null);
  
  // Show loading state while checking authentication
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  // Redirect if not authenticated as admin
  if (!user || (user.role !== 'admin' && !isAdminAuthenticated())) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully', {
        description: 'You have been logged out of the admin panel.',
      });
      navigate('/login');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  // Enhanced function to refresh all sections after status changes
  const refreshAllSections = async () => {
    console.log("🔄 Refreshing all admin sections...");
    
    try {
      // Refresh all sections in sequence to ensure proper data loading
      if (approvedRef.current) {
        console.log("🔄 Refreshing approved doctors...");
        await approvedRef.current.refresh();
      }
      
      if (rejectedRef.current) {
        console.log("🔄 Refreshing rejected applications...");
        await rejectedRef.current.refresh();
      }
      
      // Refresh pending last since it's the current view
      if (pendingRef.current) {
        console.log("🔄 Refreshing pending verifications...");
        await pendingRef.current.refresh();
      }
    } catch (error) {
      console.error("Error refreshing sections:", error);
      toast.error("Failed to refresh some sections", {
        description: "Please try refreshing the page manually if needed."
      });
    }
  };

  let activeSection: AdminSection = 'pending';
  if (section === undefined) {
    activeSection = 'home';
  } else if (['home', 'pending', 'approved', 'rejected', 'complaints', 'settings'].includes(section)) {
    activeSection = section as AdminSection;
  } else {
    // If invalid section provided in URL, default to home
    navigate('/admin/dashboard/home', { replace: true });
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Desktop Sidebar */}
        <Sidebar className="hidden md:flex">
          <SidebarHeader className="border-b px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg">MediConnect Admin</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeSection === 'home'}
                    onClick={() => navigate('/admin/dashboard/home')}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Overview</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeSection === 'pending'}
                    onClick={() => navigate('/admin/dashboard/pending')}
                  >
                    <ListCheck className="h-4 w-4" />
                    <span>Pending Verifications</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeSection === 'approved'}
                    onClick={() => navigate('/admin/dashboard/approved')}
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>Approved Doctors</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeSection === 'rejected'}
                    onClick={() => navigate('/admin/dashboard/rejected')}
                  >
                    <UserX className="h-4 w-4" />
                    <span>Rejected Applications</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeSection === 'complaints'}
                    onClick={() => navigate('/admin/dashboard/complaints')}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span>Complaints</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeSection === 'settings'}
                    onClick={() => navigate('/admin/dashboard/settings')}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t p-4">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* Mobile Header and Sheet Sidebar */}
        <div className="flex-1 flex flex-col">
          <header className="border-b bg-background/70 backdrop-blur-lg sticky top-0 z-10 p-4 md:px-6 md:py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 md:hidden">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MenuIcon className="h-6 w-6" />
                    <span className="sr-only">Toggle sidebar</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[250px] p-0">
                  <SidebarHeader className="border-b px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">MediConnect Admin</span>
                    </div>
                  </SidebarHeader>
                  <SidebarContent className="pb-4">
                    <SidebarGroup>
                      <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton 
                            isActive={activeSection === 'home'}
                            onClick={() => {navigate('/admin/dashboard/home'); setIsSheetOpen(false);}}
                          >
                            <LayoutDashboard className="h-4 w-4" />
                            <span>Overview</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton 
                            isActive={activeSection === 'pending'}
                            onClick={() => {navigate('/admin/dashboard/pending'); setIsSheetOpen(false);}}
                          >
                            <ListCheck className="h-4 w-4" />
                            <span>Pending Verifications</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton 
                            isActive={activeSection === 'approved'}
                            onClick={() => {navigate('/admin/dashboard/approved'); setIsSheetOpen(false);}}
                          >
                            <UserCheck className="h-4 w-4" />
                            <span>Approved Doctors</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton 
                            isActive={activeSection === 'rejected'}
                            onClick={() => {navigate('/admin/dashboard/rejected'); setIsSheetOpen(false);}}
                          >
                            <UserX className="h-4 w-4" />
                            <span>Rejected Applications</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton 
                            isActive={activeSection === 'complaints'}
                            onClick={() => {navigate('/admin/dashboard/complaints'); setIsSheetOpen(false);}}
                          >
                            <AlertTriangle className="h-4 w-4" />
                            <span>Complaints</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton 
                            isActive={activeSection === 'settings'}
                            onClick={() => {navigate('/admin/dashboard/settings'); setIsSheetOpen(false);}}
                          >
                            <Settings className="h-4 w-4" />
                            <span>Settings</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroup>
                  </SidebarContent>
                  <SidebarFooter className="border-t p-4">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => {handleLogout(); setIsSheetOpen(false);}}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </SidebarFooter>
                </SheetContent>
              </Sheet>
              <h1 className="text-lg font-semibold md:hidden">
                {activeSection === 'home' && 'Dashboard'}
                {activeSection === 'pending' && 'Pending'}
                {activeSection === 'approved' && 'Approved'}
                {activeSection === 'rejected' && 'Rejected'}
                {activeSection === 'complaints' && 'Complaints'}
                {activeSection === 'settings' && 'Settings'}
              </h1>
            </div>

            {/* Desktop and Mobile Header Title */}
            <h1 className="text-xl font-semibold hidden md:block">
                {activeSection === 'home' && 'Dashboard Overview'}
                {activeSection === 'pending' && 'Pending Verifications'}
                {activeSection === 'approved' && 'Approved Doctors'}
                {activeSection === 'rejected' && 'Rejected Applications'}
                {activeSection === 'complaints' && 'Complaints Management'}
                {activeSection === 'settings' && 'Admin Settings'}
            </h1>
            
            <div className="flex items-center gap-2 md:gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user.name || 'Administrator'}
              </span>
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4 md:p-6">
            {activeSection === 'home' && <AdminDashboardHome />}
            {activeSection === 'pending' && (
              <PendingVerifications 
                ref={pendingRef} 
                onStatusChange={refreshAllSections} 
              />
            )}
            {activeSection === 'approved' && (
              <ApprovedDoctors ref={approvedRef} />
            )}
            {activeSection === 'rejected' && (
              <RejectedApplications ref={rejectedRef} />
            )}
            {activeSection === 'complaints' && <ComplaintsManagement />}
            {activeSection === 'settings' && <AdminSettings />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
