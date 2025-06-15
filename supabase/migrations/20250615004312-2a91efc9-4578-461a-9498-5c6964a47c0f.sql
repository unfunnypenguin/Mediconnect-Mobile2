
-- Check current RLS policies on complaints table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'complaints';

-- Fix RLS policies for complaints table
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view all complaints" ON public.complaints;
DROP POLICY IF EXISTS "Patients can create complaints" ON public.complaints;
DROP POLICY IF EXISTS "Admins can update complaints" ON public.complaints;

-- Create new policies that work with the actual admin user structure
-- Allow users with admin role in profiles table to view all complaints
CREATE POLICY "Admins can view all complaints" ON public.complaints
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow authenticated patients to insert their own complaints
CREATE POLICY "Patients can create complaints" ON public.complaints
  FOR INSERT 
  WITH CHECK (
    auth.uid() = patient_id AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'patient'
    )
  );

-- Allow users with admin role to update complaints
CREATE POLICY "Admins can update complaints" ON public.complaints
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Also allow admins to manage complaint actions
DROP POLICY IF EXISTS "Admins can manage complaint actions" ON public.complaint_actions;

CREATE POLICY "Admins can manage complaint actions" ON public.complaint_actions
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
