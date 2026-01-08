import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Edit, Trash2, RotateCcw } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { usePagination } from '@/hooks/usePagination';
import { TablePagination } from '@/components/TablePagination';

export default function Employees() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'active' | 'deleted'>('active');

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
    
    if (error) {
      toast.error('Failed to delete employee');
      return;
    }
    
    toast.success(`${name} has been deactivated`);
    fetchEmployees();
  };

  const handleRestore = async (id: string, name: string) => {
    const { error } = await supabase
      .from('employees')
      .update({ employment_status: 'active' })
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to restore employee');
      return;
    }
    
    toast.success(`${name} has been restored`);
    fetchEmployees();
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.first_name.toLowerCase().includes(search.toLowerCase()) ||
      emp.last_name.toLowerCase().includes(search.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(search.toLowerCase())
  );

  const { currentPage, setCurrentPage, totalPages, paginatedItems } = usePagination(filteredEmployees, 10);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-success/20 text-success',
      resigned: 'bg-warning/20 text-warning',
      terminated: 'bg-destructive/20 text-destructive',
      on_leave: 'bg-info/20 text-info',
    };
    return <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-muted text-muted-foreground'}`}>{status}</span>;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Employees</h1>
        <Button asChild>
          <Link to="/employees/new"><Plus className="mr-2 h-4 w-4" /> Add Employee</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'active' | 'deleted')}>
              <TabsList>
                <TabsTrigger value="active">Active Employees</TabsTrigger>
                <TabsTrigger value="deleted">Deleted Employees</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.employee_id}</TableCell>
                        <TableCell>{emp.first_name} {emp.last_name}</TableCell>
                        <TableCell>{emp.position}</TableCell>
                        <TableCell>{emp.branches?.name || '-'}</TableCell>
                        <TableCell>{getStatusBadge(emp.employment_status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" asChild>
                              <Link to={`/employees/${emp.id}`}><Edit className="h-4 w-4" /></Link>
                            </Button>
                            {viewMode === 'active' ? (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Deactivate Employee?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will set {emp.first_name} {emp.last_name}'s status to terminated. 
                                      You can restore them later from the "Deleted Employees" tab.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleSoftDelete(emp.id, `${emp.first_name} ${emp.last_name}`)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Deactivate
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-success hover:text-success">
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Restore Employee?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will restore {emp.first_name} {emp.last_name} to active status.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleRestore(emp.id, `${emp.first_name} ${emp.last_name}`)}
                                    >
                                      Restore
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {paginatedItems.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {viewMode === 'active' ? 'No active employees found' : 'No deleted employees'}
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
