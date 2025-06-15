
-- Update the notifications table constraint to include new notification types
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notification_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notification_type_check CHECK (
  type IN ('medication_refill', 'appointment', 'system', 'healthcare_alert', 'message', 'appointment_request')
);

-- Create function to notify doctor of new messages
CREATE OR REPLACE FUNCTION public.notify_doctor_of_new_message()
RETURNS TRIGGER AS $$
DECLARE
  doctor_id_var UUID;
  patient_name TEXT;
  session_info RECORD;
BEGIN
  -- Get the chat session info including doctor_id and patient info
  SELECT cs.doctor_id, cs.patient_id INTO session_info
  FROM public.chat_sessions cs
  WHERE cs.id = NEW.session_id;
  
  -- Only create notification if sender is not the doctor
  IF session_info.doctor_id IS NOT NULL AND NEW.sender_id != session_info.doctor_id THEN
    -- Get patient name
    SELECT CONCAT(first_name, ' ', last_name) INTO patient_name
    FROM public.profiles
    WHERE id = session_info.patient_id;
    
    -- Create notification for doctor
    INSERT INTO public.notifications (
      user_id, 
      title, 
      message, 
      type, 
      related_id,
      action_url
    ) VALUES (
      session_info.doctor_id,
      'New Message',
      CONCAT('New message from ', COALESCE(patient_name, 'Patient')),
      'message',
      NEW.session_id,
      CONCAT('/chat/', NEW.session_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new chat messages
DROP TRIGGER IF EXISTS trigger_notify_doctor_new_message ON public.chat_messages;
CREATE TRIGGER trigger_notify_doctor_new_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_doctor_of_new_message();

-- Create function to notify doctor of new appointment requests
CREATE OR REPLACE FUNCTION public.notify_doctor_of_appointment_request()
RETURNS TRIGGER AS $$
DECLARE
  patient_name TEXT;
BEGIN
  -- Only create notification for pending appointments
  IF NEW.status = 'pending' THEN
    -- Get patient name
    SELECT CONCAT(first_name, ' ', last_name) INTO patient_name
    FROM public.profiles
    WHERE id = NEW.patient_id;
    
    -- Create notification for doctor
    INSERT INTO public.notifications (
      user_id, 
      title, 
      message, 
      type, 
      related_id,
      action_url
    ) VALUES (
      NEW.doctor_id,
      'New Appointment Request',
      CONCAT('New appointment request from ', COALESCE(patient_name, 'Patient'), ' for ', NEW.appointment_date),
      'appointment_request',
      NEW.id,
      '/doctor/appointments'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new appointment requests
DROP TRIGGER IF EXISTS trigger_notify_doctor_appointment_request ON public.appointments;
CREATE TRIGGER trigger_notify_doctor_appointment_request
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_doctor_of_appointment_request();
