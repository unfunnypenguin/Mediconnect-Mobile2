import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { supabase, updateDoctorVerificationStatus } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { toast } from "sonner";
import { 
  FileText, ExternalLink, CheckCircle, XCircle, User, 
  Building, FileCheck, Clock, Search, Users, X, Check, Settings, AlertCircle
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';

interface DoctorApplication {
  doctor_id: string;
  specialty: string;
  verification_status: string;
  license_number: string | null;
  nrc_number: string | null;
  institution_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  province: string;
  institution_name: string;
  date_created: string | null;
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    date_created: string;
  } | null;
  healthcare_institutions: {
    id: string;
    name: string;
    province: string;
  } | null;
}

interface PendingVerificationsProps {
  onStatusChange?: () => void;
}

export interface PendingVerificationsRef {
  refresh: () => void;
}

const PendingVerifications = forwardRef<PendingVerificationsRef, PendingVerificationsProps>(({ onStatusChange }, ref) => {
  const [applications, setApplications] = useState<DoctorApplication[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [currentDoctorId, setCurrentDoctorId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentApplication, setCurrentApplication] = useState<DoctorApplication | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth(); // Get the current authenticated user

  const fetchPendingVerifications = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("🔍 Fetching pending verifications...");
      
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select(`
          doctor_id,
          specialty,
          verification_status,
          license_number,
          nrc_number,
          institution_id,
          first_name,
          last_name,
          email,
          province,
          institution_name,
          date_created,
          profiles!fk_doctor_profiles_doctor_id(
            id,
            email,
            first_name,
            last_name,
            date_created
          ),
          healthcare_institutions!fk_doctor_profiles_institution_id(
            id,
            name,
            province
          )
        `)
        .eq('verification_status', 'pending');

      if (error) {
        console.error("❌ Database error:", error);
        throw error;
      }

      console.log("✅ Fetched data:", data);
      setApplications(data || []);
    } catch (error: any) {
      console.error('💥 Error fetching pending verifications:', error);
      setError("Failed to load pending applications. Try refreshing the page.");
      toast.error('Failed to load pending verifications', {
        description: error.message
      });
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Expose refresh function to parent component
  useImperativeHandle(ref, () => ({
    refresh: fetchPendingVerifications
  }));

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const handleApprove = async (doctorId: string) => {
    if (!user || user.role !== 'admin') {
      toast.error('You are not authorized to perform this action.');
      return;
    }

    try {
      console.log("✅ Starting approval process for doctor:", doctorId);
      
      const adminId = user.id;
      const { success, error: updateError } = await updateDoctorVerificationStatus(
        doctorId,
        'approved',
        adminId,
        null,
        currentApplication?.province || null,
        currentApplication?.institution_name || null
      );

      if (!success) {
        console.error("❌ Error updating doctor profile:", updateError);
        throw updateError;
      }

      console.log("✅ Doctor profile approved successfully");

      setApplications(prev => prev.filter(app => app.doctor_id !== doctorId));

      toast.success('Doctor application approved', {
        description: 'The doctor has been verified and can now login to the system.'
      });

      if (onStatusChange) {
        await onStatusChange();
      }

      await fetchPendingVerifications();

    } catch (error: any) {
      console.error('❌ Error approving doctor:', error);
      toast.error('Failed to approve doctor', {
        description: error.message
      });
      await fetchPendingVerifications();
    }
  };

  const handleOpenRejectDialog = (application: DoctorApplication) => {
    setCurrentDoctorId(application.doctor_id);
    setCurrentApplication(application);
  };

  const handleReject = async () => {
    if (!currentDoctorId) return;

    if (!user || user.role !== 'admin') {
      toast.error('You are not authorized to perform this action.');
      return;
    }
    
    try {
      console.log("❌ Starting rejection process for doctor:", currentDoctorId, "Reason:", rejectionReason);
      
      const adminId = user.id;
      const { success, error: updateError } = await updateDoctorVerificationStatus(
        currentDoctorId,
        'rejected',
        adminId,
        rejectionReason
      );

      if (!success) {
        console.error("❌ Error updating doctor profile:", updateError);
        throw updateError;
      }

      setApplications(prev => prev.filter(app => app.doctor_id !== currentDoctorId));
      
      setRejectionReason('');
      setCurrentDoctorId(null);
      setCurrentApplication(null);

      toast.success('Doctor application rejected', {
        description: 'The doctor has been notified of the rejection.'
      });

      if (onStatusChange) {
        await onStatusChange();
      }

      await fetchPendingVerifications();

    } catch (error: any) {
      console.error('❌ Error rejecting doctor:', error);
      toast.error('Failed to reject doctor', {
        description: error.message
      });
      await fetchPendingVerifications();
    }
  };

  const formatNrcNumber = (nrc: string | null) => {
    if (!nrc) return 'Not provided';
    // Remove any existing non-digit characters to re-apply the format consistently
    let cleanedNrc = nrc.replace(/[^0-9]/g, '');
    
    // Apply the XXXXXX/XX/X format
    if (cleanedNrc.length > 6) {
      cleanedNrc = cleanedNrc.slice(0, 6) + '/' + cleanedNrc.slice(6);
    }
    if (cleanedNrc.length > 9) {
      cleanedNrc = cleanedNrc.slice(0, 9) + '/' + cleanedNrc.slice(9);
    }
    // Truncate if it's longer than the expected format (XXXXXX/XX/X is 11 chars)
    if (cleanedNrc.length > 11) {
      cleanedNrc = cleanedNrc.slice(0, 11);
    }
    return cleanedNrc;
  };

  const filteredApplications = applications.filter((application) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    const firstName = application.profiles?.first_name || application.first_name || '';
    const lastName = application.profiles?.last_name || application.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    const doctorEmail = application.profiles?.email || application.email || '';
    const specialty = application.specialty?.toLowerCase() || '';
    const institutionName = application.healthcare_institutions?.name?.toLowerCase() || application.institution_name?.toLowerCase() || '';
    const province = application.healthcare_institutions?.province?.toLowerCase() || application.province?.toLowerCase() || '';
    
    return (
      fullName.toLowerCase().includes(searchLower) ||
      doctorEmail.toLowerCase().includes(searchLower) ||
      specialty.includes(searchLower) ||
      institutionName.includes(searchLower) ||
      province.includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading pending verifications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Error Loading Data</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchPendingVerifications}>Try Again</Button>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Users className="h-12 w-12 text-blue-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Pending Applications</h3>
        <p className="text-muted-foreground">
          No doctor applications are currently pending review.
        </p>
        <Button onClick={fetchPendingVerifications} className="mt-4">
          Refresh to Check Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium">Pending Verifications ({applications.length})</h2>
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
          <Button variant="outline" onClick={fetchPendingVerifications} size="sm">
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
              <TableHead>License Number</TableHead>
              <TableHead>NRC Number</TableHead>
              <TableHead>Province</TableHead>
              <TableHead>Institution</TableHead>
              <TableHead>Date Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications.map((application) => {
              const firstName = application.profiles?.first_name || application.first_name;
              const lastName = application.profiles?.last_name || application.last_name;
              const hasFullName = firstName && lastName;
              const fullName = hasFullName 
                ? `${firstName} ${lastName}` 
                : (firstName || lastName || 'Name not provided');
              
              const doctorEmail = application.profiles?.email || application.email || 'Email not provided';
              
              const dateSubmitted = application.profiles?.date_created || application.date_created
                ? new Date(application.profiles?.date_created || application.date_created).toLocaleDateString() 
                : 'Date not available';
              
              return (
                <TableRow key={application.doctor_id}>
                  <TableCell className="font-medium">
                    {fullName}
                    {!hasFullName && (
                      <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Missing
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {doctorEmail}
                    {!doctorEmail.includes('@') && (
                      <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Missing
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {application.specialty || 'Not specified'}
                  </TableCell>
                  <TableCell>
                    {application.license_number || 'Not provided'}
                  </TableCell>
                  <TableCell>
                    {formatNrcNumber(application.nrc_number)}
                  </TableCell>
                  <TableCell>
                    {application.healthcare_institutions?.province || application.province || 'Not specified'}
                  </TableCell>
                  <TableCell>
                    {application.healthcare_institutions?.name || application.institution_name || 'Not specified'}
                  </TableCell>
                  <TableCell>{dateSubmitted}</TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      onClick={() => handleApprove(application.doctor_id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleOpenRejectDialog(application)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Rejection Dialog */}
      <Dialog 
        open={currentDoctorId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCurrentDoctorId(null);
            setCurrentApplication(null);
            setRejectionReason('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Doctor Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this application.
            </DialogDescription>
          </DialogHeader>
          
          {currentApplication && (
            <div className="bg-slate-50 p-3 rounded-md mb-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium">Name:</span> {currentApplication.profiles?.first_name || currentApplication.first_name} {currentApplication.profiles?.last_name || currentApplication.last_name}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {currentApplication.profiles?.email || currentApplication.email}
                </div>
                <div>
                  <span className="font-medium">Specialty:</span> {currentApplication.specialty || 'Not specified'}
                </div>
                <div>
                  <span className="font-medium">Institution:</span> {currentApplication.healthcare_institutions?.name || currentApplication.institution_name || 'Not specified'}
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Rejection</Label>
              <Textarea
                id="reason"
                placeholder="Please explain why this application is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCurrentDoctorId(null);
              setCurrentApplication(null);
              setRejectionReason('');
            }}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

PendingVerifications.displayName = 'PendingVerifications';

export default PendingVerifications;
