import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Calendar, 
  MapPin, 
  Stethoscope, 
  Clock,
  CheckCircle,
  Activity,
  ArrowRight,
  Bell,
  Heart,
  Pill,
  AlertTriangle,
  FileText,
  User
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, isAfter, parseISO } from 'date-fns';
import { Appointment } from '@/lib/types';
import HealthcareAlertBar from '@/components/patient/HealthcareAlertBar';

interface RegisteredDoctor {
  id: string;
  first_name: string;
  last_name: string;
  specialty: string;
  institution_name: string;
  province: string;
}

const PatientDashboard = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [medicationRefill, setMedicationRefill] = useState<any>(null);
  const [isLoadingRefill, setIsLoadingRefill] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [registeredDoctors, setRegisteredDoctors] = useState<RegisteredDoctor[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);

  // Helper function to display avatar with selected color/gradient
  const getAvatarDisplay = (user: any) => {
    const getInitials = (name: string) => {
      if (!name) return 'U';
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    };

    // If user has a custom photo, use it
    if (user && user.photo_url) {
      return <AvatarImage src={user.photo_url} alt="Profile" />;
    }

    // If user has selected a color avatar, use the avatar data from AuthContext
    if (user && user.selected_avatar_id && user.avatar_options) {
      const avatar = user.avatar_options;
      const style = avatar.gradient_value 
        ? { background: avatar.gradient_value }
        : { backgroundColor: avatar.color_value };
      
      return (
        <div 
          className="w-full h-full rounded-full flex items-center justify-center text-white font-medium text-sm"
          style={style}
        >
          {user.name ? getInitials(user.name) : <User className="h-4 w-4" />}
        </div>
      );
    }

    // Default fallback
    return (
      <AvatarFallback>
        <User className="h-4 w-4" />
      </AvatarFallback>
    );
  };

  useEffect(() => {
    if (!currentUser) return; // Only fetch data if currentUser is available

    // Fetch registered doctors
    const fetchRegisteredDoctors = async () => {
      setIsLoadingDoctors(true);
      try {
        console.log('Fetching registered doctors for dashboard...');
        
        const { data: doctors, error } = await supabase
          .from('doctor_profiles')
          .select('doctor_id, first_name, last_name, specialty, institution_name, province')
          .eq('verification_status', 'approved')
          .order('first_name', { ascending: true })
          .limit(4); // Show only first 4 doctors

        if (error) {
          console.error('Error fetching registered doctors:', error);
          return;
        }

        console.log('Fetched registered doctors:', doctors);

        const transformedDoctors: RegisteredDoctor[] = doctors?.map(doctor => ({
          id: doctor.doctor_id,
          first_name: doctor.first_name,
          last_name: doctor.last_name,
          specialty: doctor.specialty,
          institution_name: doctor.institution_name,
          province: doctor.province
        })) || [];

        setRegisteredDoctors(transformedDoctors);
      } catch (error) {
        console.error('Error in fetchRegisteredDoctors:', error);
      } finally {
        setIsLoadingDoctors(false);
      }
    };

    // Fetch medication refill data
    const fetchMedicationRefill = async () => {
      
      setIsLoadingRefill(true);
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
          console.error('Error fetching medication refill:', error);
        }
  
        setMedicationRefill(data || null);
      } catch (error) {
        console.error('Error in fetch medication:', error);
      } finally {
        setIsLoadingRefill(false);
      }
    };

    // Fetch real appointments data
    const fetchUpcomingAppointments = async () => {

      setIsLoadingAppointments(true);
      try {
        // Get appointments for the next 30 days
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + 30);

        const { data: appointments, error: appointmentsError } = await supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', currentUser.id)
          .gte('appointment_date', today.toISOString().split('T')[0])
          .lte('appointment_date', futureDate.toISOString().split('T')[0])
          .order('appointment_date', { ascending: true })
          .limit(3); // Show only next 3 appointments

        if (appointmentsError) throw appointmentsError;

        if (!appointments || appointments.length === 0) {
          setUpcomingAppointments([]);
          return;
        }

        // Get unique doctor IDs
        const doctorIds = [...new Set(appointments.map(apt => apt.doctor_id))];

        // Fetch doctor profiles
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

        setUpcomingAppointments(formattedAppointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setUpcomingAppointments([]);
      } finally {
        setIsLoadingAppointments(false);
      }
    };
    
    fetchMedicationRefill();
    fetchUpcomingAppointments();
    fetchRegisteredDoctors();
  }, [currentUser]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getRefillStatus = () => {
    if (!medicationRefill) return null;
    
    const today = new Date();
    const nextRefill = parseISO(medicationRefill.next_refill_date);
    const daysUntil = Math.ceil((nextRefill.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (isAfter(today, nextRefill)) {
      return {
        label: "Refill due",
        color: "destructive",
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
        message: "Your ARV refill is overdue"
      };
    } else if (daysUntil <= 5) {
      return {
        label: "Refill soon",
        color: "warning",
        icon: <Clock className="h-5 w-5 text-amber-500" />,
        message: `${daysUntil} day${daysUntil === 1 ? '' : 's'} until next refill`
      };
    } else {
      return {
        label: "Up to date",
        color: "success",
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        message: `Next refill: ${format(nextRefill, 'MMM d, yyyy')}`
      };
    }
  };

  const refillStatus = getRefillStatus();

  const handleStartChat = async (doctorId: string) => {
    try {
      console.log('Starting chat with doctor:', doctorId);
      
      if (!currentUser) {
        console.error('No authenticated user');
        return;
      }

      // Create or find existing chat session
      const { data: existingSession } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('doctor_id', doctorId)
        .eq('patient_id', currentUser.id)
        .maybeSingle();

      if (existingSession) {
        navigate(`/patient/chat/${existingSession.id}`);
      } else {
        // Create new chat session
        const { data: newSession, error } = await supabase
          .from('chat_sessions')
          .insert({
            doctor_id: doctorId,
            patient_id: currentUser.id
          })
          .select('id')
          .single();

        if (error) throw error;
        navigate(`/patient/chat/${newSession.id}`);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  if (authLoading || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen-minus-header">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-lg text-gray-600">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <section className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="h-16 w-16">
            {getAvatarDisplay(currentUser)}
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold">Welcome back, {currentUser?.firstName || currentUser?.name.split(' ')[0]}!</h1>
            <p className="text-gray-600">How are you feeling today? Use our AI symptom checker for a quick health assessment.</p>
          </div>
        </div>
        <Button 
          className="mediconnect-btn mediconnect-btn-primary"
          onClick={() => navigate('/patient/symptom-checker')}
        >
          Check Symptoms
        </Button>
      </section>
      
      {/* Healthcare Alert Bar */}
      <HealthcareAlertBar />

      {/* Appointments Section */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-xl font-semibold">Upcoming Appointments</h2>
          </div>
          <a 
            href="#" 
            className="view-all-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('/patient/appointments');
            }}
          >
            View All
          </a>
        </div>
        
        {isLoadingAppointments ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : upcomingAppointments.length === 0 ? (
          <Card className="mediconnect-card">
            <div className="p-6 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No upcoming appointments</h3>
              <p className="text-gray-500 mb-4">Schedule an appointment with a doctor to get started</p>
              <Button 
                onClick={() => navigate('/patient/appointments')}
                className="mediconnect-btn mediconnect-btn-primary"
              >
                Schedule Appointment
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingAppointments.map((appointment) => (
              <Card key={appointment.id} className="mediconnect-card">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{appointment.doctorName}</h3>
                      <p className="text-sm text-gray-500">{appointment.doctorSpecialty}</p>
                    </div>
                    <Badge className={`${appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center text-sm mb-1">
                    <Clock className="h-4 w-4 text-gray-400 mr-1" />
                    {formatDate(appointment.appointmentDate)} | {appointment.startTime}
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                    {appointment.institutionName}
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs px-2"
                      onClick={() => navigate('/patient/appointments')}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Medication Refill Section */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Pill className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-xl font-semibold">Medication Refill</h2>
          </div>
          <a 
            href="#" 
            className="view-all-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('/patient/medication-refills');
            }}
          >
            Manage Refills
          </a>
        </div>
        
        <Card className="mediconnect-card">
          <CardContent className="p-4">
            {isLoadingRefill ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : medicationRefill ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {refillStatus?.icon}
                  <div className="ml-3">
                    <h3 className="font-semibold">ARV Medication</h3>
                    <p className="text-sm text-gray-600">{refillStatus?.message}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/patient/medication-refills')}
                >
                  Update
                </Button>
              </div>
            ) : (
              <div className="text-center py-3">
                <Pill className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <h3 className="font-medium mb-1">No medication tracking set up</h3>
                <p className="text-sm text-gray-500 mb-3">
                  Track your ARV medication refills so you never miss a dose
                </p>
                <Button 
                  size="sm"
                  onClick={() => navigate('/patient/medication-refills')}
                >
                  Set Up Reminder
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
      
      {/* Registered Doctors Section */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Heart className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-xl font-semibold">Available Doctors</h2>
          </div>
          <a 
            href="#" 
            className="view-all-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('/patient/doctors');
            }}
          >
            View All
          </a>
        </div>
        
        {isLoadingDoctors ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : registeredDoctors.length === 0 ? (
          <Card className="mediconnect-card">
            <div className="p-6 text-center">
              <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No registered doctors available</h3>
              <p className="text-gray-500 mb-4">We're working on verifying more healthcare professionals</p>
              <Button 
                onClick={() => navigate('/patient/doctors')}
                className="mediconnect-btn mediconnect-btn-primary"
              >
                Browse Doctors
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {registeredDoctors.map((doctor) => (
              <Card key={doctor.id} className="mediconnect-card">
                <div className="flex items-center p-4">
                  <Avatar className="h-12 w-12 mr-4">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {doctor.first_name.charAt(0)}{doctor.last_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold">Dr. {doctor.first_name} {doctor.last_name}</h3>
                    <p className="text-gray-500 text-sm">{doctor.specialty}</p>
                    <p className="text-xs text-gray-400">{doctor.institution_name}</p>
                  </div>
                  
                  <Button 
                    size="sm" 
                    className="mediconnect-btn mediconnect-btn-outline"
                    onClick={() => handleStartChat(doctor.id)}
                  >
                    Message
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
      
      {/* Quick Access Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="mediconnect-card">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="bg-primary/10 text-primary rounded-full p-4 mb-4">
              <Activity className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Symptom Checker</h3>
            <p className="text-gray-500 mb-4">
              Describe your symptoms to our AI assistant for an initial assessment.
            </p>
            <Button 
              onClick={() => navigate('/patient/symptom-checker')}
              className="mediconnect-btn mediconnect-btn-primary w-full"
            >
              Start Symptom Check
            </Button>
          </CardContent>
        </Card>
        
        <Card className="mediconnect-card">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="bg-primary/10 text-primary rounded-full p-4 mb-4">
              <MapPin className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nearby Healthcare</h3>
            <p className="text-gray-500 mb-4">
              Find hospitals, clinics, and pharmacies near your location.
            </p>
            <Button 
              onClick={() => navigate('/patient/map')}
              className="mediconnect-btn mediconnect-btn-primary w-full"
            >
              Find Care Near Me
            </Button>
          </CardContent>
        </Card>

        <Card className="mediconnect-card">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="bg-orange-100 text-orange-600 rounded-full p-4 mb-4">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Submit Complaint</h3>
            <p className="text-gray-500 mb-4">
              Report any issues or concerns about healthcare professionals.
            </p>
            <Button 
              onClick={() => navigate('/patient/complaints')}
              className="mediconnect-btn mediconnect-btn-primary w-full"
            >
              View Complaints
            </Button>
          </CardContent>
        </Card>

        <Card className="mediconnect-card">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="bg-red-100 text-red-600 rounded-full p-4 mb-4">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">SOS Emergency</h3>
            <p className="text-gray-500 mb-4">
              Quick access to ambulance services in your area for emergency situations.
            </p>
            <Button 
              onClick={() => navigate('/patient/sos-emergency')}
              className="bg-red-600 hover:bg-red-700 text-white w-full"
            >
              Access Emergency Services
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default PatientDashboard;
