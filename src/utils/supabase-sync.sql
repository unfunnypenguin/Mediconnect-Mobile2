
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view doctor availability" ON public.doctor_availability;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Enable RLS on remaining tables (some may already be enabled)
DO $$ 
BEGIN
  -- Enable RLS only if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relname = 'profiles' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create security definer functions (these will replace if they exist)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Recreate essential RLS policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view doctor availability" ON public.doctor_availability
  FOR SELECT USING (TRUE);

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) VALUES 
('profile-photos', 'profile-photos', true),
('doctor-documents', 'doctor-documents', false),
('medical-records', 'medical-records', false)
ON CONFLICT (id) DO NOTHING;
