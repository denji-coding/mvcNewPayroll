import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Clock, DollarSign, CalendarDays, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { role, profile } = useAuth();

  const stats = [
    { title: 'Total Employees', value: '156', icon: Users, change: '+12%' },
    { title: 'Active Branches', value: '5', icon: Building2, change: '' },
    { title: 'Present Today', value: '142', icon: Clock, change: '91%' },
    { title: 'Pending Leaves', value: '8', icon: CalendarDays, change: '' },
    { title: 'Payroll This Month', value: '₱2.4M', icon: DollarSign, change: '+5%' },
    { title: 'Avg. Attendance', value: '94%', icon: TrendingUp, change: '+2%' },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.firstName}! Here's what's happening today.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title} className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.change && (
                <p className="text-xs text-success mt-1">{stat.change} from last month</p>
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
            <p className="text-muted-foreground text-sm">Activity feed will appear here</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Company announcements will appear here</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
