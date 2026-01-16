import { useAuth } from '@/hooks/useAuth';
import { useDashboardStats, useRecentActivity } from '@/hooks/useDashboard';
import { useAttendanceTrend, useLeavesByStatus, useEmployeesByBranch, usePayrollSummary } from '@/hooks/useDashboardCharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Building2, Clock, DollarSign, CalendarDays, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import EmployeeDashboard from './EmployeeDashboard';

export default function Dashboard() {
  const { profile, role } = useAuth();

  // If employee role, show employee-specific dashboard
  if (role === 'employee') {
    return <EmployeeDashboard />;
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const { profile } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activity, isLoading: activityLoading } = useRecentActivity();
  const { data: attendanceTrend } = useAttendanceTrend();
  const { data: leavesByStatus } = useLeavesByStatus();
  const { data: employeesByBranch } = useEmployeesByBranch();
  const { data: payrollSummary } = usePayrollSummary();

  const statCards = [
    { title: 'Total Employees', value: stats?.employeeCount ?? 0, icon: Users, change: '' },
    { title: 'Active Branches', value: stats?.branchCount ?? 0, icon: Building2, change: '' },
    { title: 'Present Today', value: stats?.presentToday ?? 0, icon: Clock, change: stats?.attendanceRate ? `${stats.attendanceRate}%` : '' },
    { title: 'Pending Leaves', value: stats?.pendingLeaves ?? 0, icon: CalendarDays, change: '' },
    { title: 'Payroll This Month', value: stats?.payrollTotal ? `₱${(stats.payrollTotal / 1000000).toFixed(1)}M` : '₱0', icon: DollarSign, change: '' },
    { title: 'Avg. Attendance', value: stats?.attendanceRate ? `${stats.attendanceRate}%` : '-', icon: TrendingUp, change: '' },
  ];

  const chartConfig = {
    present: { label: 'Present', color: 'hsl(var(--chart-1))' },
    absent: { label: 'Absent', color: 'hsl(var(--chart-2))' },
    employees: { label: 'Employees', color: 'hsl(var(--chart-3))' },
    total: { label: 'Total', color: 'hsl(var(--chart-4))' },
  };

  const pieColors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

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

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Attendance Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trend (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceTrend && attendanceTrend.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <AreaChart data={attendanceTrend}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="present"
                    stackId="1"
                    stroke="hsl(var(--chart-1))"
                    fill="hsl(var(--chart-1))"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="absent"
                    stackId="1"
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No attendance data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leave Requests by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Requests by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {leavesByStatus && leavesByStatus.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <PieChart>
                  <Pie
                    data={leavesByStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {leavesByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No leave requests data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Employees by Branch */}
        <Card>
          <CardHeader>
            <CardTitle>Employees by Branch</CardTitle>
          </CardHeader>
          <CardContent>
            {employeesByBranch && employeesByBranch.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={employeesByBranch} layout="vertical">
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="employees" fill="hsl(var(--chart-3))" radius={4} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No branch data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payroll Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll Summary (Last 4 Periods)</CardTitle>
          </CardHeader>
          <CardContent>
            {payrollSummary && payrollSummary.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={payrollSummary}>
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => `₱${value}K`} />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [`₱${value.toFixed(0)}K`, 'Total']}
                  />
                  <Bar dataKey="total" fill="hsl(var(--chart-4))" radius={4} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No payroll data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Leave Requests</CardTitle>
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
                      <p className="text-sm font-medium">
                        {leave.employees?.first_name} {leave.employees?.last_name}
                      </p>
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
              <p className="text-muted-foreground text-sm">No recent leave requests</p>
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
