import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLeaveRequests, useCreateLeaveRequest, useApproveLeaveRequest, useLeaveCredits, useAllLeaveCredits, useCreateLeaveCredit, useUpdateLeaveCredit, calculateWorkingDays } from '@/hooks/useLeaves';
import { useEmployees } from '@/hooks/useEmployees';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, CheckCircle, XCircle, CalendarIcon, Upload, Settings, Heart, Palmtree, AlertTriangle } from 'lucide-react';
import { format, startOfToday, isBefore, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePagination } from '@/hooks/usePagination';
import { TablePagination } from '@/components/TablePagination';

const LEAVE_TYPES = [
  { value: 'sick', label: 'Sick Leave', icon: Heart, defaultCredits: 2, color: 'text-destructive' },
  { value: 'vacation', label: 'Vacation Leave', icon: Palmtree, defaultCredits: 1, color: 'text-success' },
  { value: 'emergency', label: 'Emergency Leave', icon: AlertTriangle, defaultCredits: 2, color: 'text-warning' },
];

export default function Leaves() {
  const { role, user } = useAuth();
  const { data: leaves, isLoading } = useLeaveRequests();
  const { data: credits } = useLeaveCredits();
  const { data: allCredits } = useAllLeaveCredits();
  const { data: employees } = useEmployees();
  const createLeave = useCreateLeaveRequest();
  const approveLeave = useApproveLeaveRequest();
  const createCredit = useCreateLeaveCredit();
  const updateCredit = useUpdateLeaveCredit();

  const [open, setOpen] = useState(false);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [form, setForm] = useState({ leave_type: '', reason: '' });
  const [creditForm, setCreditForm] = useState({ employee_id: '', leave_type: '', total_credits: '' });
  const [editCreditId, setEditCreditId] = useState<string | null>(null);
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

  const handleAddCredit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditForm.employee_id || !creditForm.leave_type || !creditForm.total_credits) return;
    
    createCredit.mutate({
      employee_id: creditForm.employee_id,
      leave_type: creditForm.leave_type as 'sick' | 'vacation' | 'emergency',
      total_credits: parseFloat(creditForm.total_credits),
    }, {
      onSuccess: () => {
        setCreditForm({ employee_id: '', leave_type: '', total_credits: '' });
        setCreditDialogOpen(false);
      }
    });
  };

  const handleEditCredit = (credit: any) => {
    setEditCreditId(credit.id);
    setCreditForm({
      employee_id: credit.employee_id,
      leave_type: credit.leave_type,
      total_credits: credit.total_credits?.toString() || '',
    });
    setCreditDialogOpen(true);
  };

  const handleSaveCredit = () => {
    if (!editCreditId) return;
    updateCredit.mutate({
      id: editCreditId,
      total_credits: parseFloat(creditForm.total_credits),
    }, {
      onSuccess: () => {
        setEditCreditId(null);
        setCreditForm({ employee_id: '', leave_type: '', total_credits: '' });
        setCreditDialogOpen(false);
      }
    });
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
                    {LEAVE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                        disabled={!form.leave_type}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "MMM d, yyyy") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={getDateDisabledFn()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                        disabled={!form.leave_type}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "MMM d, yyyy") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => {
                          const typeDisabled = getDateDisabledFn()(date);
                          const beforeStart = startDate ? isBefore(date, startDate) : false;
                          return typeDisabled || beforeStart;
                        }}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Leave Credits</CardTitle>
          {role === 'hr_admin' && (
            <Dialog open={creditDialogOpen} onOpenChange={(open) => {
              if (!open) {
                setEditCreditId(null);
                setCreditForm({ employee_id: '', leave_type: '', total_credits: '' });
              }
              setCreditDialogOpen(open);
            }}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Settings className="mr-2 h-4 w-4" /> Manage Credits
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editCreditId ? 'Edit Leave Credit' : 'Add Leave Credit'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={editCreditId ? (e) => { e.preventDefault(); handleSaveCredit(); } : handleAddCredit} className="space-y-4">
                  {!editCreditId && (
                    <>
                      <div>
                        <Label>Employee</Label>
                        <Select value={creditForm.employee_id} onValueChange={(v) => setCreditForm({ ...creditForm, employee_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                          <SelectContent>
                            {employees?.map((emp: any) => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.first_name} {emp.last_name} ({emp.employee_id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Leave Type</Label>
                        <Select value={creditForm.leave_type} onValueChange={(v) => {
                          const defaultCredits = LEAVE_TYPES.find(lt => lt.value === v)?.defaultCredits || 0;
                          setCreditForm({ ...creditForm, leave_type: v, total_credits: defaultCredits.toString() });
                        }}>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            {LEAVE_TYPES.map(t => (
                              <SelectItem key={t.value} value={t.value}>{t.label} (Default: {t.defaultCredits} days)</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  <div>
                    <Label>Total Credits</Label>
                    <Input 
                      type="number" 
                      min="0" 
                      step="0.5"
                      value={creditForm.total_credits} 
                      onChange={(e) => setCreditForm({ ...creditForm, total_credits: e.target.value })} 
                      placeholder="Enter credit amount"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createCredit.isPending || updateCredit.isPending}>
                      {editCreditId ? 'Save Changes' : 'Add Credit'}
                    </Button>
                  </DialogFooter>
                </form>
                
                {/* Show existing credits */}
                {!editCreditId && allCredits && allCredits.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Existing Credits (Current Year)</h4>
                    <div className="max-h-48 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Employee</TableHead>
                            <TableHead className="text-xs">Type</TableHead>
                            <TableHead className="text-xs">Total</TableHead>
                            <TableHead className="text-xs">Used</TableHead>
                            <TableHead className="text-xs"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allCredits.slice(0, 10).map((credit: any) => (
                            <TableRow key={credit.id}>
                              <TableCell className="text-xs py-1">
                                {credit.employees?.first_name} {credit.employees?.last_name}
                              </TableCell>
                              <TableCell className="text-xs py-1 capitalize">{credit.leave_type}</TableCell>
                              <TableCell className="text-xs py-1">{credit.total_credits}</TableCell>
                              <TableCell className="text-xs py-1">{credit.used_credits}</TableCell>
                              <TableCell className="text-xs py-1">
                                <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => handleEditCredit(credit)}>
                                  Edit
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {credits && credits.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              {LEAVE_TYPES.map((leaveType) => {
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
                        <span className="text-sm text-muted-foreground">/ {total} days</span>
                      </div>
                      {used > 0 && <p className="text-xs text-muted-foreground">{used} day(s) used</p>}
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
