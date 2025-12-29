import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar } from 'lucide-react';

export default function Leaves() {
  const { role } = useAuth();
  const { toast } = useToast();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ leave_type: '', start_date: '', end_date: '', reason: '' });

  useEffect(() => { fetchLeaves(); }, []);

  const fetchLeaves = async () => {
    const { data } = await supabase.from('leave_requests').select('*, employees(first_name, last_name, employee_id)').order('created_at', { ascending: false });
    setLeaves(data || []);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = { pending: 'badge-warning', manager_approved: 'badge-info', hr_approved: 'badge-success', rejected: 'badge-destructive', cancelled: 'badge-destructive' };
    return <span className={styles[status] || 'badge-info'}>{status.replace('_', ' ')}</span>;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Leave Management</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Request Leave</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Leave Request</DialogTitle></DialogHeader>
            <form className="space-y-4">
              <div><Label>Leave Type</Label><Select value={form.leave_type} onValueChange={(v) => setForm({ ...form, leave_type: v })}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent><SelectItem value="vacation">Vacation</SelectItem><SelectItem value="sick">Sick</SelectItem><SelectItem value="emergency">Emergency</SelectItem></SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-4"><div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div><div><Label>End Date</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div></div>
              <div><Label>Reason</Label><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
              <Button type="submit" className="w-full">Submit Request</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Days</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {leaves.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{l.employees?.first_name} {l.employees?.last_name}</TableCell>
                  <TableCell className="capitalize">{l.leave_type}</TableCell>
                  <TableCell>{l.start_date}</TableCell>
                  <TableCell>{l.end_date}</TableCell>
                  <TableCell>{l.total_days}</TableCell>
                  <TableCell>{getStatusBadge(l.status)}</TableCell>
                  <TableCell>{l.status === 'pending' && (role === 'hr_admin' || role === 'branch_manager') && <Button size="sm" variant="outline">Review</Button>}</TableCell>
                </TableRow>
              ))}
              {leaves.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No leave requests</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
