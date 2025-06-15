
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { Settings, Lock, Shield, Bell } from 'lucide-react';

const AdminSettings = () => {
  // This is a placeholder component
  // In a real application, these settings would be functional
  
  const handleSaveSettings = () => {
    toast.success('Settings saved', {
      description: 'Your admin settings have been updated.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Admin Settings</h2>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <CardTitle>General Settings</CardTitle>
            </div>
            <CardDescription>
              Configure general admin panel settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-name">Admin Display Name</Label>
              <Input id="admin-name" defaultValue="MediConnect Admin" />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email notifications for new verification requests
                </p>
              </div>
              <Switch id="email-notifications" defaultChecked />
            </div>
            
            <Separator />
            
            <Button onClick={handleSaveSettings}>Save Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Notification Settings</CardTitle>
            </div>
            <CardDescription>
              Configure notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="new-applications">New Applications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when a new doctor applies for verification
                </p>
              </div>
              <Switch id="new-applications" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="doctors-reports">Doctor Reports</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when a doctor is reported by patients
                </p>
              </div>
              <Switch id="doctors-reports" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="system-alerts">System Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about system events and potential issues
                </p>
              </div>
              <Switch id="system-alerts" defaultChecked />
            </div>
            
            <Separator />
            
            <Button onClick={handleSaveSettings}>Save Settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Security Settings</CardTitle>
            </div>
            <CardDescription>
              Configure security settings for admin access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-password">Change Admin Password</Label>
              <Input id="admin-password" type="password" placeholder="Enter new password" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="admin-password-confirm">Confirm New Password</Label>
              <Input id="admin-password-confirm" type="password" placeholder="Confirm new password" />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Enable two-factor authentication for added security
                </p>
              </div>
              <Switch id="two-factor" />
            </div>
            
            <Separator />
            
            <Button onClick={handleSaveSettings}>Update Security Settings</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
