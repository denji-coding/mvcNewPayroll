import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Save, Clock } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { 
  useEmployeeScheduleByEmployee, 
  useSaveEmployeeSchedule, 
  getDayName,
  EmployeeSchedule 
} from '@/hooks/useEmployeeSchedule';

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

interface DaySchedule {
  day_of_week: number;
  is_duty_day: boolean;
  start_time: string;
  end_time: string;
}

const DEFAULT_SCHEDULE: DaySchedule[] = DAYS.map(d => ({
  day_of_week: d.value,
  is_duty_day: d.value >= 1 && d.value <= 5, // Mon-Fri by default
  start_time: '08:00',
  end_time: '17:00',
}));

export default function TimeSchedule() {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [schedules, setSchedules] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);

  const { data: employees, isLoading: employeesLoading } = useEmployees();
  const { data: employeeSchedule, isLoading: scheduleLoading } = useEmployeeScheduleByEmployee(selectedEmployee);
  const saveSchedule = useSaveEmployeeSchedule();

  // Load existing schedule when employee is selected
  useEffect(() => {
    if (employeeSchedule && employeeSchedule.length > 0) {
      const loadedSchedules = DAYS.map(d => {
        const existing = employeeSchedule.find(s => s.day_of_week === d.value);
        if (existing) {
          return {
            day_of_week: existing.day_of_week,
            is_duty_day: existing.is_duty_day,
            start_time: existing.start_time,
            end_time: existing.end_time,
          };
        }
        return {
          day_of_week: d.value,
          is_duty_day: false,
          start_time: '08:00',
          end_time: '17:00',
        };
      });
      setSchedules(loadedSchedules);
    } else if (selectedEmployee) {
      setSchedules(DEFAULT_SCHEDULE);
    }
  }, [employeeSchedule, selectedEmployee]);

  const handleDayToggle = (dayOfWeek: number, checked: boolean) => {
    setSchedules(prev => 
      prev.map(s => 
        s.day_of_week === dayOfWeek 
          ? { ...s, is_duty_day: checked }
          : s
      )
    );
  };

  const handleTimeChange = (dayOfWeek: number, field: 'start_time' | 'end_time', value: string) => {
    setSchedules(prev => 
      prev.map(s => 
        s.day_of_week === dayOfWeek 
          ? { ...s, [field]: value }
          : s
      )
    );
  };

  const handleSelectWeekdays = () => {
    setSchedules(prev => 
      prev.map(s => ({
        ...s,
        is_duty_day: s.day_of_week >= 1 && s.day_of_week <= 5,
      }))
    );
  };

  const handleSelectAll = () => {
    setSchedules(prev => prev.map(s => ({ ...s, is_duty_day: true })));
  };

  const handleClearAll = () => {
    setSchedules(prev => prev.map(s => ({ ...s, is_duty_day: false })));
  };

  const handleSave = () => {
    if (!selectedEmployee) return;
    
    saveSchedule.mutate({
      employee_id: selectedEmployee,
      schedules,
    });
  };

  const selectedEmployeeData = employees?.find(e => e.id === selectedEmployee);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Time Schedule
          </h1>
          <p className="text-muted-foreground mt-1">
            Set work schedules for employees to manage attendance duty days
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Work Schedule</CardTitle>
          <CardDescription>
            Select an employee and configure their weekly work schedule. 
            Employees without duty on a specific day cannot clock in on the attendance terminal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Employee Selection */}
          <div className="space-y-2">
            <Label>Select Employee</Label>
            {employeesLoading ? (
              <Skeleton className="h-10 w-full max-w-md" />
            ) : (
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Choose an employee..." />
                </SelectTrigger>
                <SelectContent>
                  {employees?.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.last_name}, {emp.first_name} ({emp.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedEmployee && (
            <>
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectWeekdays}>
                  Mon-Fri
                </Button>
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearAll}>
                  Clear All
                </Button>
              </div>

              {/* Schedule Table */}
              {scheduleLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-32">Day</TableHead>
                        <TableHead className="w-24">Duty Day</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Time</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {DAYS.map(day => {
                        const schedule = schedules.find(s => s.day_of_week === day.value);
                        return (
                          <TableRow key={day.value}>
                            <TableCell className="font-medium">{day.label}</TableCell>
                            <TableCell>
                              <Switch
                                checked={schedule?.is_duty_day || false}
                                onCheckedChange={(checked) => handleDayToggle(day.value, checked)}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="time"
                                value={schedule?.start_time || '08:00'}
                                onChange={(e) => handleTimeChange(day.value, 'start_time', e.target.value)}
                                disabled={!schedule?.is_duty_day}
                                className="w-28"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="time"
                                value={schedule?.end_time || '17:00'}
                                onChange={(e) => handleTimeChange(day.value, 'end_time', e.target.value)}
                                disabled={!schedule?.is_duty_day}
                                className="w-28"
                              />
                            </TableCell>
                            <TableCell>
                              {schedule?.is_duty_day ? (
                                <Badge variant="default" className="flex items-center gap-1 w-fit">
                                  <Clock className="h-3 w-3" />
                                  {schedule.start_time} - {schedule.end_time}
                                </Badge>
                              ) : (
                                <Badge variant="secondary">No Duty</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={saveSchedule.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {saveSchedule.isPending ? 'Saving...' : 'Save Schedule'}
                </Button>
              </div>

              {selectedEmployeeData && (
                <p className="text-sm text-muted-foreground">
                  Configuring schedule for: <strong>{selectedEmployeeData.first_name} {selectedEmployeeData.last_name}</strong>
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
