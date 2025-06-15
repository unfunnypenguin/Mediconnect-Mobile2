-- Create a function to handle new user sign-ups and create doctor_profiles
CREATE OR REPLACE FUNCTION public.handle_new_doctor_profile()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    user_email TEXT;
    first_name TEXT;
    last_name TEXT;
    specialty TEXT;
    license_number TEXT;
    nrc_number TEXT;
    province TEXT;
    institution_name TEXT;
    institution_id UUID;
BEGIN
    -- Get user role from new user metadata
    user_role := NEW.raw_user_meta_data ->> 'role';
    user_email := NEW.email;
    first_name := NEW.raw_user_meta_data ->> 'firstName';
    last_name := NEW.raw_user_meta_data ->> 'lastName';

    IF user_role = 'doctor' THEN
        -- Extract doctor-specific metadata
        specialty := NEW.raw_user_meta_data ->> 'specialty';
        license_number := NEW.raw_user_meta_data ->> 'licenseNumber';
        nrc_number := NEW.raw_user_meta_data ->> 'nrcNumber';
        province := NEW.raw_user_meta_data ->> 'province';
        institution_name := NEW.raw_user_meta_data ->> 'institution_name';

        -- Look up the institution_id based on the institution name
        SELECT id INTO institution_id
        FROM public.healthcare_institutions
        WHERE name = institution_name;

        INSERT INTO public.doctor_profiles (
            doctor_id, 
            profile_id,
            first_name, 
            last_name, 
            email, 
            specialty, 
            province, 
            institution_name, 
            institution_id,
            license_number, 
            nrc_number, 
            verification_status, 
            date_created, 
            date_updated
        ) VALUES (
            NEW.id,
            NEW.id,
            COALESCE(first_name, ''),
            COALESCE(last_name, ''),
            COALESCE(user_email, ''),
            COALESCE(specialty, ''),
            COALESCE(province, ''),
            COALESCE(institution_name, ''),
            institution_id,
            license_number,
            nrc_number,
            'pending',
            NOW(),
            NOW()
        )
        ON CONFLICT (doctor_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created_for_doctor_profiles ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created_for_doctor_profiles
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_doctor_profile();

-- Optional: Ensure RLS is enabled for doctor_profiles if not already
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;

-- Optional: Grant necessary permissions if not already configured
GRANT ALL ON public.doctor_profiles TO authenticated;
GRANT ALL ON public.doctor_profiles TO anon; 