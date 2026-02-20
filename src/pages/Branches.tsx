import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { useBranches, useCreateBranch, useUpdateBranch, useDeleteBranch } from '@/hooks/useBranches';
import { DataTable, ColumnDef } from '@/components/ui/data-table';

interface BranchWithCounts {
  id: string; name: string; code: string; address: string | null;
  contact_number: string | null; is_active: boolean; employee_count: number; manager_name: string | null;
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
    if (branches.length > 0) fetchBranchDetails();
    else setBranchesWithCounts([]);
  }, [branches]);

  const fetchBranchDetails = async () => {
    const enrichedBranches = await Promise.all(
      branches.map(async (branch) => {
        const { count } = await supabase.from('employees').select('*', { count: 'exact', head: true }).eq('branch_id', branch.id).eq('employment_status', 'active');
        const { data: managerData } = await supabase.from('branch_managers').select('user_id').eq('branch_id', branch.id).limit(1).single();
        let managerName = null;
        if (managerData?.user_id) {
          const { data: profile } = await supabase.from('profiles').select('first_name, last_name').eq('id', managerData.user_id).single();
          if (profile) managerName = `${profile.first_name} ${profile.last_name}`;
        }
        return { ...branch, employee_count: count || 0, manager_name: managerName };
      })
    );
    setBranchesWithCounts(enrichedBranches);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) await updateMutation.mutateAsync({ id: editing.id, ...form });
    else await createMutation.mutateAsync(form);
    setOpen(false); setEditing(null); setForm({ name: '', code: '', address: '', contact_number: '', is_active: true });
  };

  const openEdit = (branch: any) => {
    setEditing(branch);
    setForm({ name: branch.name, code: branch.code, address: branch.address || '', contact_number: branch.contact_number || '', is_active: branch.is_active });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const branch = branchesWithCounts.find(b => b.id === id);
    if (branch && branch.employee_count > 0) { toast({ variant: 'destructive', title: 'Cannot Delete', description: 'Reassign employees first.' }); return; }
    if (confirm('Delete this branch?')) await deleteMutation.mutateAsync(id);
  };

  const columns: ColumnDef<BranchWithCounts, any>[] = [
    { accessorKey: 'code', header: 'Code' },
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'manager_name', header: 'Manager', cell: ({ getValue }) => getValue() || <span className="text-muted-foreground">Not assigned</span> },
    { accessorKey: 'employee_count', header: 'Employees', cell: ({ getValue }) => <div className="flex items-center gap-1"><Users className="h-4 w-4 text-muted-foreground" />{getValue() as number}</div> },
    { accessorKey: 'contact_number', header: 'Contact', cell: ({ getValue }) => getValue() || '-' },
    { accessorKey: 'is_active', header: 'Status', cell: ({ getValue }) => <Badge variant={getValue() ? 'default' : 'secondary'}>{getValue() ? 'Active' : 'Inactive'}</Badge> },
    {
      id: 'actions', header: 'Actions', enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEdit(row.original)}><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row.original.id)} disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ),
    },
  ];

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
              {editing && <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} /><Label>Active</Label></div>}
              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>{editing ? 'Update' : 'Create'} Branch</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : (
            <DataTable columns={columns} data={branchesWithCounts} searchPlaceholder="Search branches..." emptyMessage="No branches found" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
