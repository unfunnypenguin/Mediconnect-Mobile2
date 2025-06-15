
-- First, let's make sure we have proper RLS policies for appointments table
-- Enable RLS on appointments table if not already enabled
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can update their appointments" ON public.appointments;

-- Create policies for appointments
-- Patients can create appointments
CREATE POLICY "Patients can create appointments" 
  ON public.appointments 
  FOR INSERT 
  WITH CHECK (auth.uid() = patient_id);

-- Patients can view their own appointments
CREATE POLICY "Patients can view their appointments" 
  ON public.appointments 
  FOR SELECT 
  USING (auth.uid() = patient_id);

-- Doctors can view appointments where they are the doctor
CREATE POLICY "Doctors can view their appointments" 
  ON public.appointments 
  FOR SELECT 
  USING (auth.uid() = doctor_id);

-- Doctors can update appointments where they are the doctor
CREATE POLICY "Doctors can update their appointments" 
  ON public.appointments 
  FOR UPDATE 
  USING (auth.uid() = doctor_id);

-- Add a function to get doctor ID by name (for the appointment scheduler)
CREATE OR REPLACE FUNCTION public.get_doctor_id_by_name(doctor_name text)
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  doctor_uuid uuid;
BEGIN
  SELECT profiles.id INTO doctor_uuid 
  FROM public.profiles 
  WHERE profiles.name = doctor_name 
    AND profiles.role = 'doctor'
  LIMIT 1;
  
  RETURN doctor_uuid;
END;
$$;
