import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Eye, Edit, UserX, MessageCircle, FileText, Search, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Complaint {
  id: string;
  patient_id: string;
  doctor_id: string;
  reason: string;
  description: string | null;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  attachment_url?: string | null;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  patient_name: string;
  doctor_name: string;
  patient_email: string;
  doctor_email: string;
}

const ComplaintsManagement: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchComplaints();
    
    // Set up real-time subscription for complaints changes
    console.log('Setting up real-time subscription for complaints...');
    const channel = supabase
      .channel('complaints-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'complaints'
        },
        (payload) => {
          console.log('Real-time complaint change detected:', payload);
          console.log('Event type:', payload.eventType);
          console.log('Payload old:', payload.old);
          console.log('Payload new:', payload.new);
          
          if (payload.eventType === 'DELETE') {
            // Remove the deleted complaint from local state
            const deletedId = payload.old?.id;
            console.log('Attempting to delete complaint with ID:', deletedId);
            
            if (deletedId) {
              setComplaints(prev => {
                console.log('Current complaints before delete:', prev.length);
                console.log('Current complaint IDs:', prev.map(c => c.id));
                const updated = prev.filter(complaint => complaint.id !== deletedId);
                console.log('Complaint deleted via real-time. Before:', prev.length, 'After:', updated.length);
                console.log('Deleted complaint ID:', deletedId);
                console.log('Remaining complaint IDs:', updated.map(c => c.id));
                return updated;
              });
              toast.info('A complaint was deleted by the patient');
            } else {
              console.error('No ID found in deleted complaint payload:', payload.old);
              // Fallback: refresh the entire list
              console.log('Refreshing complaints list due to missing ID');
              fetchComplaints();
            }
          } else if (payload.eventType === 'UPDATE') {
            // Refresh the complaints list to get updated data with profile joins
            console.log('Complaint updated via real-time, refreshing list');
            fetchComplaints();
            toast.info('A complaint was updated');
          } else if (payload.eventType === 'INSERT') {
            // Refresh the complaints list to get new data with profile joins
            console.log('New complaint added via real-time, refreshing list');
            fetchComplaints();
            toast.info('A new complaint was submitted');
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching complaints for admin dashboard...');
      
      // First, let's see all complaints without joins to debug
      const { data: rawComplaints, error: rawError } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('📋 Raw complaints data:', rawComplaints);
      console.log('❌ Raw complaints error:', rawError);

      if (rawError) {
        console.error('Error fetching raw complaints:', rawError);
        throw rawError;
      }

      if (!rawComplaints || rawComplaints.length === 0) {
        console.log('📭 No complaints found in database');
        setComplaints([]);
        return;
      }

      // Now fetch with profile joins
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          patient:profiles!complaints_patient_id_fkey(first_name, last_name, email),
          doctor:profiles!complaints_doctor_id_fkey(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false });

      console.log('📋 Complaints with profiles data:', data);
      console.log('❌ Complaints with profiles error:', error);

      if (error) {
        console.error('Error fetching complaints with profiles:', error);
        // Fallback to basic complaints if profile join fails
        const formattedComplaints = rawComplaints.map(complaint => ({
          id: complaint.id,
          patient_id: complaint.patient_id,
          doctor_id: complaint.doctor_id,
          reason: complaint.reason,
          description: complaint.description,
          status: complaint.status as 'pending' | 'under_review' | 'resolved' | 'dismissed',
          attachment_url: complaint.attachment_url,
          admin_notes: complaint.admin_notes,
          created_at: complaint.created_at,
          updated_at: complaint.updated_at,
          resolved_at: complaint.resolved_at,
          patient_name: 'Loading...',
          doctor_name: 'Loading...',
          patient_email: '',
          doctor_email: ''
        }));
        setComplaints(formattedComplaints);
        return;
      }

      const formattedComplaints = data?.map(complaint => ({
        id: complaint.id,
        patient_id: complaint.patient_id,
        doctor_id: complaint.doctor_id,
        reason: complaint.reason,
        description: complaint.description,
        status: complaint.status as 'pending' | 'under_review' | 'resolved' | 'dismissed',
        attachment_url: complaint.attachment_url,
        admin_notes: complaint.admin_notes,
        created_at: complaint.created_at,
        updated_at: complaint.updated_at,
        resolved_at: complaint.resolved_at,
        patient_name: `${complaint.patient?.first_name || ''} ${complaint.patient?.last_name || ''}`.trim() || 'Unknown Patient',
        doctor_name: `${complaint.doctor?.first_name || ''} ${complaint.doctor?.last_name || ''}`.trim() || 'Unknown Doctor',
        patient_email: complaint.patient?.email || '',
        doctor_email: complaint.doctor?.email || ''
      })) || [];

      console.log('✅ Formatted complaints:', formattedComplaints);
      setComplaints(formattedComplaints);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const updateComplaintStatus = async (complaintId: string, newStatus: string, notes?: string) => {
    setActionLoading(true);
    try {
      const updateData: any = {
        status: newStatus,
        admin_id: user?.id,
      };

      if (notes) {
        updateData.admin_notes = notes;
      }

      const { error } = await supabase
        .from('complaints')
        .update(updateData)
        .eq('id', complaintId);

      if (error) throw error;

      // Log the action
      await supabase
        .from('complaint_actions')
        .insert({
          complaint_id: complaintId,
          admin_id: user?.id,
          action_type: 'status_change',
          action_details: `Status changed to ${newStatus}${notes ? '. Notes: ' + notes : ''}`
        });

      toast.success(`Complaint status updated to ${newStatus}`);
      fetchComplaints(); // Refresh the list
      setSelectedComplaint(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating complaint:', error);
      toast.error('Failed to update complaint status');
    } finally {
      setActionLoading(false);
    }
  };

  const suspendDoctor = async (doctorId: string, complaintId: string) => {
    setActionLoading(true);
    try {
      // Update doctor's verification status
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ is_verified: false })
        .eq('id', doctorId);

      if (profileError) throw profileError;

      // Update doctor profile status
      const { error: doctorError } = await supabase
        .from('doctor_profiles')
        .update({ verification_status: 'suspended' })
        .eq('doctor_id', doctorId);

      if (doctorError) throw doctorError;

      // Log the action
      await supabase
        .from('complaint_actions')
        .insert({
          complaint_id: complaintId,
          admin_id: user?.id,
          action_type: 'doctor_suspended',
          action_details: 'Doctor account suspended due to complaint'
        });

      toast.success('Doctor account has been suspended');
      fetchComplaints();
    } catch (error) {
      console.error('Error suspending doctor:', error);
      toast.error('Failed to suspend doctor account');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'dismissed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      complaint.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Complaints Management</h1>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {filteredComplaints.length} complaint(s)
          </Badge>
          <Button 
            onClick={fetchComplaints} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search complaints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-700">
              <strong>Debug Info:</strong> Found {complaints.length} total complaints, {filteredComplaints.length} after filtering
            </p>
          </CardContent>
        </Card>
      )}

      {/* Complaints Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComplaints.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{complaint.patient_name}</p>
                      <p className="text-sm text-muted-foreground">{complaint.patient_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">Dr. {complaint.doctor_name}</p>
                      <p className="text-sm text-muted-foreground">{complaint.doctor_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{complaint.reason}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {complaint.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(complaint.status)}>
                      {complaint.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(complaint.created_at), 'MMM d, yyyy')}
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(complaint.created_at), 'h:mm a')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedComplaint(complaint);
                              setAdminNotes(complaint.admin_notes || '');
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Complaint Details & Management</DialogTitle>
                          </DialogHeader>
                          {selectedComplaint && (
                            <div className="space-y-6">
                              {/* Complaint Details */}
                              <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <div>
                                    <Label className="text-sm font-medium">Patient</Label>
                                    <p className="text-sm">{selectedComplaint.patient_name}</p>
                                    <p className="text-xs text-muted-foreground">{selectedComplaint.patient_email}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Doctor</Label>
                                    <p className="text-sm">Dr. {selectedComplaint.doctor_name}</p>
                                    <p className="text-xs text-muted-foreground">{selectedComplaint.doctor_email}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Reason</Label>
                                    <p className="text-sm">{selectedComplaint.reason}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Current Status</Label>
                                    <Badge className={getStatusColor(selectedComplaint.status)}>
                                      {selectedComplaint.status.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <div className="space-y-4">
                                  <div>
                                    <Label className="text-sm font-medium">Description</Label>
                                    <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                                      {selectedComplaint.description}
                                    </p>
                                  </div>
                                  {selectedComplaint.attachment_url && (
                                    <div>
                                      <Label className="text-sm font-medium">Attachment</Label>
                                      <a 
                                        href={selectedComplaint.attachment_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                                      >
                                        <FileText className="h-4 w-4" />
                                        View Attachment
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Admin Actions */}
                              <div className="border-t pt-4 space-y-4">
                                <Label className="text-sm font-medium">Admin Notes</Label>
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Add notes about this complaint..."
                                  className="min-h-[80px]"
                                />
                                
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    onClick={() => updateComplaintStatus(selectedComplaint.id, 'under_review', adminNotes)}
                                    disabled={actionLoading}
                                    variant="outline"
                                  >
                                    Mark Under Review
                                  </Button>
                                  <Button
                                    onClick={() => updateComplaintStatus(selectedComplaint.id, 'resolved', adminNotes)}
                                    disabled={actionLoading}
                                    variant="outline"
                                  >
                                    Mark Resolved
                                  </Button>
                                  <Button
                                    onClick={() => updateComplaintStatus(selectedComplaint.id, 'dismissed', adminNotes)}
                                    disabled={actionLoading}
                                    variant="outline"
                                  >
                                    Dismiss
                                  </Button>
                                  
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive" disabled={actionLoading}>
                                        <UserX className="h-4 w-4 mr-2" />
                                        Suspend Doctor
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Suspend Doctor Account</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will suspend Dr. {selectedComplaint.doctor_name}'s account and prevent them from accessing the platform. This action can be reversed later.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => suspendDoctor(selectedComplaint.doctor_id, selectedComplaint.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Suspend Doctor
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredComplaints.length === 0 && (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Complaints Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No complaints match your current filters.' 
                  : 'No complaints have been submitted yet.'
                }
              </p>
              {complaints.length > 0 && (
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="mt-4"
                  variant="outline"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplaintsManagement;
