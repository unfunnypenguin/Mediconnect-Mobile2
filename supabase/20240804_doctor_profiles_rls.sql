-- Enable RLS on doctor_profiles table
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow admins to view all doctor profiles
CREATE POLICY "Admins can view all doctor profiles"
  ON public.doctor_profiles
  FOR SELECT
  USING (public.is_admin());

-- Policy to allow admins to update doctor profiles
CREATE POLICY "Admins can update doctor profiles"
  ON public.doctor_profiles
  FOR UPDATE
  USING (public.is_admin());

-- Policy to allow doctors to view their own profile
CREATE POLICY "Doctors can view own profile"
  ON public.doctor_profiles
  FOR SELECT
  USING (auth.uid() = doctor_id);

-- Policy to allow doctors to update their own profile
CREATE POLICY "Doctors can update own profile"
  ON public.doctor_profiles
  FOR UPDATE
  USING (auth.uid() = doctor_id);

-- Policy to allow doctors to insert their own profile
CREATE POLICY "Doctors can insert own profile"
  ON public.doctor_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = doctor_id);

-- Grant access to authenticated users
GRANT ALL ON public.doctor_profiles TO postgres, service_role; 