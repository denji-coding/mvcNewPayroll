import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, AlertCircle, Calendar } from 'lucide-react';
import { useTodayAttendance } from '@/hooks/useClockInOut';
import { useEmployeeAttendance } from '@/hooks/useAttendance';
import { format } from 'date-fns';
import { DataTable, ColumnDef } from '@/components/ui/data-table';

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
        return <Badge className="bg-success/10 text-success border-success/20">Present</Badge>;
      case 'late':
        return <Badge className="bg-warning/10 text-warning border-warning/20">Late</Badge>;
      case 'absent':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Absent</Badge>;
      case 'on_leave':
        return <Badge className="bg-info/10 text-info border-info/20">On Leave</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!employeeId) {
    return (
      <div className="page-container">
        <h1 className="text-2xl font-bold">My Attendance</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Your account is not linked to an employee record.</p>
            <p className="text-sm text-muted-foreground mt-2">Please contact HR to set up your employee profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const attendance = data?.attendance;

  const columns: ColumnDef<any, any>[] = [
    { accessorKey: 'date', header: 'Date', cell: ({ getValue }) => format(new Date(getValue() as string), 'MMM d, yyyy') },
    { id: 'am_in', header: 'AM In', accessorFn: (row) => row.morning_in || row.time_in, cell: ({ getValue }) => formatTime(getValue() as string) },
    { id: 'am_out', header: 'AM Out', accessorFn: (row) => row.morning_out, cell: ({ getValue }) => formatTime(getValue() as string) },
    { id: 'pm_in', header: 'PM In', accessorFn: (row) => row.afternoon_in, cell: ({ getValue }) => formatTime(getValue() as string) },
    { id: 'pm_out', header: 'PM Out', accessorFn: (row) => row.afternoon_out || row.time_out, cell: ({ getValue }) => formatTime(getValue() as string) },
    { accessorKey: 'hours_worked', header: 'Hours', cell: ({ getValue }) => getValue() || '-' },
    { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => getStatusBadge(getValue() as string) },
  ];

  return (
    <div className="page-container">
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
            <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Today's Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
              <div className="text-center p-3 md:p-4 bg-muted/50 rounded-lg">
                <p className="text-xs md:text-sm text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(attendance.status)}</div>
              </div>
              <div className="text-center p-3 md:p-4 bg-muted/50 rounded-lg">
                <p className="text-xs md:text-sm text-muted-foreground">AM In</p>
                <p className="font-semibold text-sm md:text-base">{formatTime((attendance as any).morning_in || attendance.time_in)}</p>
              </div>
              <div className="text-center p-3 md:p-4 bg-muted/50 rounded-lg">
                <p className="text-xs md:text-sm text-muted-foreground">AM Out</p>
                <p className="font-semibold text-sm md:text-base">{formatTime((attendance as any).morning_out)}</p>
              </div>
              <div className="text-center p-3 md:p-4 bg-muted/50 rounded-lg">
                <p className="text-xs md:text-sm text-muted-foreground">PM In</p>
                <p className="font-semibold text-sm md:text-base">{formatTime((attendance as any).afternoon_in)}</p>
              </div>
              <div className="text-center p-3 md:p-4 bg-muted/50 rounded-lg col-span-2 md:col-span-1">
                <p className="text-xs md:text-sm text-muted-foreground">PM Out</p>
                <p className="font-semibold text-sm md:text-base">{formatTime((attendance as any).afternoon_out || attendance.time_out)}</p>
              </div>
            </div>
            {attendance.hours_worked && (
              <div className="mt-4 text-center p-3 bg-primary/5 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Hours Worked</p>
                <p className="text-xl font-bold text-primary">{attendance.hours_worked} hours</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Today's Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-4">No attendance record for today. Please use the attendance terminal to clock in.</p>
          </CardContent>
        </Card>
      )}

      {/* Recent Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
          <CardDescription>Your attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={recentAttendance || []} searchPlaceholder="Search attendance..." emptyMessage="No attendance records found" />
        </CardContent>
      </Card>
    </div>
  );
}
