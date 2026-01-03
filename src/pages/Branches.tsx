import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { 
  useBranches, 
  useCreateBranch, 
  useUpdateBranch, 
  useDeleteBranch 
} from '@/hooks/useBranches';

interface BranchWithCounts {
  id: string;
  name: string;
  code: string;
  address: string | null;
  contact_number: string | null;
  is_active: boolean;
  employee_count: number;
  manager_name: string | null;
}

export default function Branches() {
  const { data: branches = [], isLoading } = useBranches();
  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();
  const deleteMutation = useDeleteBranch();
  
  const [branchesWithCounts, setBranchesWithCounts] = useState<BranchWithCounts[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', code: '', address: '', contact_number: '', is_active: true });
  const { toast } = useToast();

  useEffect(() => {
    if (branches.length > 0) {
      fetchBranchDetails();
    } else {
      setBranchesWithCounts([]);
    }
  }, [branches]);

  const fetchBranchDetails = async () => {
    // Fetch employee counts and managers for each branch
    const enrichedBranches = await Promise.all(
      branches.map(async (branch) => {
        // Get employee count
        const { count } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true })
          .eq('branch_id', branch.id)
          .eq('employment_status', 'active');

        // Get branch manager
        const { data: managerData } = await supabase
          .from('branch_managers')
          .select('user_id')
          .eq('branch_id', branch.id)
          .limit(1)
          .single();

        let managerName = null;
        if (managerData?.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', managerData.user_id)
            .single();
          if (profile) {
            managerName = `${profile.first_name} ${profile.last_name}`;
          }
        }

        return {
          ...branch,
          employee_count: count || 0,
          manager_name: managerName,
        };
      })
    );
    setBranchesWithCounts(enrichedBranches);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...form });
    } else {
      await createMutation.mutateAsync(form);
    }
    setOpen(false);
    setEditing(null);
    setForm({ name: '', code: '', address: '', contact_number: '', is_active: true });
  };

  const openEdit = (branch: any) => {
    setEditing(branch);
    setForm({ 
      name: branch.name, 
      code: branch.code, 
      address: branch.address || '', 
      contact_number: branch.contact_number || '',
      is_active: branch.is_active 
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const branch = branchesWithCounts.find(b => b.id === id);
    if (branch && branch.employee_count > 0) {
      toast({ variant: 'destructive', title: 'Cannot Delete', description: 'This branch has employees assigned. Reassign them first.' });
      return;
    }
    if (confirm('Are you sure you want to delete this branch?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Branches</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm({ name: '', code: '', address: '', contact_number: '', is_active: true }); } }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Branch</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit Branch' : 'Add New Branch'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Branch Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><Label>Branch Code *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></div>
              <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div><Label>Contact Number</Label><Input value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} /></div>
              {editing && (
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} />
                  <Label>Active</Label>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                {editing ? 'Update' : 'Create'} Branch
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branchesWithCounts.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.code}</TableCell>
                    <TableCell>{b.name}</TableCell>
                    <TableCell>{b.manager_name || <span className="text-muted-foreground">Not assigned</span>}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {b.employee_count}
                      </div>
                    </TableCell>
                    <TableCell>{b.contact_number || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={b.is_active ? 'default' : 'secondary'}>
                        {b.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)} disabled={deleteMutation.isPending}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {branchesWithCounts.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No branches found</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
