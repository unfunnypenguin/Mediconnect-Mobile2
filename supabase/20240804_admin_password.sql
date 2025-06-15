-- Create a function to set up the admin user's password
CREATE OR REPLACE FUNCTION public.setup_admin_password()
RETURNS void AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- Get the admin user's ID
  SELECT id INTO admin_id FROM public.profiles WHERE email = 'admin@mediconnect.com';
  
  IF admin_id IS NOT NULL THEN
    -- Set the admin user's password using Supabase Auth
    PERFORM auth.users_update_password(
      admin_id,
      '@$Medi.Connect.2025x'  -- This is the same password as before
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function
SELECT public.setup_admin_password();

-- Drop the function after use
DROP FUNCTION public.setup_admin_password(); 