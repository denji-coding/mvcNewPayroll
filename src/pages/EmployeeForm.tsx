import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { SalaryAdjustmentsCard } from '@/components/employees/SalaryAdjustmentsCard';
import { DateInput } from '@/components/ui/date-picker';
import { PasswordInput } from '@/components/ui/password-input';

export default function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [form, setForm] = useState({
    employee_id: '', first_name: '', last_name: '', middle_name: '', email: '', phone: '',
    date_of_birth: '', gender: '', civil_status: '', address: '', position: '', department: '',
    date_hired: '', basic_salary: '', branch_id: '', sss_number: '', philhealth_number: '',
    pagibig_number: '', tin_number: '', bank_name: '', bank_account_number: '',
    emergency_contact_name: '', emergency_contact_phone: '', rfid_card_number: '',
    role: 'employee' as 'employee' | 'branch_manager' | 'hr_admin',
    password: '',
    employment_status: 'active' as 'active' | 'inactive' | 'terminated',
  });

  useEffect(() => {
    fetchBranches();
    if (id) fetchEmployee();
  }, [id]);

  const fetchBranches = async () => {
    const { data } = await supabase.from('branches').select('id, name').eq('is_active', true);
    setBranches(data || []);
  };

  const fetchEmployee = async () => {
    const { data } = await supabase.from('employees').select('*').eq('id', id).single();
    if (data) setForm({ 
      ...form, 
      ...data, 
      date_of_birth: data.date_of_birth || '', 
      date_hired: data.date_hired || '', 
      basic_salary: data.basic_salary?.toString() || '',
      employment_status: (data.employment_status as 'active' | 'inactive' | 'terminated') || 'active',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (id) {
      // Update existing employee (no user/role changes)
      const { password, role, ...payload } = form;
      
      // Clean empty strings to undefined for optional fields
      const cleanPayload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(payload)) {
        if (value === '') {
          cleanPayload[key] = null;
        } else if (key === 'basic_salary') {
          cleanPayload[key] = parseFloat(value as string) || 0;
        } else {
          cleanPayload[key] = value;
        }
      }
      
      const { error } = await supabase.from('employees').update(cleanPayload).eq('id', id);
      setLoading(false);
      if (error) { toast({ variant: 'destructive', title: 'Error', description: error.message }); return; }
      toast({ title: 'Employee Updated' });
      navigate('/employees');
    } else {
      // Create new employee with user account via edge function
      if (!form.password || form.password.length < 6) {
        toast({ variant: 'destructive', title: 'Error', description: 'Password must be at least 6 characters' });
        setLoading(false);
        return;
      }

      const payload = {
        ...form,
        basic_salary: parseFloat(form.basic_salary) || 0,
      };

      const { data, error } = await supabase.functions.invoke('create-employee', {
        body: payload,
      });

      setLoading(false);
      if (error || data?.error) {
        toast({ variant: 'destructive', title: 'Error', description: data?.error || error?.message });
        return;
      }
      toast({ title: 'Employee Created', description: 'User account created and role assigned' });
      navigate('/employees');
    }
  };

  const updateField = (field: string, value: string) => setForm({ ...form, [field]: value });

  return (
    <div className="page-container max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/employees')}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="page-title">{id ? 'Edit Employee' : 'Add New Employee'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div><Label>Employee ID *</Label><Input value={form.employee_id} onChange={(e) => updateField('employee_id', e.target.value)} required /></div>
            <div><Label>First Name *</Label><Input value={form.first_name} onChange={(e) => updateField('first_name', e.target.value)} required /></div>
            <div><Label>Last Name *</Label><Input value={form.last_name} onChange={(e) => updateField('last_name', e.target.value)} required /></div>
            <div><Label>Middle Name</Label><Input value={form.middle_name} onChange={(e) => updateField('middle_name', e.target.value)} /></div>
            <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} required /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} /></div>
            <div><Label>Date of Birth</Label><DateInput value={form.date_of_birth} onChange={(v) => updateField('date_of_birth', v)} /></div>
            <div><Label>Gender</Label><Select value={form.gender} onValueChange={(v) => updateField('gender', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select></div>
            <div><Label>Civil Status</Label><Select value={form.civil_status} onValueChange={(v) => updateField('civil_status', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="single">Single</SelectItem><SelectItem value="married">Married</SelectItem><SelectItem value="widowed">Widowed</SelectItem></SelectContent></Select></div>
            <div className="md:col-span-3"><Label>Address</Label><Input value={form.address} onChange={(e) => updateField('address', e.target.value)} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Employment Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div><Label>Position *</Label><Input value={form.position} onChange={(e) => updateField('position', e.target.value)} required /></div>
            <div><Label>Department</Label><Input value={form.department} onChange={(e) => updateField('department', e.target.value)} /></div>
            <div><Label>Branch</Label><Select value={form.branch_id} onValueChange={(v) => updateField('branch_id', v)}><SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger><SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Date Hired *</Label><DateInput value={form.date_hired} onChange={(v) => updateField('date_hired', v)} /></div>
            <div><Label>Basic Salary (₱)</Label><Input type="number" value={form.basic_salary} onChange={(e) => updateField('basic_salary', e.target.value)} /></div>
            <div><Label>RFID Card Number</Label><Input value={form.rfid_card_number} onChange={(e) => updateField('rfid_card_number', e.target.value)} /></div>
            
            <div className="flex items-center gap-2">
              <Switch 
                checked={form.employment_status === 'active'} 
                onCheckedChange={(checked) => updateField('employment_status', checked ? 'active' : 'inactive')} 
              />
              <Label>{form.employment_status === 'active' ? 'Active' : 'Inactive'}</Label>
            </div>
          </CardContent>
        </Card>

        {!id && (
          <Card>
            <CardHeader><CardTitle>User Account & Role</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Role *</Label>
                <Select value={form.role} onValueChange={(v) => updateField('role', v)}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="branch_manager">Branch Manager</SelectItem>
                    <SelectItem value="hr_admin">HR Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Password *</Label>
                <PasswordInput 
                  value={form.password} 
                  onChange={(e) => updateField('password', e.target.value)} 
                  placeholder="Min 6 characters"
                />
              </div>
              <div className="flex items-end">
                <p className="text-sm text-muted-foreground">
                  Employee will login using their email and this password
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Government IDs & Banking</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div><Label>SSS Number</Label><Input value={form.sss_number} onChange={(e) => updateField('sss_number', e.target.value)} /></div>
            <div><Label>PhilHealth Number</Label><Input value={form.philhealth_number} onChange={(e) => updateField('philhealth_number', e.target.value)} /></div>
            <div><Label>Pag-IBIG Number</Label><Input value={form.pagibig_number} onChange={(e) => updateField('pagibig_number', e.target.value)} /></div>
            <div><Label>TIN Number</Label><Input value={form.tin_number} onChange={(e) => updateField('tin_number', e.target.value)} /></div>
            <div><Label>Bank Name</Label><Input value={form.bank_name} onChange={(e) => updateField('bank_name', e.target.value)} /></div>
            <div><Label>Bank Account Number</Label><Input value={form.bank_account_number} onChange={(e) => updateField('bank_account_number', e.target.value)} /></div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('/employees')}>Cancel</Button>
          <Button type="submit" disabled={loading}><Save className="mr-2 h-4 w-4" />{loading ? 'Saving...' : 'Save Employee'}</Button>
        </div>
      </form>

      {id && (
        <div className="mt-6">
          <SalaryAdjustmentsCard employeeId={id} />
        </div>
      )}
    </div>
  );
}
