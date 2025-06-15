
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Doctor, Appointment } from '@/lib/types';
import { CalendarIcon, ClockIcon, UserIcon, MapPinIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import AppointmentActions from './AppointmentActions';

interface AppointmentSchedulerProps {
  selectedDoctor?: Doctor | null;
  onAppointmentScheduled?: () => void;
}

// Database appointment type (snake_case)
interface DatabaseAppointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  reason: string;
  notes?: string;
  status: string;
  created_at: string;
}

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({ 
  selectedDoctor, 
  onAppointmentScheduled 
}) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorLocal, setSelectedDoctorLocal] = useState<Doctor | null>(selectedDoctor || null);

  // Available time slots
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00'
  ];

  // Fetch doctors if not provided
  useEffect(() => {
    if (!selectedDoctor) {
      fetchDoctors();
    }
  }, [selectedDoctor]);

  // Fetch existing appointments for selected date
  useEffect(() => {
    if (selectedDate && selectedDoctorLocal) {
      fetchAppointments();
    }
  }, [selectedDate, selectedDoctorLocal]);

  // Fetch patient's appointments
  useEffect(() => {
    if (user) {
      fetchPatientAppointments();
    }
  }, [user]);

  const fetchDoctors = async () => {
    try {
      // First, get verified doctors from profiles
      const { data: doctorProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'doctor')
        .eq('is_verified', true);

      if (profilesError) throw profilesError;

      // Then get their doctor profile details using the correct foreign key
      const { data: doctorDetails, error: detailsError } = await supabase
        .from('doctor_profiles')
        .select('doctor_id, specialty, institution_name, province')
        .in('doctor_id', doctorProfiles?.map(p => p.id) || []);

      if (detailsError) throw detailsError;

      // Combine the data
      const doctorsData = doctorProfiles?.map(profile => {
        const details = doctorDetails?.find(d => d.doctor_id === profile.id);
        return {
          id: profile.id,
          name: profile.name || `${profile.first_name} ${profile.last_name}`,
          email: profile.email,
          role: 'doctor' as const,
          dateCreated: new Date(profile.date_created),
          specialty: details?.specialty || 'General Practice',
          nrc_number: '',
          institution: {
            id: '1',
            name: details?.institution_name || 'Healthcare Center',
            address: details?.province || 'Lusaka',
            type: 'hospital' as const,
            province: details?.province || 'Lusaka'
          }
        };
      }) || [];

      setDoctors(doctorsData);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    }
  };

  const fetchAppointments = async () => {
    if (!selectedDoctorLocal || !selectedDate) return;

    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', selectedDoctorLocal.id)
        .eq('appointment_date', dateString);

      if (error) throw error;

      // Convert database appointments to frontend format
      const formattedAppointments: Appointment[] = (data as DatabaseAppointment[])?.map(apt => ({
        id: apt.id,
        patientId: apt.patient_id,
        doctorId: apt.doctor_id,
        appointmentDate: apt.appointment_date,
        startTime: apt.start_time,
        endTime: apt.end_time,
        reason: apt.reason || '',
        notes: apt.notes,
        status: apt.status as 'pending' | 'confirmed' | 'cancelled' | 'completed'
      })) || [];

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchPatientAppointments = async () => {
    if (!user) return;

    try {
      // Get the patient's appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: true });

      if (appointmentsError) throw appointmentsError;

      if (!appointments || appointments.length === 0) {
        setPatientAppointments([]);
        return;
      }

      // Get unique doctor IDs
      const doctorIds = [...new Set(appointments.map(apt => apt.doctor_id))];

      // Fetch doctor profiles for these doctors
      const { data: doctors, error: doctorsError } = await supabase
        .from('profiles')
        .select('id, name, first_name, last_name')
        .in('id', doctorIds);

      if (doctorsError) throw doctorsError;

      // Fetch doctor details
      const { data: doctorProfiles, error: doctorProfilesError } = await supabase
        .from('doctor_profiles')
        .select('doctor_id, specialty, institution_name')
        .in('doctor_id', doctorIds);

      if (doctorProfilesError) throw doctorProfilesError;

      // Combine the data
      const formattedAppointments: Appointment[] = appointments.map(apt => {
        const doctor = doctors?.find(d => d.id === apt.doctor_id);
        const doctorProfile = doctorProfiles?.find(dp => dp.doctor_id === apt.doctor_id);
        
        return {
          id: apt.id,
          patientId: apt.patient_id,
          doctorId: apt.doctor_id,
          appointmentDate: apt.appointment_date,
          startTime: apt.start_time,
          endTime: apt.end_time,
          reason: apt.reason || '',
          notes: apt.notes,
          status: apt.status as 'pending' | 'confirmed' | 'cancelled' | 'completed',
          doctorName: doctor?.name || `${doctor?.first_name || ''} ${doctor?.last_name || ''}`.trim() || 'Unknown Doctor',
          doctorSpecialty: doctorProfile?.specialty || 'General Practice',
          institutionName: doctorProfile?.institution_name || 'Healthcare Center'
        };
      });

      setPatientAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error fetching patient appointments:', error);
      setPatientAppointments([]);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(''); // Reset time when date changes
  };

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctorLocal(doctor);
    setSelectedTime(''); // Reset time when doctor changes
  };

  const getAvailableTimeSlots = () => {
    const bookedTimes = appointments.map(apt => apt.startTime);
    return timeSlots.filter(time => !bookedTimes.includes(time));
  };

  const calculateEndTime = (startTime: string) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(hours, minutes + 30, 0, 0); // 30-minute appointments
    return endDate.toTimeString().slice(0, 5);
  };

  const handleScheduleAppointment = async () => {
    if (!user) {
      toast.error('Please log in to schedule an appointment');
      return;
    }

    if (!selectedDate || !selectedTime || !reason || !selectedDoctorLocal) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const appointmentData = {
        patient_id: user.id,
        doctor_id: selectedDoctorLocal.id,
        appointment_date: selectedDate.toISOString().split('T')[0],
        start_time: selectedTime,
        end_time: calculateEndTime(selectedTime),
        reason: reason,
        notes: notes || null,
        status: 'pending'
      };

      const { error } = await supabase
        .from('appointments')
        .insert([appointmentData]);

      if (error) throw error;

      toast.success('Appointment scheduled successfully!');
      
      // Reset form
      setSelectedTime('');
      setReason('');
      setNotes('');
      
      // Refresh appointments
      await fetchAppointments();
      await fetchPatientAppointments();
      
      if (onAppointmentScheduled) {
        onAppointmentScheduled();
      }

    } catch (error) {
      console.error('Error scheduling appointment:', error);
      toast.error('Failed to schedule appointment. Please try again.');
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

  const availableTimeSlots = getAvailableTimeSlots();

  return (
    <div className="space-y-6">
      {/* Patient's Appointments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            <CalendarIcon className="mr-2 h-4 w-4 inline-block" />
            Your Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patientAppointments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              You don't have any appointments scheduled yet.
            </p>
          ) : (
            <div className="space-y-3">
              {patientAppointments.map((appointment) => (
                <AppointmentActions
                  key={appointment.id}
                  appointment={appointment}
                  onUpdate={fetchPatientAppointments}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule New Appointment Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <Calendar 
              mode="single" 
              selected={selectedDate} 
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date()}
              className="w-full rounded-md border-0"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4 w-full",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-input rounded-md",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex w-full",
                head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] flex-1 text-center",
                row: "flex w-full mt-2",
                cell: "h-8 w-8 text-center text-sm p-0 relative flex-1 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-accent hover:text-accent-foreground",
                day_range_end: "day-range-end",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            />
          </CardContent>
        </Card>

        {/* Doctor Selection Section */}
        {!selectedDoctor && (
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center">
                <UserIcon className="mr-2 h-4 w-4" />
                Select Doctor
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {doctors.map((doctor) => (
                  <Button
                    key={doctor.id}
                    variant={selectedDoctorLocal?.id === doctor.id ? 'default' : 'outline'}
                    onClick={() => handleDoctorSelect(doctor)}
                    className="w-full justify-start text-left h-auto p-3"
                  >
                    <div className="text-left">
                      <div className="font-medium text-sm">{doctor.name}</div>
                      <div className="text-xs opacity-70">{doctor.specialty}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Appointment Details Section */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center">
              <ClockIcon className="mr-2 h-4 w-4" />
              Appointment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-4">
            {selectedDate && selectedDoctorLocal ? (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm text-muted-foreground">{selectedDate.toLocaleDateString()}</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Doctor</Label>
                  <p className="text-sm font-medium">{selectedDoctorLocal.name}</p>
                  <Badge variant="secondary" className="text-xs">{selectedDoctorLocal.specialty}</Badge>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Available Time Slots</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableTimeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTime(time)}
                        className="text-xs h-8"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                  {availableTimeSlots.length === 0 && (
                    <p className="text-xs text-muted-foreground">No available slots for this date</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason" className="text-sm font-medium">Reason for Visit *</Label>
                  <Input
                    id="reason"
                    placeholder="e.g., Regular check-up, Follow-up"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional information..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="text-sm resize-none"
                  />
                </div>

                <Button 
                  onClick={handleScheduleAppointment}
                  disabled={loading || !selectedTime || !reason}
                  className="w-full text-sm"
                >
                  {loading ? 'Scheduling...' : 'Schedule Appointment'}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {!selectedDoctorLocal ? 'Select a doctor to continue' : 'Select a date to view available slots'}
              </p>
            )}

            {/* Show existing appointments for the day */}
            {appointments.length > 0 && selectedDate && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-semibold mb-2">
                  Existing Appointments - {selectedDate.toLocaleDateString()}
                </h4>
                <div className="space-y-2">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="text-xs p-2 bg-muted rounded">
                      <div className="font-medium">
                        {appointment.startTime} - {appointment.endTime}
                      </div>
                      <div className="text-muted-foreground">{appointment.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppointmentScheduler;
