import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { UserRole } from '@/lib/types';
import { UserIcon, StethoscopeIcon, ShieldIcon, LockIcon, MailIcon, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LoginFormProps {
  onForgotPassword: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Clear admin session when on login page
  useEffect(() => {
    if (location.pathname === '/login') {
      sessionStorage.removeItem('adminAuthenticated');
    }
  }, [location.pathname]);

  // Navigate to dashboard when user is authenticated and not loading
  useEffect(() => {
    console.log('🔄 LoginForm: Checking auth state:', { user: !!user, authLoading, role: user?.role });
    
    if (user && !authLoading && !isLoading) {
      console.log('✅ User authenticated, navigating to dashboard...');
      
      // Navigate based on user role
      const dashboardPath = user.role === 'patient' 
        ? '/patient/dashboard' 
        : user.role === 'doctor' 
        ? '/doctor/dashboard'
        : user.role === 'admin'
        ? '/admin/dashboard/home'
        : '/';
        
      console.log('🚀 Navigating to:', dashboardPath);
      navigate(dashboardPath, { replace: true });
    }
  }, [user, authLoading, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    console.log('🚀 Login attempt started:', { email, role });
    
    try {
      const { user: loggedInUser } = await login(email, password, role);
      
      console.log('✅ Login successful:', loggedInUser);
      
      toast.success('Login successful!', {
        description: `Welcome back to MediConnect${role === 'doctor' ? ', Doctor' : ''}!`,
      });
      
      // Don't navigate here - let the useEffect handle it
      
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      // Handle specific doctor verification messages
      if (error.message.includes('pending approval')) {
        setError('Your account is pending approval by the MediConnect admin. Please wait for verification.');
        toast.error('Account pending verification', {
          description: 'Your account is pending approval by the MediConnect admin.',
        });
      } else if (error.message.includes('has been declined')) {
        setError(error.message);
        toast.error('Access denied', {
          description: error.message,
        });
      } else if (error.message.includes('Doctor profile not found')) {
        setError('Your doctor profile is missing. Please contact support.');
        toast.error('Account error', {
          description: 'Your doctor profile is missing. Please contact support.',
        });
      } else {
        setError(error.message || 'Login failed. Please check your credentials and try again.');
        toast.error('Login failed', {
          description: error.message || 'Please check your credentials and try again.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    console.log('🔐 Admin login attempt with:', { email, password: password ? '[HIDDEN]' : 'empty' });
    
    try {
      const { user: adminUser } = await login(email, password, 'admin');
      
      console.log('✅ Admin login successful:', adminUser);
      
      toast.success('Admin login successful!', {
        description: 'Welcome to the Admin Dashboard',
      });
      
      // Don't navigate here - let the useEffect handle it
      
    } catch (error: any) {
      console.error('❌ Admin login error:', error);
      setError(error.message || 'Invalid administrator credentials');
      toast.error('Admin login failed', {
        description: error.message || 'Invalid administrator credentials',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-4 sm:p-6 md:p-8">
      <div className="text-center mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-display font-semibold tracking-tight mb-2">Welcome to MediConnect</h1>
        <p className="text-sm text-muted-foreground">Connect with healthcare professionals seamlessly</p>
      </div>
      
      <Tabs defaultValue="patient" className="w-full" onValueChange={(value) => setRole(value as UserRole)}>
        <TabsList className="grid w-full grid-cols-3 h-auto p-1 mb-6">
          <TabsTrigger value="patient" className="flex-col h-auto py-2 gap-1 data-[state=active]:bg-background">
            <UserIcon className="h-5 w-5" />
            <span className="text-xs">Patient</span>
          </TabsTrigger>
          <TabsTrigger value="doctor" className="flex-col h-auto py-2 gap-1 data-[state=active]:bg-background">
            <StethoscopeIcon className="h-5 w-5" />
            <span className="text-xs text-center">Healthcare <br/> Professional</span>
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex-col h-auto py-2 gap-1 data-[state=active]:bg-background">
            <ShieldIcon className="h-5 w-5" />
            <span className="text-xs">Admin</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="patient">
          <form onSubmit={handleSubmit} className="form-container animate-slide-up">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 text-base"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 text-base"
                  />
                </div>
              </div>
              
              <Button
                variant="link"
                onClick={onForgotPassword}
                className="text-sm text-primary hover:underline p-0 h-auto block text-right"
              >
                Forgot Password?
              </Button>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> Logging In...</span>
                ) : (
                  <>Login <LockIcon className="ml-2 h-4 w-4" /></>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full mt-4"
                onClick={() => navigate('/register')}
              >
                Create Account
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="doctor">
          <form onSubmit={handleSubmit} className="form-container animate-slide-up">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="doctor-email">Email</Label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="doctor-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 text-base"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="doctor-password">Password</Label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="doctor-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 text-base"
                  />
                </div>
              </div>
              
              <Button
                variant="link"
                onClick={onForgotPassword}
                className="text-sm text-primary hover:underline p-0 h-auto block text-right"
              >
                Forgot Password?
              </Button>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> Logging In...</span>
                ) : (
                  <>Login <LockIcon className="ml-2 h-4 w-4" /></>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full mt-4"
                onClick={() => navigate('/register')}
              >
                Create Account
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="admin">
          <form onSubmit={handleAdminSubmit} className="form-container animate-slide-up">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="Enter admin email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 text-base"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 text-base"
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> Logging In...</span>
                ) : (
                  <>Login <ShieldIcon className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LoginForm;
