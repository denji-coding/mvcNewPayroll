import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Download, Edit2 } from 'lucide-react';
import { useAttendanceByDate, useAttendanceStats, useUpdateAttendance } from '@/hooks/useAttendance';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { usePagination } from '@/hooks/usePagination';
import { TablePagination } from '@/components/TablePagination';

export default function Attendance() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const { role } = useAuth();
  const { data: attendance, isLoading } = useAttendanceByDate(date);
  const { data: stats, isLoading: statsLoading } = useAttendanceStats(date);
  const updateAttendance = useUpdateAttendance();

  const [editRecord, setEditRecord] = useState<any>(null);
  const [editForm, setEditForm] = useState({ time_in: '', time_out: '', remarks: '' });

  const { currentPage, setCurrentPage, totalPages, paginatedItems } = usePagination(attendance || [], 10);

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '-';
    try {
      return format(parseISO(timestamp), 'hh:mm a');
    } catch {
      return timestamp;
    }
  };

  const handleEdit = (record: any) => {
    setEditRecord(record);
    setEditForm({
      time_in: record.time_in ? format(parseISO(record.time_in), "HH:mm") : '',
      time_out: record.time_out ? format(parseISO(record.time_out), "HH:mm") : '',
      remarks: record.remarks || ''
    });
  };

  const handleSaveEdit = () => {
    if (!editRecord) return;
    const timeIn = editForm.time_in ? `${date}T${editForm.time_in}:00` : null;
    const timeOut = editForm.time_out ? `${date}T${editForm.time_out}:00` : null;
    
    updateAttendance.mutate({
      id: editRecord.id,
      time_in: timeIn,
      time_out: timeOut,
      remarks: editForm.remarks || null
    }, {
      onSuccess: () => setEditRecord(null)
    });
  };

  const exportCSV = () => {
    if (!attendance || attendance.length === 0) return;
    
    const headers = ['Employee ID', 'Name', 'Time In', 'Time Out', 'Hours Worked', 'Late (min)', 'Status'];
    const rows = attendance.map((a: any) => [
      a.employees?.employee_id || '',
      `${a.employees?.first_name || ''} ${a.employees?.last_name || ''}`,
      formatTime(a.time_in),
      formatTime(a.time_out),
      a.hours_worked?.toFixed(2) || '0',
      a.late_minutes || '0',
      a.status || 'present'
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${date}.csv`;
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
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
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
            Daily Attendance - {new Date(date).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Time In</TableHead>
                <TableHead>Time Out</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Late (min)</TableHead>
                <TableHead>Status</TableHead>
                {role === 'hr_admin' && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <TableRow key={i}>
                    {[1, 2, 3, 4, 5, 6, 7].map(j => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : paginatedItems.length > 0 ? (
                paginatedItems.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.employees?.employee_id}</TableCell>
                    <TableCell>{a.employees?.first_name} {a.employees?.last_name}</TableCell>
                    <TableCell>{formatTime(a.time_in)}</TableCell>
                    <TableCell>{formatTime(a.time_out)}</TableCell>
                    <TableCell>{a.hours_worked?.toFixed(2) || '-'}</TableCell>
                    <TableCell>{a.late_minutes || 0}</TableCell>
                    <TableCell>{getStatusBadge(a.status || 'present')}</TableCell>
                    {role === 'hr_admin' && (
                      <TableCell>
                        <Dialog open={editRecord?.id === a.id} onOpenChange={(open) => !open && setEditRecord(null)}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(a)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Edit Attendance</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                              <div><Label>Time In</Label><Input type="time" value={editForm.time_in} onChange={(e) => setEditForm({ ...editForm, time_in: e.target.value })} /></div>
                              <div><Label>Time Out</Label><Input type="time" value={editForm.time_out} onChange={(e) => setEditForm({ ...editForm, time_out: e.target.value })} /></div>
                              <div><Label>Remarks</Label><Input value={editForm.remarks} onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })} /></div>
                              <Button onClick={handleSaveEdit} className="w-full" disabled={updateAttendance.isPending}>
                                {updateAttendance.isPending ? 'Saving...' : 'Save Changes'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={role === 'hr_admin' ? 8 : 7} className="text-center py-8 text-muted-foreground">
                    No attendance records for this date
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
