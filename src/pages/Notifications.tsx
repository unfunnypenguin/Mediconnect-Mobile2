import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import HealthcareAlertsInbox from '@/components/shared/HealthcareAlertsInbox';
import { Bell, AlertTriangle, Calendar, MessageSquare, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Notifications = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Back button clicked'); // Debug log
    
    // Navigate to appropriate dashboard based on user role
    if (user?.role === 'doctor') {
      navigate('/doctor/dashboard');
    } else if (user?.role === 'patient') {
      navigate('/patient/dashboard');
    } else {
      // Fallback to browser history
      navigate(-1);
    }
  };

  return (
    <div className="container mx-auto py-4 px-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleBack}
          className="mr-2"
          type="button"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back</span>
        </Button>
        <Bell className="h-5 w-5 text-primary" />
        <div>
          <h1 className="text-xl font-bold">Notifications & Alerts</h1>
          <p className="text-sm text-muted-foreground">Stay updated with important healthcare information</p>
        </div>
      </div>

      <Tabs defaultValue="alerts" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1">
          <TabsTrigger value="alerts" className="flex flex-col h-auto py-2 gap-1 data-[state=active]:bg-background">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-xs text-center">Healthcare <br/> Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex flex-col h-auto py-2 gap-1 data-[state=active]:bg-background">
            <Calendar className="h-5 w-5" />
            <span className="text-xs">Appointments</span>
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex flex-col h-auto py-2 gap-1 data-[state=active]:bg-background">
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs">Messages</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex flex-col h-auto py-2 gap-1 data-[state=active]:bg-background">
            <Bell className="h-5 w-5" />
            <span className="text-xs">System</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-3">
          <HealthcareAlertsInbox />
        </TabsContent>

        <TabsContent value="appointments" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Appointment Notifications
              </CardTitle>
              <CardDescription className="text-sm">
                Reminders and updates about your scheduled appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">No appointment notifications at this time.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5" />
                Message Notifications
              </CardTitle>
              <CardDescription className="text-sm">
                New messages from your healthcare providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">No message notifications at this time.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5" />
                System Notifications
              </CardTitle>
              <CardDescription className="text-sm">
                Important system updates and announcements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">No system notifications at this time.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Notifications;
