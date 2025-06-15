
-- Create ambulance services table
CREATE TABLE public.ambulance_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('Emergency', 'Non-Emergency', 'Private')),
  phone_number TEXT NOT NULL,
  province TEXT NOT NULL,
  district TEXT,
  estimated_response_time TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ambulance requests table
CREATE TABLE public.ambulance_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  ambulance_service_id UUID NOT NULL REFERENCES public.ambulance_services(id),
  location_province TEXT NOT NULL,
  location_district TEXT,
  location_details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Add Row Level Security (RLS) to ambulance services (public read access)
ALTER TABLE public.ambulance_services ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view ambulance services
CREATE POLICY "Anyone can view ambulance services" 
  ON public.ambulance_services 
  FOR SELECT 
  USING (is_active = true);

-- Add Row Level Security (RLS) to ambulance requests (user can only see their own)
ALTER TABLE public.ambulance_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own ambulance requests
CREATE POLICY "Users can view their own ambulance requests" 
  ON public.ambulance_requests 
  FOR SELECT 
  USING (auth.uid() = patient_id);

-- Users can create their own ambulance requests
CREATE POLICY "Users can create their own ambulance requests" 
  ON public.ambulance_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = patient_id);

-- Users can update their own ambulance requests (for cancellation)
CREATE POLICY "Users can update their own ambulance requests" 
  ON public.ambulance_requests 
  FOR UPDATE 
  USING (auth.uid() = patient_id);

-- Insert some sample ambulance services
INSERT INTO public.ambulance_services (name, service_type, phone_number, province, district, estimated_response_time) VALUES
('Emergency Medical Services Lusaka', 'Emergency', '+260-911-999-911', 'Lusaka', 'Lusaka', '5-10 minutes'),
('Red Cross Ambulance Service', 'Emergency', '+260-211-251-631', 'Lusaka', 'Lusaka', '8-15 minutes'),
('Private Medical Transport', 'Private', '+260-977-123-456', 'Lusaka', 'Lusaka', '10-20 minutes'),
('Copperbelt Emergency Services', 'Emergency', '+260-212-224-444', 'Copperbelt', 'Kitwe', '7-12 minutes'),
('Southern Province Ambulance', 'Emergency', '+260-213-331-111', 'Southern', 'Choma', '15-25 minutes'),
('Central Hospital Ambulance', 'Non-Emergency', '+260-211-254-888', 'Lusaka', 'Lusaka', '20-30 minutes');
