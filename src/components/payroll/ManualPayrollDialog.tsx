import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmployees } from '@/hooks/useEmployees';
import { useCreateManualPayroll, type ManualPayrollData } from '@/hooks/usePayroll';

interface ManualPayrollDialogProps {
  periodId: string;
  open: boolean;
  onClose: () => void;
}

export function ManualPayrollDialog({ periodId, open, onClose }: ManualPayrollDialogProps) {
  const { data: employees } = useEmployees();
  const createManualPayroll = useCreateManualPayroll();
  
  const [form, setForm] = useState({
    employee_id: '',
    basic_pay: 0,
    days_worked: 0,
    overtime_pay: 0,
    holiday_pay: 0,
    night_differential: 0,
    total_allowances: 0,
    sss_contribution: 0,
    philhealth_contribution: 0,
    pagibig_contribution: 0,
    withholding_tax: 0,
    other_deductions: 0,
  });

  const activeEmployees = employees?.filter(e => e.employment_status === 'active') || [];

  // Calculate totals
  const grossPay = form.basic_pay + form.overtime_pay + form.holiday_pay + 
                   form.night_differential + form.total_allowances;
  const totalDeductions = form.sss_contribution + form.philhealth_contribution + 
                          form.pagibig_contribution + form.withholding_tax + form.other_deductions;
  const netPay = grossPay - totalDeductions;

  // Auto-fill basic salary when employee is selected
  useEffect(() => {
    if (form.employee_id) {
      const emp = activeEmployees.find(e => e.id === form.employee_id);
      if (emp) {
        setForm(prev => ({ ...prev, basic_pay: emp.basic_salary || 0 }));
      }
    }
  }, [form.employee_id, activeEmployees]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.employee_id) return;

    await createManualPayroll.mutateAsync({
      payroll_period_id: periodId,
      ...form,
    });
    
    onClose();
    // Reset form
    setForm({
      employee_id: '',
      basic_pay: 0,
      days_worked: 0,
      overtime_pay: 0,
      holiday_pay: 0,
      night_differential: 0,
      total_allowances: 0,
      sss_contribution: 0,
      philhealth_contribution: 0,
      pagibig_contribution: 0,
      withholding_tax: 0,
      other_deductions: 0,
    });
  };

  const formatCurrency = (amount: number) => 
    `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  const NumberInput = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        step="0.01"
        value={value || ''}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="h-8 text-sm"
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Manual Payroll</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Employee Selection */}
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {activeEmployees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.employee_id} - {emp.first_name} {emp.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Earnings */}
            <div className="space-y-3">
              <h4 className="font-semibold text-success text-sm">Earnings</h4>
              <div className="bg-success/5 rounded-lg p-3 space-y-2">
                <NumberInput label="Basic Pay" value={form.basic_pay} onChange={(v) => setForm({ ...form, basic_pay: v })} />
                <NumberInput label="Days Worked" value={form.days_worked} onChange={(v) => setForm({ ...form, days_worked: v })} />
                <NumberInput label="Overtime Pay" value={form.overtime_pay} onChange={(v) => setForm({ ...form, overtime_pay: v })} />
                <NumberInput label="Holiday Pay" value={form.holiday_pay} onChange={(v) => setForm({ ...form, holiday_pay: v })} />
                <NumberInput label="Night Differential" value={form.night_differential} onChange={(v) => setForm({ ...form, night_differential: v })} />
                <NumberInput label="Total Allowances" value={form.total_allowances} onChange={(v) => setForm({ ...form, total_allowances: v })} />
                <div className="flex justify-between pt-2 border-t font-semibold text-sm">
                  <span>Gross Pay</span>
                  <span className="text-success">{formatCurrency(grossPay)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="space-y-3">
              <h4 className="font-semibold text-destructive text-sm">Deductions</h4>
              <div className="bg-destructive/5 rounded-lg p-3 space-y-2">
                <NumberInput label="SSS Contribution" value={form.sss_contribution} onChange={(v) => setForm({ ...form, sss_contribution: v })} />
                <NumberInput label="PhilHealth Contribution" value={form.philhealth_contribution} onChange={(v) => setForm({ ...form, philhealth_contribution: v })} />
                <NumberInput label="Pag-IBIG Contribution" value={form.pagibig_contribution} onChange={(v) => setForm({ ...form, pagibig_contribution: v })} />
                <NumberInput label="Withholding Tax" value={form.withholding_tax} onChange={(v) => setForm({ ...form, withholding_tax: v })} />
                <NumberInput label="Other Deductions" value={form.other_deductions} onChange={(v) => setForm({ ...form, other_deductions: v })} />
                <div className="flex justify-between pt-2 border-t font-semibold text-sm">
                  <span>Total Deductions</span>
                  <span className="text-destructive">{formatCurrency(totalDeductions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Pay Summary */}
          <div className="bg-primary/10 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">Net Pay</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(netPay)}</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!form.employee_id || createManualPayroll.isPending}>
              {createManualPayroll.isPending ? 'Creating...' : 'Create Payroll'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
