
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Shield, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type HealthcareAlert = {
  id: string;
  message_content: string;
  sent_at: string;
};

const HealthcareAlertsView: React.FC = () => {
  const [alerts, setAlerts] = useState<HealthcareAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchHealthcareAlerts() {
      setLoading(true);
      console.log('Fetching healthcare alerts...');
      
      try {
        const { data, error } = await supabase
          .from('healthcare_alerts')
          .select('id, message_content, sent_at')
          .order('sent_at', { ascending: true });

        if (error) {
          console.error('Error fetching healthcare alerts:', error);
          toast({
            title: "Error",
            description: "Failed to load healthcare alerts.",
            variant: "destructive"
          });
          return;
        }

        console.log('Fetched healthcare alerts:', data);
        setAlerts(data || []);
        
      } catch (error) {
        console.error('Error in fetchHealthcareAlerts:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading alerts.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchHealthcareAlerts();
  }, [toast]);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const handleBack = () => {
    navigate('/doctor/chat');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-orange-500 text-white">
            <Shield className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-orange-800">Healthcare Alerts</h2>
          <p className="text-sm text-orange-600">System messages - No reply needed</p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No healthcare alerts yet.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="flex gap-3">
              <Avatar className="h-8 w-8 mt-1">
                <AvatarFallback className="bg-orange-500 text-white">
                  <Shield className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 max-w-[80%]">
                  <div className="text-sm text-orange-900 whitespace-pre-wrap">
                    {alert.message_content}
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-orange-600">
                  <Clock className="h-3 w-3" />
                  {formatTime(alert.sent_at)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer - No reply section */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="text-center text-sm text-gray-500 italic">
          These are system messages from healthcare administrators. No reply is needed.
        </div>
      </div>
    </div>
  );
};

export default HealthcareAlertsView;
