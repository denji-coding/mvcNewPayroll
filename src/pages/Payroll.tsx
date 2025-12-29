import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Calendar, FileText, Calculator } from 'lucide-react';

export default function Payroll() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Payroll Management</h1>
        <Button><Calculator className="mr-2 h-4 w-4" /> Run Payroll</Button>
      </div>

      <Tabs defaultValue="periods">
        <TabsList><TabsTrigger value="periods">Payroll Periods</TabsTrigger><TabsTrigger value="records">Payroll Records</TabsTrigger><TabsTrigger value="components">Salary Components</TabsTrigger></TabsList>

        <TabsContent value="periods" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Payroll Periods</CardTitle><CardDescription>Manage payroll cycles and processing</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Period</TableHead><TableHead>Pay Date</TableHead><TableHead>Employees</TableHead><TableHead>Total Gross</TableHead><TableHead>Total Net</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody><TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No payroll periods. Click "Run Payroll" to create one.</TableCell></TableRow></TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Payroll Records</CardTitle><CardDescription>Individual employee payslips</CardDescription></CardHeader>
            <CardContent><p className="text-muted-foreground">Select a payroll period to view records</p></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="components" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Salary Components</CardTitle><CardDescription>Configure earnings and deductions</CardDescription></CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-success mb-3">Earnings</h3>
                  <ul className="space-y-2 text-sm"><li>• Transportation Allowance</li><li>• Rice Allowance</li><li>• Meal Allowance</li><li>• Overtime Pay</li><li>• Night Differential</li><li>• Holiday Pay</li></ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-destructive mb-3">Deductions</h3>
                  <ul className="space-y-2 text-sm"><li>• SSS Contribution</li><li>• PhilHealth Contribution</li><li>• Pag-IBIG Contribution</li><li>• Withholding Tax</li><li>• SSS Loan</li><li>• Pag-IBIG Loan</li><li>• Company Loan</li></ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
