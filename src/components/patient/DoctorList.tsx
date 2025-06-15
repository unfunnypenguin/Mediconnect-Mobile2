
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SearchIcon, MapPinIcon, CalendarIcon, MessageSquareIcon, StarIcon, UserIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface RegisteredDoctor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  specialty: string;
  institution_name: string;
  province: string;
  verification_status: string;
  bio?: string;
}

const DoctorList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const { data: doctors = [], isLoading, error } = useQuery({
    queryKey: ['verified-doctors'],
    queryFn: async () => {
      console.log('Fetching verified doctors...');
      
      // First, let's check what's in the doctor_profiles table
      const { data: allDoctors, error: allError } = await supabase
        .from('doctor_profiles')
        .select('*');
      
      console.log('All doctors in database:', allDoctors);
      console.log('All doctors error:', allError);
      
      // Now fetch only approved doctors
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('verification_status', 'approved')
        .order('first_name', { ascending: true });

      if (error) {
        console.error('Error fetching approved doctors:', error);
        throw error;
      }

      console.log('Approved doctors:', data);

      // Transform the data to match our interface
      const transformedDoctors = data?.map(doctor => ({
        id: doctor.doctor_id,
        first_name: doctor.first_name,
        last_name: doctor.last_name,
        email: doctor.email,
        specialty: doctor.specialty,
        institution_name: doctor.institution_name,
        province: doctor.province,
        verification_status: doctor.verification_status,
        bio: `Experienced ${doctor.specialty} specialist at ${doctor.institution_name}, providing quality healthcare in ${doctor.province} Province.`
      })) || [];

      console.log('Transformed doctors:', transformedDoctors);
      return transformedDoctors;
    }
  });

  const filteredDoctors = doctors.filter(doctor =>
    `${doctor.first_name} ${doctor.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.institution_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.province.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBookAppointment = (doctorId: string) => {
    navigate('/patient/appointments', { 
      state: { selectedDoctorId: doctorId } 
    });
  };

  const handleStartChat = async (doctorId: string) => {
    try {
      console.log('Starting chat with doctor:', doctorId);
      const currentUser = await supabase.auth.getUser();
      
      if (!currentUser.data.user) {
        console.error('No authenticated user');
        return;
      }

      // Create or find existing chat session
      const { data: existingSession } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('doctor_id', doctorId)
        .eq('patient_id', currentUser.data.user.id)
        .maybeSingle();

      if (existingSession) {
        navigate(`/patient/chat/${existingSession.id}`);
      } else {
        // Create new chat session
        const { data: newSession, error } = await supabase
          .from('chat_sessions')
          .insert({
            doctor_id: doctorId,
            patient_id: currentUser.data.user.id
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

  const handleViewProfile = (doctorId: string) => {
    // For now, we'll show an alert. Later this can be a modal or separate page
    alert(`Doctor profile view for ${doctorId} will be implemented in the next phase`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-gray-500">Loading doctors...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-red-500">Error loading doctors: {error.message}</p>
              <p className="text-sm text-gray-500 mt-2">Please check the console for more details.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Find a Doctor</CardTitle>
          <p className="text-gray-600">Browse our verified healthcare professionals</p>
        </CardHeader>
        <CardContent>
          <div className="relative mb-6">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <Input
              type="text"
              placeholder="Search by name, specialty, institution, or province..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {doctors.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <UserIcon className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No verified doctors available</h3>
              <p className="text-gray-500">We're working on verifying more healthcare professionals. Please check back soon.</p>
              <p className="text-xs text-gray-400 mt-2">Check console logs for debugging information.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDoctors.map((doctor) => (
                <Card key={doctor.id} className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="px-6 py-4">
                    <div className="flex items-center space-x-4 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {doctor.first_name.charAt(0)}{doctor.last_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle 
                          className="text-lg font-semibold cursor-pointer hover:text-blue-600" 
                          onClick={() => handleViewProfile(doctor.id)}
                        >
                          Dr. {doctor.first_name} {doctor.last_name}
                        </CardTitle>
                        <p className="text-gray-600">{doctor.specialty}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <Badge variant="secondary" className="mr-2">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {doctor.institution_name}
                      </Badge>
                      <Badge variant="outline">
                        {doctor.province} Province
                      </Badge>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        ✓ Verified
                      </Badge>
                    </div>
                    
                    <p className="text-gray-700 text-sm mb-4 line-clamp-3">{doctor.bio}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                        <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                        <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                        <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                        <StarIcon className="h-4 w-4 text-gray-300" />
                        <span className="text-xs text-gray-500 ml-1">(4.0)</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleBookAppointment(doctor.id)}
                      >
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Book
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleStartChat(doctor.id)}
                      >
                        <MessageSquareIcon className="h-4 w-4 mr-1" />
                        Chat
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              
              {filteredDoctors.length === 0 && doctors.length > 0 && (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">No doctors found matching your search criteria.</p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear search
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorList;
