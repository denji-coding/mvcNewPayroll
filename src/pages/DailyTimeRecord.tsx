import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useEmployeeAttendance } from '@/hooks/useAttendance';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Clock, AlertCircle, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, getDaysInMonth, eachDayOfInterval, isWeekend } from 'date-fns';

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYear = new Date().getFullYear();
const years = [currentYear, currentYear - 1, currentYear - 2];

export default function DailyTimeRecord() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Get employee ID from user
  const { data: employee, isLoading: employeeLoading } = useQuery({
    queryKey: ['employee-by-user', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, employee_id, position, department')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Calculate date range for selected month
  const { startDate, endDate } = useMemo(() => {
    const date = new Date(selectedYear, selectedMonth, 1);
    return {
      startDate: format(startOfMonth(date), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(date), 'yyyy-MM-dd'),
    };
  }, [selectedMonth, selectedYear]);

  // Fetch attendance for the month
  const { data: attendance, isLoading: attendanceLoading } = useEmployeeAttendance(
    employee?.id,
    startDate,
    endDate
  );

  // Create a map of attendance by date
  const attendanceMap = useMemo(() => {
    if (!attendance) return new Map();
    return new Map(attendance.map(record => [record.date, record]));
  }, [attendance]);

  // Generate all days of the month
  const daysInMonth = useMemo(() => {
    const date = new Date(selectedYear, selectedMonth, 1);
    return eachDayOfInterval({
      start: startOfMonth(date),
      end: endOfMonth(date),
    });
  }, [selectedMonth, selectedYear]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!attendance) return { daysWorked: 0, totalHours: 0, lateDays: 0, absentDays: 0 };
    
    const workingDays = daysInMonth.filter(day => !isWeekend(day)).length;
    const daysWorked = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const totalHours = attendance.reduce((sum, a) => sum + (a.hours_worked || 0), 0);
    const lateDays = attendance.filter(a => (a.late_minutes || 0) > 0).length;
    const attendedDates = new Set(attendance.map(a => a.date));
    const absentDays = daysInMonth.filter(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      return !isWeekend(day) && !attendedDates.has(dateStr) && day <= new Date();
    }).length;

    return { daysWorked, totalHours, lateDays, absentDays, workingDays };
  }, [attendance, daysInMonth]);

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '-';
    return format(new Date(timestamp), 'hh:mm a');
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'present':
        return <Badge variant="default" className="bg-primary">Present</Badge>;
      case 'late':
        return <Badge variant="secondary" className="bg-accent text-accent-foreground">Late</Badge>;
      case 'absent':
        return <Badge variant="destructive">Absent</Badge>;
      case 'on_leave':
        return <Badge variant="outline">On Leave</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  if (employeeLoading) {
    return (
      <div className="page-container">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="page-container">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Your account is not linked to an employee record.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Daily Time Record
          </h1>
          <p className="text-muted-foreground">
            View your attendance records by month
          </p>
        </div>
      </div>

      {/* Employee Info Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Employee:</span>
              <p className="font-medium">{employee.first_name} {employee.last_name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">ID:</span>
              <p className="font-medium">{employee.employee_id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Position:</span>
              <p className="font-medium">{employee.position}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Department:</span>
              <p className="font-medium">{employee.department || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Select Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={month} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Days Worked</span>
            </div>
            <p className="text-2xl font-bold mt-1">{summary.daysWorked}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Total Hours</span>
            </div>
            <p className="text-2xl font-bold mt-1">{summary.totalHours.toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-accent-foreground" />
              <span className="text-sm text-muted-foreground">Late Days</span>
            </div>
            <p className="text-2xl font-bold mt-1">{summary.lateDays}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Absent Days</span>
            </div>
            <p className="text-2xl font-bold mt-1">{summary.absentDays}</p>
          </CardContent>
        </Card>
      </div>

      {/* DTR Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {months[selectedMonth]} {selectedYear} Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead className="w-[80px]">Day</TableHead>
                    <TableHead>AM In</TableHead>
                    <TableHead>AM Out</TableHead>
                    <TableHead>PM In</TableHead>
                    <TableHead>PM Out</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {daysInMonth.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const record = attendanceMap.get(dateStr);
                    const isWeekendDay = isWeekend(day);
                    const isFuture = day > new Date();

                    return (
                      <TableRow 
                        key={dateStr}
                        className={isWeekendDay ? 'bg-muted/30' : ''}
                      >
                        <TableCell className="font-medium">
                          {format(day, 'MMM dd')}
                        </TableCell>
                        <TableCell className={isWeekendDay ? 'text-muted-foreground' : ''}>
                          {format(day, 'EEE')}
                        </TableCell>
                        <TableCell>{formatTime(record?.morning_in)}</TableCell>
                        <TableCell>{formatTime(record?.morning_out)}</TableCell>
                        <TableCell>{formatTime(record?.afternoon_in)}</TableCell>
                        <TableCell>{formatTime(record?.afternoon_out)}</TableCell>
                        <TableCell className="text-right">
                          {record?.hours_worked ? record.hours_worked.toFixed(2) : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {isWeekendDay ? (
                            <Badge variant="outline">Weekend</Badge>
                          ) : isFuture ? (
                            <Badge variant="outline">-</Badge>
                          ) : record ? (
                            getStatusBadge(record.status)
                          ) : (
                            <Badge variant="destructive">Absent</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
