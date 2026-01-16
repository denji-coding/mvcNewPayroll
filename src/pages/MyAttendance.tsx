import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, AlertCircle, Calendar } from 'lucide-react';
import { useTodayAttendance } from '@/hooks/useClockInOut';
import { useEmployeeAttendance } from '@/hooks/useAttendance';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function MyAttendance() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { data, isLoading } = useTodayAttendance();

  const employeeId = data?.employeeId;
  const { data: recentAttendance } = useEmployeeAttendance(employeeId);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'hh:mm a');
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-500/10 text-green-600">Present</Badge>;
      case 'late':
        return <Badge className="bg-yellow-500/10 text-yellow-600">Late</Badge>;
      case 'absent':
        return <Badge className="bg-red-500/10 text-red-600">Absent</Badge>;
      case 'on_leave':
        return <Badge className="bg-blue-500/10 text-blue-600">On Leave</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!employeeId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Attendance</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Your account is not linked to an employee record.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Please contact HR to set up your employee profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const attendance = data?.attendance;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Attendance</h1>

      {/* Current Time Display */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-6 md:py-8 text-center">
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-2">
            <Clock className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <span className="text-2xl md:text-4xl font-bold tabular-nums">
              {format(currentTime, 'hh:mm:ss a')}
            </span>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            {format(currentTime, 'EEEE, MMMM d, yyyy')}
          </p>
        </CardContent>
      </Card>

      {/* Today's Summary */}
      {attendance ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
              <div className="text-center p-3 md:p-4 bg-muted/50 rounded-lg">
                <p className="text-xs md:text-sm text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(attendance.status)}</div>
              </div>
              <div className="text-center p-3 md:p-4 bg-muted/50 rounded-lg">
                <p className="text-xs md:text-sm text-muted-foreground">Time In</p>
                <p className="font-semibold text-sm md:text-base">{formatTime(attendance.time_in)}</p>
              </div>
              <div className="text-center p-3 md:p-4 bg-muted/50 rounded-lg">
                <p className="text-xs md:text-sm text-muted-foreground">Time Out</p>
                <p className="font-semibold text-sm md:text-base">{formatTime(attendance.time_out)}</p>
              </div>
              <div className="text-center p-3 md:p-4 bg-muted/50 rounded-lg">
                <p className="text-xs md:text-sm text-muted-foreground">Hours</p>
                <p className="font-semibold text-sm md:text-base">{attendance.hours_worked || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-4">
              No attendance record for today. Please use the attendance terminal to clock in.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
          <CardDescription>Your last 10 attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time In</TableHead>
                  <TableHead>Time Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAttendance?.slice(0, 10).map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="whitespace-nowrap">{format(new Date(record.date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{formatTime(record.time_in)}</TableCell>
                    <TableCell>{formatTime(record.time_out)}</TableCell>
                    <TableCell>{record.hours_worked || '-'}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                  </TableRow>
                ))}
                {(!recentAttendance || recentAttendance.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No attendance records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {recentAttendance?.slice(0, 10).map((record) => (
              <div key={record.id} className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">{format(new Date(record.date), 'MMM d, yyyy')}</span>
                  {getStatusBadge(record.status)}
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Time In</p>
                    <p className="font-medium">{formatTime(record.time_in)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Time Out</p>
                    <p className="font-medium">{formatTime(record.time_out)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Hours</p>
                    <p className="font-medium">{record.hours_worked || '-'}</p>
                  </div>
                </div>
              </div>
            ))}
            {(!recentAttendance || recentAttendance.length === 0) && (
              <div className="text-center text-muted-foreground py-8">
                No attendance records found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
