import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Users, DollarSign, Building2, Download } from 'lucide-react';

const reports = [
  { title: 'Employee Masterlist', description: 'Complete list of all employees with details', icon: Users, category: 'HR' },
  { title: 'Attendance Summary', description: 'Daily, weekly, or monthly attendance reports', icon: FileText, category: 'HR' },
  { title: 'Leave Balance Report', description: 'Leave credits and usage per employee', icon: FileText, category: 'HR' },
  { title: 'Payroll Summary', description: 'Payroll totals per period', icon: DollarSign, category: 'Payroll' },
  { title: 'Government Contributions', description: 'SSS, PhilHealth, Pag-IBIG reports', icon: DollarSign, category: 'Payroll' },
  { title: 'Withholding Tax Report', description: 'BIR 2316 and alphalist', icon: DollarSign, category: 'Payroll' },
  { title: 'Branch Performance', description: 'Attendance and costs by branch', icon: Building2, category: 'Branch' },
];

export default function Reports() {
  return (
    <div className="page-container">
      <div className="page-header"><h1 className="page-title">Reports</h1></div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.title} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <report.icon className="h-8 w-8 text-primary" />
                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">{report.category}</span>
              </div>
              <CardTitle className="text-lg">{report.title}</CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full"><Download className="mr-2 h-4 w-4" /> Generate Report</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
