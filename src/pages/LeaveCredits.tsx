 import { useState } from 'react';
 import { useAuth } from '@/hooks/useAuth';
 import { useAllLeaveCredits, useCreateLeaveCredit, useUpdateLeaveCredit } from '@/hooks/useLeaves';
 import { useEmployees } from '@/hooks/useEmployees';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Skeleton } from '@/components/ui/skeleton';
 import { Plus, Edit, Heart, Palmtree, AlertTriangle, RefreshCw } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { usePagination } from '@/hooks/usePagination';
 import { TablePagination } from '@/components/TablePagination';
 
 const LEAVE_TYPES = [
   { value: 'sick', label: 'Sick Leave', icon: Heart, defaultCredits: 2, color: 'text-destructive' },
   { value: 'vacation', label: 'Vacation Leave', icon: Palmtree, defaultCredits: 1, color: 'text-success' },
   { value: 'emergency', label: 'Emergency Leave', icon: AlertTriangle, defaultCredits: 2, color: 'text-warning' },
 ];
 
 export default function LeaveCredits() {
   const { role } = useAuth();
   const { data: allCredits, isLoading, refetch } = useAllLeaveCredits();
   const { data: employees } = useEmployees();
   const createCredit = useCreateLeaveCredit();
   const updateCredit = useUpdateLeaveCredit();
 
   const [dialogOpen, setDialogOpen] = useState(false);
   const [editCreditId, setEditCreditId] = useState<string | null>(null);
   const [form, setForm] = useState({ employee_id: '', leave_type: '', total_credits: '' });
 
   const { currentPage, setCurrentPage, totalPages, paginatedItems } = usePagination(allCredits || [], 15);
 
   const handleAddCredit = (e: React.FormEvent) => {
     e.preventDefault();
     if (!form.employee_id || !form.leave_type || !form.total_credits) return;
     
     createCredit.mutate({
       employee_id: form.employee_id,
       leave_type: form.leave_type as 'sick' | 'vacation' | 'emergency',
       total_credits: parseFloat(form.total_credits),
     }, {
       onSuccess: () => {
         setForm({ employee_id: '', leave_type: '', total_credits: '' });
         setDialogOpen(false);
       }
     });
   };
 
   const handleEditCredit = (credit: any) => {
     setEditCreditId(credit.id);
     setForm({
       employee_id: credit.employee_id,
       leave_type: credit.leave_type,
       total_credits: credit.total_credits?.toString() || '',
     });
     setDialogOpen(true);
   };
 
   const handleSaveCredit = () => {
     if (!editCreditId) return;
     updateCredit.mutate({
       id: editCreditId,
       total_credits: parseFloat(form.total_credits),
     }, {
       onSuccess: () => {
         setEditCreditId(null);
         setForm({ employee_id: '', leave_type: '', total_credits: '' });
         setDialogOpen(false);
       }
     });
   };
 
   const closeDialog = () => {
     setDialogOpen(false);
     setEditCreditId(null);
     setForm({ employee_id: '', leave_type: '', total_credits: '' });
   };
 
   const getLeaveTypeInfo = (type: string) => {
     return LEAVE_TYPES.find(lt => lt.value === type);
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
           <p className="text-muted-foreground">Manage employee leave credits and allocations</p>
         </div>
         <div className="flex gap-2">
           <Button variant="outline" onClick={() => refetch()}>
             <RefreshCw className="mr-2 h-4 w-4" /> Refresh
           </Button>
           <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
             <DialogTrigger asChild>
               <Button onClick={() => setDialogOpen(true)}>
                 <Plus className="mr-2 h-4 w-4" /> Add Credit
               </Button>
             </DialogTrigger>
             <DialogContent className="max-w-md">
               <DialogHeader>
                 <DialogTitle>{editCreditId ? 'Edit Leave Credit' : 'Add Leave Credit'}</DialogTitle>
               </DialogHeader>
               <form onSubmit={editCreditId ? (e) => { e.preventDefault(); handleSaveCredit(); } : handleAddCredit} className="space-y-4">
                 {!editCreditId && (
                   <>
                     <div>
                       <Label>Employee</Label>
                       <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                         <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                         <SelectContent>
                           {employees?.map((emp: any) => (
                             <SelectItem key={emp.id} value={emp.id}>
                               {emp.first_name} {emp.last_name} ({emp.employee_id})
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                     <div>
                       <Label>Leave Type</Label>
                       <Select value={form.leave_type} onValueChange={(v) => {
                         const defaultCredits = LEAVE_TYPES.find(lt => lt.value === v)?.defaultCredits || 0;
                         setForm({ ...form, leave_type: v, total_credits: defaultCredits.toString() });
                       }}>
                         <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                         <SelectContent>
                           {LEAVE_TYPES.map(t => (
                             <SelectItem key={t.value} value={t.value}>
                               {t.label} (Default: {t.defaultCredits} days)
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                   </>
                 )}
                 <div>
                   <Label>Total Credits (days)</Label>
                   <Input 
                     type="number" 
                     min="0" 
                     step="0.5"
                     value={form.total_credits} 
                     onChange={(e) => setForm({ ...form, total_credits: e.target.value })} 
                     placeholder="Enter credit amount"
                   />
                 </div>
                 <DialogFooter>
                   <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                   <Button type="submit" disabled={createCredit.isPending || updateCredit.isPending}>
                     {editCreditId ? 'Save Changes' : 'Add Credit'}
                   </Button>
                 </DialogFooter>
               </form>
             </DialogContent>
           </Dialog>
         </div>
       </div>
 
       {/* Summary Cards */}
       <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-6">
         {LEAVE_TYPES.map((leaveType) => {
           const Icon = leaveType.icon;
           const creditsOfType = allCredits?.filter((c: any) => c.leave_type === leaveType.value) || [];
           const totalAllocated = creditsOfType.reduce((sum: number, c: any) => sum + (c.total_credits || 0), 0);
           const totalUsed = creditsOfType.reduce((sum: number, c: any) => sum + (c.used_credits || 0), 0);
           
           return (
             <Card key={leaveType.value}>
               <CardContent className="p-4">
                 <div className="flex items-center gap-3">
                   <div className={cn("p-2 rounded-full bg-muted", leaveType.color)}>
                     <Icon className="h-5 w-5" />
                   </div>
                   <div>
                     <p className="text-sm font-medium">{leaveType.label}</p>
                     <p className="text-xs text-muted-foreground">
                       {creditsOfType.length} employees • {totalUsed}/{totalAllocated} days used
                     </p>
                   </div>
                 </div>
               </CardContent>
             </Card>
           );
         })}
       </div>
 
       {/* Credits Table */}
       <Card>
         <CardHeader>
           <CardTitle>All Leave Credits</CardTitle>
           <CardDescription>Current year leave credit allocations for all employees</CardDescription>
         </CardHeader>
         <CardContent>
           <div className="overflow-x-auto">
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Employee</TableHead>
                   <TableHead>Employee ID</TableHead>
                   <TableHead>Leave Type</TableHead>
                   <TableHead className="text-center">Total Credits</TableHead>
                   <TableHead className="text-center">Used</TableHead>
                   <TableHead className="text-center">Available</TableHead>
                   <TableHead>Actions</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {isLoading ? (
                   [1, 2, 3, 4, 5].map(i => (
                     <TableRow key={i}>
                       {[1, 2, 3, 4, 5, 6, 7].map(j => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                     </TableRow>
                   ))
                 ) : paginatedItems.length > 0 ? (
                   paginatedItems.map((credit: any) => {
                     const typeInfo = getLeaveTypeInfo(credit.leave_type);
                     const Icon = typeInfo?.icon || Heart;
                     const available = (credit.total_credits || 0) - (credit.used_credits || 0);
                     const isLow = available <= 0 && credit.total_credits > 0;
                     
                     return (
                       <TableRow key={credit.id}>
                         <TableCell className="font-medium">
                           {credit.employees?.first_name} {credit.employees?.last_name}
                         </TableCell>
                         <TableCell className="text-muted-foreground">
                           {credit.employees?.employee_id}
                         </TableCell>
                         <TableCell>
                           <div className="flex items-center gap-2">
                             <Icon className={cn("h-4 w-4", typeInfo?.color)} />
                             <span className="capitalize">{credit.leave_type}</span>
                           </div>
                         </TableCell>
                         <TableCell className="text-center">{credit.total_credits}</TableCell>
                         <TableCell className="text-center">{credit.used_credits}</TableCell>
                         <TableCell className={cn("text-center font-medium", isLow && "text-destructive")}>
                           {available}
                         </TableCell>
                         <TableCell>
                           <Button size="sm" variant="ghost" onClick={() => handleEditCredit(credit)}>
                             <Edit className="h-4 w-4" />
                           </Button>
                         </TableCell>
                       </TableRow>
                     );
                   })
                 ) : (
                   <TableRow>
                     <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                       No leave credits found. Click "Add Credit" to allocate leave credits to employees.
                     </TableCell>
                   </TableRow>
                 )}
               </TableBody>
             </Table>
           </div>
           <TablePagination
             currentPage={currentPage}
             totalPages={totalPages}
             onPageChange={setCurrentPage}
           />
         </CardContent>
       </Card>
     </div>
   );
 }