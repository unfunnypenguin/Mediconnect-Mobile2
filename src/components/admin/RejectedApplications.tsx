
import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search, XCircle, AlertTriangle, UserX, AlertCircle
} from 'lucide-react';

// Updated interface to match database structure:
interface RejectedApplication {
  doctor_id: string;
  specialty: string;
  verification_status: string;
  verification_notes?: string | null;
  review_date?: string | null;
  license_number?: string | null;
  nrc_number?: string | null;
  institution_id?: string | null;
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

export interface RejectedApplicationsRef {
  refresh: () => void;
}

const RejectedApplications = forwardRef<RejectedApplicationsRef, {}>((props, ref) => {
  const [applications, setApplications] = useState<RejectedApplication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchRejectedApplications = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Fetching rejected applications...");
      
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select(`
          doctor_id,
          specialty,
          verification_status,
          verification_notes,
          review_date,
          license_number,
          nrc_number,
          institution_id,
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
        .eq('verification_status', 'rejected');

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log('Rejected applications data:', data);
      console.log('Number of rejected applications:', data?.length || 0);
      
      setApplications(data || []);
    } catch (error: any) {
      console.error('Error fetching rejected applications:', error);
      setError("Failed to load rejected applications. Try refreshing the page.");
      toast.error('Failed to load rejected applications', {
        description: error.message
      });
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Expose refresh function to parent component
  useImperativeHandle(ref, () => ({
    refresh: fetchRejectedApplications
  }));

  useEffect(() => {
    fetchRejectedApplications();
  }, []);

  const handleAllowReapplication = async (doctorId: string) => {
    try {
      console.log("Moving application back to pending:", doctorId);
      
      // Update the doctor's verification status back to pending
      const { error } = await supabase
        .from('doctor_profiles')
        .update({ 
          verification_status: 'pending',
          verification_notes: null,
          review_date: null
        })
        .eq('doctor_id', doctorId);

      if (error) throw error;

      toast.success('Application status updated', {
        description: 'Application has been moved back to pending verifications.'
      });

      fetchRejectedApplications();
    } catch (error: any) {
      console.error('Error updating application status:', error);
      toast.error('Failed to update application status', {
        description: error.message
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading rejected applications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Error Loading Data</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchRejectedApplications}>Try Again</Button>
      </div>
    );
  }

  const filteredApplications = applications.filter(application => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    const firstName = application.profiles?.first_name || '';
    const lastName = application.profiles?.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const doctorEmail = application.profiles?.email?.toLowerCase() || '';
    const specialty = application.specialty?.toLowerCase() || '';
    const verificationNotes = application.verification_notes?.toLowerCase() || '';
    const institutionName = application.healthcare_institutions?.name?.toLowerCase() || '';
    const province = application.healthcare_institutions?.province?.toLowerCase() || '';

    return (
      fullName.toLowerCase().includes(searchLower) ||
      doctorEmail.includes(searchLower) ||
      specialty.includes(searchLower) ||
      verificationNotes.includes(searchLower) ||
      institutionName.includes(searchLower) ||
      province.includes(searchLower)
    );
  });

  if (filteredApplications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Rejected Applications</h3>
        <p className="text-muted-foreground">
          {searchTerm ? 'No applications match your search criteria.' : 'No rejected applications in the system.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium">Rejected Applications ({applications.length})</h2>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search applications..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={fetchRejectedApplications} size="sm">
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Specialty</TableHead>
              <TableHead>License</TableHead>
              <TableHead>Institution</TableHead>
              <TableHead>Rejection Reason</TableHead>
              <TableHead>Rejected On</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications.map((application) => {
              const firstName = application.profiles?.first_name || '';
              const lastName = application.profiles?.last_name || '';
              const fullName = `${firstName} ${lastName}`.trim() || 'Unknown';
              return (
                <TableRow key={application.doctor_id}>
                  <TableCell className="font-medium">{fullName}</TableCell>
                  <TableCell>{application.profiles?.email || 'Not specified'}</TableCell>
                  <TableCell>{application.specialty || 'Not specified'}</TableCell>
                  <TableCell>{application.license_number || 'Not provided'}</TableCell>
                  <TableCell>{application.healthcare_institutions?.name || 'Not specified'}</TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={application.verification_notes || 'No reason provided'}>
                      {application.verification_notes || 'No reason provided'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {application.review_date 
                      ? new Date(application.review_date).toLocaleDateString() 
                      : 'Not available'}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleAllowReapplication(application.doctor_id)}
                    >
                      Allow Reapplication
                    </Button>
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

RejectedApplications.displayName = 'RejectedApplications';

export default RejectedApplications;
