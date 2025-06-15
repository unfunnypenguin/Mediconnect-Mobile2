
-- Create complaints table to store patient reports about doctors
CREATE TABLE public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  attachment_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  admin_notes TEXT,
  admin_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on complaints table
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Create policies for complaints table
-- Only admins can view all complaints
CREATE POLICY "Admins can view all complaints" ON public.complaints
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE id = auth.uid()
    )
  );

-- Only authenticated patients can insert their own complaints
CREATE POLICY "Patients can create complaints" ON public.complaints
  FOR INSERT 
  WITH CHECK (
    auth.uid() = patient_id AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'patient'
    )
  );

-- Only admins can update complaints
CREATE POLICY "Admins can update complaints" ON public.complaints
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE id = auth.uid()
    )
  );

-- Create complaint_actions table to track admin actions on complaints
CREATE TABLE public.complaint_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES public.profiles(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('status_change', 'warning_sent', 'doctor_suspended', 'account_deleted')),
  action_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on complaint_actions table
ALTER TABLE public.complaint_actions ENABLE ROW LEVEL SECURITY;

-- Only admins can view and insert complaint actions
CREATE POLICY "Admins can manage complaint actions" ON public.complaint_actions
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE id = auth.uid()
    )
  );

-- Create function to update complaint timestamp on status change
CREATE OR REPLACE FUNCTION update_complaint_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  
  -- Set resolved_at when status changes to resolved
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = now();
  ELSIF NEW.status != 'resolved' THEN
    NEW.resolved_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for complaint updates
CREATE TRIGGER update_complaint_timestamp_trigger
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION update_complaint_timestamp();

-- Create function to send notifications when complaint status changes
CREATE OR REPLACE FUNCTION notify_complaint_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify patient about status change
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    related_id,
    action_url
  ) VALUES (
    NEW.patient_id,
    'Complaint Status Updated',
    'Your complaint status has been updated to: ' || NEW.status,
    'system',
    NEW.id,
    '/patient/complaints'
  );
  
  -- Notify admin if complaint is newly submitted
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      related_id,
      action_url
    )
    SELECT 
      admin_users.id,
      'New Complaint Submitted',
      'A new complaint has been submitted and requires review',
      'system',
      NEW.id,
      '/admin/dashboard/complaints'
    FROM public.admin_users;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for complaint notifications
CREATE TRIGGER notify_complaint_status_change_trigger
  AFTER INSERT OR UPDATE OF status ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION notify_complaint_status_change();

-- Create storage bucket for complaint attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('complaint-attachments', 'complaint-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for complaint attachments
CREATE POLICY "Authenticated users can upload complaint attachments" ON storage.objects
  FOR INSERT 
  WITH CHECK (bucket_id = 'complaint-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can view complaint attachments" ON storage.objects
  FOR SELECT 
  USING (
    bucket_id = 'complaint-attachments' AND
    EXISTS (
      SELECT 1 FROM public.admin_users WHERE id = auth.uid()
    )
  );
