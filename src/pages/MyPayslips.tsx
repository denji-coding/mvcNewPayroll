import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Calendar, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { generatePayslipPdf } from '@/lib/generatePayslipPdf';
import { DataTable, ColumnDef } from '@/components/ui/data-table';

const currentYear = new Date().getFullYear();
const startYear = 2020;
const years = Array.from({ length: currentYear - startYear + 1 }, (_, i) => currentYear - i);

export default function MyPayslips() {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const { data: employee, isLoading: employeeLoading } = useQuery({
    queryKey: ['my-employee-record', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase.from('employees').select('id, employee_id, first_name, last_name, position, department, basic_salary').eq('user_id', user.id).single();
      if (error) throw error; return data;
    },
    enabled: !!user?.id,
  });

  const { data: payrollRecords, isLoading: payrollLoading } = useQuery({
    queryKey: ['my-payroll-records', employee?.id, selectedYear],
    queryFn: async () => {
      if (!employee?.id) return [];
      const { data, error } = await supabase.from('payroll_records').select(`*, payroll_periods!inner(id, period_start, period_end, pay_date, status)`)
        .eq('employee_id', employee.id).gte('payroll_periods.period_start', `${selectedYear}-01-01`).lte('payroll_periods.period_end', `${selectedYear}-12-31`)
        .order('payroll_periods(period_start)', { ascending: false });
      if (error) throw error; return data;
    },
    enabled: !!employee?.id,
  });

  const handleDownloadPayslip = (record: any) => {
    if (!employee || !record) return;
    generatePayslipPdf({
      employee: { employee_id: employee.employee_id, first_name: employee.first_name, last_name: employee.last_name, position: employee.position, department: employee.department },
      payroll: {
        period_start: record.payroll_periods.period_start, period_end: record.payroll_periods.period_end, pay_date: record.payroll_periods.pay_date,
        basic_pay: Number(record.basic_pay), days_worked: Number(record.days_worked || 0), overtime_pay: Number(record.overtime_pay || 0),
        holiday_pay: Number(record.holiday_pay || 0), night_differential: Number(record.night_differential || 0), total_allowances: Number(record.total_allowances || 0),
        allowances_breakdown: record.allowances_breakdown as Record<string, number> || {}, gross_pay: Number(record.gross_pay || 0),
        sss_contribution: Number(record.sss_contribution || 0), philhealth_contribution: Number(record.philhealth_contribution || 0),
        pagibig_contribution: Number(record.pagibig_contribution || 0), withholding_tax: Number(record.withholding_tax || 0),
        other_deductions: Number(record.other_deductions || 0), deductions_breakdown: record.deductions_breakdown as Record<string, number> || {},
        total_deductions: Number(record.total_deductions || 0), net_pay: Number(record.net_pay || 0),
      },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="default">Approved</Badge>;
      case 'paid': return <Badge className="bg-green-600 hover:bg-green-700">Paid</Badge>;
      case 'processing': return <Badge variant="secondary">Processing</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const approvedRecords = payrollRecords?.filter(r => r.payroll_periods.status === 'approved' || r.payroll_periods.status === 'paid') || [];
  const totalEarnings = approvedRecords.reduce((sum, r) => sum + Number(r.gross_pay || 0), 0);
  const totalDeductions = approvedRecords.reduce((sum, r) => sum + Number(r.total_deductions || 0), 0);
  const totalNetPay = approvedRecords.reduce((sum, r) => sum + Number(r.net_pay || 0), 0);

  if (employeeLoading) return <div className="space-y-6 p-6"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div><Skeleton className="h-96" /></div>;
  if (!employee) return <div className="p-6"><Card><CardContent className="flex flex-col items-center justify-center py-12"><FileText className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground">No employee record found.</p></CardContent></Card></div>;

  const columns: ColumnDef<any, any>[] = [
    {
      id: 'period', header: 'Pay Period',
      accessorFn: (row) => row.payroll_periods.period_start,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex items-center gap-2">
            {format(new Date(r.payroll_periods.period_start), 'MMM d')} - {format(new Date(r.payroll_periods.period_end), 'MMM d, yyyy')}
            {r.is_manual && <Badge variant="outline" className="bg-info/10 text-info border-info/30 text-xs">Manual</Badge>}
          </div>
        );
      },
    },
    { id: 'pay_date', header: 'Pay Date', accessorFn: (row) => row.payroll_periods.pay_date, cell: ({ row }) => format(new Date(row.original.payroll_periods.pay_date), 'MMM d, yyyy') },
    { accessorKey: 'gross_pay', header: 'Gross Pay', cell: ({ getValue }) => `₱${Number(getValue() || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` },
    { accessorKey: 'total_deductions', header: 'Deductions', cell: ({ getValue }) => <span className="text-destructive">-₱{Number(getValue() || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span> },
    { accessorKey: 'net_pay', header: 'Net Pay', cell: ({ getValue }) => <span className="font-semibold">₱{Number(getValue() || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span> },
    { id: 'status', header: 'Status', accessorFn: (row) => row.payroll_periods.status, cell: ({ getValue }) => getStatusBadge(getValue() as string || 'draft') },
    {
      id: 'action', header: 'Action', enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        const canDownload = r.payroll_periods.status === 'approved' || r.payroll_periods.status === 'paid';
        return <Button size="sm" variant="outline" disabled={!canDownload} onClick={() => handleDownloadPayslip(r)}><Download className="h-4 w-4 mr-1" />{canDownload ? 'Download' : 'Pending'}</Button>;
      },
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h1 className="text-2xl font-bold">My Payslips</h1><p className="text-muted-foreground">View and download your payroll history</p></div>
        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}><SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger><SelectContent>{years.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}</SelectContent></Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Earnings</CardTitle><TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₱{totalEarnings.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div><p className="text-xs text-muted-foreground">Gross pay for {selectedYear}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Total Deductions</CardTitle><TrendingDown className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">₱{totalDeductions.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div><p className="text-xs text-muted-foreground">Deductions for {selectedYear}</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Net Pay</CardTitle><DollarSign className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold">₱{totalNetPay.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div><p className="text-xs text-muted-foreground">Take-home pay for {selectedYear}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Payroll History</CardTitle><CardDescription>{approvedRecords.length} payslip(s) available for {selectedYear}</CardDescription></CardHeader>
        <CardContent>
          {payrollLoading ? <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}</div> : (
            <DataTable columns={columns} data={payrollRecords || []} searchable={false} emptyMessage={`No payslips found for ${selectedYear}`} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
