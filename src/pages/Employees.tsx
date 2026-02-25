import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, RotateCcw, Eye } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { EmployeeAvatar } from '@/components/employees/EmployeeAvatar';
import { EmployeeViewModal } from '@/components/employees/EmployeeViewModal';
import { DataTable, ColumnDef } from '@/components/ui/data-table';

export default function Employees() {
  const { role } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'active' | 'inactive' | 'deleted'>('active');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  useEffect(() => {
    fetchEmployees();
  }, [viewMode]);

  const fetchEmployees = async () => {
    setLoading(true);
    let query = supabase
      .from('employees')
      .select('*, branches(name)')
      .order('last_name');
    
    if (viewMode === 'active') {
      query = query.eq('employment_status', 'active');
    } else if (viewMode === 'inactive') {
      query = query.eq('employment_status', 'inactive');
    } else {
      query = query.eq('employment_status', 'terminated');
    }
    
    const { data } = await query;
    setEmployees(data || []);
    setLoading(false);
  };

  const handleSoftDelete = async (id: string, name: string) => {
    const { error } = await supabase
      .from('employees')
      .update({ employment_status: 'terminated' })
      .eq('id', id);
    if (error) { toast.error('Failed to delete employee'); return; }
    toast.success(`${name} has been deactivated`);
    fetchEmployees();
  };

  const handleRestore = async (id: string, name: string) => {
    const { error } = await supabase
      .from('employees')
      .update({ employment_status: 'active' })
      .eq('id', id);
    if (error) { toast.error('Failed to restore employee'); return; }
    toast.success(`${name} has been restored`);
    fetchEmployees();
  };

  const handlePermanentDelete = async (id: string, name: string) => {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);
    if (error) { toast.error('Failed to delete employee permanently'); return; }
    toast.success(`${name} has been permanently deleted`);
    fetchEmployees();
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-success/20 text-success',
      inactive: 'bg-warning/20 text-warning',
      resigned: 'bg-muted/20 text-muted-foreground',
      terminated: 'bg-destructive/20 text-destructive',
      on_leave: 'bg-info/20 text-info',
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-muted text-muted-foreground'}`}>{status}</span>;
  };

  const columns: ColumnDef<any, any>[] = [
    {
      id: 'avatar',
      header: '',
      cell: ({ row }) => (
        <EmployeeAvatar firstName={row.original.first_name} lastName={row.original.last_name} avatarUrl={row.original.avatar_url} gender={row.original.gender} />
      ),
      enableSorting: false,
    },
    { accessorKey: 'employee_id', header: 'Employee ID' },
    {
      id: 'name',
      header: 'Name',
      accessorFn: (row) => `${row.first_name} ${row.last_name}`,
      cell: ({ row }) => `${row.original.first_name} ${row.original.last_name}`,
    },
    { accessorKey: 'position', header: 'Position' },
    {
      id: 'branch',
      header: 'Branch',
      accessorFn: (row) => row.branches?.name || '-',
    },
    {
      accessorKey: 'employment_status',
      header: 'Status',
      cell: ({ getValue }) => getStatusBadge(getValue() as string),
    },
    {
      id: 'actions',
      header: 'Actions',
      enableSorting: false,
      cell: ({ row }) => {
        const emp = row.original;
        return (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" title="View" onClick={() => setSelectedEmployee(emp)}>
              <Eye className="h-4 w-4" />
            </Button>
            {role === 'hr_admin' && (
              <Button variant="ghost" size="icon" asChild>
                <Link to={`/employees/${emp.id}`}><Edit className="h-4 w-4" /></Link>
              </Button>
            )}
            {role === 'hr_admin' && viewMode === 'deleted' && (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" title="Restore" className="text-success hover:text-success"><RotateCcw className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Restore Employee?</AlertDialogTitle><AlertDialogDescription>This will restore {emp.first_name} {emp.last_name} to active status.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleRestore(emp.id, `${emp.first_name} ${emp.last_name}`)}>Restore</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" title="Delete permanently" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Permanently?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete {emp.first_name} {emp.last_name} from the database. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handlePermanentDelete(emp.id, `${emp.first_name} ${emp.last_name}`)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete permanently</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            {role === 'hr_admin' && viewMode !== 'deleted' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Delete Employee?</AlertDialogTitle><AlertDialogDescription>This will set {emp.first_name} {emp.last_name}'s status to terminated.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleSoftDelete(emp.id, `${emp.first_name} ${emp.last_name}`)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
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
        <h1 className="page-title">Employees</h1>
        {role === 'hr_admin' && (
          <Button asChild>
            <Link to="/employees/new"><Plus className="mr-2 h-4 w-4" /> Add Employee</Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'active' | 'inactive' | 'deleted')}>
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
              <TabsTrigger value="deleted">Deleted</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <DataTable
              columns={columns}
              data={employees}
              searchPlaceholder="Search employees..."
              emptyMessage={viewMode === 'active' ? 'No active employees found' : viewMode === 'inactive' ? 'No inactive employees found' : 'No deleted employees'}
            />
          )}
        </CardContent>
      </Card>

      <EmployeeViewModal employee={selectedEmployee} open={!!selectedEmployee} onClose={() => setSelectedEmployee(null)} />
    </div>
  );
}
