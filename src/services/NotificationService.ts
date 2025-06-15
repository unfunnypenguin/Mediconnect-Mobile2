
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, isBefore } from 'date-fns';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'medication_refill' | 'appointment' | 'system';
  read: boolean;
  action_url?: string;
  related_id?: string;
  created_at: string;
}

export const NotificationService = {
  /**
   * Check for medication refill notifications
   * @param userId - The user ID to check notifications for
   */
  checkMedicationRefills: async (userId: string): Promise<void> => {
    try {
      // Get all active medication refills for the user
      const { data: refills, error } = await supabase
        .from('medication_refills')
        .select('*')
        .eq('patient_id', userId)
        .eq('notifications_enabled', true);

      if (error) throw error;

      if (!refills || refills.length === 0) return;

      const today = new Date();
      
      // Check each refill
      for (const refill of refills) {
        const nextRefillDate = new Date(refill.next_refill_date);
        
        // If the refill date is today or has passed
        if (isBefore(nextRefillDate, today) || format(nextRefillDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
          // Create a notification if one doesn't already exist for this refill date
          const { data: existingNotifications, error: checkError } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .eq('type', 'medication_refill')
            .eq('related_id', refill.id)
            .gte('created_at', format(today, 'yyyy-MM-dd'));
          
          if (checkError) throw checkError;
          
          // If no notification exists for today, create one
          if (!existingNotifications || existingNotifications.length === 0) {
            await NotificationService.createNotification({
              user_id: userId,
              title: 'Medication Refill Due',
              message: "It's time to refill your ARV prescription. Please visit your clinic or pharmacy.",
              type: 'medication_refill',
              related_id: refill.id,
              action_url: '/patient/medication-refills'
            });
            
            // Show a toast notification
            toast.info('Medication Refill Reminder', {
              description: "It's time to refill your ARV prescription. Please visit your clinic or pharmacy.",
              duration: 10000
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking medication refills:', error);
    }
  },

  /**
   * Create a new notification
   * @param notification - The notification data
   */
  createNotification: async (notification: {
    user_id: string;
    title: string;
    message: string;
    type: 'medication_refill' | 'appointment' | 'system';
    related_id?: string;
    action_url?: string;
  }): Promise<void> => {
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: notification.user_id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        related_id: notification.related_id,
        action_url: notification.action_url,
        read: false,
        created_at: new Date().toISOString()
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  },

  /**
   * Get all notifications for a user
   * @param userId - The user ID to get notifications for
   * @returns A list of notifications
   */
  getNotifications: async (userId: string): Promise<Notification[]> => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Ensure we properly type the returned data
      const typedData = data?.map(notification => ({
        ...notification,
        type: notification.type as 'medication_refill' | 'appointment' | 'system'
      })) || [];

      return typedData;
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  },

  /**
   * Mark a notification as read
   * @param notificationId - The notification ID to mark as read
   */
  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }
};

export default NotificationService;
