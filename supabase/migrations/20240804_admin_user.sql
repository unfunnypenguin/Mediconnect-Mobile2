-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_super_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on admin_users table
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Policy to allow admins to view all admin users
CREATE POLICY "Admins can view all admin users"
  ON public.admin_users
  FOR SELECT
  USING (public.is_admin());

-- Policy to allow super admins to manage admin users
CREATE POLICY "Super admins can manage admin users"
  ON public.admin_users
  USING (EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE id = auth.uid() AND is_super_admin = true
  ));

-- Grant access to authenticated users
GRANT ALL ON public.admin_users TO postgres, service_role;

-- Insert the default admin user if it doesn't exist
DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Check if admin profile exists
  SELECT id INTO admin_id FROM public.profiles WHERE email = 'admin@mediconnect.com';
  
  IF admin_id IS NULL THEN
    -- Create admin profile
    INSERT INTO public.profiles (id, email, role, first_name, last_name, name, date_created)
    VALUES (
      gen_random_uuid(),
      'admin@mediconnect.com',
      'admin',
      'MediConnect',
      'Admin',
      'MediConnect Admin',
      now()
    )
    RETURNING id INTO admin_id;
    
    -- Create admin user
    INSERT INTO public.admin_users (id, is_super_admin)
    VALUES (admin_id, true);
  END IF;
END $$; 