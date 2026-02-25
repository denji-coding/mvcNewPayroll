import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLeaveTypes, useCreateLeaveType, useUpdateLeaveType, useDeleteLeaveType, getLeaveTypeEnum } from '@/hooks/useLeaveTypes';
import { useAllLeaveCredits } from '@/hooks/useLeaves';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, EyeOff, Trash2, CheckSquare, RefreshCw, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataTable, ColumnDef } from '@/components/ui/data-table';

export default function LeaveCredits() {
  const { role } = useAuth();
  const { data: leaveTypes, isLoading, refetch } = useLeaveTypes();
  const { data: allCredits } = useAllLeaveCredits();
  const createLeaveType = useCreateLeaveType();
  const updateLeaveType = useUpdateLeaveType();
  const deleteLeaveType = useDeleteLeaveType();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [form, setForm] = useState({ name: '', default_credits: '', description: '', applyToAll: true });
  const [editForm, setEditForm] = useState({ name: '', default_credits: '', description: '' });

  const handleAddLeaveType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.default_credits) return;
    createLeaveType.mutate({ name: form.name, default_credits: parseFloat(form.default_credits), description: form.description || undefined, applyToAll: form.applyToAll }, {
      onSuccess: () => { setForm({ name: '', default_credits: '', description: '', applyToAll: true }); setDialogOpen(false); },
    });
  };

  const handleEditLeaveType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType || !editForm.name || !editForm.default_credits) return;
    updateLeaveType.mutate({ id: editingType.id, name: editForm.name, default_credits: parseFloat(editForm.default_credits), description: editForm.description || null }, {
      onSuccess: () => { setEditingType(null); setEditDialogOpen(false); },
    });
  };

  const openEditDialog = (lt: any) => {
    setEditingType(lt);
    setEditForm({ name: lt.name, default_credits: lt.default_credits.toString(), description: lt.description || '' });
    setEditDialogOpen(true);
  };

  const handleToggleActive = (id: string, currentActive: boolean) => updateLeaveType.mutate({ id, is_active: !currentActive });

  const getTotalTaken = (leaveTypeName: string) => {
    if (!allCredits) return 0;
    const enumVal = getLeaveTypeEnum(leaveTypeName);
    return allCredits.filter((c: any) => c.leave_type === enumVal).reduce((sum: number, c: any) => sum + (c.used_credits || 0), 0);
  };

  if (role !== 'hr_admin') {
    return <div className="page-container"><Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">You don't have permission to access this page.</p></CardContent></Card></div>;
  }

  const columns: ColumnDef<any, any>[] = [
    {
      accessorKey: 'name', header: 'Leave Type',
      cell: ({ row }) => {
        const lt = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-full", lt.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}><CheckSquare className="h-5 w-5" /></div>
            <div><p className="font-medium">{lt.name}</p>{lt.description && <p className="text-xs text-muted-foreground">{lt.description}</p>}</div>
          </div>
        );
      },
    },
    { accessorKey: 'is_active', header: 'Status', cell: ({ getValue }) => <Badge variant={getValue() ? 'default' : 'secondary'}>{getValue() ? 'Active' : 'Inactive'}</Badge> },
    { accessorKey: 'default_credits', header: 'Default Credits', cell: ({ getValue }) => `${getValue()} days` },
    {
      id: 'total_taken', header: 'Total Taken',
      cell: ({ row }) => <Badge variant="destructive" className="min-w-[60px]">{getTotalTaken(row.original.name)} days</Badge>,
    },
    {
      id: 'actions', header: 'Actions', enableSorting: false,
      cell: ({ row }) => {
        const lt = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:text-primary" onClick={() => openEditDialog(lt)} title="Edit">
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:text-primary" onClick={() => handleToggleActive(lt.id, lt.is_active)} title={lt.is_active ? 'Deactivate' : 'Activate'}>
              {lt.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete"><Trash2 className="h-4 w-4" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Leave Type?</AlertDialogTitle>
                  <AlertDialogDescription>Are you sure you want to delete "{lt.name}"? This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteLeaveType.mutate(lt.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Leave Credits Management</h1><p className="text-muted-foreground">Manage employee leave credits and allocations.</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
          <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Leave Type</Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? <div className="text-center py-8 text-muted-foreground">Loading...</div> : (
            <DataTable columns={columns} data={leaveTypes || []} searchPlaceholder="Search leave types..." emptyMessage="No leave types found. Click 'Add Leave Type' to create one." />
          )}
        </CardContent>
      </Card>

      {/* Add Leave Type Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Leave Type</DialogTitle></DialogHeader>
          <form onSubmit={handleAddLeaveType} className="space-y-4">
            <div className="space-y-2"><Label>Leave Type Name</Label><Input placeholder="e.g., Sick Leave" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><p className="text-xs text-muted-foreground">Enter a descriptive name for the leave type</p></div>
            <div className="space-y-2"><Label>Default Allowed Days</Label><Input type="number" min="0" step="0.5" placeholder="Enter default days" value={form.default_credits} onChange={(e) => setForm({ ...form, default_credits: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Enter description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="flex items-start gap-3 pt-2">
              <Checkbox id="applyToAll" checked={form.applyToAll} onCheckedChange={(checked) => setForm({ ...form, applyToAll: !!checked })} />
              <div><Label htmlFor="applyToAll" className="font-semibold cursor-pointer">Apply to all existing employees</Label><p className="text-xs text-muted-foreground">If checked, all employees will get leave credits for this type.</p></div>
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button type="submit" disabled={createLeaveType.isPending}><Plus className="mr-2 h-4 w-4" /> Add Leave Type</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Leave Type Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditingType(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Leave Type</DialogTitle></DialogHeader>
          <form onSubmit={handleEditLeaveType} className="space-y-4">
            <div className="space-y-2"><Label>Leave Type Name</Label><Input placeholder="e.g., Sick Leave" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Default Allowed Days</Label><Input type="number" min="0" step="0.5" placeholder="Enter default days" value={editForm.default_credits} onChange={(e) => setEditForm({ ...editForm, default_credits: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Enter description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => { setEditDialogOpen(false); setEditingType(null); }}>Cancel</Button><Button type="submit" disabled={updateLeaveType.isPending}>{updateLeaveType.isPending ? 'Saving...' : 'Save Changes'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
