
-- Let's check what triggers exist on the complaints table and remove the problematic one
DROP TRIGGER IF EXISTS notify_complaint_status_change_trigger ON public.complaints;

-- Also drop the function that might be causing issues
DROP FUNCTION IF EXISTS public.notify_complaint_status_change();

-- Create a simpler version that doesn't try to access admin_users
CREATE OR REPLACE FUNCTION public.notify_complaint_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only notify patient about status change (no admin notification for now)
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    related_id,
    action_url
  ) VALUES (
    NEW.patient_id,
    'Complaint Status Updated',
    'Your complaint status has been updated to: ' || NEW.status,
    'system',
    NEW.id,
    '/patient/complaints'
  );
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger for status changes only (not inserts)
CREATE TRIGGER notify_complaint_status_change_trigger
  AFTER UPDATE OF status ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION notify_complaint_status_change();
