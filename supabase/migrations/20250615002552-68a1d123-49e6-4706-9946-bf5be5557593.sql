
-- Create a function to notify admins about new complaints (without accessing admin_users table)
CREATE OR REPLACE FUNCTION public.notify_new_complaint()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Notify the specific admin user ID we know exists
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    related_id,
    action_url
  ) VALUES (
    'd55a36b6-1779-430b-bb82-41af35c7f375', -- Known admin user ID
    'New Complaint Submitted',
    'A new complaint has been submitted and requires review',
    'system',
    NEW.id,
    '/admin/dashboard/complaints'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new complaint notifications
CREATE TRIGGER notify_new_complaint_trigger
  AFTER INSERT ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_complaint();
