import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLeaveRequests, useCreateLeaveRequest, useApproveLeaveRequest, useLeaveCredits, calculateWorkingDays } from '@/hooks/useLeaves';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const LEAVE_TYPES = [
  { value: 'vacation', label: 'Vacation Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'emergency', label: 'Emergency Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
  { value: 'bereavement', label: 'Bereavement Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
];

export default function Leaves() {
  const { role } = useAuth();
  const { data: leaves, isLoading } = useLeaveRequests();
  const { data: credits } = useLeaveCredits();
  const createLeave = useCreateLeaveRequest();
  const approveLeave = useApproveLeaveRequest();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ leave_type: '', start_date: '', end_date: '', reason: '' });
  const [reviewLeave, setReviewLeave] = useState<any>(null);
  const [remarks, setRemarks] = useState('');

  const calculatedDays = form.start_date && form.end_date 
    ? calculateWorkingDays(new Date(form.start_date), new Date(form.end_date))
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leave_type || !form.start_date || !form.end_date) return;

    createLeave.mutate({
      leave_type: form.leave_type as any,
      start_date: form.start_date,
      end_date: form.end_date,
      total_days: calculatedDays,
      reason: form.reason || null,
    }, {
      onSuccess: () => {
        setForm({ leave_type: '', start_date: '', end_date: '', reason: '' });
        setOpen(false);
      }
    });
  };

  const handleApprove = (action: 'approve' | 'reject') => {
    if (!reviewLeave) return;
    approveLeave.mutate({
      id: reviewLeave.id,
      action,
      remarks: remarks || undefined
    }, {
      onSuccess: () => {
        setReviewLeave(null);
        setRemarks('');
      }
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-warning/20 text-warning',
      manager_approved: 'bg-info/20 text-info',
      hr_approved: 'bg-success/20 text-success',
      rejected: 'bg-destructive/20 text-destructive',
      cancelled: 'bg-muted text-muted-foreground'
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || styles.pending}`}>{status.replace('_', ' ')}</span>;
  };

  const canReview = (leave: any) => {
    if (role === 'branch_manager' && leave.status === 'pending') return true;
    if (role === 'hr_admin' && (leave.status === 'pending' || leave.status === 'manager_approved')) return true;
    return false;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Leave Management</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Request Leave</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Leave Request</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Leave Type</Label>
                <Select value={form.leave_type} onValueChange={(v) => setForm({ ...form, leave_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {LEAVE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required /></div>
                <div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required /></div>
              </div>
              {calculatedDays > 0 && (
                <p className="text-sm text-muted-foreground">Total working days: <span className="font-medium text-foreground">{calculatedDays}</span></p>
              )}
              <div><Label>Reason</Label><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Optional reason for leave" /></div>
              <Button type="submit" className="w-full" disabled={createLeave.isPending || !form.leave_type || calculatedDays < 1}>
                {createLeave.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {credits && credits.length > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-lg">Your Leave Balance</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
              {credits.map((c: any) => (
                <div key={c.id} className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground capitalize">{c.leave_type}</p>
                  <p className="text-lg font-bold">{(c.total_credits || 0) - (c.used_credits || 0)}</p>
                  <p className="text-xs text-muted-foreground">of {c.total_credits || 0}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Leave Requests</CardTitle><CardDescription>View and manage leave requests</CardDescription></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <TableRow key={i}>
                    {[1, 2, 3, 4, 5, 6, 7].map(j => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                  </TableRow>
                ))
              ) : leaves && leaves.length > 0 ? (
                leaves.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.employees?.first_name} {l.employees?.last_name}</TableCell>
                    <TableCell className="capitalize">{l.leave_type}</TableCell>
                    <TableCell>{format(new Date(l.start_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{format(new Date(l.end_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>{l.total_days}</TableCell>
                    <TableCell>{getStatusBadge(l.status)}</TableCell>
                    <TableCell>
                      {canReview(l) && (
                        <Dialog open={reviewLeave?.id === l.id} onOpenChange={(open) => !open && setReviewLeave(null)}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setReviewLeave(l)}>Review</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Review Leave Request</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-muted-foreground">Employee:</span> <span className="font-medium">{l.employees?.first_name} {l.employees?.last_name}</span></div>
                                <div><span className="text-muted-foreground">Type:</span> <span className="font-medium capitalize">{l.leave_type}</span></div>
                                <div><span className="text-muted-foreground">From:</span> <span className="font-medium">{l.start_date}</span></div>
                                <div><span className="text-muted-foreground">To:</span> <span className="font-medium">{l.end_date}</span></div>
                                <div><span className="text-muted-foreground">Days:</span> <span className="font-medium">{l.total_days}</span></div>
                                <div><span className="text-muted-foreground">Status:</span> {getStatusBadge(l.status)}</div>
                              </div>
                              {l.reason && <div><Label>Reason</Label><p className="text-sm bg-muted p-2 rounded">{l.reason}</p></div>}
                              <div><Label>Remarks (optional)</Label><Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add remarks..." /></div>
                            </div>
                            <DialogFooter className="gap-2">
                              <Button variant="destructive" onClick={() => handleApprove('reject')} disabled={approveLeave.isPending}>
                                <XCircle className="mr-2 h-4 w-4" /> Reject
                              </Button>
                              <Button onClick={() => handleApprove('approve')} disabled={approveLeave.isPending}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Approve
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No leave requests</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
