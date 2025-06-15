-- Create the medication_refills table
CREATE TABLE public.medication_refills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  medication_type VARCHAR(255) NOT NULL,
  last_refill_date TIMESTAMP WITH TIME ZONE NOT NULL,
  next_refill_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Add constraint to ensure next_refill_date is after last_refill_date
  CONSTRAINT next_date_after_last_date CHECK (next_refill_date > last_refill_date)
);

-- Create index for faster queries by patient_id
CREATE INDEX medication_refills_patient_id_idx ON public.medication_refills (patient_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.medication_refills ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own medication refill data
CREATE POLICY "Users can view their own medication refills" 
  ON public.medication_refills 
  FOR SELECT 
  USING (auth.uid() = patient_id);

-- Policy to allow users to insert their own medication refill data
CREATE POLICY "Users can insert their own medication refills" 
  ON public.medication_refills 
  FOR INSERT 
  WITH CHECK (auth.uid() = patient_id);

-- Policy to allow users to update their own medication refill data
CREATE POLICY "Users can update their own medication refills" 
  ON public.medication_refills 
  FOR UPDATE 
  USING (auth.uid() = patient_id);

-- Policy to allow users to delete their own medication refill data
CREATE POLICY "Users can delete their own medication refills" 
  ON public.medication_refills 
  FOR DELETE 
  USING (auth.uid() = patient_id);

-- Add the table to the public schema
GRANT ALL ON public.medication_refills TO postgres, service_role;

-- Update the database types to include the medication_refills table 