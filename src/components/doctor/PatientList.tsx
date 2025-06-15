
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchIcon, FilterIcon, UserIcon, MessageSquareIcon, CalendarIcon, FileIcon, ClockIcon } from 'lucide-react';

type Patient = {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other' | 'prefer not to say';
  condition?: string;
  lastVisit: Date;
  upcomingAppointment?: Date;
  hivStatus?: boolean;
  tags: string[];
  avatar?: string;
};

// Mock patients data
const mockPatients: Patient[] = [
  {
    id: 'patient-1',
    name: 'John Doe',
    age: 45,
    gender: 'male',
    condition: 'Hypertension',
    lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    upcomingAppointment: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    hivStatus: false,
    tags: ['hypertension', 'diabetes']
  },
  {
    id: 'patient-2',
    name: 'Jane Smith',
    age: 32,
    gender: 'female',
    condition: 'Diabetes Type 2',
    lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    upcomingAppointment: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    hivStatus: false,
    tags: ['diabetes', 'anxiety']
  },
  {
    id: 'patient-3',
    name: 'Michael Johnson',
    age: 28,
    gender: 'male',
    condition: 'Asthma',
    lastVisit: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    upcomingAppointment: undefined,
    hivStatus: false,
    tags: ['asthma', 'allergies']
  },
  {
    id: 'patient-4',
    name: 'Sarah Williams',
    age: 37,
    gender: 'female',
    condition: 'Arthritis',
    lastVisit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    upcomingAppointment: undefined,
    hivStatus: false,
    tags: ['arthritis', 'chronic pain']
  },
  {
    id: 'patient-5',
    name: 'David Chen',
    age: 52,
    gender: 'male',
    condition: 'Heart Disease',
    lastVisit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    upcomingAppointment: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    hivStatus: false,
    tags: ['heart disease', 'hypertension', 'high cholesterol']
  },
  {
    id: 'patient-6',
    name: 'Emily Brown',
    age: 29,
    gender: 'female',
    condition: 'Depression',
    lastVisit: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
    upcomingAppointment: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    hivStatus: false,
    tags: ['depression', 'anxiety', 'insomnia']
  },
  {
    id: 'patient-7',
    name: 'Thomas Wilson',
    age: 41,
    gender: 'male',
    condition: 'HIV Positive',
    lastVisit: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    upcomingAppointment: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    hivStatus: true,
    tags: ['hiv', 'immunocompromised']
  }
];

const PatientList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOption, setFilterOption] = useState('all');
  const [sortOption, setSortOption] = useState('name-asc');
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>(mockPatients);
  const navigate = useNavigate();

  const handleSearch = () => {
    let results = mockPatients;
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(
        patient => 
          patient.name.toLowerCase().includes(term) ||
          patient.tags.some(tag => tag.toLowerCase().includes(term)) ||
          (patient.condition && patient.condition.toLowerCase().includes(term))
      );
    }
    
    // Filter by option
    if (filterOption === 'upcoming-appointments') {
      results = results.filter(patient => patient.upcomingAppointment !== undefined);
    } else if (filterOption === 'no-appointments') {
      results = results.filter(patient => patient.upcomingAppointment === undefined);
    } else if (filterOption === 'hiv-positive') {
      results = results.filter(patient => patient.hivStatus === true);
    }
    
    // Sort results
    results = sortPatients(results, sortOption);
    
    setFilteredPatients(results);
  };

  const sortPatients = (patients: Patient[], sortBy: string) => {
    const sortedPatients = [...patients];
    
    switch (sortBy) {
      case 'name-asc':
        return sortedPatients.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sortedPatients.sort((a, b) => b.name.localeCompare(a.name));
      case 'last-visit':
        return sortedPatients.sort((a, b) => b.lastVisit.getTime() - a.lastVisit.getTime());
      case 'upcoming-appointment':
        return sortedPatients.sort((a, b) => {
          if (!a.upcomingAppointment) return 1;
          if (!b.upcomingAppointment) return -1;
          return a.upcomingAppointment.getTime() - b.upcomingAppointment.getTime();
        });
      default:
        return sortedPatients;
    }
  };

  const viewPatientProfile = (patientId: string) => {
    navigate(`/doctor/patient/${patientId}`);
  };

  const messagPatient = (patientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/doctor/chat/${patientId}`);
  };

  const scheduleAppointment = (patientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/doctor/appointments/new?patient=${patientId}`);
  };

  const viewMedicalRecords = (patientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/doctor/patient/${patientId}/records`);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-semibold tracking-tight mb-2">Patient Management</h1>
        <p className="text-muted-foreground">View and manage your patients</p>
      </div>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-5 relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="md:col-span-3">
              <Select
                value={filterOption}
                onValueChange={setFilterOption}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Patients</SelectItem>
                  <SelectItem value="upcoming-appointments">Has Upcoming Appointment</SelectItem>
                  <SelectItem value="no-appointments">No Scheduled Appointments</SelectItem>
                  <SelectItem value="hiv-positive">HIV Positive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-3">
              <Select
                value={sortOption}
                onValueChange={setSortOption}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="last-visit">Last Visit</SelectItem>
                  <SelectItem value="upcoming-appointment">Upcoming Appointment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-1">
              <Button 
                onClick={handleSearch} 
                className="w-full"
                size="icon"
              >
                <FilterIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="space-y-4">
        {filteredPatients.length > 0 ? (
          filteredPatients.map((patient) => (
            <Card 
              key={patient.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => viewPatientProfile(patient.id)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 border">
                      <AvatarImage src={patient.avatar} alt={patient.name} />
                      <AvatarFallback>{getInitials(patient.name)}</AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <h3 className="font-medium text-lg">{patient.name}</h3>
                        {patient.hivStatus && (
                          <Badge className="bg-red-500 hover:bg-red-600">HIV+</Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mt-1 text-sm text-muted-foreground">
                        <span>{patient.age} years</span>
                        <span className="mx-1">•</span>
                        <span>{patient.gender}</span>
                        {patient.condition && (
                          <>
                            <span className="mx-1">•</span>
                            <span>{patient.condition}</span>
                          </>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mt-2">
                        {patient.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4 sm:mt-0">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <ClockIcon className="h-4 w-4" />
                        <span>Last visit: {formatDate(patient.lastVisit)}</span>
                      </div>
                      
                      {patient.upcomingAppointment && (
                        <div className="flex items-center gap-1 text-primary">
                          <CalendarIcon className="h-4 w-4" />
                          <span>Upcoming: {formatDate(patient.upcomingAppointment)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={(e) => messagPatient(patient.id, e)}
                      >
                        <MessageSquareIcon className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={(e) => viewMedicalRecords(patient.id, e)}
                      >
                        <FileIcon className="h-4 w-4 mr-2" />
                        Records
                      </Button>
                      
                      <Button 
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={(e) => scheduleAppointment(patient.id, e)}
                      >
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Schedule
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <UserIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No patients found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your search or filters</p>
            <Button onClick={() => {
              setSearchTerm('');
              setFilterOption('all');
              setSortOption('name-asc');
              setFilteredPatients(mockPatients);
            }}>
              Reset Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientList;
