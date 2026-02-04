import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download } from 'lucide-react';
import { useAttendanceByDate, useAttendanceStats } from '@/hooks/useAttendance';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { usePagination } from '@/hooks/usePagination';
import { TablePagination } from '@/components/TablePagination';
import { DatePicker } from '@/components/ui/date-picker';

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const { data: attendance, isLoading } = useAttendanceByDate(dateStr);
  const { data: stats, isLoading: statsLoading } = useAttendanceStats(dateStr);

  const { currentPage, setCurrentPage, totalPages, paginatedItems } = usePagination(attendance || [], 10);

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '-';
    try {
      return format(parseISO(timestamp), 'hh:mm a');
    } catch {
      return timestamp;
    }
  };

  const exportCSV = () => {
    if (!attendance || attendance.length === 0) return;
    
    const headers = ['Employee ID', 'Name', 'AM In', 'AM Out', 'PM In', 'PM Out', 'Hours Worked', 'Late (min)', 'Status'];
    const rows = attendance.map((a: any) => [
      a.employees?.employee_id || '',
      `${a.employees?.first_name || ''} ${a.employees?.last_name || ''}`,
      formatTime(a.morning_in || a.time_in),
      formatTime(a.morning_out),
      formatTime(a.afternoon_in),
      formatTime(a.afternoon_out || a.time_out),
      a.hours_worked?.toFixed(2) || '0',
      a.late_minutes || '0',
      a.status || 'present'
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      present: 'bg-success/20 text-success',
      late: 'bg-warning/20 text-warning',
      absent: 'bg-destructive/20 text-destructive',
      on_leave: 'bg-info/20 text-info'
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || styles.present}`}>{status.replace('_', ' ')}</span>;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <div className="flex gap-2">
          <DatePicker
            date={selectedDate}
            onDateChange={(d) => d && setSelectedDate(d)}
            className="w-[200px]"
          />
          <Button variant="outline" onClick={exportCSV} disabled={!attendance?.length}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="stat-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Present</CardTitle></CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold text-success">{stats?.present || 0}</div>}
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Late</CardTitle></CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold text-warning">{stats?.late || 0}</div>}
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Absent</CardTitle></CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold text-destructive">{stats?.absent || 0}</div>}
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">On Leave</CardTitle></CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold text-info">{stats?.onLeave || 0}</div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Daily Attendance - {selectedDate.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>AM In</TableHead>
                  <TableHead>AM Out</TableHead>
                  <TableHead>PM In</TableHead>
                  <TableHead>PM Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Late</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1, 2, 3].map(i => (
                    <TableRow key={i}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(j => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                    </TableRow>
                  ))
                ) : paginatedItems.length > 0 ? (
                  paginatedItems.map((a: any) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.employees?.employee_id}</TableCell>
                      <TableCell>{a.employees?.first_name} {a.employees?.last_name}</TableCell>
                      <TableCell>{formatTime(a.morning_in || a.time_in)}</TableCell>
                      <TableCell>{formatTime(a.morning_out)}</TableCell>
                      <TableCell>{formatTime(a.afternoon_in)}</TableCell>
                      <TableCell>{formatTime(a.afternoon_out || a.time_out)}</TableCell>
                      <TableCell>{a.hours_worked?.toFixed(2) || '-'}</TableCell>
                      <TableCell>{a.late_minutes || 0}</TableCell>
                      <TableCell>{getStatusBadge(a.status || 'present')}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No attendance records for this date
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
