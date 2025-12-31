import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Calculator, Plus, Eye, CheckCircle } from 'lucide-react';
import { usePayrollPeriods, usePayrollRecords, useCreatePayrollPeriod, useRunPayroll, useApprovePayroll, useSalaryComponents } from '@/hooks/usePayroll';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

export default function Payroll() {
  const { role } = useAuth();
  const { data: periods, isLoading: periodsLoading } = usePayrollPeriods();
  const { data: components } = useSalaryComponents();
  const createPeriod = useCreatePayrollPeriod();
  const runPayroll = useRunPayroll();
  const approvePayroll = useApprovePayroll();

  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const { data: records, isLoading: recordsLoading } = usePayrollRecords(selectedPeriod || undefined);

  const [createOpen, setCreateOpen] = useState(false);
  const [periodForm, setPeriodForm] = useState({ period_start: '', period_end: '', pay_date: '' });
  const [viewPayslip, setViewPayslip] = useState<any>(null);

  const handleCreatePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    createPeriod.mutate({
      period_start: periodForm.period_start,
      period_end: periodForm.period_end,
      pay_date: periodForm.pay_date
    }, {
      onSuccess: () => {
        setPeriodForm({ period_start: '', period_end: '', pay_date: '' });
        setCreateOpen(false);
      }
    });
  };

  const handleRunPayroll = (periodId: string) => {
    runPayroll.mutate({ periodId });
  };

  const handleApprovePayroll = (periodId: string) => {
    approvePayroll.mutate(periodId);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-muted text-muted-foreground',
      processing: 'bg-info/20 text-info',
      approved: 'bg-success/20 text-success',
      paid: 'bg-primary/20 text-primary'
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || styles.draft}`}>{status}</span>;
  };

  const formatCurrency = (amount: number | null) => {
    return `₱${(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  };

  const earnings = components?.filter((c: any) => c.type === 'earning') || [];
  const deductions = components?.filter((c: any) => c.type === 'deduction') || [];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Payroll Management</h1>
        {role === 'hr_admin' && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> New Payroll Period</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Payroll Period</DialogTitle></DialogHeader>
              <form onSubmit={handleCreatePeriod} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Period Start</Label><Input type="date" value={periodForm.period_start} onChange={(e) => setPeriodForm({ ...periodForm, period_start: e.target.value })} required /></div>
                  <div><Label>Period End</Label><Input type="date" value={periodForm.period_end} onChange={(e) => setPeriodForm({ ...periodForm, period_end: e.target.value })} required /></div>
                </div>
                <div><Label>Pay Date</Label><Input type="date" value={periodForm.pay_date} onChange={(e) => setPeriodForm({ ...periodForm, pay_date: e.target.value })} required /></div>
                <Button type="submit" className="w-full" disabled={createPeriod.isPending}>
                  {createPeriod.isPending ? 'Creating...' : 'Create Period'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="periods">
        <TabsList>
          <TabsTrigger value="periods">Payroll Periods</TabsTrigger>
          <TabsTrigger value="records">Payroll Records</TabsTrigger>
          <TabsTrigger value="components">Salary Components</TabsTrigger>
        </TabsList>

        <TabsContent value="periods" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Payroll Periods</CardTitle><CardDescription>Manage payroll cycles and processing</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Pay Date</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Total Gross</TableHead>
                    <TableHead>Total Net</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periodsLoading ? (
                    [1, 2, 3].map(i => (
                      <TableRow key={i}>
                        {[1, 2, 3, 4, 5, 6, 7].map(j => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                      </TableRow>
                    ))
                  ) : periods && periods.length > 0 ? (
                    periods.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell>{format(new Date(p.period_start), 'MMM d')} - {format(new Date(p.period_end), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{format(new Date(p.pay_date), 'MMM d, yyyy')}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>{getStatusBadge(p.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setSelectedPeriod(p.id)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {role === 'hr_admin' && p.status === 'draft' && (
                              <Button size="sm" onClick={() => handleRunPayroll(p.id)} disabled={runPayroll.isPending}>
                                <Calculator className="mr-1 h-4 w-4" /> Run
                              </Button>
                            )}
                            {role === 'hr_admin' && p.status === 'processing' && (
                              <Button size="sm" variant="outline" onClick={() => handleApprovePayroll(p.id)} disabled={approvePayroll.isPending}>
                                <CheckCircle className="mr-1 h-4 w-4" /> Approve
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No payroll periods. Click "New Payroll Period" to create one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Records</CardTitle>
              <CardDescription>
                {selectedPeriod ? 'Individual employee payslips' : 'Select a payroll period from the Periods tab to view records'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedPeriod ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Basic Pay</TableHead>
                      <TableHead>Gross Pay</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net Pay</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recordsLoading ? (
                      [1, 2, 3].map(i => (
                        <TableRow key={i}>
                          {[1, 2, 3, 4, 5, 6].map(j => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                        </TableRow>
                      ))
                    ) : records && records.length > 0 ? (
                      records.map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.employees?.first_name} {r.employees?.last_name}</TableCell>
                          <TableCell>{formatCurrency(r.basic_pay)}</TableCell>
                          <TableCell>{formatCurrency(r.gross_pay)}</TableCell>
                          <TableCell>{formatCurrency(r.total_deductions)}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(r.net_pay)}</TableCell>
                          <TableCell>
                            <Dialog open={viewPayslip?.id === r.id} onOpenChange={(open) => !open && setViewPayslip(null)}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => setViewPayslip(r)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg">
                                <DialogHeader><DialogTitle>Payslip</DialogTitle></DialogHeader>
                                <div className="space-y-4">
                                  <div className="text-center border-b pb-4">
                                    <h3 className="font-bold">{r.employees?.first_name} {r.employees?.last_name}</h3>
                                    <p className="text-sm text-muted-foreground">{r.employees?.position}</p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold text-success mb-2">Earnings</h4>
                                      <div className="space-y-1 text-sm">
                                        <div className="flex justify-between"><span>Basic Pay</span><span>{formatCurrency(r.basic_pay)}</span></div>
                                        <div className="flex justify-between"><span>Overtime</span><span>{formatCurrency(r.overtime_pay)}</span></div>
                                        <div className="flex justify-between"><span>Holiday Pay</span><span>{formatCurrency(r.holiday_pay)}</span></div>
                                        <div className="flex justify-between"><span>Allowances</span><span>{formatCurrency(r.total_allowances)}</span></div>
                                        <div className="flex justify-between font-bold border-t pt-1"><span>Gross Pay</span><span>{formatCurrency(r.gross_pay)}</span></div>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-destructive mb-2">Deductions</h4>
                                      <div className="space-y-1 text-sm">
                                        <div className="flex justify-between"><span>SSS</span><span>{formatCurrency(r.sss_contribution)}</span></div>
                                        <div className="flex justify-between"><span>PhilHealth</span><span>{formatCurrency(r.philhealth_contribution)}</span></div>
                                        <div className="flex justify-between"><span>Pag-IBIG</span><span>{formatCurrency(r.pagibig_contribution)}</span></div>
                                        <div className="flex justify-between"><span>Withholding Tax</span><span>{formatCurrency(r.withholding_tax)}</span></div>
                                        <div className="flex justify-between"><span>Other</span><span>{formatCurrency(r.other_deductions)}</span></div>
                                        <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span>{formatCurrency(r.total_deductions)}</span></div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="bg-primary/10 p-4 rounded-lg text-center">
                                    <p className="text-sm text-muted-foreground">Net Pay</p>
                                    <p className="text-2xl font-bold text-primary">{formatCurrency(r.net_pay)}</p>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No payroll records for this period. Run payroll to generate records.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">Select a payroll period to view records</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Salary Components</CardTitle><CardDescription>Configure earnings and deductions</CardDescription></CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-success mb-3">Earnings</h3>
                  {earnings.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {earnings.map((c: any) => (
                        <li key={c.id} className="flex justify-between">
                          <span>• {c.name}</span>
                          {c.is_taxable && <span className="text-xs text-muted-foreground">Taxable</span>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      <li>• Transportation Allowance</li>
                      <li>• Rice Allowance</li>
                      <li>• Meal Allowance</li>
                      <li>• Overtime Pay</li>
                      <li>• Night Differential</li>
                      <li>• Holiday Pay</li>
                    </ul>
                  )}
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-destructive mb-3">Deductions</h3>
                  {deductions.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {deductions.map((c: any) => (
                        <li key={c.id} className="flex justify-between">
                          <span>• {c.name}</span>
                          {c.is_mandatory && <span className="text-xs text-muted-foreground">Mandatory</span>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      <li>• SSS Contribution</li>
                      <li>• PhilHealth Contribution</li>
                      <li>• Pag-IBIG Contribution</li>
                      <li>• Withholding Tax</li>
                      <li>• SSS Loan</li>
                      <li>• Pag-IBIG Loan</li>
                      <li>• Company Loan</li>
                    </ul>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
