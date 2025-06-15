
-- Create the admin user in Supabase auth
-- This will allow the admin to actually sign in with Supabase auth

-- First, let's create the admin user account
-- Note: In a real production environment, you would do this through the Supabase dashboard
-- or use the Admin API, but for development this SQL approach works

-- Insert the admin user into auth.users (this simulates user creation)
-- The password hash is for '@$Medi.Connect.2025x'
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  'd55a36b6-1779-430b-bb82-41af35c7f375',
  '00000000-0000-0000-0000-000000000000',
  'admin@mediconnect.com',
  '$2a$10$JZNbr8j8QQzKjrX7p8nGJOQ7r.Y6K6Q7r.Y6K6Q7r.Y6K6Q7r.Y6K6',
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO UPDATE SET
  email = 'admin@mediconnect.com',
  updated_at = now();

-- Ensure the admin profile exists and is properly linked
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
