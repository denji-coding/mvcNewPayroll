import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useAttendanceByDate, useAttendanceStats } from '@/hooks/useAttendance';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { DatePicker } from '@/components/ui/date-picker';
import { DataTable, ColumnDef } from '@/components/ui/data-table';

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const { data: attendance, isLoading } = useAttendanceByDate(dateStr);
  const { data: stats, isLoading: statsLoading } = useAttendanceStats(dateStr);

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '-';
    try { return format(parseISO(timestamp), 'hh:mm a'); } catch { return timestamp; }
  };

  const exportCSV = () => {
    if (!attendance || attendance.length === 0) return;
    const headers = ['Employee ID', 'Name', 'AM In', 'AM Out', 'PM In', 'PM Out', 'Hours Worked', 'Late (min)', 'Status'];
    const rows = attendance.map((a: any) => [
      a.employees?.employee_id || '', `${a.employees?.first_name || ''} ${a.employees?.last_name || ''}`,
      formatTime(a.morning_in || a.time_in), formatTime(a.morning_out), formatTime(a.afternoon_in), formatTime(a.afternoon_out || a.time_out),
      a.hours_worked?.toFixed(2) || '0', a.late_minutes || '0', a.status || 'present'
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `attendance-${dateStr}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = { present: 'bg-success/20 text-success', late: 'bg-warning/20 text-warning', absent: 'bg-destructive/20 text-destructive', on_leave: 'bg-info/20 text-info' };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || styles.present}`}>{status.replace('_', ' ')}</span>;
  };

  const columns: ColumnDef<any, any>[] = [
    { id: 'emp_id', header: 'Employee ID', accessorFn: (row) => row.employees?.employee_id },
    { id: 'name', header: 'Name', accessorFn: (row) => `${row.employees?.first_name} ${row.employees?.last_name}` },
    { id: 'am_in', header: 'AM In', accessorFn: (row) => row.morning_in || row.time_in, cell: ({ getValue }) => formatTime(getValue() as string) },
    { id: 'am_out', header: 'AM Out', accessorFn: (row) => row.morning_out, cell: ({ getValue }) => formatTime(getValue() as string) },
    { id: 'pm_in', header: 'PM In', accessorFn: (row) => row.afternoon_in, cell: ({ getValue }) => formatTime(getValue() as string) },
    { id: 'pm_out', header: 'PM Out', accessorFn: (row) => row.afternoon_out || row.time_out, cell: ({ getValue }) => formatTime(getValue() as string) },
    { accessorKey: 'hours_worked', header: 'Hours', cell: ({ getValue }) => (getValue() as number)?.toFixed(2) || '-' },
    { accessorKey: 'late_minutes', header: 'Late', cell: ({ getValue }) => getValue() || 0 },
    { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => getStatusBadge((getValue() as string) || 'present') },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <div className="flex gap-2">
          <DatePicker date={selectedDate} onDateChange={(d) => d && setSelectedDate(d)} className="w-[200px]" />
          <Button variant="outline" onClick={exportCSV} disabled={!attendance?.length}><Download className="mr-2 h-4 w-4" /> Export</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="stat-card"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Present</CardTitle></CardHeader><CardContent>{statsLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold text-success">{stats?.present || 0}</div>}</CardContent></Card>
        <Card className="stat-card"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Late</CardTitle></CardHeader><CardContent>{statsLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold text-warning">{stats?.late || 0}</div>}</CardContent></Card>
        <Card className="stat-card"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Absent</CardTitle></CardHeader><CardContent>{statsLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold text-destructive">{stats?.absent || 0}</div>}</CardContent></Card>
        <Card className="stat-card"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">On Leave</CardTitle></CardHeader><CardContent>{statsLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold text-info">{stats?.onLeave || 0}</div>}</CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Attendance - {selectedDate.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <DataTable columns={columns} data={attendance || []} searchPlaceholder="Search attendance..." emptyMessage="No attendance records for this date" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
