
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquareIcon, 
  CalendarIcon, 
  UserIcon, 
  CheckCircleIcon,
  ClockIcon,
  StethoscopeIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BarChart3Icon,
  Users2Icon,
  LineChartIcon,
  ActivityIcon
} from 'lucide-react';
import HealthcareAlertBar from '@/components/patient/HealthcareAlertBar';
import { supabase } from '@/integrations/supabase/client';

interface AppointmentWithPatient {
  id: string;
  patient_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  reason: string;
  status: string;
  patientName: string;
  type: string;
}

interface RecentPatient {
  id: string;
  name: string;
  lastVisit: Date;
  condition: string;
  avatar?: string;
}

const DoctorDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // State for real statistics
  const [stats, setStats] = React.useState({
    totalPatients: 0,
    appointments: 0,
    consultations: 0,
    messages: 0
  });
  const [isLoadingStats, setIsLoadingStats] = React.useState(true);
  
  // State for real appointments
  const [upcomingAppointments, setUpcomingAppointments] = React.useState<AppointmentWithPatient[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = React.useState(true);
  
  // State for real recent patients
  const [recentPatients, setRecentPatients] = React.useState<RecentPatient[]>([]);
  const [isLoadingRecentPatients, setIsLoadingRecentPatients] = React.useState(true);

  // Fetch real statistics
  React.useEffect(() => {
    const fetchStatistics = async () => {
      if (!currentUser?.id) return;
      
      setIsLoadingStats(true);
      try {
        // Get total unique patients who have appointments with this doctor
        const { data: appointmentPatients, error: appointmentError } = await supabase
          .from('appointments')
          .select('patient_id')
          .eq('doctor_id', currentUser.id);

        if (appointmentError) throw appointmentError;

        const uniquePatients = new Set(appointmentPatients?.map(apt => apt.patient_id) || []);
        const totalPatients = uniquePatients.size;

        // Get total appointments count for this doctor
        const { count: appointmentsCount, error: appointmentsError } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', currentUser.id);

        if (appointmentsError) throw appointmentsError;

        // Get completed appointments count (consultations)
        const { count: consultationsCount, error: consultationsError } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', currentUser.id)
          .eq('status', 'completed');

        if (consultationsError) throw consultationsError;

        // Get total messages in chat sessions where this doctor is involved
        const { data: chatSessions, error: sessionsError } = await supabase
          .from('chat_sessions')
          .select('id')
          .eq('doctor_id', currentUser.id);

        if (sessionsError) throw sessionsError;

        let totalMessages = 0;
        if (chatSessions && chatSessions.length > 0) {
          const sessionIds = chatSessions.map(session => session.id);
          const { count: messagesCount, error: messagesError } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .in('session_id', sessionIds);

          if (messagesError) throw messagesError;
          totalMessages = messagesCount || 0;
        }

        setStats({
          totalPatients,
          appointments: appointmentsCount || 0,
          consultations: consultationsCount || 0,
          messages: totalMessages
        });

      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStatistics();
  }, [currentUser]);

  // Fetch real appointments
  React.useEffect(() => {
    const fetchUpcomingAppointments = async () => {
      if (!currentUser?.id) return;
      
      setIsLoadingAppointments(true);
      try {
        // Get today's and upcoming appointments
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const { data: appointments, error: appointmentsError } = await supabase
          .from('appointments')
          .select('*')
          .eq('doctor_id', currentUser.id)
          .gte('appointment_date', today)
          .lte('appointment_date', nextWeek)
          .order('appointment_date', { ascending: true })
          .order('start_time', { ascending: true })
          .limit(5);

        if (appointmentsError) throw appointmentsError;

        if (!appointments || appointments.length === 0) {
          setUpcomingAppointments([]);
          return;
        }

        // Get patient names for each appointment
        const patientIds = [...new Set(appointments.map(apt => apt.patient_id))];
        const { data: patients, error: patientsError } = await supabase
          .from('profiles')
          .select('id, name, first_name, last_name')
          .in('id', patientIds);

        if (patientsError) throw patientsError;

        // Combine appointment and patient data
        const appointmentsWithPatients: AppointmentWithPatient[] = appointments.map(apt => {
          const patient = patients?.find(p => p.id === apt.patient_id);
          const patientName = patient?.name || `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim() || 'Unknown Patient';
          
          return {
            id: apt.id,
            patient_id: apt.patient_id,
            appointment_date: apt.appointment_date,
            start_time: apt.start_time,
            end_time: apt.end_time,
            reason: apt.reason || 'General Consultation',
            status: apt.status,
            patientName,
            type: apt.reason || 'General Consultation'
          };
        });

        setUpcomingAppointments(appointmentsWithPatients);

      } catch (error) {
        console.error('Error fetching appointments:', error);
        setUpcomingAppointments([]);
      } finally {
        setIsLoadingAppointments(false);
      }
    };

    fetchUpcomingAppointments();
  }, [currentUser]);

  // Fetch recent patients
  React.useEffect(() => {
    const fetchRecentPatients = async () => {
      if (!currentUser?.id) return;
      
      setIsLoadingRecentPatients(true);
      try {
        // Get recent completed appointments with patient info
        const { data: recentAppointments, error: appointmentsError } = await supabase
          .from('appointments')
          .select('patient_id, appointment_date, reason')
          .eq('doctor_id', currentUser.id)
          .eq('status', 'completed')
          .order('appointment_date', { ascending: false })
          .limit(10);

        if (appointmentsError) throw appointmentsError;

        if (!recentAppointments || recentAppointments.length === 0) {
          setRecentPatients([]);
          return;
        }

        // Get unique patients and their most recent appointment
        const patientMap = new Map();
        recentAppointments.forEach(apt => {
          if (!patientMap.has(apt.patient_id)) {
            patientMap.set(apt.patient_id, {
              patient_id: apt.patient_id,
              lastVisit: new Date(apt.appointment_date),
              condition: apt.reason || 'General Consultation'
            });
          }
        });

        const uniquePatients = Array.from(patientMap.values()).slice(0, 3);

        // Get patient names
        const patientIds = uniquePatients.map(p => p.patient_id);
        const { data: patients, error: patientsError } = await supabase
          .from('profiles')
          .select('id, name, first_name, last_name, photo_url')
          .in('id', patientIds);

        if (patientsError) throw patientsError;

        // Combine data
        const recentPatientsData: RecentPatient[] = uniquePatients.map(patient => {
          const profile = patients?.find(p => p.id === patient.patient_id);
          const patientName = profile?.name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Unknown Patient';
          
          return {
            id: patient.patient_id,
            name: patientName,
            lastVisit: patient.lastVisit,
            condition: patient.condition,
            avatar: profile?.photo_url
          };
        });

        setRecentPatients(recentPatientsData);

      } catch (error) {
        console.error('Error fetching recent patients:', error);
        setRecentPatients([]);
      } finally {
        setIsLoadingRecentPatients(false);
      }
    };

    fetchRecentPatients();
  }, [currentUser]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  const formatTime = (timeString: string) => {
    const time = new Date(`1970-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  // Fetching actual chat sessions and last patient messages for this doctor
  const [patientMessages, setPatientMessages] = React.useState<any[]>([]);
  React.useEffect(() => {
    async function fetchPatientChats() {
      const doctorId = currentUser?.id;
      if (!doctorId) return;
      // Find chat_sessions for this doctor with at least one message
      const { data: sessions } = await supabase
        .from('chat_sessions')
        .select('id,patient_id')
        .eq('doctor_id', doctorId);

      if (!sessions?.length) {
        setPatientMessages([]);
        return;
      }

      // For each session, fetch patient info and last message
      const result: any[] = [];
      for (let session of sessions) {
        // Last message
        const { data: msgs } = await supabase
          .from('chat_messages')
          .select('id,content,created_at,sender_id')
          .eq('session_id', session.id)
          .order('created_at', { ascending: false })
          .limit(1);

        // Get patient profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id,first_name,last_name')
          .eq('id', session.patient_id)
          .single();

        if (msgs?.[0] && profile) {
          result.push({
            sessionId: session.id,
            patientId: session.patient_id,
            name: `${profile.first_name} ${profile.last_name}`,
            message: msgs[0].content,
            time: msgs[0].created_at,
          });
        }
      }
      setPatientMessages(result);
    }
    fetchPatientChats();
  }, [currentUser]);

  // Dashboard stats with real data
  const dashboardStats = [
    {
      title: 'Total Patients',
      value: isLoadingStats ? '...' : stats.totalPatients.toString(),
      change: '', // Remove percentage change for now since we don't have historical data
      trend: 'neutral',
      icon: <Users2Icon className="h-5 w-5" />
    },
    {
      title: 'Appointments',
      value: isLoadingStats ? '...' : stats.appointments.toString(),
      change: '',
      trend: 'neutral',
      icon: <CalendarIcon className="h-5 w-5" />
    },
    {
      title: 'Consultations',
      value: isLoadingStats ? '...' : stats.consultations.toString(),
      change: '',
      trend: 'neutral',
      icon: <StethoscopeIcon className="h-5 w-5" />
    },
    {
      title: 'Messages',
      value: isLoadingStats ? '...' : stats.messages.toString(),
      change: '',
      trend: 'neutral',
      icon: <MessageSquareIcon className="h-5 w-5" />
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-display font-semibold tracking-tight">Welcome back, Dr. {currentUser?.name.split(' ')[1]}</h1>
        <p className="text-muted-foreground">Here's an overview of your practice</p>
      </div>
      
      {/* Healthcare Alert Bar */}
      <HealthcareAlertBar />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {dashboardStats.map((stat, index) => (
          <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-muted-foreground">{stat.title}</span>
                  <span className="text-3xl font-semibold mt-1">{stat.value}</span>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {stat.icon}
                </div>
              </div>
              
              {stat.change && (
                <div className="flex items-center mt-4">
                  {stat.trend === 'up' ? (
                    <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                  ) : stat.trend === 'down' ? (
                    <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                  ) : null}
                  <span className={`text-sm ${
                    stat.trend === 'up' ? 'text-green-500' : stat.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Upcoming Appointments
            </CardTitle>
            <CardDescription>Your upcoming appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAppointments ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : upcomingAppointments.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex flex-col sm:flex-row gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary">
                      <UserIcon className="h-6 w-6" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <h4 className="font-medium">{appointment.patientName}</h4>
                          <p className="text-sm text-muted-foreground">{appointment.type}</p>
                        </div>
                        <Badge variant={appointment.status === 'confirmed' ? 'default' : 'outline'}>
                          {appointment.status === 'confirmed' ? (
                            <span className="flex items-center gap-1">
                              <CheckCircleIcon className="h-3 w-3" />
                              Confirmed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <ClockIcon className="h-3 w-3" />
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </span>
                          )}
                        </Badge>
                      </div>
                      
                      <div className="mt-2 flex items-center text-sm">
                        <ClockIcon className="h-4 w-4 text-muted-foreground mr-1" />
                        <span>{formatDate(appointment.appointment_date)} at {formatTime(appointment.start_time)}</span>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 flex sm:flex-col gap-2 sm:gap-1 mt-2 sm:mt-0">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => navigate(`/doctor/appointments`)}
                      >
                        View
                      </Button>
                      <Button 
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => navigate(`/doctor/chat`)}
                      >
                        Message
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No upcoming appointments</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/doctor/appointments')}
            >
              View All Appointments
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <BarChart3Icon className="h-5 w-5 text-primary" />
              Practice Insights
            </CardTitle>
            <CardDescription>Analytics and trends for your practice</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <LineChartIcon className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Detailed analytics and insights will appear here
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/doctor/analytics')}
            >
              View Detailed Analytics
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm hover:shadow-md transition-shadow lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <Users2Icon className="h-5 w-5 text-primary" />
              Recent Patients
            </CardTitle>
            <CardDescription>Patients you've recently interacted with</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRecentPatients ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : recentPatients.length > 0 ? (
              <div className="space-y-4">
                {recentPatients.map((patient) => (
                  <div 
                    key={patient.id} 
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/doctor/patient/${patient.id}`)}
                  >
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={patient.avatar} alt={patient.name} />
                      <AvatarFallback>{getInitials(patient.name)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{patient.name}</h4>
                        <span className="text-xs text-muted-foreground">
                          Last visit: {formatDate(patient.lastVisit.toISOString())}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{patient.condition}</p>
                    </div>
                    
                    <div className="flex-shrink-0">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/doctor/chat/${patient.id}`);
                        }}
                      >
                        <MessageSquareIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No recent patients</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/doctor/patients')}
            >
              View All Patients
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <MessageSquareIcon className="h-5 w-5 text-primary" />
              Recent Messages
            </CardTitle>
            <CardDescription>Your latest patient communications</CardDescription>
          </CardHeader>
          <CardContent>
              {patientMessages.length > 0 ? (
                  <div className="space-y-4">
                      {patientMessages.map((msg) => (
                          <div
                              key={msg.sessionId}
                              className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                              onClick={() => navigate(`/chat/${msg.sessionId}`)}
                          >
                              <Avatar className="h-10 w-10 border mt-1">
                                  <AvatarFallback>
                                      {msg.name
                                          .split(' ')
                                          .map((n: string) => n[0])
                                          .join('')
                                          .slice(0, 2)
                                          .toUpperCase()}
                                  </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 overflow-hidden">
                                  <div className="flex justify-between items-start">
                                      <h4 className="font-medium flex items-center gap-2">
                                          {msg.name}
                                      </h4>
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-2">{msg.message}</p>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="text-center py-6">
                      <p className="text-muted-foreground">No recent messages</p>
                  </div>
              )}
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/doctor/chat')}
            >
              View All Messages
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default DoctorDashboard;
