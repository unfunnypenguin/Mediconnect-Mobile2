
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  CalendarIcon, 
  ClockIcon, 
  FileTextIcon, 
  MessageSquareIcon,
  UserIcon,
  PhoneIcon,
  PencilIcon,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AppointmentDetailsProps = {
  appointment: {
    id: string;
    patientId: string;
    patientName: string;
    dateTime: Date;
    duration: number;
    type: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    notes?: string;
    patientAvatar?: string;
    patientContact?: string;
    patientEmail?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate?: (appointmentId: string, newStatus: string) => void;
}

const AppointmentDetails = ({ appointment, isOpen, onClose, onStatusUpdate }: AppointmentDetailsProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  if (!appointment) return null;

  const handleUpdateStatus = async (newStatus: string) => {
    if (!appointment) return;
    
    setIsLoading(true);
    try {
      // In a real app with Supabase, this would update the appointment status in the backend
      // const { error } = await supabase
      //   .from('appointments')
      //   .update({ status: newStatus })
      //   .eq('id', appointment.id);
      
      // if (error) throw error;
      
      // For now, we'll just simulate the update
      setTimeout(() => {
        toast.success(`Appointment status updated to ${newStatus}`);
        setIsLoading(false);
        
        // Notify parent component about the status change
        if (onStatusUpdate) {
          onStatusUpdate(appointment.id, newStatus);
        }
        
        onClose();
      }, 600);
    } catch (error) {
      toast.error('Failed to update appointment status');
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    navigate(`/doctor/chat/${appointment.patientId}`);
  };

  const handleViewPatientRecords = () => {
    navigate(`/doctor/patient/${appointment.patientId}/records`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500 hover:bg-green-600';
      case 'pending':
        return 'bg-amber-500 hover:bg-amber-600';
      case 'cancelled':
        return 'bg-red-500 hover:bg-red-600';
      case 'completed':
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formattedStartTime = format(appointment.dateTime, 'h:mm a');
  const endTime = new Date(appointment.dateTime.getTime() + appointment.duration * 60000);
  const formattedEndTime = format(endTime, 'h:mm a');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Appointment Details</DialogTitle>
            <Badge className={`text-white ${getStatusColor(appointment.status)}`}>
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </Badge>
          </div>
          <DialogDescription>
            View and manage appointment information
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-4 p-2">
          <Avatar className="h-16 w-16 border">
            <AvatarImage src={appointment.patientAvatar} alt={appointment.patientName} />
            <AvatarFallback>{getInitials(appointment.patientName)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium text-lg">{appointment.patientName}</h3>
            <p className="text-muted-foreground text-sm">Patient</p>
          </div>
        </div>

        <Separator />

        <Tabs defaultValue="details">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="flex items-center w-1/3">
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    Date
                  </TableCell>
                  <TableCell className="font-medium">
                    {format(appointment.dateTime, 'PPPP')}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="flex items-center">
                    <ClockIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    Time
                  </TableCell>
                  <TableCell className="font-medium">
                    {formattedStartTime} - {formattedEndTime} ({appointment.duration} min)
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="flex items-center">
                    <FileTextIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    Type
                  </TableCell>
                  <TableCell className="font-medium">
                    {appointment.type}
                  </TableCell>
                </TableRow>
                {appointment.notes && (
                  <TableRow>
                    <TableCell className="flex items-center">
                      <FileTextIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      Notes
                    </TableCell>
                    <TableCell className="font-medium">
                      {appointment.notes}
                    </TableCell>
                  </TableRow>
                )}
                {appointment.patientContact && (
                  <TableRow>
                    <TableCell className="flex items-center">
                      <PhoneIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      Contact
                    </TableCell>
                    <TableCell className="font-medium">
                      {appointment.patientContact}
                    </TableCell>
                  </TableRow>
                )}
                {appointment.patientEmail && (
                  <TableRow>
                    <TableCell className="flex items-center">
                      <MessageSquareIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      Email
                    </TableCell>
                    <TableCell className="font-medium">
                      {appointment.patientEmail}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
          
          <TabsContent value="actions">
            <div className="space-y-4 py-2">
              {appointment.status === 'pending' && (
                <Button 
                  onClick={() => handleUpdateStatus('confirmed')}
                  className="bg-green-500 hover:bg-green-600 text-white w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>Confirm Appointment</>
                  )}
                </Button>
              )}
              {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                <Button 
                  onClick={() => handleUpdateStatus('cancelled')}
                  variant="destructive"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>Cancel Appointment</>
                  )}
                </Button>
              )}
              {appointment.status === 'confirmed' && (
                <Button 
                  onClick={() => handleUpdateStatus('completed')}
                  className="bg-blue-500 hover:bg-blue-600 text-white w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>Mark as Completed</>
                  )}
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={handleSendMessage}
                className="w-full"
              >
                <MessageSquareIcon className="mr-2 h-4 w-4" />
                Message Patient
              </Button>
              <Button 
                variant="outline"
                onClick={handleViewPatientRecords}
                className="w-full"
              >
                <UserIcon className="mr-2 h-4 w-4" />
                View Patient Records
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentDetails;
