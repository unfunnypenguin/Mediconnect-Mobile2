
-- First, drop all policies that depend on the is_admin_user() function
DROP POLICY IF EXISTS "Admins can view complaint actions" ON public.complaint_actions;
DROP POLICY IF EXISTS "Admins can create complaint actions" ON public.complaint_actions;
DROP POLICY IF EXISTS "Admins can update complaint actions" ON public.complaint_actions;
DROP POLICY IF EXISTS "Admins can delete complaint actions" ON public.complaint_actions;
DROP POLICY IF EXISTS "Admins can view all complaint attachments" ON storage.objects;

-- Now drop all complaint-related policies to start fresh
DROP POLICY IF EXISTS "Patients can view their own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Patients can create their own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins can view all complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins can update complaints" ON public.complaints;
DROP POLICY IF EXISTS "Patients can create complaints" ON public.complaints;

-- Now we can safely drop the problematic function
DROP FUNCTION IF EXISTS public.is_admin_user();

-- Create simple, direct policies for patients only (no admin policies for now)
CREATE POLICY "Patients can create their own complaints" ON public.complaints
  FOR INSERT 
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can view their own complaints" ON public.complaints
  FOR SELECT 
  USING (auth.uid() = patient_id);

-- Make sure the storage bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('complaint-attachments', 'complaint-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Simple storage policies for authenticated users (no admin-specific policies)
DROP POLICY IF EXISTS "Users can upload complaint attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own complaint attachments" ON storage.objects;

CREATE POLICY "Authenticated users can upload to complaint-attachments" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'complaint-attachments' AND 
    auth.role() = 'authenticated'
  );

CREATE POLICY "Authenticated users can view complaint-attachments" ON storage.objects
  FOR SELECT 
  USING (
    bucket_id = 'complaint-attachments' AND 
    auth.role() = 'authenticated'
  );
