import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Users, DollarSign, Building2, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type ReportType = 'employee-masterlist' | 'attendance-summary' | 'leave-balance' | 'payroll-summary' | 'gov-contributions' | 'branch-performance';

const reports = [
  { id: 'employee-masterlist' as ReportType, title: 'Employee Masterlist', description: 'Complete list of all employees with details', icon: Users, category: 'HR' },
  { id: 'attendance-summary' as ReportType, title: 'Attendance Summary', description: 'Daily, weekly, or monthly attendance reports', icon: FileText, category: 'HR' },
  { id: 'leave-balance' as ReportType, title: 'Leave Balance Report', description: 'Leave credits and usage per employee', icon: FileText, category: 'HR' },
  { id: 'payroll-summary' as ReportType, title: 'Payroll Summary', description: 'Payroll totals per period', icon: DollarSign, category: 'Payroll' },
  { id: 'gov-contributions' as ReportType, title: 'Government Contributions', description: 'SSS, PhilHealth, Pag-IBIG reports', icon: DollarSign, category: 'Payroll' },
  { id: 'branch-performance' as ReportType, title: 'Branch Performance', description: 'Attendance and costs by branch', icon: Building2, category: 'Branch' },
];

export default function Reports() {
  const { toast } = useToast();
  const [generating, setGenerating] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);

  const downloadCSV = (data: any[], filename: string, headers: string[]) => {
    const csv = [headers.join(','), ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateReport = async (reportId: ReportType) => {
    setGenerating(reportId);
    try {
      switch (reportId) {
        case 'employee-masterlist': {
          const { data, error } = await supabase.from('employees').select('*, branches(name)').order('last_name');
          if (error) throw error;
          const formatted = (data || []).map(e => ({
            employee_id: e.employee_id,
            first_name: e.first_name,
            middle_name: e.middle_name || '',
            last_name: e.last_name,
            email: e.email,
            phone: e.phone || '',
            position: e.position,
            department: e.department || '',
            branch: (e.branches as any)?.name || '',
            date_hired: e.date_hired,
            status: e.employment_status,
            basic_salary: e.basic_salary
          }));
          downloadCSV(formatted, 'employee-masterlist', ['employee_id', 'first_name', 'middle_name', 'last_name', 'email', 'phone', 'position', 'department', 'branch', 'date_hired', 'status', 'basic_salary']);
          toast({ title: 'Report Generated', description: 'Employee masterlist downloaded successfully' });
          break;
        }
        case 'attendance-summary': {
          if (!dateRange.start || !dateRange.end) {
            toast({ title: 'Date Required', description: 'Please select a date range', variant: 'destructive' });
            setGenerating(null);
            return;
          }
          const { data, error } = await supabase.from('attendance')
            .select('*, employees(employee_id, first_name, last_name)')
            .gte('date', dateRange.start)
            .lte('date', dateRange.end)
            .order('date');
          if (error) throw error;
          const formatted = (data || []).map(a => ({
            date: a.date,
            employee_id: (a.employees as any)?.employee_id || '',
            name: `${(a.employees as any)?.first_name || ''} ${(a.employees as any)?.last_name || ''}`,
            time_in: a.time_in || '',
            time_out: a.time_out || '',
            hours_worked: a.hours_worked || 0,
            late_minutes: a.late_minutes || 0,
            status: a.status || 'present'
          }));
          downloadCSV(formatted, 'attendance-summary', ['date', 'employee_id', 'name', 'time_in', 'time_out', 'hours_worked', 'late_minutes', 'status']);
          toast({ title: 'Report Generated', description: 'Attendance summary downloaded successfully' });
          break;
        }
        case 'leave-balance': {
          const { data, error } = await supabase.from('leave_credits')
            .select('*, employees(employee_id, first_name, last_name)')
            .eq('year', new Date().getFullYear());
          if (error) throw error;
          const formatted = (data || []).map(c => ({
            employee_id: (c.employees as any)?.employee_id || '',
            name: `${(c.employees as any)?.first_name || ''} ${(c.employees as any)?.last_name || ''}`,
            leave_type: c.leave_type,
            total_credits: c.total_credits || 0,
            used_credits: c.used_credits || 0,
            remaining: (c.total_credits || 0) - (c.used_credits || 0),
            year: c.year
          }));
          downloadCSV(formatted, 'leave-balance', ['employee_id', 'name', 'leave_type', 'total_credits', 'used_credits', 'remaining', 'year']);
          toast({ title: 'Report Generated', description: 'Leave balance report downloaded successfully' });
          break;
        }
        case 'payroll-summary': {
          const { data, error } = await supabase.from('payroll_records')
            .select('*, employees(employee_id, first_name, last_name), payroll_periods(period_start, period_end, pay_date)')
            .order('created_at', { ascending: false });
          if (error) throw error;
          const formatted = (data || []).map(r => ({
            period: `${(r.payroll_periods as any)?.period_start || ''} to ${(r.payroll_periods as any)?.period_end || ''}`,
            pay_date: (r.payroll_periods as any)?.pay_date || '',
            employee_id: (r.employees as any)?.employee_id || '',
            name: `${(r.employees as any)?.first_name || ''} ${(r.employees as any)?.last_name || ''}`,
            basic_pay: r.basic_pay,
            overtime_pay: r.overtime_pay || 0,
            allowances: r.total_allowances || 0,
            gross_pay: r.gross_pay || 0,
            sss: r.sss_contribution || 0,
            philhealth: r.philhealth_contribution || 0,
            pagibig: r.pagibig_contribution || 0,
            tax: r.withholding_tax || 0,
            deductions: r.total_deductions || 0,
            net_pay: r.net_pay || 0
          }));
          downloadCSV(formatted, 'payroll-summary', ['period', 'pay_date', 'employee_id', 'name', 'basic_pay', 'overtime_pay', 'allowances', 'gross_pay', 'sss', 'philhealth', 'pagibig', 'tax', 'deductions', 'net_pay']);
          toast({ title: 'Report Generated', description: 'Payroll summary downloaded successfully' });
          break;
        }
        case 'gov-contributions': {
          const { data, error } = await supabase.from('payroll_records')
            .select('*, employees(employee_id, first_name, last_name, sss_number, philhealth_number, pagibig_number)')
            .order('created_at', { ascending: false });
          if (error) throw error;
          const formatted = (data || []).map(r => ({
            employee_id: (r.employees as any)?.employee_id || '',
            name: `${(r.employees as any)?.first_name || ''} ${(r.employees as any)?.last_name || ''}`,
            sss_number: (r.employees as any)?.sss_number || '',
            sss_ee: r.sss_contribution || 0,
            sss_er: ((r.sss_contribution || 0) * 1.5).toFixed(2),
            philhealth_number: (r.employees as any)?.philhealth_number || '',
            philhealth_ee: r.philhealth_contribution || 0,
            philhealth_er: r.philhealth_contribution || 0,
            pagibig_number: (r.employees as any)?.pagibig_number || '',
            pagibig_ee: r.pagibig_contribution || 0,
            pagibig_er: r.pagibig_contribution || 0
          }));
          downloadCSV(formatted, 'gov-contributions', ['employee_id', 'name', 'sss_number', 'sss_ee', 'sss_er', 'philhealth_number', 'philhealth_ee', 'philhealth_er', 'pagibig_number', 'pagibig_ee', 'pagibig_er']);
          toast({ title: 'Report Generated', description: 'Government contributions report downloaded successfully' });
          break;
        }
        case 'branch-performance': {
          const { data: branches } = await supabase.from('branches').select('*');
          const { data: employees } = await supabase.from('employees').select('branch_id');
          const { data: attendance } = await supabase.from('attendance').select('employee_id, status, employees(branch_id)');
          
          const formatted = (branches || []).map(b => {
            const branchEmployees = (employees || []).filter(e => e.branch_id === b.id).length;
            const branchAttendance = (attendance || []).filter(a => (a.employees as any)?.branch_id === b.id);
            const presentCount = branchAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
            const attendanceRate = branchAttendance.length > 0 ? ((presentCount / branchAttendance.length) * 100).toFixed(1) : '0';
            return {
              branch_code: b.code,
              branch_name: b.name,
              address: b.address || '',
              total_employees: branchEmployees,
              attendance_records: branchAttendance.length,
              attendance_rate: `${attendanceRate}%`,
              status: b.is_active ? 'Active' : 'Inactive'
            };
          });
          downloadCSV(formatted, 'branch-performance', ['branch_code', 'branch_name', 'address', 'total_employees', 'attendance_records', 'attendance_rate', 'status']);
          toast({ title: 'Report Generated', description: 'Branch performance report downloaded successfully' });
          break;
        }
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to generate report', variant: 'destructive' });
    } finally {
      setGenerating(null);
      setSelectedReport(null);
    }
  };

  const needsDateRange = (id: ReportType) => id === 'attendance-summary';

  return (
    <div className="page-container">
      <div className="page-header"><h1 className="page-title">Reports</h1></div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <report.icon className="h-8 w-8 text-primary" />
                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">{report.category}</span>
              </div>
              <CardTitle className="text-lg">{report.title}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {needsDateRange(report.id) ? (
                <Dialog open={selectedReport === report.id} onOpenChange={(open) => setSelectedReport(open ? report.id : null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Download className="mr-2 h-4 w-4" /> Generate Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Select Date Range</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Start Date</Label><Input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} /></div>
                        <div><Label>End Date</Label><Input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} /></div>
                      </div>
                      <Button className="w-full" onClick={() => generateReport(report.id)} disabled={generating === report.id}>
                        {generating === report.id ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Download className="mr-2 h-4 w-4" /> Download Report</>}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => generateReport(report.id)} disabled={generating === report.id}>
                  {generating === report.id ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Download className="mr-2 h-4 w-4" /> Generate Report</>}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
