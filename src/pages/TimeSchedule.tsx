import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Save, Clock, Edit, Trash2 } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useEmployeeScheduleByEmployee, useEmployeeSchedules, useSaveEmployeeSchedule, useDeleteEmployeeSchedule, getDayName, type DaySchedule } from '@/hooks/useEmployeeSchedule';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DataTable, ColumnDef } from '@/components/ui/data-table';

const DAYS = [
  { value: 1, label: 'Monday' }, { value: 2, label: 'Tuesday' }, { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' }, { value: 5, label: 'Friday' }, { value: 6, label: 'Saturday' }, { value: 0, label: 'Sunday' },
];

const SHORT_DAYS: Record<number, string> = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };

const DEFAULT_SCHEDULE: DaySchedule[] = DAYS.map(d => ({
  day_of_week: d.value, is_duty_day: d.value >= 1 && d.value <= 5,
  morning_start: '08:00', morning_end: '12:00', afternoon_start: '13:00', afternoon_end: '17:00',
}));

export default function TimeSchedule() {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [schedules, setSchedules] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [isEditing, setIsEditing] = useState(false);

  const { data: employees, isLoading: employeesLoading } = useEmployees();
  const { data: allSchedules, isLoading: allSchedulesLoading } = useEmployeeSchedules();
  const { data: employeeSchedule, isLoading: scheduleLoading } = useEmployeeScheduleByEmployee(selectedEmployee);
  const saveSchedule = useSaveEmployeeSchedule();
  const deleteSchedule = useDeleteEmployeeSchedule();

  const employeesWithSchedules = useMemo(() => {
    if (!allSchedules) return new Set<string>();
    return new Set(allSchedules.map((s: any) => s.employee_id));
  }, [allSchedules]);

  const groupedSchedules = useMemo(() => {
    if (!allSchedules) return [];
    const grouped: Record<string, any> = {};
    allSchedules.forEach((schedule: any) => {
      if (!grouped[schedule.employee_id]) {
        grouped[schedule.employee_id] = {
          employee: schedule.employees, dutyDays: [],
          morningStart: schedule.morning_start || schedule.start_time || '08:00', morningEnd: schedule.morning_end || '12:00',
          afternoonStart: schedule.afternoon_start || '13:00', afternoonEnd: schedule.afternoon_end || schedule.end_time || '17:00',
        };
      }
      if (schedule.is_duty_day) grouped[schedule.employee_id].dutyDays.push(schedule.day_of_week);
    });
    return Object.entries(grouped).map(([employeeId, data]) => ({ employeeId, ...data }));
  }, [allSchedules]);

  const availableEmployees = useMemo(() => {
    if (!employees) return [];
    if (isEditing && selectedEmployee) return employees.filter(e => !employeesWithSchedules.has(e.id) || e.id === selectedEmployee);
    return employees.filter(e => !employeesWithSchedules.has(e.id));
  }, [employees, employeesWithSchedules, isEditing, selectedEmployee]);

  useEffect(() => {
    if (employeeSchedule && employeeSchedule.length > 0) {
      const loadedSchedules = DAYS.map(d => {
        const existing = employeeSchedule.find(s => s.day_of_week === d.value);
        if (existing) return { day_of_week: existing.day_of_week, is_duty_day: existing.is_duty_day, morning_start: existing.morning_start || existing.start_time || '08:00', morning_end: existing.morning_end || '12:00', afternoon_start: existing.afternoon_start || '13:00', afternoon_end: existing.afternoon_end || existing.end_time || '17:00' };
        return { day_of_week: d.value, is_duty_day: false, morning_start: '08:00', morning_end: '12:00', afternoon_start: '13:00', afternoon_end: '17:00' };
      });
      setSchedules(loadedSchedules);
    } else if (selectedEmployee) setSchedules(DEFAULT_SCHEDULE);
  }, [employeeSchedule, selectedEmployee]);

  const handleDayToggle = (dayOfWeek: number, checked: boolean) => setSchedules(prev => prev.map(s => s.day_of_week === dayOfWeek ? { ...s, is_duty_day: checked } : s));
  const handleTimeChange = (dayOfWeek: number, field: keyof DaySchedule, value: string) => setSchedules(prev => prev.map(s => s.day_of_week === dayOfWeek ? { ...s, [field]: value } : s));
  const handleSelectWeekdays = () => setSchedules(prev => prev.map(s => ({ ...s, is_duty_day: s.day_of_week >= 1 && s.day_of_week <= 5 })));
  const handleSelectAll = () => setSchedules(prev => prev.map(s => ({ ...s, is_duty_day: true })));
  const handleClearAll = () => setSchedules(prev => prev.map(s => ({ ...s, is_duty_day: false })));

  const handleSave = () => {
    if (!selectedEmployee) return;
    saveSchedule.mutate({ employee_id: selectedEmployee, schedules }, { onSuccess: () => { setSelectedEmployee(''); setIsEditing(false); setSchedules(DEFAULT_SCHEDULE); } });
  };

  const handleEdit = (employeeId: string) => { setIsEditing(true); setSelectedEmployee(employeeId); };
  const handleDelete = (employeeId: string) => deleteSchedule.mutate(employeeId);
  const handleCancelEdit = () => { setSelectedEmployee(''); setIsEditing(false); setSchedules(DEFAULT_SCHEDULE); };
  const formatTimeRange = (start: string, end: string) => `${start?.slice(0, 5) || '--:--'} - ${end?.slice(0, 5) || '--:--'}`;

  const scheduleColumns: ColumnDef<any, any>[] = [
    { id: 'emp_id', header: 'Employee ID', accessorFn: (row) => row.employee?.employee_id || '-' },
    { id: 'name', header: 'Name', accessorFn: (row) => `${row.employee?.first_name} ${row.employee?.last_name}` },
    {
      id: 'duty_days', header: 'Duty Days',
      cell: ({ row }) => {
        const dutyDays = row.original.dutyDays;
        return (
          <div className="flex flex-wrap gap-1">
            {dutyDays.length === 0 ? <Badge variant="secondary">No duty days</Badge> :
              dutyDays.sort((a: number, b: number) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b)).map((day: number) => <Badge key={day} variant="outline" className="text-xs">{SHORT_DAYS[day]}</Badge>)}
          </div>
        );
      },
    },
    { id: 'morning', header: 'Morning', cell: ({ row }) => <Badge variant="secondary" className="flex items-center gap-1 w-fit text-xs"><Clock className="h-3 w-3" />{formatTimeRange(row.original.morningStart, row.original.morningEnd)}</Badge> },
    { id: 'afternoon', header: 'Afternoon', cell: ({ row }) => <Badge variant="secondary" className="flex items-center gap-1 w-fit text-xs"><Clock className="h-3 w-3" />{formatTimeRange(row.original.afternoonStart, row.original.afternoonEnd)}</Badge> },
    {
      id: 'actions', header: 'Actions', enableSorting: false,
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row.original.employeeId)}><Edit className="h-4 w-4" /></Button>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="outline" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Schedule?</AlertDialogTitle><AlertDialogDescription>Delete schedule for {row.original.employee?.first_name} {row.original.employee?.last_name}?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(row.original.employeeId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2"><Calendar className="h-6 w-6" />Time Schedule</h1>
          <p className="text-muted-foreground mt-1">Set 4-time work schedules for employees</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>Assigned Schedules</CardTitle><CardDescription>Employees with configured work schedules</CardDescription></CardHeader>
        <CardContent>
          {allSchedulesLoading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <DataTable columns={scheduleColumns} data={groupedSchedules} searchPlaceholder="Search schedules..." emptyMessage="No employees have assigned schedules yet" />
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Schedule Card - keep as-is since it's a form, not a data table */}
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Schedule' : 'Add Employee Schedule'}</CardTitle>
          <CardDescription>{isEditing ? 'Modify the work schedule' : 'Select an employee to configure their weekly work schedule'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Select Employee</Label>
            {employeesLoading ? <Skeleton className="h-10 w-full max-w-md" /> : availableEmployees.length === 0 && !isEditing ? (
              <p className="text-muted-foreground text-sm">All employees already have assigned schedules</p>
            ) : (
              <div className="flex gap-2 items-center">
                <Select value={selectedEmployee} onValueChange={(v) => { setSelectedEmployee(v); if (!isEditing) setIsEditing(false); }} disabled={isEditing}>
                  <SelectTrigger className="w-full max-w-md"><SelectValue placeholder="Choose an employee..." /></SelectTrigger>
                  <SelectContent>{availableEmployees.map((emp) => <SelectItem key={emp.id} value={emp.id}>{emp.last_name}, {emp.first_name} ({emp.employee_id})</SelectItem>)}</SelectContent>
                </Select>
                {isEditing && <Button variant="outline" onClick={handleCancelEdit}>Cancel Edit</Button>}
              </div>
            )}
          </div>

          {selectedEmployee && (
            <>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectWeekdays}>Mon-Fri</Button>
                <Button variant="outline" size="sm" onClick={handleSelectAll}>Select All</Button>
                <Button variant="outline" size="sm" onClick={handleClearAll}>Clear All</Button>
              </div>

              {scheduleLoading ? (
                <div className="space-y-2">{[1, 2, 3, 4, 5, 6, 7].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow><TableHead className="w-24">Day</TableHead><TableHead className="w-20">Duty</TableHead><TableHead>AM In</TableHead><TableHead>AM Out</TableHead><TableHead>PM In</TableHead><TableHead>PM Out</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {DAYS.map(day => {
                        const schedule = schedules.find(s => s.day_of_week === day.value);
                        const isDuty = schedule?.is_duty_day || false;
                        return (
                          <TableRow key={day.value}>
                            <TableCell className="font-medium">{day.label}</TableCell>
                            <TableCell><Switch checked={isDuty} onCheckedChange={(checked) => handleDayToggle(day.value, checked)} /></TableCell>
                            <TableCell><Input type="time" value={schedule?.morning_start || '08:00'} onChange={(e) => handleTimeChange(day.value, 'morning_start', e.target.value)} disabled={!isDuty} className="w-24" /></TableCell>
                            <TableCell><Input type="time" value={schedule?.morning_end || '12:00'} onChange={(e) => handleTimeChange(day.value, 'morning_end', e.target.value)} disabled={!isDuty} className="w-24" /></TableCell>
                            <TableCell><Input type="time" value={schedule?.afternoon_start || '13:00'} onChange={(e) => handleTimeChange(day.value, 'afternoon_start', e.target.value)} disabled={!isDuty} className="w-24" /></TableCell>
                            <TableCell><Input type="time" value={schedule?.afternoon_end || '17:00'} onChange={(e) => handleTimeChange(day.value, 'afternoon_end', e.target.value)} disabled={!isDuty} className="w-24" /></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              <Button onClick={handleSave} disabled={saveSchedule.isPending || !selectedEmployee} className="w-full sm:w-auto">
                <Save className="mr-2 h-4 w-4" />{saveSchedule.isPending ? 'Saving...' : isEditing ? 'Update Schedule' : 'Save Schedule'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
