import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { RefreshCw } from 'lucide-react';
import { SalaryAdjustmentsCard } from '@/components/employees/SalaryAdjustmentsCard';
import { EmployeeAvatarUpload } from '@/components/employees/EmployeeAvatarUpload';
import { DateInput } from '@/components/ui/date-picker';
import { PasswordInput } from '@/components/ui/password-input';
import { usePositions } from '@/hooks/usePositions';

export default function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const { data: positions } = usePositions();
  const [form, setForm] = useState({
    employee_id: '', first_name: '', last_name: '', middle_name: '', email: '', phone: '',
    date_of_birth: '', gender: '', civil_status: '', address: '', position: '', department: '',
    date_hired: '', basic_salary: '', branch_id: '', sss_number: '', philhealth_number: '',
    pagibig_number: '',
    emergency_contact_name: '', emergency_contact_phone: '', rfid_card_number: '',
    role: 'employee' as 'employee' | 'branch_manager' | 'hr_admin',
    password: '',
    employment_status: 'active' as 'active' | 'inactive' | 'terminated',
    avatar_url: null as string | null,
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
      avatar_url: data.avatar_url || null,
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
      if (error) { toast.error(error.message); return; }
      toast.success('Employee updated successfully');
      navigate('/employees');
    } else {
      // Create new employee with user account via edge function
      if (!form.password || form.password.length < 6) {
        toast.error('Password must be at least 6 characters');
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
        toast.error(data?.error || error?.message);
        return;
      }
      toast.success('Employee created successfully');
      navigate('/employees');
    }
  };

  const updateField = (field: string, value: string) => setForm({ ...form, [field]: value });

  const generateEmployeeId = () => {
    const randomId = Math.floor(100000 + Math.random() * 900000);
    setForm({ ...form, employee_id: `EMP-${randomId}` });
  };

  return (
    <div className="page-container max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/employees')}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="page-title">{id ? 'Edit Employee' : 'Add New Employee'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar Upload Section */}
              <div className="flex-shrink-0">
                <EmployeeAvatarUpload
                  avatarUrl={form.avatar_url}
                  gender={form.gender}
                  employeeId={id || form.employee_id}
                  firstName={form.first_name}
                  lastName={form.last_name}
                  onAvatarChange={(url) => setForm({ ...form, avatar_url: url })}
                />
              </div>
              
              {/* Personal Info Fields */}
              <div className="flex-1 grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Employee ID *</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={form.employee_id} 
                      onChange={(e) => updateField('employee_id', e.target.value)} 
                      required 
                      className="flex-1" 
                      disabled={!!id}
                    />
                    {!id && (
                      <Button type="button" variant="outline" size="icon" onClick={generateEmployeeId} title="Generate ID">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div><Label>First Name *</Label><Input value={form.first_name} onChange={(e) => updateField('first_name', e.target.value)} required placeholder="e.g. Juan" /></div>
                <div><Label>Last Name *</Label><Input value={form.last_name} onChange={(e) => updateField('last_name', e.target.value)} required placeholder="e.g. Dela Cruz" /></div>
                <div><Label>Middle Name</Label><Input value={form.middle_name} onChange={(e) => updateField('middle_name', e.target.value)} placeholder="e.g. Santos" /></div>
                <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} required placeholder="e.g. juan@company.com" /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="09XXXXXXXXX" maxLength={11} /></div>
                <div><Label>Date of Birth</Label><DateInput value={form.date_of_birth} onChange={(v) => updateField('date_of_birth', v)} /></div>
                <div><Label>Gender</Label><Select value={form.gender} onValueChange={(v) => updateField('gender', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select></div>
                <div><Label>Civil Status</Label><Select value={form.civil_status} onValueChange={(v) => updateField('civil_status', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="single">Single</SelectItem><SelectItem value="married">Married</SelectItem><SelectItem value="widowed">Widowed</SelectItem></SelectContent></Select></div>
                <div className="md:col-span-3"><Label>Address</Label><Input value={form.address} onChange={(e) => updateField('address', e.target.value)} placeholder="e.g. 123 Main St, Makati City" /></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Employment Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Position *</Label>
              <Select value={form.position} onValueChange={(v) => updateField('position', v)}>
                <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                <SelectContent>
                  {positions?.map((p) => (
                    <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div><Label>Branch</Label><Select value={form.branch_id} onValueChange={(v) => updateField('branch_id', v)}><SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger><SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Date Hired *</Label><DateInput value={form.date_hired} onChange={(v) => updateField('date_hired', v)} /></div>
            <div><Label>Basic Salary (₱)</Label><Input type="number" value={form.basic_salary} onChange={(e) => updateField('basic_salary', e.target.value)} placeholder="e.g. 25000" /></div>
            <div><Label>RFID Card Number</Label><Input value={form.rfid_card_number} onChange={(e) => updateField('rfid_card_number', e.target.value)} placeholder="Scan or enter RFID number" /></div>
            
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
          <CardHeader><CardTitle>Government IDs</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div><Label>SSS Number</Label><Input value={form.sss_number} onChange={(e) => updateField('sss_number', e.target.value.replace(/[^0-9-]/g, '').slice(0, 12))} placeholder="XX-XXXXXXX-X" maxLength={12} /></div>
            <div><Label>PhilHealth Number</Label><Input value={form.philhealth_number} onChange={(e) => updateField('philhealth_number', e.target.value.replace(/[^0-9-]/g, '').slice(0, 14))} placeholder="XX-XXXXXXXXX-X" maxLength={14} /></div>
            <div><Label>Pag-IBIG Number</Label><Input value={form.pagibig_number} onChange={(e) => updateField('pagibig_number', e.target.value.replace(/[^0-9-]/g, '').slice(0, 14))} placeholder="XXXX-XXXX-XXXX" maxLength={14} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Emergency Contact</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div><Label>Emergency Contact Name</Label><Input value={form.emergency_contact_name} onChange={(e) => updateField('emergency_contact_name', e.target.value)} placeholder="e.g. Maria Dela Cruz" /></div>
            <div><Label>Emergency Contact Phone</Label><Input value={form.emergency_contact_phone} onChange={(e) => updateField('emergency_contact_phone', e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="09XXXXXXXXX" maxLength={11} /></div>
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
