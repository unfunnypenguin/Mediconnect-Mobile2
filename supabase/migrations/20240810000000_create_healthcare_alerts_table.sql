-- Create the healthcare_alerts table
CREATE TABLE public.healthcare_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_content TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    sent_by_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Add RLS to the healthcare_alerts table
ALTER TABLE public.healthcare_alerts ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read alerts (all doctors and patients)
CREATE POLICY "Allow authenticated users to read healthcare alerts" ON public.healthcare_alerts
FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for admins to create alerts
CREATE POLICY "Allow admins to create healthcare alerts" ON public.healthcare_alerts
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Optional: Grant usage to authenticated and anon for sequence if any
GRANT ALL ON public.healthcare_alerts TO authenticated;
GRANT ALL ON public.healthcare_alerts TO anon; 