import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Phone, Users, MessageSquare, Activity } from "lucide-react";
import { toast } from "sonner";

interface AnalyticsData {
  date: string;
  daily_signups: number;
  daily_calls: number;
  avg_call_duration: number;
  daily_translations: number;
}

interface SummaryStats {
  totalUsers: number;
  totalCalls: number;
  totalTranslations: number;
  avgCallDuration: number;
  activeUsers: number;
}

export const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalUsers: 0,
    totalCalls: 0,
    totalTranslations: 0,
    avgCallDuration: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();
      
      if (profile?.is_admin) {
        setIsAdmin(true);
        await loadAnalyticsData();
        await loadSummaryStats();
      } else {
        toast.error("Access denied. Admin privileges required.");
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      toast.error("Error checking permissions");
    } finally {
      setLoading(false);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_analytics_data', {
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      });

      if (error) throw error;
      
      const formattedData = data?.map((item: any) => ({
        date: new Date(item.date).toLocaleDateString(),
        daily_signups: Number(item.daily_signups || 0),
        daily_calls: Number(item.daily_calls || 0),
        avg_call_duration: Number(item.avg_call_duration || 0),
        daily_translations: Number(item.daily_translations || 0)
      })) || [];

      setAnalyticsData(formattedData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error("Failed to load analytics data");
    }
  };

  const loadSummaryStats = async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total calls
      const { count: totalCalls } = await supabase
        .from('call_sessions')
        .select('*', { count: 'exact', head: true });

      // Get total translations
      const { count: totalTranslations } = await supabase
        .from('translations')
        .select('*', { count: 'exact', head: true });

      // Get average call duration
      const { data: avgDurationData } = await supabase
        .from('call_sessions')
        .select('duration_seconds')
        .not('duration_seconds', 'is', null);

      const avgCallDuration = avgDurationData?.length ? 
        avgDurationData.reduce((sum, call) => sum + (call.duration_seconds || 0), 0) / avgDurationData.length : 0;

      // Get active users (users with calls in last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: activeUsersData } = await supabase
        .from('call_sessions')
        .select('user_id')
        .gte('created_at', thirtyDaysAgo);

      const activeUsers = new Set(activeUsersData?.map(session => session.user_id)).size;

      setSummaryStats({
        totalUsers: totalUsers || 0,
        totalCalls: totalCalls || 0,
        totalTranslations: totalTranslations || 0,
        avgCallDuration: Math.round(avgCallDuration || 0),
        activeUsers
      });
    } catch (error) {
      console.error('Error loading summary stats:', error);
      toast.error("Failed to load summary statistics");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Access Denied</h3>
          <p className="text-muted-foreground">You need admin privileges to view analytics.</p>
        </div>
      </div>
    );
  }

  const chartConfig = {
    daily_signups: {
      label: "Daily Signups",
      color: "hsl(var(--primary))",
    },
    daily_calls: {
      label: "Daily Calls",
      color: "hsl(var(--secondary))",
    },
    daily_translations: {
      label: "Daily Translations",
      color: "hsl(var(--accent))",
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Monitor your ConversaFlow usage and performance.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalCalls}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Translations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.totalTranslations}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Call Duration</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(summaryStats.avgCallDuration / 60)}m {summaryStats.avgCallDuration % 60}s</div>
            <p className="text-xs text-muted-foreground">Average length</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
            <CardDescription>User signups and calls over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="daily_signups"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Signups"
                  />
                  <Line
                    type="monotone"
                    dataKey="daily_calls"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    name="Calls"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Translations</CardTitle>
            <CardDescription>Translation volume over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="daily_translations"
                    fill="hsl(var(--accent))"
                    name="Translations"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};