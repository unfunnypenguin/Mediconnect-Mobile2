import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Shield, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type HealthcareAlert = {
  id: string;
  message_content: string;
  sent_at: string;
};

const HealthcareAlertBar: React.FC = () => {
  const [alert, setAlert] = useState<HealthcareAlert | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchLatestAlert() {
      try {
        // Get the latest alert
        const { data: alerts, error } = await supabase
          .from('healthcare_alerts')
          .select('id, message_content, sent_at')
          .order('sent_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error fetching healthcare alerts:', error);
          return;
        }

        if (alerts && alerts.length > 0) {
          setAlert(alerts[0]);
        }
      } catch (error) {
        console.error('Error in fetchLatestAlert:', error);
      }
    }

    fetchLatestAlert();
  }, []);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleClick = () => {
    // Navigate to healthcare alerts view
    navigate('/patient/healthcare-alerts');
  };

  if (!alert) return null;

  return (
    <div className="mb-6">
      <div
        className="flex items-center gap-3 py-3 px-3 bg-orange-50 border border-orange-200 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors"
        onClick={handleClick}
      >
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-orange-500 text-white">
            <Shield className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-orange-800 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Healthcare Alerts
            </div>
            <div className="text-xs text-orange-600">
              {formatTime(alert.sent_at)}
            </div>
          </div>
          <div className="text-sm text-orange-700 mt-1 truncate">
            Latest: {alert.message_content}
          </div>
          <div className="text-xs text-orange-500 mt-1 italic">
            System messages - Click to view all
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthcareAlertBar;
