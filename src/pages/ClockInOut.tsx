import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, LogIn, LogOut, Timer, AlertCircle } from 'lucide-react';
import { useTodayAttendance, useClockIn, useClockOut } from '@/hooks/useClockInOut';
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

export default function ClockInOut() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { data, isLoading } = useTodayAttendance();
  const clockIn = useClockIn();
  const clockOut = useClockOut();

  const employeeId = data?.employeeId;
  const { data: recentAttendance } = useEmployeeAttendance(employeeId);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClockIn = () => {
    if (employeeId) {
      clockIn.mutate(employeeId);
    }
  };

  const handleClockOut = () => {
    if (data?.attendance?.id && data?.attendance?.time_in) {
      clockOut.mutate({
        attendanceId: data.attendance.id,
        timeIn: data.attendance.time_in,
      });
    }
  };

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
        <h1 className="text-2xl font-bold">Clock In / Out</h1>
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
  const isClockedIn = attendance?.time_in && !attendance?.time_out;
  const isClockedOut = attendance?.time_in && attendance?.time_out;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Clock In / Out</h1>

      {/* Current Time Display */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="py-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Clock className="h-8 w-8 text-primary" />
            <span className="text-4xl font-bold tabular-nums">
              {format(currentTime, 'hh:mm:ss a')}
            </span>
          </div>
          <p className="text-muted-foreground">
            {format(currentTime, 'EEEE, MMMM d, yyyy')}
          </p>
        </CardContent>
      </Card>

      {/* Clock In/Out Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Clock In
            </CardTitle>
            <CardDescription>Start your workday</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {attendance?.time_in ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-1">Clocked in at</p>
                <p className="text-2xl font-semibold">{formatTime(attendance.time_in)}</p>
                {attendance.late_minutes && attendance.late_minutes > 0 && (
                  <Badge variant="secondary" className="mt-2">
                    {attendance.late_minutes} mins late
                  </Badge>
                )}
              </div>
            ) : (
              <Button
                className="w-full h-16 text-lg"
                onClick={handleClockIn}
                disabled={clockIn.isPending}
              >
                <LogIn className="mr-2 h-5 w-5" />
                {clockIn.isPending ? 'Clocking In...' : 'Clock In Now'}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              Clock Out
            </CardTitle>
            <CardDescription>End your workday</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isClockedOut ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-1">Clocked out at</p>
                <p className="text-2xl font-semibold">{formatTime(attendance?.time_out)}</p>
                {attendance?.hours_worked && (
                  <Badge variant="secondary" className="mt-2">
                    {attendance.hours_worked} hrs worked
                  </Badge>
                )}
              </div>
            ) : isClockedIn ? (
              <Button
                className="w-full h-16 text-lg"
                variant="outline"
                onClick={handleClockOut}
                disabled={clockOut.isPending}
              >
                <LogOut className="mr-2 h-5 w-5" />
                {clockOut.isPending ? 'Clocking Out...' : 'Clock Out Now'}
              </Button>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Timer className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>Clock in first to enable clock out</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's Summary */}
      {attendance && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(attendance.status)}</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Time In</p>
                <p className="font-semibold">{formatTime(attendance.time_in)}</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Time Out</p>
                <p className="font-semibold">{formatTime(attendance.time_out)}</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Hours Worked</p>
                <p className="font-semibold">{attendance.hours_worked || '-'}</p>
              </div>
            </div>
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
                  <TableCell>{format(new Date(record.date), 'MMM d, yyyy')}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}
