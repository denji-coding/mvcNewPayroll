import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLeaveRequests, useCreateLeaveRequest, useApproveLeaveRequest, useLeaveCredits, calculateWorkingDays } from '@/hooks/useLeaves';
import { useLeaveTypes } from '@/hooks/useLeaveTypes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePicker } from '@/components/ui/date-picker';
import { Plus, CheckCircle, XCircle, Upload, Heart, Palmtree, AlertTriangle, Baby, Flower2, CloudRain, Ban, CalendarDays } from 'lucide-react';
import { format, startOfToday, isBefore, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePagination } from '@/hooks/usePagination';
import { TablePagination } from '@/components/TablePagination';

// Map leave type names to icons and colors
const LEAVE_TYPE_ICON_MAP: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  'sick': { icon: Heart, color: 'text-destructive' },
  'vacation': { icon: Palmtree, color: 'text-success' },
  'emergency': { icon: AlertTriangle, color: 'text-warning' },
  'maternity': { icon: Baby, color: 'text-pink-500' },
  'paternity': { icon: Baby, color: 'text-blue-500' },
  'bereavement': { icon: Flower2, color: 'text-muted-foreground' },
  'unpaid': { icon: Ban, color: 'text-muted-foreground' },
};

const getLeaveTypeVisuals = (name: string) => {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(LEAVE_TYPE_ICON_MAP)) {
    if (lower.includes(key)) return val;
  }
  return { icon: CalendarDays, color: 'text-primary' };
};

export default function Leaves() {
  const { role, user } = useAuth();
  const { data: leaves, isLoading } = useLeaveRequests();
  const { data: credits } = useLeaveCredits();
  const { data: leaveTypes } = useLeaveTypes();
  const createLeave = useCreateLeaveRequest();
  const approveLeave = useApproveLeaveRequest();

  // Build dynamic leave types from database
  const activeLeaveTypes = (leaveTypes || []).filter(lt => lt.is_active).map(lt => {
    const visuals = getLeaveTypeVisuals(lt.name);
    // Map name to enum value
    const nameToEnum: Record<string, string> = {
      'Sick Leave': 'sick', 'Vacation Leave': 'vacation', 'Emergency Leave': 'emergency',
      'Maternity/Paternity Leave': 'maternity', 'Bereavement Leave': 'bereavement', 'Unpaid Leave': 'unpaid',
    };
    const enumVal = nameToEnum[lt.name] || lt.name.toLowerCase().replace(/\s+/g, '_');
    return { value: enumVal, label: lt.name, icon: visuals.icon, defaultCredits: lt.default_credits, color: visuals.color };
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ leave_type: '', reason: '' });
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [reviewLeave, setReviewLeave] = useState<any>(null);
  const [remarks, setRemarks] = useState('');
  const [medicalFile, setMedicalFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { currentPage, setCurrentPage, totalPages, paginatedItems } = usePagination(leaves || [], 10);

  const today = startOfToday();
  const isSickLeave = form.leave_type === 'sick';
  
  const calculatedDays = startDate && endDate 
    ? calculateWorkingDays(startDate, endDate)
    : 0;

  const requiresMedicalCert = isSickLeave && calculatedDays >= 3;

  // Reset dates when leave type changes
  useEffect(() => {
    setStartDate(undefined);
    setEndDate(undefined);
  }, [form.leave_type]);

  const getDateDisabledFn = () => {
    if (isSickLeave) {
      // Sick leave: disable future dates, allow past and today
      return (date: Date) => isAfter(date, today);
    }
    // Other leaves: disable past dates, allow today and future
    return (date: Date) => isBefore(date, today);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setMedicalFile(file);
    }
  };

  const uploadMedicalCert = async (): Promise<string | null> => {
    if (!medicalFile || !user) return null;
    
    const fileExt = medicalFile.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('medical-certificates')
      .upload(fileName, medicalFile);
    
    if (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload medical certificate');
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('medical-certificates')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leave_type || !startDate || !endDate) return;

    try {
      setUploading(true);
      let medicalCertUrl: string | null = null;

      if (requiresMedicalCert && medicalFile) {
        medicalCertUrl = await uploadMedicalCert();
      }

      createLeave.mutate({
        leave_type: form.leave_type as any,
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        total_days: calculatedDays,
        reason: form.reason || null,
        medical_certificate_url: medicalCertUrl,
      }, {
        onSuccess: () => {
          setForm({ leave_type: '', reason: '' });
          setStartDate(undefined);
          setEndDate(undefined);
          setMedicalFile(null);
          setOpen(false);
        }
      });
    } catch (error) {
      toast.error('Failed to submit leave request');
    } finally {
      setUploading(false);
    }
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
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New Leave Request</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Leave Type</Label>
                <Select value={form.leave_type} onValueChange={(v) => setForm({ ...form, leave_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {activeLeaveTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <DatePicker
                    date={startDate}
                    onDateChange={setStartDate}
                    placeholder="Pick date"
                    disabled={!form.leave_type}
                    disabledDates={getDateDisabledFn()}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <DatePicker
                    date={endDate}
                    onDateChange={setEndDate}
                    placeholder="Pick date"
                    disabled={!form.leave_type}
                    disabledDates={(date) => {
                      const typeDisabled = getDateDisabledFn()(date);
                      const beforeStart = startDate ? isBefore(date, startDate) : false;
                      return typeDisabled || beforeStart;
                    }}
                  />
                </div>
              </div>
              
              {calculatedDays > 0 && (
                <p className="text-sm text-muted-foreground">Total working days: <span className="font-medium text-foreground">{calculatedDays}</span></p>
              )}
              
              {requiresMedicalCert ? (
                <div className="space-y-2">
                  <Label>Medical Certificate (Required for 3+ days sick leave)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="flex-1"
                    />
                  </div>
                  {medicalFile && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Upload className="h-3 w-3" /> {medicalFile.name}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <Label>Reason</Label>
                  <Textarea 
                    value={form.reason} 
                    onChange={(e) => setForm({ ...form, reason: e.target.value })} 
                    placeholder="Optional reason for leave" 
                  />
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={createLeave.isPending || uploading || !form.leave_type || calculatedDays < 1 || (requiresMedicalCert && !medicalFile)}
              >
                {uploading ? 'Uploading...' : createLeave.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Leave Credits Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">My Leave Credits</CardTitle>
        </CardHeader>
        <CardContent>
          {credits && credits.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              {activeLeaveTypes.map((leaveType) => {
                const credit = credits.find((c: any) => c.leave_type === leaveType.value);
                const total = credit?.total_credits || 0;
                const used = credit?.used_credits || 0;
                const available = total - used;
                const Icon = leaveType.icon;
                const isLow = total > 0 && available <= 0;
                
                return (
                  <div 
                    key={leaveType.value} 
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border",
                      isLow ? "border-destructive/50 bg-destructive/5" : "border-border bg-muted/30"
                    )}
                  >
                    <div className={cn("p-2 rounded-full bg-background", leaveType.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{leaveType.label}</p>
                      <div className="flex items-baseline gap-1">
                        <span className={cn("text-2xl font-bold", isLow && "text-destructive")}>{available}</span>
                        <span className="text-sm text-muted-foreground">/ {total}</span>
                      </div>
                      {used > 0 && <p className="text-xs text-muted-foreground">{used} used</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No leave credits assigned yet. {role === 'hr_admin' && 'Click "Manage Credits" to add credits for employees.'}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Leave Requests</CardTitle><CardDescription>View and manage leave requests</CardDescription></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                ) : paginatedItems.length > 0 ? (
                  paginatedItems.map((l: any) => (
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
                                {l.medical_certificate_url && (
                                  <div>
                                    <Label>Medical Certificate</Label>
                                    <a href={l.medical_certificate_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline block">
                                      View Certificate
                                    </a>
                                  </div>
                                )}
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
