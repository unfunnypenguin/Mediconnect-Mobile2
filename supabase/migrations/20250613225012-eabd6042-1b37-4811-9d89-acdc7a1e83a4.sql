
-- First, let's check what RLS policies exist on healthcare_alerts table
-- and update them to properly handle admin authentication

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow admins to create healthcare alerts" ON public.healthcare_alerts;
DROP POLICY IF EXISTS "Allow authenticated users to read healthcare alerts" ON public.healthcare_alerts;

-- Create a more flexible policy for reading alerts (all authenticated users)
CREATE POLICY "Allow authenticated users to read healthcare alerts" 
ON public.healthcare_alerts
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create a policy for inserting alerts that allows:
-- 1. Users with admin role in profiles table
-- 2. Service role (for backend operations)
CREATE POLICY "Allow admins to create healthcare alerts" 
ON public.healthcare_alerts
FOR INSERT 
WITH CHECK (
  -- Allow if user has admin role in profiles table
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  OR
  -- Allow service role for backend operations
  auth.role() = 'service_role'
);

-- Also ensure the admin profile exists in the database
-- Insert the admin profile if it doesn't exist
INSERT INTO public.profiles (id, email, role, first_name, last_name, name, date_created)
VALUES (
  'd55a36b6-1779-430b-bb82-41af35c7f375',
  'admin@mediconnect.com',
  'admin',
  'MediConnect',
  'Admin',
  'MediConnect Admin',
  now()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  email = 'admin@mediconnect.com',
  name = 'MediConnect Admin',
  first_name = 'MediConnect',
  last_name = 'Admin';
