import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { BellRing, Info, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface HealthcareAlert {
  id: string;
  message_content: string;
  sent_at: string;
  sent_by_admin_id: string | null;
  delivery: {
    id: string;
    read_at: string | null;
  } | null;
}

const HealthcareAlertsInbox: React.FC = () => {
  const [alerts, setAlerts] = useState<HealthcareAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('healthcare_alerts')
          .select(`
            id, 
            message_content, 
            sent_at, 
            sent_by_admin_id,
            user_alert_deliveries!inner(
              id,
              read_at
            )
          `)
          .eq('user_alert_deliveries.user_id', (await supabase.auth.getUser()).data.user?.id)
          .order('sent_at', { ascending: false });

        if (error) {
          throw error;
        }

        // Transform the data to match our interface
        const transformedAlerts = data?.map(alert => ({
          id: alert.id,
          message_content: alert.message_content,
          sent_at: alert.sent_at,
          sent_by_admin_id: alert.sent_by_admin_id,
          delivery: alert.user_alert_deliveries?.[0] || null
        })) || [];

        setAlerts(transformedAlerts);
      } catch (err: any) {
        console.error("Error fetching healthcare alerts:", err);
        setError("Failed to load healthcare alerts.");
        toast.error("Failed to load alerts", {
          description: err.message || "Please try again later."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();

    // Realtime subscription for new alerts
    const subscription = supabase
      .channel('healthcare_alerts_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_alert_deliveries' },
        async (payload) => {
          console.log('New alert delivery received:', payload);
          // Refresh the alerts when a new delivery is created
          fetchAlerts();
          toast.info("New Healthcare Alert!", {
            description: "You have received a new healthcare alert",
            icon: <BellRing className="h-4 w-4" />,
            duration: 5000
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const markAsRead = async (alertId: string, deliveryId: string) => {
    try {
      const { error } = await supabase
        .from('user_alert_deliveries')
        .update({ read_at: new Date().toISOString() })
        .eq('id', deliveryId);

      if (error) throw error;

      // Update local state
      setAlerts(prevAlerts =>
        prevAlerts.map(alert =>
          alert.id === alertId && alert.delivery
            ? {
                ...alert,
                delivery: {
                  ...alert.delivery,
                  read_at: new Date().toISOString()
                }
              }
            : alert
        )
      );

      toast.success("Alert marked as read");
    } catch (error: any) {
      console.error("Error marking alert as read:", error);
      toast.error("Failed to mark alert as read");
    }
  };

  return (
    <Card className="col-span-1 lg:col-span-2 mx-auto w-full max-w-md md:max-w-none">
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <CardTitle className="text-lg font-medium">Healthcare Alerts</CardTitle>
        <BellRing className="h-5 w-5 text-blue-500" />
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {isLoading && <p className="text-muted-foreground">Loading alerts...</p>}
        {error && (
          <div className="flex items-center text-red-500 p-2">
            <Info className="h-4 w-4 mr-2" />
            <p>{error}</p>
          </div>
        )}
        {!isLoading && !error && alerts.length === 0 && (
          <p className="text-muted-foreground p-2">No healthcare alerts to display.</p>
        )}
        <ScrollArea className="h-[400px]">
          {!isLoading && !error && alerts.length > 0 && alerts.map((alert) => (
            <div key={alert.id} className={`py-3 px-3 rounded-lg mb-2 ${
              !alert.delivery?.read_at ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'bg-gray-50'
            }`}>
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-1.5">
                  <BellRing className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700">Healthcare Alert</span>
                  {alert.delivery?.read_at && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
                {alert.delivery && !alert.delivery.read_at && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markAsRead(alert.id, alert.delivery!.id)}
                    className="text-xs h-7 px-2"
                  >
                    Mark as Read
                  </Button>
                )}
              </div>
              <p className="text-sm font-medium mb-1">{alert.message_content}</p>
              <p className="text-xs text-muted-foreground">
                Sent: {new Date(alert.sent_at).toLocaleString()}
                {alert.delivery?.read_at && (
                  <span className="ml-1.5">
                    • Read: {new Date(alert.delivery.read_at).toLocaleString()}
                  </span>
                )}
              </p>
              <Separator className="mt-3" />
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default HealthcareAlertsInbox;
