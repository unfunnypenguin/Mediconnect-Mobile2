
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Upload, FileText, AlertTriangle } from 'lucide-react';

const complaintSchema = z.object({
  doctorId: z.string().min(1, 'Please select a doctor'),
  reason: z.string().min(1, 'Please select a reason'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  attachment: z.instanceof(File).optional(),
});

type ComplaintFormData = z.infer<typeof complaintSchema>;

interface ComplaintFormProps {
  doctorId?: string;
  doctorName?: string;
  onSuccess?: () => void;
}

const COMPLAINT_REASONS = [
  'Unprofessional behavior',
  'Poor medical care',
  'Communication issues',
  'Inappropriate conduct',
  'Billing disputes',
  'Privacy concerns',
  'Other'
];

const ComplaintForm: React.FC<ComplaintFormProps> = ({ 
  doctorId, 
  doctorName, 
  onSuccess 
}) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string }>>([]);

  const form = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      doctorId: doctorId || '',
      reason: '',
      description: '',
    },
  });

  // Fetch doctors if no specific doctor is provided
  React.useEffect(() => {
    if (!doctorId) {
      fetchDoctors();
    }
  }, [doctorId]);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'doctor')
        .eq('is_verified', true);

      if (error) throw error;

      const formattedDoctors = data?.map(doctor => ({
        id: doctor.id,
        name: `${doctor.first_name} ${doctor.last_name}`.trim() || doctor.id
      })) || [];

      setDoctors(formattedDoctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    }
  };

  const uploadAttachment = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('complaint-attachments')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('complaint-attachments')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      toast.error('Failed to upload attachment');
      return null;
    }
  };

  const onSubmit = async (data: ComplaintFormData) => {
    if (!user) {
      toast.error('You must be logged in to submit a complaint');
      return;
    }

    setIsSubmitting(true);

    try {
      let attachmentUrl = null;
      if (data.attachment) {
        attachmentUrl = await uploadAttachment(data.attachment);
        if (!attachmentUrl) {
          setIsSubmitting(false);
          return;
        }
      }

      const complaintData = {
        patient_id: user.id,
        doctor_id: data.doctorId,
        reason: data.reason,
        description: data.description,
        attachment_url: attachmentUrl,
      };

      const { error } = await supabase
        .from('complaints')
        .insert(complaintData);

      if (error) {
        throw error;
      }

      toast.success('Complaint submitted successfully', {
        description: 'Your complaint has been submitted and will be reviewed by our admin team.',
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error('Failed to submit complaint', {
        description: 'Please try again later.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Submit a Complaint
        </CardTitle>
        <CardDescription>
          Report any issues or concerns about a healthcare professional. All complaints are reviewed confidentially.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="doctorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Doctor</FormLabel>
                  <FormControl>
                    {doctorId ? (
                      <Input 
                        value={doctorName || 'Selected Doctor'} 
                        disabled 
                        className="bg-muted"
                      />
                    ) : (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map((doctor) => (
                            <SelectItem key={doctor.id} value={doctor.id}>
                              {doctor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Complaint</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPLAINT_REASONS.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide detailed information about your complaint..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="attachment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supporting Document (Optional)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          field.onChange(file);
                        }}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    Upload screenshots, documents, or other supporting files (Max 10MB)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => form.reset()}
                disabled={isSubmitting}
              >
                Clear Form
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ComplaintForm;
