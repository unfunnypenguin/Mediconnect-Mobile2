import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, ClockIcon, EditIcon, X } from 'lucide-react';
import { Appointment } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AppointmentActionsProps {
  appointment: Appointment;
  onUpdate: () => void;
}

const AppointmentActions: React.FC<AppointmentActionsProps> = ({ appointment, onUpdate }) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date(appointment.appointmentDate));
  const [selectedTime, setSelectedTime] = useState<string>(appointment.startTime);
  const [reason, setReason] = useState<string>(appointment.reason);
  const [notes, setNotes] = useState<string>(appointment.notes || '');
  const [loading, setLoading] = useState(false);

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00'
  ];

  const calculateEndTime = (startTime: string) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(hours, minutes + 30, 0, 0);
    return endDate.toTimeString().slice(0, 5);
  };

  const handleCancelAppointment = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointment.id);

      if (error) throw error;

      toast.success('Appointment cancelled successfully');
      onUpdate();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAppointment = async () => {
    if (!selectedDate || !selectedTime || !reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        appointment_date: selectedDate.toISOString().split('T')[0],
        start_time: selectedTime,
        end_time: calculateEndTime(selectedTime),
        reason: reason,
        notes: notes || null,
        status: 'pending' // Reset to pending when edited
      };

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointment.id);

      if (error) throw error;

      toast.success('Appointment updated successfully');
      setIsEditDialogOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-medium">{appointment.doctorName}</h4>
          <p className="text-sm text-muted-foreground">{appointment.doctorSpecialty}</p>
          <p className="text-sm text-muted-foreground">{appointment.institutionName}</p>
        </div>
        <Badge className={getStatusColor(appointment.status)}>
          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
        </Badge>
      </div>
      
      <div className="flex items-center text-sm text-muted-foreground mb-1">
        <CalendarIcon className="h-4 w-4 mr-1" />
        {new Date(appointment.appointmentDate).toLocaleDateString()}
      </div>
      
      <div className="flex items-center text-sm text-muted-foreground mb-2">
        <ClockIcon className="h-4 w-4 mr-1" />
        {appointment.startTime} - {appointment.endTime}
      </div>
      
      <div className="text-sm mb-2">
        <strong>Reason:</strong> {appointment.reason}
      </div>
      
      {appointment.notes && (
        <div className="text-sm mb-3">
          <strong>Notes:</strong> {appointment.notes}
        </div>
      )}

      {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
        <div className="flex gap-2 mt-3">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <EditIcon className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Appointment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Calendar 
                    mode="single" 
                    selected={selectedDate} 
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Time</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-reason">Reason for Visit *</Label>
                  <Input
                    id="edit-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Regular check-up, Follow-up"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Additional Notes</Label>
                  <Textarea
                    id="edit-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional information..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleUpdateAppointment}
                    disabled={loading || !selectedTime || !reason}
                    className="flex-1"
                  >
                    {loading ? 'Updating...' : 'Update Appointment'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="default" 
            size="sm" 
            onClick={handleCancelAppointment}
            disabled={loading}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-1" />
            {loading ? 'Cancelling...' : 'Cancel'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AppointmentActions;
