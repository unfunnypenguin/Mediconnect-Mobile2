
-- Drop all existing policies on notifications table
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can view their notifications" ON public.notifications;

-- Now create the correct policies
-- Allow users to view their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to mark their own notifications as read
CREATE POLICY "Users can update their own notifications" 
ON public.notifications
FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow system/triggers to create notifications for any user (this is the key fix)
CREATE POLICY "System can create notifications" 
ON public.notifications
FOR INSERT 
WITH CHECK (true);
