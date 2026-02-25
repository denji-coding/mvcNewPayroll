import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMyLeaveRequests, useCreateLeaveRequest, useLeaveCredits, calculateWorkingDays } from '@/hooks/useLeaves';
import { useLeaveTypes, getLeaveTypeEnum } from '@/hooks/useLeaveTypes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Upload, Heart, Palmtree, AlertTriangle, Baby, Flower2, Ban, CalendarDays } from 'lucide-react';
import { format, startOfToday, isBefore, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DataTable, ColumnDef } from '@/components/ui/data-table';

const LEAVE_TYPE_ICON_MAP: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  'sick': { icon: Heart, color: 'text-destructive' }, 'vacation': { icon: Palmtree, color: 'text-success' },
  'emergency': { icon: AlertTriangle, color: 'text-warning' }, 'maternity': { icon: Baby, color: 'text-pink-500' },
  'paternity': { icon: Baby, color: 'text-blue-500' }, 'bereavement': { icon: Flower2, color: 'text-muted-foreground' },
  'unpaid': { icon: Ban, color: 'text-muted-foreground' },
};

const getLeaveTypeVisuals = (name: string) => {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(LEAVE_TYPE_ICON_MAP)) { if (lower.includes(key)) return val; }
  return { icon: CalendarDays, color: 'text-primary' };
};

export default function Leaves() {
  const { user } = useAuth();
  const { data: myLeaves, isLoading } = useMyLeaveRequests();
  const { data: credits } = useLeaveCredits();
  const { data: leaveTypes } = useLeaveTypes();
  const createLeave = useCreateLeaveRequest();

  const activeLeaveTypes = (leaveTypes || []).filter(lt => lt.is_active).map(lt => {
    const visuals = getLeaveTypeVisuals(lt.name);
    const enumVal = getLeaveTypeEnum(lt.name);
    return { id: lt.id, value: enumVal, label: lt.name, icon: visuals.icon, defaultCredits: lt.default_credits, color: visuals.color };
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ leave_type: '', reason: '', pay_type: 'with_pay' as 'with_pay' | 'without_pay' });
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [medicalFile, setMedicalFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const today = startOfToday();
  const isSickLeave = form.leave_type === 'sick';
  const calculatedDays = startDate && endDate ? calculateWorkingDays(startDate, endDate) : 0;
  const requiresMedicalCert = isSickLeave && calculatedDays >= 3;

  useEffect(() => { setStartDate(undefined); setEndDate(undefined); }, [form.leave_type]);

  const getDateDisabledFn = () => {
    if (isSickLeave) return (date: Date) => isAfter(date, today);
    return (date: Date) => isBefore(date, today);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { if (file.size > 5 * 1024 * 1024) { toast.error('File size must be less than 5MB'); return; } setMedicalFile(file); }
  };

  const uploadMedicalCert = async (): Promise<string | null> => {
    if (!medicalFile || !user) return null;
    const fileExt = medicalFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('medical-certificates').upload(fileName, medicalFile);
    if (error) throw new Error('Failed to upload medical certificate');
    const { data: { publicUrl } } = supabase.storage.from('medical-certificates').getPublicUrl(fileName);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leave_type || !startDate || !endDate) return;
    try {
      setUploading(true);
      let medicalCertUrl: string | null = null;
      if (requiresMedicalCert && medicalFile) medicalCertUrl = await uploadMedicalCert();
      createLeave.mutate({
        leave_type: form.leave_type as any, start_date: format(startDate, 'yyyy-MM-dd'), end_date: format(endDate, 'yyyy-MM-dd'),
        total_days: calculatedDays, reason: form.reason || null, medical_certificate_url: medicalCertUrl, pay_type: form.pay_type,
      }, { onSuccess: () => { setForm({ leave_type: '', reason: '', pay_type: 'with_pay' }); setStartDate(undefined); setEndDate(undefined); setMedicalFile(null); setOpen(false); } });
    } catch { toast.error('Failed to submit leave request'); } finally { setUploading(false); }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = { pending: 'bg-warning/20 text-warning', manager_approved: 'bg-info/20 text-info', hr_approved: 'bg-success/20 text-success', rejected: 'bg-destructive/20 text-destructive', cancelled: 'bg-muted text-muted-foreground' };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || styles.pending}`}>{status.replace('_', ' ')}</span>;
  };

  const columns: ColumnDef<any, any>[] = [
    { accessorKey: 'leave_type', header: 'Type', cell: ({ getValue }) => <span className="capitalize">{getValue() as string}</span> },
    { accessorKey: 'pay_type', header: 'Pay Type', cell: ({ getValue }) => <span className="capitalize">{((getValue() as string) || 'with_pay').replace('_', ' ')}</span> },
    { accessorKey: 'start_date', header: 'Start', cell: ({ getValue }) => format(new Date(getValue() as string), 'MMM d, yyyy') },
    { accessorKey: 'end_date', header: 'End', cell: ({ getValue }) => format(new Date(getValue() as string), 'MMM d, yyyy') },
    { accessorKey: 'total_days', header: 'Days' },
    { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => getStatusBadge(getValue() as string) },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">My Leaves</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Request Leave</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New Leave Request</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Leave Type</Label><Select value={form.leave_type} onValueChange={(v) => setForm({ ...form, leave_type: v })}><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>{activeLeaveTypes.map(t => <SelectItem key={t.id} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Pay Type</Label><RadioGroup value={form.pay_type} onValueChange={(v) => setForm({ ...form, pay_type: v as 'with_pay' | 'without_pay' })} className="flex gap-4"><div className="flex items-center space-x-2"><RadioGroupItem value="with_pay" id="with_pay" /><Label htmlFor="with_pay" className="cursor-pointer">With Pay</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="without_pay" id="without_pay" /><Label htmlFor="without_pay" className="cursor-pointer">Without Pay</Label></div></RadioGroup></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Start Date</Label><DatePicker date={startDate} onDateChange={setStartDate} placeholder="Pick date" disabled={!form.leave_type} disabledDates={getDateDisabledFn()} /></div>
                <div className="space-y-2"><Label>End Date</Label><DatePicker date={endDate} onDateChange={setEndDate} placeholder="Pick date" disabled={!form.leave_type} disabledDates={(date) => { const typeDisabled = getDateDisabledFn()(date); const beforeStart = startDate ? isBefore(date, startDate) : false; return typeDisabled || beforeStart; }} /></div>
              </div>
              {calculatedDays > 0 && <p className="text-sm text-muted-foreground">Total working days: <span className="font-medium text-foreground">{calculatedDays}</span></p>}
              {requiresMedicalCert ? (
                <div className="space-y-2"><Label>Medical Certificate (Required for 3+ days sick leave)</Label><div className="flex items-center gap-2"><Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="flex-1" /></div>{medicalFile && <p className="text-sm text-muted-foreground flex items-center gap-1"><Upload className="h-3 w-3" /> {medicalFile.name}</p>}</div>
              ) : (
                <div><Label>Reason</Label><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Optional reason for leave" /></div>
              )}
              <Button type="submit" className="w-full" disabled={createLeave.isPending || uploading || !form.leave_type || calculatedDays < 1 || (requiresMedicalCert && !medicalFile)}>
                {uploading ? 'Uploading...' : createLeave.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Leave Credits Card */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-lg">My Leave Credits</CardTitle></CardHeader>
        <CardContent>
          {credits && credits.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {activeLeaveTypes.map((leaveType) => {
                const credit = credits.find((c: any) => c.leave_type === leaveType.value);
                const total = credit?.total_credits || 0; const used = credit?.used_credits || 0; const available = total - used;
                const Icon = leaveType.icon; const isLow = total > 0 && available <= 0;
                return (
                  <div key={leaveType.id} className={cn("flex items-center gap-4 p-4 rounded-lg border", isLow ? "border-destructive/50 bg-destructive/5" : "border-border bg-muted/30")}>
                    <div className={cn("p-2 rounded-full bg-background", leaveType.color)}><Icon className="h-5 w-5" /></div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{leaveType.label}</p><div className="flex items-baseline gap-1"><span className={cn("text-2xl font-bold", isLow && "text-destructive")}>{available}</span><span className="text-sm text-muted-foreground">/ {total}</span></div>{used > 0 && <p className="text-xs text-muted-foreground">{used} used</p>}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No leave credits assigned yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>My Leave Requests</CardTitle><CardDescription>View the status of your leave applications</CardDescription></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <DataTable columns={columns} data={myLeaves || []} searchPlaceholder="Search my leaves..." emptyMessage="No leave requests found" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
