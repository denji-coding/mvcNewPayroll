import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLeaveRequests, useApproveLeaveRequest } from '@/hooks/useLeaves';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { DataTable, ColumnDef } from '@/components/ui/data-table';

export default function LeaveApprovals() {
  const { role } = useAuth();
  const { data: leaves, isLoading } = useLeaveRequests();
  const approveLeave = useApproveLeaveRequest();

  const [reviewLeave, setReviewLeave] = useState<any>(null);
  const [remarks, setRemarks] = useState('');

  const handleApprove = (action: 'approve' | 'reject') => {
    if (!reviewLeave) return;
    approveLeave.mutate(
      { id: reviewLeave.id, action, remarks: remarks || undefined },
      { onSuccess: () => { setReviewLeave(null); setRemarks(''); } }
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-warning/20 text-warning',
      manager_approved: 'bg-info/20 text-info',
      hr_approved: 'bg-success/20 text-success',
      rejected: 'bg-destructive/20 text-destructive',
      cancelled: 'bg-muted text-muted-foreground',
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || styles.pending}`}>{status.replace('_', ' ')}</span>;
  };

  const canReview = (leave: any) => {
    if (role === 'branch_manager' && leave.status === 'pending') return true;
    if (role === 'hr_admin' && (leave.status === 'pending' || leave.status === 'manager_approved')) return true;
    return false;
  };

  const columns: ColumnDef<any, any>[] = [
    { id: 'employee', header: 'Employee', accessorFn: (row) => `${row.employees?.first_name} ${row.employees?.last_name}` },
    { accessorKey: 'leave_type', header: 'Type', cell: ({ getValue }) => <span className="capitalize">{getValue() as string}</span> },
    { accessorKey: 'pay_type', header: 'Pay Type', cell: ({ getValue }) => <span className="capitalize">{((getValue() as string) || 'with_pay').replace('_', ' ')}</span> },
    { accessorKey: 'start_date', header: 'Start', cell: ({ getValue }) => format(new Date(getValue() as string), 'MMM d, yyyy') },
    { accessorKey: 'end_date', header: 'End', cell: ({ getValue }) => format(new Date(getValue() as string), 'MMM d, yyyy') },
    { accessorKey: 'total_days', header: 'Days' },
    { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => getStatusBadge(getValue() as string) },
    {
      id: 'actions', header: 'Actions', enableSorting: false,
      cell: ({ row }) => {
        const l = row.original;
        if (!canReview(l)) return null;
        return <Button size="sm" variant="outline" onClick={() => setReviewLeave(l)}>Review</Button>;
      },
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Leave Approvals</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests</CardTitle>
          <CardDescription>Review and approve/reject employee leave requests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <DataTable columns={columns} data={leaves || []} searchPlaceholder="Search leave requests..." emptyMessage="No leave requests found" />
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      {reviewLeave && (
        <Dialog open={!!reviewLeave} onOpenChange={(open) => !open && setReviewLeave(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Review Leave Request</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Employee:</span> <span className="font-medium">{reviewLeave.employees?.first_name} {reviewLeave.employees?.last_name}</span></div>
                <div><span className="text-muted-foreground">Type:</span> <span className="font-medium capitalize">{reviewLeave.leave_type}</span></div>
                <div><span className="text-muted-foreground">From:</span> <span className="font-medium">{reviewLeave.start_date}</span></div>
                <div><span className="text-muted-foreground">To:</span> <span className="font-medium">{reviewLeave.end_date}</span></div>
                <div><span className="text-muted-foreground">Days:</span> <span className="font-medium">{reviewLeave.total_days}</span></div>
                <div><span className="text-muted-foreground">Pay Type:</span> <span className="font-medium capitalize">{(reviewLeave.pay_type || 'with_pay').replace('_', ' ')}</span></div>
              </div>
              {reviewLeave.reason && <div className="text-sm"><span className="text-muted-foreground">Reason:</span> {reviewLeave.reason}</div>}
              <div><Label>Remarks</Label><Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add remarks..." /></div>
              <div className="flex gap-2">
                <Button onClick={() => handleApprove('approve')} disabled={approveLeave.isPending} className="flex-1"><CheckCircle className="mr-2 h-4 w-4" /> Approve</Button>
                <Button onClick={() => handleApprove('reject')} disabled={approveLeave.isPending} variant="destructive" className="flex-1"><XCircle className="mr-2 h-4 w-4" /> Reject</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
