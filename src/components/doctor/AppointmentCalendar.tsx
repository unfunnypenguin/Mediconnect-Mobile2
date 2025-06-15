import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, ClockIcon, UserIcon, PhoneIcon, MailIcon, PlusIcon, CheckIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  dateTime: Date;
  duration: number;
  type: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  rejectionReason?: string;
  contactInfo: {
    phone: string;
    email: string;
  };
}

interface AppointmentEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: any;
}

const localizer = momentLocalizer(moment);

const AppointmentCalendar = () => {
  const [selectedEvent, setSelectedEvent] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  // Get current user (doctor)
  const [currentUser, setCurrentUser] = useState<any>(null);
  useEffect(() => {
    async function getCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    }
    getCurrentUser();
  }, []);

  // Fetch appointments from Supabase
  const { data: appointments = [], isLoading, error } = useQuery({
    queryKey: ['doctor-appointments', currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];

      console.log('Fetching appointments for doctor:', currentUser.id);

      // First get the appointments
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', currentUser.id)
        .order('appointment_date', { ascending: true });
      
      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
        return [];
      }

      console.log('Raw appointments data:', appointmentsData);

      if (!appointmentsData || appointmentsData.length === 0) {
        console.log('No appointments found for doctor');
        return [];
      }

      // Get patient information separately
      const patientIds = [...new Set(appointmentsData.map(appt => appt.patient_id))];
      console.log('Patient IDs to fetch:', patientIds);

      const { data: patientsData, error: patientsError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', patientIds);

      if (patientsError) {
        console.error('Error fetching patient profiles:', patientsError);
      }

      console.log('Patient profiles data:', patientsData);

      // Combine the data
      const combinedData = appointmentsData.map(appointment => {
        const patient = patientsData?.find(p => p.id === appointment.patient_id);
        
        return {
          id: appointment.id,
          patientId: appointment.patient_id,
          patientName: patient?.first_name && patient?.last_name 
            ? `${patient.first_name} ${patient.last_name}`
            : 'Unknown Patient',
          dateTime: new Date(appointment.appointment_date + 'T' + appointment.start_time),
          duration: 30, // Default duration
          type: appointment.reason || 'Consultation',
          status: appointment.status as 'pending' | 'confirmed' | 'cancelled' | 'completed',
          appointmentDate: appointment.appointment_date,
          startTime: appointment.start_time,
          endTime: appointment.end_time,
          reason: appointment.reason || 'No reason provided',
          rejectionReason: appointment.rejection_reason,
          contactInfo: {
            phone: '+260 XXX XXXXXX',
            email: patient?.email || 'no-email@provided.com'
          }
        };
      });

      console.log('Final combined appointments:', combinedData);
      return combinedData;
    },
    enabled: !!currentUser?.id
  });

  const handleEventClick = (event: AppointmentEvent) => {
    const appointment = appointments.find((appt) => appt.id === event.id);
    if (appointment) {
      setSelectedEvent(appointment);
      setIsDialogOpen(true);
    }
  };

  const handleManageAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setRejectionReason(appointment.rejectionReason || '');
    setIsManageDialogOpen(true);
  };

  const handleAcceptAppointment = async () => {
    if (!selectedAppointment) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'confirmed',
          rejection_reason: null 
        })
        .eq('id', selectedAppointment.id);

      if (error) {
        console.error('Error accepting appointment:', error);
        toast.error('Failed to accept appointment');
        return;
      }

      toast.success('Appointment accepted successfully');
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] });
      setIsManageDialogOpen(false);
    } catch (error) {
      console.error('Error accepting appointment:', error);
      toast.error('Failed to accept appointment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectAppointment = async () => {
    if (!selectedAppointment || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'cancelled',
          rejection_reason: rejectionReason.trim()
        })
        .eq('id', selectedAppointment.id);

      if (error) {
        console.error('Error rejecting appointment:', error);
        toast.error('Failed to reject appointment');
        return;
      }

      toast.success('Appointment rejected successfully');
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments'] });
      setIsManageDialogOpen(false);
    } catch (error) {
      console.error('Error rejecting appointment:', error);
      toast.error('Failed to reject appointment');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingAppointments = appointments.filter(appt => appt.status === 'pending');
  const confirmedAppointments = appointments.filter(appt => appt.status === 'confirmed');
  const rejectedAppointments = appointments.filter(appt => appt.status === 'cancelled');

  const appointmentEvents: AppointmentEvent[] = confirmedAppointments.map((appt) => ({
    id: appt.id,
    title: `${appt.patientName} - ${appt.type}`,
    start: new Date(appt.appointmentDate + 'T' + appt.startTime),
    end: new Date(appt.appointmentDate + 'T' + appt.endTime),
  }));

  console.log('Pending appointments:', pendingAppointments);
  console.log('All appointments:', appointments);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Appointment Management</CardTitle>
          <CardDescription>Manage your appointments and patient requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="requests" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="requests">
                Pending Requests ({pendingAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="space-y-4">
              <div className="space-y-4">
                {isLoading && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Loading appointments...</p>
                  </div>
                )}
                {!isLoading && pendingAppointments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No pending appointment requests</p>
                  </div>
                ) : (
                  pendingAppointments.map((appointment) => (
                    <div key={appointment.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{appointment.patientName}</h3>
                          <p className="text-sm text-gray-600">{appointment.contactInfo.email}</p>
                        </div>
                        <Badge className={getStatusBadgeColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Date:</span> {moment(appointment.appointmentDate).format('MMMM D, YYYY')}
                        </div>
                        <div>
                          <span className="font-medium">Time:</span> {appointment.startTime} - {appointment.endTime}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">Reason:</span> {appointment.reason}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button 
                          onClick={() => handleManageAppointment(appointment)}
                          variant="default"
                          size="sm"
                        >
                          <CheckIcon className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button 
                          onClick={() => handleManageAppointment(appointment)}
                          variant="destructive"
                          size="sm"
                        >
                          <XIcon className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button 
                          onClick={() => {
                            setSelectedEvent(appointment);
                            setIsDialogOpen(true);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="calendar">
              <div className="h-[600px]">
                <Calendar
                  localizer={localizer}
                  events={appointmentEvents}
                  startAccessor="start"
                  endAccessor="end"
                  onSelectEvent={handleEventClick}
                  views={['month', 'week', 'day']}
                  step={30}
                  showMultiDayTimes
                />
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Confirmed Appointments</h3>
                {confirmedAppointments.map((appointment) => (
                  <div key={appointment.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{appointment.patientName}</h4>
                        <p className="text-sm text-gray-600">
                          {moment(appointment.appointmentDate).format('MMM D, YYYY')} at {appointment.startTime}
                        </p>
                      </div>
                      <Badge className={getStatusBadgeColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>
                  </div>
                ))}

                {rejectedAppointments.length > 0 && (
                  <>
                    <h3 className="text-lg font-semibold pt-4">Rejected Appointments</h3>
                    {rejectedAppointments.map((appointment) => (
                      <div key={appointment.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{appointment.patientName}</h4>
                            <p className="text-sm text-gray-600">
                              {moment(appointment.appointmentDate).format('MMM D, YYYY')} at {appointment.startTime}
                            </p>
                            {appointment.rejectionReason && (
                              <p className="text-sm text-red-600 mt-1">
                                Reason: {appointment.rejectionReason}
                              </p>
                            )}
                          </div>
                          <Badge className={getStatusBadgeColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Appointment Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>Information about the selected appointment.</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Patient Name</Label>
                <Input value={selectedEvent.patientName} className="col-span-3" readOnly />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Date and Time</Label>
                <Input
                  value={moment(selectedEvent.dateTime).format('MMMM D, YYYY h:mm A')}
                  className="col-span-3"
                  readOnly
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Type</Label>
                <Input value={selectedEvent.type} className="col-span-3" readOnly />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Status</Label>
                <Badge className={getStatusBadgeColor(selectedEvent.status)}>
                  {selectedEvent.status}
                </Badge>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Email</Label>
                <Input value={selectedEvent.contactInfo.email} className="col-span-3" readOnly />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Reason</Label>
                <Textarea value={selectedEvent.reason} className="col-span-3" readOnly />
              </div>
              {selectedEvent.rejectionReason && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Rejection Reason</Label>
                  <Textarea value={selectedEvent.rejectionReason} className="col-span-3" readOnly />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Appointment Dialog */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manage Appointment Request</DialogTitle>
            <DialogDescription>
              Accept or reject this appointment request from {selectedAppointment?.patientName}
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Patient</Label>
                <Input value={selectedAppointment.patientName} readOnly />
              </div>
              <div className="grid gap-2">
                <Label>Date & Time</Label>
                <Input 
                  value={`${moment(selectedAppointment.appointmentDate).format('MMM D, YYYY')} at ${selectedAppointment.startTime}`} 
                  readOnly 
                />
              </div>
              <div className="grid gap-2">
                <Label>Reason</Label>
                <Textarea value={selectedAppointment.reason} readOnly />
              </div>
              <div className="grid gap-2">
                <Label>Rejection Reason (if rejecting)</Label>
                <Textarea 
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsManageDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectAppointment}
              disabled={isProcessing}
            >
              <XIcon className="w-4 h-4 mr-1" />
              {isProcessing ? 'Rejecting...' : 'Reject'}
            </Button>
            <Button 
              onClick={handleAcceptAppointment}
              disabled={isProcessing}
            >
              <CheckIcon className="w-4 h-4 mr-1" />
              {isProcessing ? 'Accepting...' : 'Accept'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AppointmentCalendar;
