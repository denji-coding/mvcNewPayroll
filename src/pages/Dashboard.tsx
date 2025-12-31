import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats, useRecentActivity } from '@/hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Building2, Clock, DollarSign, CalendarDays, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { profile } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activity, isLoading: activityLoading } = useRecentActivity();

  const statCards = [
    { title: 'Total Employees', value: stats?.employeeCount ?? 0, icon: Users, change: '' },
    { title: 'Active Branches', value: stats?.branchCount ?? 0, icon: Building2, change: '' },
    { title: 'Present Today', value: stats?.presentToday ?? 0, icon: Clock, change: stats?.attendanceRate ? `${stats.attendanceRate}%` : '' },
    { title: 'Pending Leaves', value: stats?.pendingLeaves ?? 0, icon: CalendarDays, change: '' },
    { title: 'Payroll This Month', value: stats?.payrollTotal ? `₱${(stats.payrollTotal / 1000000).toFixed(1)}M` : '₱0', icon: DollarSign, change: '' },
    { title: 'Avg. Attendance', value: stats?.attendanceRate ? `${stats.attendanceRate}%` : '-', icon: TrendingUp, change: '' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.firstName || 'User'}! Here's what's happening today.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title} className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  {stat.change && (
                    <p className="text-xs text-success mt-1">{stat.change}</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : activity?.leaveRequests && activity.leaveRequests.length > 0 ? (
              <div className="space-y-3">
                {activity.leaveRequests.map((leave: any) => (
                  <div key={leave.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">Leave Request</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {leave.leave_type} leave - {leave.status.replace('_', ' ')}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(leave.created_at), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No recent activity</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : activity?.announcements && activity.announcements.length > 0 ? (
              <div className="space-y-3">
                {activity.announcements.map((ann: any) => (
                  <div key={ann.id} className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium">{ann.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{ann.content}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(ann.published_at), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No announcements</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
