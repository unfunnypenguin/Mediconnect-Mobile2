import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Eye, Calendar, FileText, Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Complaint {
  id: string;
  reason: string;
  description: string | null;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  attachment_url?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  admin_notes?: string | null;
  doctor_name: string;
}

const ComplaintsList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [editingComplaint, setEditingComplaint] = useState<Complaint | null>(null);
  const [editForm, setEditForm] = useState({
    reason: '',
    description: ''
  });
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchComplaints();
    }
  }, [user]);

  const fetchComplaints = async () => {
    try {
      console.log('Fetching complaints for user:', user?.id);
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          doctor:profiles!complaints_doctor_id_fkey(first_name, last_name)
        `)
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching complaints:', error);
        throw error;
      }

      console.log('Raw complaints data:', data);

      const formattedComplaints = data?.map(complaint => ({
        id: complaint.id,
        reason: complaint.reason,
        description: complaint.description,
        status: complaint.status as 'pending' | 'under_review' | 'resolved' | 'dismissed',
        attachment_url: complaint.attachment_url,
        created_at: complaint.created_at,
        updated_at: complaint.updated_at,
        resolved_at: complaint.resolved_at,
        admin_notes: complaint.admin_notes,
        doctor_name: `${complaint.doctor?.first_name || ''} ${complaint.doctor?.last_name || ''}`.trim() || 'Unknown Doctor'
      })) || [];

      console.log('Formatted complaints:', formattedComplaints);
      setComplaints(formattedComplaints);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleEditComplaint = async () => {
    if (!editingComplaint) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('complaints')
        .update({
          reason: editForm.reason,
          description: editForm.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingComplaint.id);

      if (error) throw error;

      toast.success('Complaint updated successfully');
      setEditingComplaint(null);
      
      // Update local state immediately
      setComplaints(prev => prev.map(complaint => 
        complaint.id === editingComplaint.id 
          ? { 
              ...complaint, 
              reason: editForm.reason, 
              description: editForm.description,
              updated_at: new Date().toISOString()
            }
          : complaint
      ));
    } catch (error) {
      console.error('Error updating complaint:', error);
      toast.error('Failed to update complaint');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteComplaint = async (complaintId: string) => {
    setDeleting(complaintId);
    try {
      console.log('Deleting complaint:', complaintId);
      const { error } = await supabase
        .from('complaints')
        .delete()
        .eq('id', complaintId);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      console.log('Delete successful, updating local state');
      toast.success('Complaint deleted successfully');
      
      // Update local state immediately by filtering out the deleted complaint
      setComplaints(prev => {
        const updated = prev.filter(complaint => complaint.id !== complaintId);
        console.log('Updated complaints after delete:', updated);
        return updated;
      });
    } catch (error) {
      console.error('Error deleting complaint:', error);
      toast.error('Failed to delete complaint');
    } finally {
      setDeleting(null);
    }
  };

  const openEditDialog = (complaint: Complaint) => {
    setEditingComplaint(complaint);
    setEditForm({
      reason: complaint.reason,
      description: complaint.description || ''
    });
  };

  const canEdit = (complaint: Complaint) => {
    return complaint.status === 'pending' || complaint.status === 'under_review';
  };

  const canDelete = (complaint: Complaint) => {
    return complaint.status === 'pending';
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'under_review':
        return 'Under Review';
      case 'resolved':
        return 'Resolved';
      case 'dismissed':
        return 'Dismissed';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Complaints</h2>
          <Button 
            onClick={() => navigate('/patient/complaints/new')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Submit New Complaint
          </Button>
        </div>
        
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No Complaints Submitted</h3>
            <p className="text-muted-foreground mb-6">
              You haven't submitted any complaints yet. If you have concerns about a healthcare professional, you can submit a complaint for review.
            </p>
            <Button 
              onClick={() => navigate('/patient/complaints/new')}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              Submit Your First Complaint
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Complaints</h2>
        <Button 
          onClick={() => navigate('/patient/complaints/new')}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Submit New Complaint
        </Button>
      </div>

      <div className="space-y-4">
        {complaints.map((complaint) => (
          <Card key={complaint.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">Dr. {complaint.doctor_name}</h3>
                    <Badge className={getStatusColor(complaint.status)}>
                      {getStatusText(complaint.status)}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Reason: {complaint.reason}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {complaint.description}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  {/* View Details Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedComplaint(complaint)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Complaint Details</DialogTitle>
                      </DialogHeader>
                      {selectedComplaint && (
                        <div className="space-y-4">
                          {/* ... keep existing code (complaint details display) */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium">Doctor</Label>
                              <p className="text-sm">Dr. {selectedComplaint.doctor_name}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Status</Label>
                              <Badge className={getStatusColor(selectedComplaint.status)}>
                                {getStatusText(selectedComplaint.status)}
                              </Badge>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium">Reason</Label>
                            <p className="text-sm">{selectedComplaint.reason}</p>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium">Description</Label>
                            <p className="text-sm whitespace-pre-wrap">{selectedComplaint.description}</p>
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
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <Label className="text-sm font-medium">Submitted</Label>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(selectedComplaint.created_at), 'PPP')}
                              </p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Last Updated</Label>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(selectedComplaint.updated_at), 'PPP')}
                              </p>
                            </div>
                          </div>
                          
                          {selectedComplaint.admin_notes && (
                            <div>
                              <Label className="text-sm font-medium">Admin Notes</Label>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {selectedComplaint.admin_notes}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {/* Edit Button */}
                  {canEdit(complaint) && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(complaint)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Edit Complaint</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="edit-reason">Reason</Label>
                            <Select
                              value={editForm.reason}
                              onValueChange={(value) => setEditForm(prev => ({ ...prev, reason: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a reason" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unprofessional_behavior">Unprofessional Behavior</SelectItem>
                                <SelectItem value="medical_negligence">Medical Negligence</SelectItem>
                                <SelectItem value="poor_communication">Poor Communication</SelectItem>
                                <SelectItem value="billing_issues">Billing Issues</SelectItem>
                                <SelectItem value="appointment_issues">Appointment Issues</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                              id="edit-description"
                              value={editForm.description}
                              onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Provide details about your complaint..."
                              className="min-h-[100px]"
                            />
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              onClick={() => setEditingComplaint(null)}
                              disabled={updating}
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleEditComplaint}
                              disabled={updating || !editForm.reason.trim()}
                            >
                              {updating ? 'Updating...' : 'Update Complaint'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* Delete Button */}
                  {canDelete(complaint) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={deleting === complaint.id}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {deleting === complaint.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Complaint</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this complaint? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteComplaint(complaint.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Submitted {format(new Date(complaint.created_at), 'MMM d, yyyy')}
                </div>
                {complaint.attachment_url && (
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Has attachment
                  </div>
                )}
                {complaint.updated_at !== complaint.created_at && (
                  <div className="flex items-center gap-1 text-blue-600">
                    <Edit className="h-4 w-4" />
                    Updated {format(new Date(complaint.updated_at), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ComplaintsList;
