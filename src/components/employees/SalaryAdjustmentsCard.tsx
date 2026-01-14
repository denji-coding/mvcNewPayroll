import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { 
  useEmployeeSalaryAdjustments, 
  useCreateEmployeeSalaryAdjustment, 
  useDeleteEmployeeSalaryAdjustment 
} from '@/hooks/useEmployeeSalaryAdjustments';
import { useSalaryComponents } from '@/hooks/useSalaryComponents';
import { DateInput } from '@/components/ui/date-picker';

interface SalaryAdjustmentsCardProps {
  employeeId: string;
}

export function SalaryAdjustmentsCard({ employeeId }: SalaryAdjustmentsCardProps) {
  const { data: adjustments = [], isLoading } = useEmployeeSalaryAdjustments(employeeId);
  const { data: components = [] } = useSalaryComponents();
  const createMutation = useCreateEmployeeSalaryAdjustment();
  const deleteMutation = useDeleteEmployeeSalaryAdjustment();
  
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    component_id: '',
    amount: '',
    is_recurring: true,
    effective_from: '',
    effective_to: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      employee_id: employeeId,
      component_id: form.component_id,
      amount: parseFloat(form.amount),
      is_recurring: form.is_recurring,
      effective_from: form.effective_from || undefined,
      effective_to: form.effective_to || undefined,
    });
    setOpen(false);
    setForm({ component_id: '', amount: '', is_recurring: true, effective_from: '', effective_to: '' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this adjustment?')) {
      await deleteMutation.mutateAsync({ id, employee_id: employeeId });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <CardTitle>Salary Adjustments</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Add Adjustment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Salary Adjustment</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Salary Component *</Label>
                <Select value={form.component_id} onValueChange={(v) => setForm({ ...form, component_id: v })} required>
                  <SelectTrigger><SelectValue placeholder="Select component" /></SelectTrigger>
                  <SelectContent>
                    {components.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount (₱) *</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={form.amount} 
                  onChange={(e) => setForm({ ...form, amount: e.target.value })} 
                  required 
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={form.is_recurring} 
                  onCheckedChange={(checked) => setForm({ ...form, is_recurring: checked })} 
                />
                <Label>Recurring (applies every payroll)</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Effective From</Label>
                  <DateInput 
                    value={form.effective_from} 
                    onChange={(v) => setForm({ ...form, effective_from: v })} 
                  />
                </div>
                <div>
                  <Label>Effective To</Label>
                  <DateInput 
                    value={form.effective_to} 
                    onChange={(v) => setForm({ ...form, effective_to: v })} 
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Adding...' : 'Add Adjustment'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Loading...</div>
        ) : adjustments.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No salary adjustments configured</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Recurring</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adjustments.map((adj) => (
                <TableRow key={adj.id}>
                  <TableCell className="font-medium">{adj.component?.name || 'Unknown'}</TableCell>
                  <TableCell>
                    <Badge variant={adj.component?.type === 'earning' ? 'default' : 'destructive'}>
                      {adj.component?.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(adj.amount)}</TableCell>
                  <TableCell>{adj.is_recurring ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(adj.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
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
