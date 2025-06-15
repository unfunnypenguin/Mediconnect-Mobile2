
-- Add more specific appointment statuses and rejection reason field
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update the status field to support more specific statuses if needed
-- The current status field already exists with default 'pending'

-- Enable RLS on appointments table if not already enabled
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for appointments
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Patients can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can update their appointments" ON public.appointments;

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

-- Doctors can update appointments where they are the doctor (for accepting/rejecting)
CREATE POLICY "Doctors can update their appointments" 
  ON public.appointments 
  FOR UPDATE 
  USING (auth.uid() = doctor_id);
