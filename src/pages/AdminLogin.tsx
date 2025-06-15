import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, User, AlertCircle } from 'lucide-react';
import { verifyAdminCredentials, setAdminSession } from '@/utils/adminAuth';
import { toast } from 'sonner';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (verifyAdminCredentials(email, password)) {
        const success = await setAdminSession();
        
        if (success) {
          toast.success('Admin login successful', {
            description: 'You have been authenticated with Supabase',
          });
        } else {
          toast.warning('Admin login successful (fallback mode)', {
            description: 'Authenticated using session storage',
          });
        }
        
        navigate('/admin/dashboard');
      } else {
        toast.error('Invalid credentials', {
          description: 'Please check your email and password.',
        });
      }
    } catch (error) {
      console.error('Admin login error:', error);
      toast.error('Login failed', {
        description: 'An error occurred during login. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-sm">
        <Card className="shadow-lg border">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-14 h-14 bg-primary-foreground rounded-full flex items-center justify-center mb-3">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold">Admin Access</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Sign in to access the MediConnect admin dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10 text-base"
                    placeholder="admin@mediconnect.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-10 text-base"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start space-x-3">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs">
                  <p className="font-medium text-yellow-800">Admin Access Only</p>
                  <p className="text-yellow-700 mt-0.5">
                    This area is restricted to authorized administrators only.
                  </p>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-10 bg-primary hover:bg-primary/90 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> Signing In...</span>
                ) : (
                  <>Sign In to Admin Panel <Lock className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
