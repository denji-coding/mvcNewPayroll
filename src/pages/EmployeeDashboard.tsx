import { useAuth } from '@/hooks/useAuth';
import { useEmployeeDashboard } from '@/hooks/useEmployeeDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Calendar, CalendarDays, DollarSign, TrendingUp, AlertCircle, Gift } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export default function EmployeeDashboard() {
  const { profile } = useAuth();
  const { 
    attendanceSummary, 
    leaveCredits, 
    recentPayslips,
    upcomingHolidays,
    announcements,
    isLoading 
  } = useEmployeeDashboard();

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-500/10 text-green-600">Present</Badge>;
      case 'late':
        return <Badge className="bg-yellow-500/10 text-yellow-600">Late</Badge>;
      case 'absent':
        return <Badge className="bg-red-500/10 text-red-600">Absent</Badge>;
      default:
        return <Badge variant="secondary">No Record</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="page-header">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.firstName}! Here's your personal overview.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Status
            </CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getStatusBadge(attendanceSummary?.todayStatus)}
            </div>
            {attendanceSummary?.todayTimeIn && (
              <p className="text-xs text-muted-foreground mt-1">
                In: {format(new Date(attendanceSummary.todayTimeIn), 'hh:mm a')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceSummary?.monthlyPresent || 0} days</div>
            <p className="text-xs text-muted-foreground mt-1">
              {attendanceSummary?.monthlyLate || 0} late, {attendanceSummary?.monthlyAbsent || 0} absent
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Vacation Leave
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(leaveCredits?.vacation?.total || 0) - (leaveCredits?.vacation?.used || 0)} days
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {leaveCredits?.vacation?.used || 0} used of {leaveCredits?.vacation?.total || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sick Leave
            </CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(leaveCredits?.sick?.total || 0) - (leaveCredits?.sick?.used || 0)} days
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {leaveCredits?.sick?.used || 0} used of {leaveCredits?.sick?.total || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Payslips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Recent Payslips
            </CardTitle>
            <CardDescription>Your latest payroll records</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPayslips && recentPayslips.length > 0 ? (
              <div className="space-y-3">
                {recentPayslips.map((payslip: any) => (
                  <div key={payslip.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(payslip.payroll_periods?.period_start), 'MMM d')} - {format(new Date(payslip.payroll_periods?.period_end), 'MMM d, yyyy')}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {payslip.payroll_periods?.status}
                      </p>
                    </div>
                    <span className="font-semibold text-primary">
                      ₱{Number(payslip.net_pay || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No payslips available yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Holidays */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Upcoming Holidays
            </CardTitle>
            <CardDescription>Holidays in the next 60 days</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingHolidays && upcomingHolidays.length > 0 ? (
              <div className="space-y-3">
                {upcomingHolidays.map((holiday: any) => (
                  <div key={holiday.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{holiday.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{holiday.type} Holiday</p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(holiday.date), 'MMM d')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Gift className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No upcoming holidays</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Recent Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {announcements && announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.map((ann: any) => (
                <div key={ann.id} className="p-4 rounded-lg bg-muted/50 border-l-4 border-primary">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{ann.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ann.content}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                      {formatDistanceToNow(new Date(ann.published_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent announcements</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
