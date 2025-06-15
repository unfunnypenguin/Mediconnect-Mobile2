
-- Drop existing problematic policies for complaints table
DROP POLICY IF EXISTS "Admins can view all complaints" ON public.complaints;
DROP POLICY IF EXISTS "Patients can create complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins can update complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins can manage complaint actions" ON public.complaint_actions;

-- Create a security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  );
$$;

-- Create new policies for complaints table that don't cause recursion
CREATE POLICY "Patients can view their own complaints" ON public.complaints
  FOR SELECT 
  USING (auth.uid() = patient_id);

CREATE POLICY "Patients can create their own complaints" ON public.complaints
  FOR INSERT 
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Admins can view all complaints" ON public.complaints
  FOR SELECT 
  USING (public.is_admin_user());

CREATE POLICY "Admins can update complaints" ON public.complaints
  FOR UPDATE 
  USING (public.is_admin_user());

-- Create new policies for complaint_actions table
CREATE POLICY "Admins can view complaint actions" ON public.complaint_actions
  FOR SELECT 
  USING (public.is_admin_user());

CREATE POLICY "Admins can create complaint actions" ON public.complaint_actions
  FOR INSERT 
  WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can update complaint actions" ON public.complaint_actions
  FOR UPDATE 
  USING (public.is_admin_user());

CREATE POLICY "Admins can delete complaint actions" ON public.complaint_actions
  FOR DELETE 
  USING (public.is_admin_user());

-- Create storage policies for complaint attachments (if they don't exist)
CREATE POLICY "Users can upload complaint attachments" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'complaint-attachments' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view their own complaint attachments" ON storage.objects
  FOR SELECT 
  USING (
    bucket_id = 'complaint-attachments' AND 
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Admins can view all complaint attachments" ON storage.objects
  FOR SELECT 
  USING (
    bucket_id = 'complaint-attachments' AND
    public.is_admin_user()
  );
