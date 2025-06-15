
-- Create a table to track which users have received each alert
CREATE TABLE public.user_alert_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES public.healthcare_alerts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    delivered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    read_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(alert_id, user_id)
);

-- Add RLS policies for user_alert_deliveries
ALTER TABLE public.user_alert_deliveries ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own alert deliveries
CREATE POLICY "Users can view their own alert deliveries" 
    ON public.user_alert_deliveries 
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Policy for users to update their own alert deliveries (mark as read)
CREATE POLICY "Users can update their own alert deliveries" 
    ON public.user_alert_deliveries 
    FOR UPDATE 
    USING (auth.uid() = user_id);

-- Policy for authenticated users to insert alert deliveries (for the trigger)
CREATE POLICY "System can insert alert deliveries" 
    ON public.user_alert_deliveries 
    FOR INSERT 
    WITH CHECK (true);

-- Create a function to automatically deliver alerts to all users when an alert is created
CREATE OR REPLACE FUNCTION public.deliver_alert_to_all_users()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert a delivery record for each registered user
    INSERT INTO public.user_alert_deliveries (alert_id, user_id)
    SELECT NEW.id, profiles.id
    FROM public.profiles
    WHERE profiles.role IN ('doctor', 'patient');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically deliver alerts when they are created
CREATE TRIGGER trigger_deliver_alert_to_users
    AFTER INSERT ON public.healthcare_alerts
    FOR EACH ROW
    EXECUTE FUNCTION public.deliver_alert_to_all_users();

-- Update the notifications table to include healthcare alert notifications
-- Add a new notification type for healthcare alerts
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notification_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notification_type_check CHECK (
    type IN ('medication_refill', 'appointment', 'system', 'healthcare_alert')
);

-- Create a function to create notifications for healthcare alerts
CREATE OR REPLACE FUNCTION public.create_alert_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Create a notification for each user when an alert is delivered
    INSERT INTO public.notifications (user_id, title, message, type, related_id, action_url)
    SELECT 
        NEW.user_id,
        'New Healthcare Alert',
        (SELECT LEFT(message_content, 100) || CASE WHEN LENGTH(message_content) > 100 THEN '...' ELSE '' END 
         FROM public.healthcare_alerts WHERE id = NEW.alert_id),
        'healthcare_alert',
        NEW.alert_id,
        '/notifications'
    FROM public.healthcare_alerts 
    WHERE id = NEW.alert_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to create notifications when alerts are delivered
CREATE TRIGGER trigger_create_alert_notifications
    AFTER INSERT ON public.user_alert_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION public.create_alert_notifications();
