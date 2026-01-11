import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calculator, Plus, Eye, CheckCircle, Edit, Trash2, Banknote, Download } from 'lucide-react';
import { usePayrollPeriods, usePayrollRecords, useCreatePayrollPeriod, useRunPayroll, useApprovePayroll, useDeletePayrollPeriod, useDeletePayrollRecord } from '@/hooks/usePayroll';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useSalaryComponents, useCreateSalaryComponent, useUpdateSalaryComponent, useDeleteSalaryComponent } from '@/hooks/useSalaryComponents';
import { useLoans, useCreateLoan, useUpdateLoan, useDeleteLoan } from '@/hooks/useLoans';
import { useEmployees } from '@/hooks/useEmployees';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

export default function Payroll() {
  const { role } = useAuth();
  const isHR = role === 'hr_admin';
  const { data: periods, isLoading: periodsLoading } = usePayrollPeriods();
  const { data: components, isLoading: componentsLoading } = useSalaryComponents();
  const { data: loans, isLoading: loansLoading } = useLoans();
  const { data: employees } = useEmployees();
  const createPeriod = useCreatePayrollPeriod();
  const runPayroll = useRunPayroll();
  const approvePayroll = useApprovePayroll();
  const deletePayrollPeriod = useDeletePayrollPeriod();
  const deletePayrollRecord = useDeletePayrollRecord();

  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('periods');
  const { data: records, isLoading: recordsLoading } = usePayrollRecords(selectedPeriod || undefined);

  const [createOpen, setCreateOpen] = useState(false);
  const [periodForm, setPeriodForm] = useState({ period_start: '', period_end: '', pay_date: '' });
  const [viewPayslip, setViewPayslip] = useState<any>(null);

  const handleViewPeriod = (periodId: string) => {
    setSelectedPeriod(periodId);
    setActiveTab('records');
  };

  const handleCreatePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    createPeriod.mutate(periodForm, { onSuccess: () => { setPeriodForm({ period_start: '', period_end: '', pay_date: '' }); setCreateOpen(false); } });
  };

  const formatCurrency = (amount: number | null) => `₱${(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = { draft: 'outline', processing: 'secondary', approved: 'default', paid: 'default' };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const earnings = components?.filter(c => c.type === 'earning') || [];
  const deductions = components?.filter(c => c.type === 'deduction') || [];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Payroll Management</h1>
        {isHR && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New Payroll Period</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Payroll Period</DialogTitle></DialogHeader>
              <form onSubmit={handleCreatePeriod} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Period Start</Label><Input type="date" value={periodForm.period_start} onChange={(e) => setPeriodForm({ ...periodForm, period_start: e.target.value })} required /></div>
                  <div><Label>Period End</Label><Input type="date" value={periodForm.period_end} onChange={(e) => setPeriodForm({ ...periodForm, period_end: e.target.value })} required /></div>
                </div>
                <div><Label>Pay Date</Label><Input type="date" value={periodForm.pay_date} onChange={(e) => setPeriodForm({ ...periodForm, pay_date: e.target.value })} required /></div>
                <Button type="submit" className="w-full" disabled={createPeriod.isPending}>{createPeriod.isPending ? 'Creating...' : 'Create Period'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex w-auto min-w-full gap-1">
            <TabsTrigger value="periods">Payroll Periods</TabsTrigger>
            <TabsTrigger value="records">Payroll Records</TabsTrigger>
            <TabsTrigger value="components">Salary Components</TabsTrigger>
            <TabsTrigger value="loans">Loans</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="periods" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Payroll Periods</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Period</TableHead><TableHead>Pay Date</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {periodsLoading ? [1,2,3].map(i => <TableRow key={i}>{[1,2,3,4].map(j => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>) :
                   periods?.length ? periods.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>{format(new Date(p.period_start), 'MMM d')} - {format(new Date(p.period_end), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{format(new Date(p.pay_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>{getStatusBadge(p.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewPeriod(p.id)}><Eye className="h-4 w-4" /></Button>
                          {isHR && p.status === 'draft' && <Button size="sm" onClick={() => runPayroll.mutate({ periodId: p.id })}><Calculator className="mr-1 h-4 w-4" />Run</Button>}
                          {isHR && p.status === 'processing' && <Button size="sm" variant="outline" onClick={() => approvePayroll.mutate(p.id)}><CheckCircle className="mr-1 h-4 w-4" />Approve</Button>}
                          {isHR && (p.status === 'draft' || p.status === 'processing') && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Payroll Period?</AlertDialogTitle>
                                  <AlertDialogDescription>This will delete the payroll period and all associated records. This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deletePayrollPeriod.mutate(p.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No payroll periods</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Payroll Records</CardTitle><CardDescription>{selectedPeriod ? 'Employee payslips' : 'Select a period first'}</CardDescription></CardHeader>
            <CardContent>
              {selectedPeriod ? (
                <Table>
                  <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Basic</TableHead><TableHead>Gross</TableHead><TableHead>Deductions</TableHead><TableHead>Net Pay</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {recordsLoading ? [1,2,3].map(i => <TableRow key={i}>{[1,2,3,4,5,6].map(j => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>) :
                     records?.length ? records.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.employees?.first_name} {r.employees?.last_name}</TableCell>
                        <TableCell>{formatCurrency(r.basic_pay)}</TableCell>
                        <TableCell>{formatCurrency(r.gross_pay)}</TableCell>
                        <TableCell>{formatCurrency(r.total_deductions)}</TableCell>
                        <TableCell className="font-bold">{formatCurrency(r.net_pay)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setViewPayslip(r)}><Eye className="h-4 w-4" /></Button>
                            {isHR && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Payroll Record?</AlertDialogTitle>
                                    <AlertDialogDescription>This will delete the payroll record for {r.employees?.first_name} {r.employees?.last_name}. This action cannot be undone.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deletePayrollRecord.mutate(r.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No records</TableCell></TableRow>}
                  </TableBody>
                </Table>
              ) : <p className="text-muted-foreground text-center py-8">Select a payroll period</p>}
            </CardContent>
          </Card>
          {viewPayslip && <PayslipDialog record={viewPayslip} onClose={() => setViewPayslip(null)} formatCurrency={formatCurrency} />}
        </TabsContent>

        <TabsContent value="components" className="mt-4">
          <SalaryComponentsTab earnings={earnings} deductions={deductions} isLoading={componentsLoading} isHR={isHR} />
        </TabsContent>

        <TabsContent value="loans" className="mt-4">
          <LoansTab loans={loans} employees={employees} isLoading={loansLoading} isHR={isHR} formatCurrency={formatCurrency} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PayslipDialog({ record: r, onClose, formatCurrency }: { record: any; onClose: () => void; formatCurrency: (n: number | null) => string }) {
  const handleDownload = () => {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payslip - ${r.employees?.first_name} ${r.employees?.last_name}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
    .header h1 { margin: 0; color: #333; }
    .header p { margin: 5px 0; color: #666; }
    .employee-info { margin-bottom: 20px; }
    .section { margin-bottom: 20px; }
    .section h3 { margin: 0 0 10px; padding: 5px; background: #f5f5f5; }
    .row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
    .row.total { font-weight: bold; border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; }
    .net-pay { text-align: center; background: #f0f7ff; padding: 20px; border-radius: 8px; margin-top: 20px; }
    .net-pay .amount { font-size: 28px; font-weight: bold; color: #0066cc; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>MVC Corporation</h1>
    <p>PAYSLIP</p>
  </div>
  <div class="employee-info">
    <strong>Employee:</strong> ${r.employees?.first_name} ${r.employees?.last_name}<br>
    <strong>Employee ID:</strong> ${r.employees?.employee_id || 'N/A'}
  </div>
  <div class="section">
    <h3 style="color: #22c55e;">Earnings</h3>
    <div class="row"><span>Basic Pay</span><span>${formatCurrency(r.basic_pay)}</span></div>
    <div class="row"><span>Overtime Pay</span><span>${formatCurrency(r.overtime_pay)}</span></div>
    <div class="row"><span>Holiday Pay</span><span>${formatCurrency(r.holiday_pay)}</span></div>
    <div class="row"><span>Allowances</span><span>${formatCurrency(r.total_allowances)}</span></div>
    <div class="row total"><span>Gross Pay</span><span>${formatCurrency(r.gross_pay)}</span></div>
  </div>
  <div class="section">
    <h3 style="color: #ef4444;">Deductions</h3>
    <div class="row"><span>SSS</span><span>${formatCurrency(r.sss_contribution)}</span></div>
    <div class="row"><span>PhilHealth</span><span>${formatCurrency(r.philhealth_contribution)}</span></div>
    <div class="row"><span>Pag-IBIG</span><span>${formatCurrency(r.pagibig_contribution)}</span></div>
    <div class="row"><span>Withholding Tax</span><span>${formatCurrency(r.withholding_tax)}</span></div>
    <div class="row total"><span>Total Deductions</span><span>${formatCurrency(r.total_deductions)}</span></div>
  </div>
  <div class="net-pay">
    <p style="margin:0 0 5px; color: #666;">Net Pay</p>
    <p class="amount" style="margin:0;">${formatCurrency(r.net_pay)}</p>
  </div>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip-${r.employees?.last_name || 'employee'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Payslip - {r.employees?.first_name} {r.employees?.last_name}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div><h4 className="font-semibold text-success mb-2">Earnings</h4><div className="space-y-1 text-sm"><div className="flex justify-between"><span>Basic Pay</span><span>{formatCurrency(r.basic_pay)}</span></div><div className="flex justify-between"><span>Overtime</span><span>{formatCurrency(r.overtime_pay)}</span></div><div className="flex justify-between"><span>Holiday</span><span>{formatCurrency(r.holiday_pay)}</span></div><div className="flex justify-between"><span>Allowances</span><span>{formatCurrency(r.total_allowances)}</span></div><div className="flex justify-between font-bold border-t pt-1"><span>Gross</span><span>{formatCurrency(r.gross_pay)}</span></div></div></div>
          <div><h4 className="font-semibold text-destructive mb-2">Deductions</h4><div className="space-y-1 text-sm"><div className="flex justify-between"><span>SSS</span><span>{formatCurrency(r.sss_contribution)}</span></div><div className="flex justify-between"><span>PhilHealth</span><span>{formatCurrency(r.philhealth_contribution)}</span></div><div className="flex justify-between"><span>Pag-IBIG</span><span>{formatCurrency(r.pagibig_contribution)}</span></div><div className="flex justify-between"><span>Tax</span><span>{formatCurrency(r.withholding_tax)}</span></div><div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span>{formatCurrency(r.total_deductions)}</span></div></div></div>
        </div>
        <div className="bg-primary/10 p-4 rounded-lg text-center"><p className="text-sm text-muted-foreground">Net Pay</p><p className="text-2xl font-bold text-primary">{formatCurrency(r.net_pay)}</p></div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Close</Button>
          <Button onClick={handleDownload} className="w-full sm:w-auto">Download Payslip</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SalaryComponentsTab({ earnings, deductions, isLoading, isHR }: { earnings: any[]; deductions: any[]; isLoading: boolean; isHR: boolean }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'earning', description: '', is_taxable: true, is_mandatory: false });
  const createComponent = useCreateSalaryComponent();
  const deleteComponent = useDeleteSalaryComponent();

  const handleSubmit = async () => {
    await createComponent.mutateAsync(form);
    setDialogOpen(false);
    setForm({ name: '', type: 'earning', description: '', is_taxable: true, is_mandatory: false });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><CardTitle>Salary Components</CardTitle><CardDescription>Configure earnings and deductions</CardDescription></div>
          {isHR && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild><Button className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" />Add Component</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Salary Component</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                  <div><Label>Type</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="earning">Earning</SelectItem><SelectItem value="deduction">Deduction</SelectItem></SelectContent></Select></div>
                  <div className="flex items-center justify-between"><Label>Taxable</Label><Switch checked={form.is_taxable} onCheckedChange={(v) => setForm({ ...form, is_taxable: v })} /></div>
                  <div className="flex items-center justify-between"><Label>Mandatory</Label><Switch checked={form.is_mandatory} onCheckedChange={(v) => setForm({ ...form, is_mandatory: v })} /></div>
                </div>
                <DialogFooter><Button onClick={handleSubmit} disabled={!form.name}>Create</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-40 w-full" /> : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border rounded-lg p-4"><h3 className="font-semibold text-success mb-3">Earnings</h3>
              {earnings.length ? <ul className="space-y-2 text-sm">{earnings.map(c => <li key={c.id} className="flex justify-between items-center"><span>• {c.name}</span>{isHR && <Button variant="ghost" size="icon" onClick={() => deleteComponent.mutate(c.id)}><Trash2 className="h-4 w-4" /></Button>}</li>)}</ul> : <p className="text-muted-foreground text-sm">No earnings configured</p>}
            </div>
            <div className="border rounded-lg p-4"><h3 className="font-semibold text-destructive mb-3">Deductions</h3>
              {deductions.length ? <ul className="space-y-2 text-sm">{deductions.map(c => <li key={c.id} className="flex justify-between items-center"><span>• {c.name}</span>{isHR && <Button variant="ghost" size="icon" onClick={() => deleteComponent.mutate(c.id)}><Trash2 className="h-4 w-4" /></Button>}</li>)}</ul> : <p className="text-muted-foreground text-sm">No deductions configured</p>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LoansTab({ loans, employees, isLoading, isHR, formatCurrency }: { loans: any; employees: any; isLoading: boolean; isHR: boolean; formatCurrency: (n: number | null) => string }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ employee_id: '', loan_type: 'SSS', principal_amount: '', monthly_amortization: '', start_date: '' });
  const createLoan = useCreateLoan();
  const deleteLoan = useDeleteLoan();

  const handleSubmit = async () => {
    await createLoan.mutateAsync({ ...form, principal_amount: parseFloat(form.principal_amount), monthly_amortization: parseFloat(form.monthly_amortization) });
    setDialogOpen(false);
    setForm({ employee_id: '', loan_type: 'SSS', principal_amount: '', monthly_amortization: '', start_date: '' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><CardTitle className="flex items-center gap-2"><Banknote className="h-5 w-5" />Loan Management</CardTitle><CardDescription>Manage employee loans</CardDescription></div>
          {isHR && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild><Button className="w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" />Add Loan</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Employee Loan</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div><Label>Employee</Label><Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{employees?.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Loan Type</Label><Select value={form.loan_type} onValueChange={(v) => setForm({ ...form, loan_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SSS">SSS Loan</SelectItem><SelectItem value="Pag-IBIG">Pag-IBIG Loan</SelectItem><SelectItem value="Company">Company Loan</SelectItem></SelectContent></Select></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Principal Amount</Label><Input type="number" value={form.principal_amount} onChange={(e) => setForm({ ...form, principal_amount: e.target.value })} /></div>
                    <div><Label>Monthly Amortization</Label><Input type="number" value={form.monthly_amortization} onChange={(e) => setForm({ ...form, monthly_amortization: e.target.value })} /></div>
                  </div>
                  <div><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                </div>
                <DialogFooter><Button onClick={handleSubmit} disabled={!form.employee_id || !form.principal_amount}>Create</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-40 w-full" /> : !loans?.length ? <p className="text-muted-foreground text-center py-8">No loans</p> : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>Principal</TableHead><TableHead>Monthly</TableHead><TableHead>Balance</TableHead><TableHead>Status</TableHead>{isHR && <TableHead>Actions</TableHead>}</TableRow></TableHeader>
              <TableBody>
                {loans.map((l: any) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.employee?.first_name} {l.employee?.last_name}</TableCell>
                    <TableCell>{l.loan_type}</TableCell>
                    <TableCell>{formatCurrency(l.principal_amount)}</TableCell>
                    <TableCell>{formatCurrency(l.monthly_amortization)}</TableCell>
                    <TableCell>{formatCurrency(l.remaining_balance)}</TableCell>
                    <TableCell><Badge variant={l.status === 'active' ? 'default' : 'secondary'}>{l.status}</Badge></TableCell>
                    {isHR && <TableCell><Button variant="ghost" size="icon" onClick={() => deleteLoan.mutate(l.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
