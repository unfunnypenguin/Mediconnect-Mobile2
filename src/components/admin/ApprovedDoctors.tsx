
import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search, BadgeCheck, CheckCircle, User, AlertCircle
} from 'lucide-react';

// Correct interface to match actual Supabase response
interface ApprovedDoctor {
  doctor_id: string;
  specialty: string;
  verification_status: string;
  license_number?: string | null;
  review_date?: string | null;
  institution_id?: string | null;
  nrc_number?: string | null;
  province: string | null;
  institution_name: string | null;
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  healthcare_institutions?: {
    id: string;
    name: string | null;
    province: string | null;
  } | null;
}

export interface ApprovedDoctorsRef {
  refresh: () => void;
}

const ApprovedDoctors = forwardRef<ApprovedDoctorsRef, {}>((props, ref) => {
  const [doctors, setDoctors] = useState<ApprovedDoctor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchApprovedDoctors = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Fetching approved doctors...");
      
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select(`
          doctor_id,
          specialty,
          verification_status,
          license_number,
          review_date,
          institution_id,
          nrc_number,
          province,
          institution_name,
          profiles!fk_doctor_profiles_doctor_id(
            id,
            email,
            first_name,
            last_name
          ),
          healthcare_institutions!fk_doctor_profiles_institution_id(
            id,
            name,
            province
          )
        `)
        .eq('verification_status', 'approved');

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      console.log('Approved doctors data:', data);
      console.log('Number of approved doctors:', data?.length || 0);

      setDoctors(data || []);
    } catch (error: any) {
      console.error('Error fetching approved doctors:', error);
      setError("Failed to load approved doctors. Try refreshing the page.");
      toast.error('Failed to load approved doctors', {
        description: error.message
      });
      setDoctors([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Expose refresh function to parent component
  useImperativeHandle(ref, () => ({
    refresh: fetchApprovedDoctors
  }));

  useEffect(() => {
    fetchApprovedDoctors();
  }, []);

  const filteredDoctors = doctors.filter((doctor) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const firstName = doctor.profiles?.first_name || '';
    const lastName = doctor.profiles?.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const doctorEmail = doctor.profiles?.email?.toLowerCase() || '';
    const specialty = doctor.specialty?.toLowerCase() || '';
    
    // Use the direct province and institution_name from doctor_profiles first, then fallback to healthcare_institutions
    const province = (doctor.province || doctor.healthcare_institutions?.province || '').toLowerCase();
    const institutionName = (doctor.institution_name || doctor.healthcare_institutions?.name || '').toLowerCase();

    return (
      fullName.toLowerCase().includes(searchLower) ||
      doctorEmail.includes(searchLower) ||
      specialty.includes(searchLower) ||
      institutionName.includes(searchLower) ||
      province.includes(searchLower)
    );
  });

  const formatNrcNumber = (nrc: string | null) => {
    if (!nrc) return 'Not provided';
    let cleanedNrc = nrc.replace(/[^0-9]/g, '');
    if (cleanedNrc.length > 6) {
      cleanedNrc = cleanedNrc.slice(0, 6) + '/' + cleanedNrc.slice(6);
    }
    if (cleanedNrc.length > 9) {
      cleanedNrc = cleanedNrc.slice(0, 9) + '/' + cleanedNrc.slice(9);
    }
    if (cleanedNrc.length > 11) {
      cleanedNrc = cleanedNrc.slice(0, 11);
    }
    return cleanedNrc;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading approved doctors...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Error Loading Data</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchApprovedDoctors}>Try Again</Button>
      </div>
    );
  }

  if (filteredDoctors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <User className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Doctors Found</h3>
        <p className="text-muted-foreground">
          {searchTerm ? 'No doctors match your search criteria.' : 'No approved doctors in the system yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium">Approved Doctors ({doctors.length})</h2>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search doctors..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={fetchApprovedDoctors} size="sm">
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">Full Name</TableHead>
              <TableHead className="min-w-[200px]">Email</TableHead>
              <TableHead className="min-w-[120px]">Specialty</TableHead>
              <TableHead className="min-w-[120px]">NRC Number</TableHead>
              <TableHead className="min-w-[100px]">Province</TableHead>
              <TableHead className="min-w-[150px]">Institution</TableHead>
              <TableHead className="min-w-[120px]">Verified On</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDoctors.map((doctor) => {
              const firstName = doctor.profiles?.first_name || '';
              const lastName = doctor.profiles?.last_name || '';
              const fullName = `${firstName} ${lastName}`.trim() || 'Unknown';
              
              // Use the direct province and institution_name from doctor_profiles first, then fallback to healthcare_institutions
              const province = doctor.province || doctor.healthcare_institutions?.province || 'Not specified';
              const institutionName = doctor.institution_name || doctor.healthcare_institutions?.name || 'Not specified';
              
              return (
                <TableRow key={doctor.doctor_id}>
                  <TableCell className="font-medium">{fullName}</TableCell>
                  <TableCell className="break-all">{doctor.profiles?.email || 'Not specified'}</TableCell>
                  <TableCell>{doctor.specialty || 'Not specified'}</TableCell>
                  <TableCell>{formatNrcNumber(doctor.nrc_number)}</TableCell>
                  <TableCell>{province}</TableCell>
                  <TableCell>{institutionName}</TableCell>
                  <TableCell>
                    {doctor.review_date 
                      ? new Date(doctor.review_date).toLocaleDateString() 
                      : 'Not available'}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center text-sm font-normal bg-green-100 text-green-700 px-2 py-1 rounded-full whitespace-nowrap">
                      <BadgeCheck className="h-3 w-3 mr-1" />
                      Verified
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

ApprovedDoctors.displayName = 'ApprovedDoctors';

export default ApprovedDoctors;
