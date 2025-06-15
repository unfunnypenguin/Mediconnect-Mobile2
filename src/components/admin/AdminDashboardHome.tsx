import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, UserCheck, UserX, Clock, BarChart4, Activity, Users, Calendar, Send, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { Textarea } from '@/components/ui/textarea';
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface HealthcareAlert {
  id: string;
  message_content: string;
  sent_at: string;
  sent_by_admin_id: string | null;
}

const AdminDashboardHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalDoctors: 0,
    recentApprovals: 0,
    recentRejections: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [previousAlerts, setPreviousAlerts] = useState<HealthcareAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboardStats = async () => {
      // Only attempt to fetch data if user is defined and authenticated
      if (!user?.id) {
        console.log("User not authenticated, skipping dashboard stats fetch.");
        setIsLoading(false); // Ensure loading state is false if not authenticated
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Fetching admin dashboard stats...");
        
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        console.log("Executing pending doctors query...");
        const pendingPromise = supabase.from('doctor_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending');
        console.log("Executing approved doctors query...");
        const approvedPromise = supabase.from('doctor_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'approved');
        console.log("Executing rejected doctors query...");
        const rejectedPromise = supabase.from('doctor_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'rejected');
        console.log("Executing recent approvals query...");
        const recentApprovalsPromise = supabase.from('doctor_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'approved').gte('review_date', lastWeek.toISOString());
        console.log("Executing recent rejections query...");
        const recentRejectionsPromise = supabase.from('doctor_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'rejected').gte('review_date', lastWeek.toISOString());

        const [pendingRes, approvedRes, rejectedRes, recentApprovalsRes, recentRejectionsRes] = await Promise.all([
          pendingPromise,
          approvedPromise,
          rejectedPromise,
          recentApprovalsPromise,
          recentRejectionsPromise
        ]);
        console.log("All Supabase queries for dashboard stats completed.");

        if (pendingRes.error) throw pendingRes.error;
        if (approvedRes.error) throw approvedRes.error;
        if (rejectedRes.error) throw rejectedRes.error;
        if (recentApprovalsRes.error) throw recentApprovalsRes.error;
        if (recentRejectionsRes.error) throw recentRejectionsRes.error;

        const pendingCount = pendingRes.count || 0;
        const approvedCount = approvedRes.count || 0;
        const rejectedCount = rejectedRes.count || 0;
        const recentApprovals = recentApprovalsRes.count || 0;
        const recentRejections = recentRejectionsRes.count || 0;

        console.log("Stats fetched:", {
          pendingCount,
          approvedCount,
          rejectedCount,
          recentApprovals,
          recentRejections
        });

        setStats({
          pendingCount,
          approvedCount,
          rejectedCount,
          totalDoctors: pendingCount + approvedCount + rejectedCount,
          recentApprovals,
          recentRejections
        });
      } catch (error: any) {
        console.error('Error fetching dashboard stats:', error);
        setError(`Failed to load dashboard statistics: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchPreviousAlerts = async () => {
      setAlertsLoading(true);
      try {
        console.log("Fetching previous healthcare alerts...");
        const { data, error } = await supabase
          .from('healthcare_alerts')
          .select('*')
          .order('sent_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        setPreviousAlerts(data || []);
        console.log("Previous alerts fetched:", data);
      } catch (error: any) {
        console.error('Error fetching previous alerts:', error);
        toast.error("Failed to load previous alerts", {
          description: error.message || "Please try again"
        });
      } finally {
        setAlertsLoading(false);
      }
    };

    fetchDashboardStats();
    fetchPreviousAlerts();
  }, [user?.id]); // Add user.id as a dependency

  const pieData = [
    { name: 'Pending', value: stats.pendingCount, color: '#f97316' }, // Orange
    { name: 'Approved', value: stats.approvedCount, color: '#10b981' }, // Green
    { name: 'Rejected', value: stats.rejectedCount, color: '#ef4444' }, // Red
  ];

  const activityData = [
    { name: 'Approved', lastWeek: stats.recentApprovals, total: stats.approvedCount },
    { name: 'Rejected', lastWeek: stats.recentRejections, total: stats.rejectedCount },
    { name: 'Pending', lastWeek: stats.pendingCount, total: stats.pendingCount },
  ];

  const handleSendAlert = async () => {
    if (!alertMessage.trim()) {
      toast.error("Please enter an alert message");
      return;
    }

    setIsSendingAlert(true);
    try {
      console.log("Sending healthcare alert...");
      
      // Use the actual database admin ID directly
      const adminUserId = 'd55a36b6-1779-430b-bb82-41af35c7f375';
      
      const { data, error } = await supabase.from('healthcare_alerts').insert([
        {
          message_content: alertMessage.trim(),
          sent_by_admin_id: adminUserId,
          sent_at: new Date().toISOString()
        }
      ]).select();

      if (error) throw error;

      console.log("Alert sent successfully:", data);
      toast.success("Healthcare alert sent successfully", {
        description: "All registered users will receive this alert"
      });
      setAlertMessage('');
      
      // Refresh the previous alerts list
      const { data: alertsData, error: alertsError } = await supabase
        .from('healthcare_alerts')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(10);

      if (!alertsError) {
        setPreviousAlerts(alertsData || []);
      }
    } catch (error: any) {
      console.error('Error sending healthcare alert:', error);
      toast.error("Failed to send healthcare alert", {
        description: error.message || "Please try again"
      });
    } finally {
      setIsSendingAlert(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading dashboard statistics...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Activity className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Error Loading Data</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Verifications
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="ghost" 
              className="w-full text-xs"
              onClick={() => navigate('/admin/dashboard/pending')}
            >
              View all pending
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Approved Doctors
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedCount}</div>
            <p className="text-xs text-muted-foreground">
              Active healthcare professionals
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="ghost" 
              className="w-full text-xs"
              onClick={() => navigate('/admin/dashboard/approved')}
            >
              View approved doctors
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rejected Applications
            </CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejectedCount}</div>
            <p className="text-xs text-muted-foreground">
              Declined healthcare professionals
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="ghost" 
              className="w-full text-xs"
              onClick={() => navigate('/admin/dashboard/rejected')}
            >
              View rejected applications
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Healthcare Professionals
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDoctors}</div>
            <p className="text-xs text-muted-foreground">
              All registered healthcare providers
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full text-xs" disabled>
              All accounts
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Send Healthcare Alert
            </CardTitle>
            <Send className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder="Type your alert message here..."
              className="min-h-[80px] mb-2"
              value={alertMessage}
              onChange={(e) => setAlertMessage(e.target.value)}
            />
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              className="w-full"
              onClick={handleSendAlert}
              disabled={!alertMessage.trim() || isSendingAlert}
            >
              {isSendingAlert ? 'Sending...' : 'Send Alert'}
            </Button>
            
            <Collapsible open={isAlertsOpen} onOpenChange={setIsAlertsOpen} className="w-full">
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Previous Healthcare Alerts ({previousAlerts.length})</span>
                  </div>
                  {isAlertsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <div className="border rounded-lg p-4 bg-gray-50">
                  {alertsLoading ? (
                    <p className="text-muted-foreground text-sm">Loading previous alerts...</p>
                  ) : previousAlerts.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No alerts have been sent yet.</p>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {previousAlerts.map((alert) => (
                        <div key={alert.id} className="border rounded-lg p-3 bg-white">
                          <p className="text-sm font-medium mb-1">{alert.message_content}</p>
                          <p className="text-xs text-muted-foreground">
                            Sent: {new Date(alert.sent_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Doctor Verification Status</CardTitle>
            <CardDescription>Distribution of healthcare providers by verification status</CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(value) => [`${value} doctors`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Verification Activity</CardTitle>
            <CardDescription>Comparison of verification status counts</CardDescription>
          </CardHeader>
          <CardContent className="px-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#8884d8" name="Total" />
                  <Bar dataKey="lastWeek" fill="#82ca9d" name="Last 7 Days" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Doctor verification activity in the last 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentApprovals > 0 && (
              <div className="flex items-center gap-4">
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {stats.recentApprovals} doctor{stats.recentApprovals !== 1 ? 's' : ''} approved in the last week
                  </p>
                  <p className="text-xs text-muted-foreground">
                    These doctors can now access the platform
                  </p>
                </div>
              </div>
            )}

            {stats.recentRejections > 0 && (
              <div className="flex items-center gap-4">
                <div className="bg-red-100 p-2 rounded-full">
                  <UserX className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {stats.recentRejections} application{stats.recentRejections !== 1 ? 's' : ''} rejected in the last week
                  </p>
                  <p className="text-xs text-muted-foreground">
                    These applicants have been notified
                  </p>
                </div>
              </div>
            )}

            {stats.pendingCount > 0 && (
              <div className="flex items-center gap-4">
                <div className="bg-orange-100 p-2 rounded-full">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {stats.pendingCount} application{stats.pendingCount !== 1 ? 's' : ''} awaiting your review
                  </p>
                  <p className="text-xs text-muted-foreground">
                    These need to be approved or rejected
                  </p>
                </div>
              </div>
            )}

            {stats.pendingCount === 0 && stats.recentApprovals === 0 && stats.recentRejections === 0 && (
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    No recent activity to show
                  </p>
                  <p className="text-xs text-muted-foreground">
                    The system is up to date with all verifications
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/admin/dashboard/pending')}
            disabled={stats.pendingCount === 0}
          >
            {stats.pendingCount > 0 
              ? `Review ${stats.pendingCount} pending application${stats.pendingCount !== 1 ? 's' : ''}` 
              : 'No pending applications'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminDashboardHome;
