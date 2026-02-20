import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useAllPositions, useCreatePosition, useUpdatePosition, useDeletePosition } from '@/hooks/usePositions';
import { Badge } from '@/components/ui/badge';
import { DataTable, ColumnDef } from '@/components/ui/data-table';

export default function Positions() {
  const { data: positions, isLoading } = useAllPositions();
  const createPosition = useCreatePosition();
  const updatePosition = useUpdatePosition();
  const deletePosition = useDeletePosition();

  const [createOpen, setCreateOpen] = useState(false);
  const [editPosition, setEditPosition] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createPosition.mutate(form, { onSuccess: () => { setForm({ name: '', description: '' }); setCreateOpen(false); } });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPosition) return;
    updatePosition.mutate({ id: editPosition.id, name: form.name, description: form.description }, { onSuccess: () => { setEditPosition(null); setForm({ name: '', description: '' }); } });
  };

  const openEditDialog = (position: any) => {
    setEditPosition(position);
    setForm({ name: position.name, description: position.description || '' });
  };

  const columns: ColumnDef<any, any>[] = [
    { accessorKey: 'name', header: 'Position Name' },
    { accessorKey: 'description', header: 'Description', cell: ({ getValue }) => getValue() || '-' },
    {
      accessorKey: 'is_active', header: 'Status',
      cell: ({ getValue }) => <Badge variant={getValue() ? 'default' : 'secondary'}>{getValue() ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      id: 'actions', header: 'Actions', enableSorting: false,
      cell: ({ row }) => {
        const position = row.original;
        return (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => openEditDialog(position)}><Edit className="h-4 w-4" /></Button>
            {position.is_active && (
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Delete Position?</AlertDialogTitle><AlertDialogDescription>This will deactivate the position "{position.name}".</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deletePosition.mutate(position.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Positions</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Add Position</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Position</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><Label>Position Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Software Engineer" required /></div>
              <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description" /></div>
              <DialogFooter><Button type="submit" disabled={createPosition.isPending}>{createPosition.isPending ? 'Creating...' : 'Create Position'}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>All Positions</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <DataTable columns={columns} data={positions || []} searchPlaceholder="Search positions..." emptyMessage="No positions found. Create your first position." />
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editPosition} onOpenChange={(open) => !open && setEditPosition(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Position</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div><Label>Position Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <DialogFooter><Button type="submit" disabled={updatePosition.isPending}>{updatePosition.isPending ? 'Saving...' : 'Save Changes'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
