import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLeaveTypes, useCreateLeaveType, useUpdateLeaveType, useDeleteLeaveType } from '@/hooks/useLeaveTypes';
import { useAllLeaveCredits } from '@/hooks/useLeaves';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, EyeOff, Trash2, CheckSquare, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LeaveCredits() {
  const { role } = useAuth();
  const { data: leaveTypes, isLoading, refetch } = useLeaveTypes();
  const { data: allCredits } = useAllLeaveCredits();
  const createLeaveType = useCreateLeaveType();
  const updateLeaveType = useUpdateLeaveType();
  const deleteLeaveType = useDeleteLeaveType();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', default_credits: '', description: '', applyToAll: true });

  const handleAddLeaveType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.default_credits) return;
    createLeaveType.mutate({
      name: form.name,
      default_credits: parseFloat(form.default_credits),
      description: form.description || undefined,
      applyToAll: form.applyToAll,
    }, {
      onSuccess: () => {
        setForm({ name: '', default_credits: '', description: '', applyToAll: true });
        setDialogOpen(false);
      },
    });
  };

  const handleToggleActive = (id: string, currentActive: boolean) => {
    updateLeaveType.mutate({ id, is_active: !currentActive });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this leave type?')) {
      deleteLeaveType.mutate(id);
    }
  };

  const getTotalTaken = (leaveTypeName: string) => {
    if (!allCredits) return 0;
    const typeMap: Record<string, string> = {
      'Sick Leave': 'sick',
      'Vacation Leave': 'vacation',
      'Emergency Leave': 'emergency',
      'Maternity/Paternity Leave': 'maternity',
    };
    const enumVal = typeMap[leaveTypeName];
    if (!enumVal) return 0;
    return allCredits
      .filter((c: any) => c.leave_type === enumVal)
      .reduce((sum: number, c: any) => sum + (c.used_credits || 0), 0);
  };

  if (role !== 'hr_admin') {
    return (
      <div className="page-container">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leave Credits Management</h1>
          <p className="text-muted-foreground">Manage employee leave credits and allocations.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Leave Type
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="text-primary-foreground font-semibold">Leave Type</TableHead>
                  <TableHead className="text-primary-foreground font-semibold text-center">Status</TableHead>
                  <TableHead className="text-primary-foreground font-semibold text-center">Default Credits</TableHead>
                  <TableHead className="text-primary-foreground font-semibold text-center">Total Taken</TableHead>
                  <TableHead className="text-primary-foreground font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [1, 2, 3, 4].map(i => (
                    <TableRow key={i}>
                      {[1, 2, 3, 4, 5].map(j => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                    </TableRow>
                  ))
                ) : leaveTypes && leaveTypes.length > 0 ? (
                  leaveTypes.map((lt) => {
                    const totalTaken = getTotalTaken(lt.name);
                    return (
                      <TableRow
                        key={lt.id}
                        className={cn(
                          lt.is_active ? 'bg-accent/30' : 'bg-muted/50 opacity-70'
                        )}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-full",
                              lt.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            )}>
                              <CheckSquare className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">{lt.name}</p>
                              {lt.description && (
                                <p className="text-xs text-muted-foreground">{lt.description}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={lt.is_active ? 'default' : 'secondary'}>
                            {lt.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {lt.default_credits} days
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="destructive" className="min-w-[60px]">
                            {totalTaken} days
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-primary hover:text-primary"
                              onClick={() => handleToggleActive(lt.id, lt.is_active)}
                              title={lt.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {lt.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(lt.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No leave types found. Click "Add Leave Type" to create one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Leave Type Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Leave Type</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddLeaveType} className="space-y-4">
            <div className="space-y-2">
              <Label>Leave Type Name</Label>
              <Input
                placeholder="e.g., Sick Leave, Vacation Leave"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Enter a descriptive name for the leave type</p>
            </div>
            <div className="space-y-2">
              <Label>Default Allowed Days</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                placeholder="Enter default days"
                value={form.default_credits}
                onChange={(e) => setForm({ ...form, default_credits: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Number of days allowed by default for new employees</p>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Enter a description for this leave type"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">Optional description explaining when this leave type should be used</p>
            </div>
            <div className="flex items-start gap-3 pt-2">
              <Checkbox
                id="applyToAll"
                checked={form.applyToAll}
                onCheckedChange={(checked) => setForm({ ...form, applyToAll: !!checked })}
              />
              <div>
                <Label htmlFor="applyToAll" className="font-semibold cursor-pointer">
                  Apply to all existing employees
                </Label>
                <p className="text-xs text-muted-foreground">
                  If checked, all existing employees will automatically get leave credits for this new leave type with 0 taken days.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createLeaveType.isPending}>
                <Plus className="mr-2 h-4 w-4" /> Add Leave Type
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
