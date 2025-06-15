
-- Enable RLS on chat_sessions table if not already enabled
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Allow patients to create chat sessions
CREATE POLICY "Patients can create chat sessions" 
  ON public.chat_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = patient_id);

-- Allow patients to view their own chat sessions
CREATE POLICY "Patients can view their chat sessions" 
  ON public.chat_sessions 
  FOR SELECT 
  USING (auth.uid() = patient_id);

-- Allow doctors to view chat sessions where they are the doctor
CREATE POLICY "Doctors can view their chat sessions" 
  ON public.chat_sessions 
  FOR SELECT 
  USING (auth.uid() = doctor_id);

-- Allow both patients and doctors to update their chat sessions
CREATE POLICY "Users can update their chat sessions" 
  ON public.chat_sessions 
  FOR UPDATE 
  USING (auth.uid() = patient_id OR auth.uid() = doctor_id);

-- Enable RLS on chat_messages table if not already enabled
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow users to view messages in sessions they participate in
CREATE POLICY "Users can view messages in their sessions" 
  ON public.chat_messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions 
      WHERE id = session_id 
      AND (patient_id = auth.uid() OR doctor_id = auth.uid())
    )
  );

-- Allow users to insert messages in sessions they participate in
CREATE POLICY "Users can insert messages in their sessions" 
  ON public.chat_messages 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions 
      WHERE id = session_id 
      AND (patient_id = auth.uid() OR doctor_id = auth.uid())
    )
  );
