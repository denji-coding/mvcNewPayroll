import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Calculator } from 'lucide-react';
import { calculateSalary, SalaryCalculationInput } from '@/lib/salaryCalculations';

export function SalaryCalculator() {
  const [inputs, setInputs] = useState<SalaryCalculationInput>({
    basicMonthlySalary: 25000,
    daysWorked: 11,
    overtimeHours: 0,
    allowances: 0,
    loanDeductions: 0,
    otherDeductions: 0,
    workingDaysPerMonth: 22,
  });

  const result = useMemo(() => calculateSalary(inputs), [inputs]);

  const formatCurrency = (amount: number) => 
    `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  const updateInput = (key: keyof SalaryCalculationInput, value: string) => {
    setInputs(prev => ({
      ...prev,
      [key]: parseFloat(value) || 0,
    }));
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Input Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Salary Inputs
          </CardTitle>
          <CardDescription>
            Enter values to calculate salary (semi-monthly payroll)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="basicSalary">Basic Monthly Salary</Label>
              <Input
                id="basicSalary"
                type="number"
                value={inputs.basicMonthlySalary}
                onChange={(e) => updateInput('basicMonthlySalary', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="workingDays">Working Days/Month</Label>
              <Input
                id="workingDays"
                type="number"
                value={inputs.workingDaysPerMonth}
                onChange={(e) => updateInput('workingDaysPerMonth', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="daysWorked">Days Worked (this period)</Label>
              <Input
                id="daysWorked"
                type="number"
                value={inputs.daysWorked}
                onChange={(e) => updateInput('daysWorked', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="overtime">Overtime Hours</Label>
              <Input
                id="overtime"
                type="number"
                value={inputs.overtimeHours}
                onChange={(e) => updateInput('overtimeHours', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="allowances">Additional Allowances</Label>
            <Input
              id="allowances"
              type="number"
              value={inputs.allowances}
              onChange={(e) => updateInput('allowances', e.target.value)}
              className="mt-1"
            />
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="loanDeductions">Loan Deductions</Label>
              <Input
                id="loanDeductions"
                type="number"
                value={inputs.loanDeductions}
                onChange={(e) => updateInput('loanDeductions', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="otherDeductions">Other Deductions</Label>
              <Input
                id="otherDeductions"
                type="number"
                value={inputs.otherDeductions}
                onChange={(e) => updateInput('otherDeductions', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="bg-muted p-3 rounded-lg text-sm">
            <p><strong>Daily Rate:</strong> {formatCurrency(result.dailyRate)}</p>
            <p><strong>Hourly Rate:</strong> {formatCurrency(result.hourlyRate)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Result Card */}
      <Card>
        <CardHeader>
          <CardTitle>Computation Breakdown</CardTitle>
          <CardDescription>
            Real-time calculation based on Philippine tax laws (2024)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Earnings Section */}
          <div>
            <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">Earnings</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Basic Pay ({inputs.daysWorked} days × {formatCurrency(result.dailyRate)})</span>
                <span>{formatCurrency(result.basicPay)}</span>
              </div>
              <div className="flex justify-between">
                <span>Overtime Pay ({inputs.overtimeHours} hrs × {formatCurrency(result.hourlyRate * 1.25)})</span>
                <span>{formatCurrency(result.overtimePay)}</span>
              </div>
              <div className="flex justify-between">
                <span>Allowances</span>
                <span>{formatCurrency(inputs.allowances)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-1 mt-2">
                <span>Gross Pay</span>
                <span>{formatCurrency(result.grossPay)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Deductions Section */}
          <div>
            <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">Deductions</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>SSS Contribution</span>
                <span>{formatCurrency(result.sssContribution)}</span>
              </div>
              <div className="flex justify-between">
                <span>PhilHealth</span>
                <span>{formatCurrency(result.philhealthContribution)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pag-IBIG</span>
                <span>{formatCurrency(result.pagibigContribution)}</span>
              </div>
              <div className="flex justify-between">
                <span>Withholding Tax</span>
                <span>{formatCurrency(result.withholdingTax)}</span>
              </div>
              <div className="flex justify-between">
                <span>Loan Deductions</span>
                <span>{formatCurrency(inputs.loanDeductions)}</span>
              </div>
              <div className="flex justify-between">
                <span>Other Deductions</span>
                <span>{formatCurrency(inputs.otherDeductions)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-1 mt-2">
                <span>Total Deductions</span>
                <span>{formatCurrency(result.totalDeductions)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Net Pay */}
          <div className="bg-primary/10 p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Net Pay (Take Home)</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(result.netPay)}</p>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            * Based on semi-monthly payroll. Government contributions are computed on monthly gross ({formatCurrency(result.monthlyGross)}) then divided by 2.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
