
-- Allow patients to update their own complaints (only if not yet resolved)
CREATE POLICY "Patients can update their own complaints" ON public.complaints
  FOR UPDATE 
  USING (
    auth.uid() = patient_id AND
    status IN ('pending', 'under_review') AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'patient'
    )
  );

-- Allow patients to delete their own complaints (only if pending)
CREATE POLICY "Patients can delete their own complaints" ON public.complaints
  FOR DELETE 
  USING (
    auth.uid() = patient_id AND
    status = 'pending' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'patient'
    )
  );
