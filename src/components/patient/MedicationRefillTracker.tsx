import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import NotificationService from '@/services/NotificationService';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format, addDays, isAfter, parseISO } from 'date-fns';
import { CalendarIcon, Clock, Bell, Pill, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MedicationRefill {
  id: string;
  medication_type: string;
  last_refill_date: string;
  next_refill_date: string;
  notifications_enabled: boolean;
}

const MedicationRefillTracker = () => {
  const { currentUser } = useAuth();
  const [refillData, setRefillData] = useState<MedicationRefill | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchRefillData = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('medication_refills')
        .select('*')
        .eq('patient_id', currentUser.id)
        .eq('medication_type', 'ARV')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setRefillData(data);
        setSelectedDate(parseISO(data.last_refill_date));
        setNotificationsEnabled(data.notifications_enabled);
      }
    } catch (error) {
      console.error('Error fetching refill data:', error);
      toast.error('Failed to load medication data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRefillData();
    
    // Check notifications when component mounts
    if (currentUser) {
      NotificationService.checkMedicationRefills(currentUser.id);
    }
  }, [currentUser]);

  const saveRefillData = async () => {
    if (!currentUser) return;

    setIsSaving(true);
    const nextRefillDate = addDays(selectedDate, 30);

    try {
      if (refillData) {
        // Update existing record
        const { error } = await supabase
          .from('medication_refills')
          .update({
            last_refill_date: selectedDate.toISOString(),
            next_refill_date: nextRefillDate.toISOString(),
            notifications_enabled: notificationsEnabled,
            updated_at: new Date().toISOString(),
          })
          .eq('id', refillData.id);

        if (error) throw error;
        
        setRefillData({
          ...refillData,
          last_refill_date: selectedDate.toISOString(),
          next_refill_date: nextRefillDate.toISOString(),
          notifications_enabled: notificationsEnabled,
        });

        toast.success('Medication refill date updated');
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('medication_refills')
          .insert({
            patient_id: currentUser.id,
            medication_type: 'ARV',
            last_refill_date: selectedDate.toISOString(),
            next_refill_date: nextRefillDate.toISOString(),
            notifications_enabled: notificationsEnabled,
          })
          .select()
          .single();

        if (error) throw error;
        
        setRefillData(data);
        toast.success('Medication refill tracker created');
      }

      // Create notification if refill date is today or has passed
      if (notificationsEnabled) {
        const today = new Date();
        if (isAfter(today, nextRefillDate) || 
            format(nextRefillDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
          
          await NotificationService.createNotification({
            user_id: currentUser.id,
            title: 'Medication Refill Due',
            message: "It's time to refill your ARV prescription. Please visit your clinic or pharmacy.",
            type: 'medication_refill',
            related_id: refillData?.id,
            action_url: '/patient/medication-refills'
          });
          
          toast.info("It's time to refill your ARV prescription. Please visit your clinic or pharmacy.", {
            duration: 10000
          });
        }
      }
    } catch (error) {
      console.error('Error saving refill data:', error);
      toast.error('Failed to save medication data');
    } finally {
      setIsSaving(false);
    }
  };

  const getRefillStatus = () => {
    if (!refillData) return null;
    
    const today = new Date();
    const nextRefill = parseISO(refillData.next_refill_date);
    
    if (isAfter(today, nextRefill)) {
      return {
        label: "Refill due",
        color: "destructive",
        icon: <AlertTriangle className="h-4 w-4" />
      };
    } else {
      return {
        label: "Up to date",
        color: "success",
        icon: <CheckCircle className="h-4 w-4" />
      };
    }
  };

  const status = getRefillStatus();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading medication data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Pill className="h-5 w-5 text-primary mr-2" />
          <h2 className="text-xl font-semibold">ARV Medication Refill Tracker</h2>
        </div>
      </div>

      <Card className="mediconnect-card">
        <CardHeader>
          <CardTitle>Antiretroviral (ARV) Medication</CardTitle>
          <CardDescription>
            Track your ARV medication refills and get reminders when it's time to refill your prescription.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status indicator */}
          {status && (
            <div className="flex items-center space-x-2">
              <Label>Current Status:</Label>
              <Badge variant={status.color as any} className="flex items-center gap-1 px-3 py-1">
                {status.icon}
                <span>{status.label}</span>
              </Badge>
            </div>
          )}

          {/* Refill date selector */}
          <div className="space-y-2">
            <Label htmlFor="refill-date">When did you last receive your ARVs?</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  id="refill-date"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : 'Select a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Next refill date display */}
          <div className="space-y-2">
            <Label>Next refill due on:</Label>
            <div className="flex items-center rounded-md border p-3">
              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>
                {selectedDate
                  ? format(addDays(selectedDate, 30), 'MMMM d, yyyy')
                  : 'Select a last refill date first'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your next medication refill will be due exactly 30 days after your last refill.
            </p>
          </div>

          {/* Notification toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
            <Label htmlFor="notifications" className="flex items-center cursor-pointer">
              <Bell className="mr-2 h-4 w-4 text-muted-foreground" />
              Receive refill reminders
            </Label>
          </div>
          <p className="text-sm text-muted-foreground">
            {notificationsEnabled 
              ? "You'll receive a reminder when it's time to refill your prescription."
              : "You won't receive reminders for your medication refills."}
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={saveRefillData} 
            className="w-full" 
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {refillData ? "Update Refill Information" : "Save Refill Information"}
          </Button>
        </CardFooter>
      </Card>

      {/* Information Card */}
      <Card className="bg-blue-50 border-blue-100">
        <CardContent className="p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Why this matters</h3>
          <p className="text-blue-700 text-sm">
            Regular ARV medication is crucial for managing HIV effectively. 
            Keeping track of your refill dates helps ensure you never run out of medication.
            Always follow your healthcare provider's instructions regarding your ARVs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicationRefillTracker; 