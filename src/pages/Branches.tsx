import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Building2 } from 'lucide-react';

export default function Branches() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', code: '', address: '', contact_number: '' });
  const { toast } = useToast();

  useEffect(() => { fetchBranches(); }, []);

  const fetchBranches = async () => {
    const { data } = await supabase.from('branches').select('*').order('name');
    setBranches(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = editing
      ? await supabase.from('branches').update(form).eq('id', editing.id)
      : await supabase.from('branches').insert(form);
    if (error) { toast({ variant: 'destructive', title: 'Error', description: error.message }); return; }
    toast({ title: editing ? 'Branch Updated' : 'Branch Created' });
    setOpen(false);
    setEditing(null);
    setForm({ name: '', code: '', address: '', contact_number: '' });
    fetchBranches();
  };

  const openEdit = (branch: any) => {
    setEditing(branch);
    setForm({ name: branch.name, code: branch.code, address: branch.address || '', contact_number: branch.contact_number || '' });
    setOpen(true);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Branches</h1>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm({ name: '', code: '', address: '', contact_number: '' }); } }}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Branch</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit Branch' : 'Add New Branch'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Branch Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><Label>Branch Code *</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></div>
              <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div><Label>Contact Number</Label><Input value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} /></div>
              <Button type="submit" className="w-full">{editing ? 'Update' : 'Create'} Branch</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : (
            <Table>
              <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Address</TableHead><TableHead>Contact</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {branches.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.code}</TableCell>
                    <TableCell>{b.name}</TableCell>
                    <TableCell>{b.address || '-'}</TableCell>
                    <TableCell>{b.contact_number || '-'}</TableCell>
                    <TableCell><span className={b.is_active ? 'badge-success' : 'badge-destructive'}>{b.is_active ? 'Active' : 'Inactive'}</span></TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Edit className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
                {branches.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No branches found</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
