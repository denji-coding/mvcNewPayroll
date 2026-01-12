import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EmployeeSchedule {
  id: string;
  employee_id: string;
  day_of_week: number;
  is_duty_day: boolean;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleFormData {
  employee_id: string;
  schedules: {
    day_of_week: number;
    is_duty_day: boolean;
    start_time: string;
    end_time: string;
  }[];
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const getDayName = (dayOfWeek: number) => DAY_NAMES[dayOfWeek] || '';

// Fetch all schedules
export function useEmployeeSchedules() {
  return useQuery({
    queryKey: ['employee-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_schedules')
        .select('*, employees(first_name, last_name, employee_id)')
        .order('employee_id', { ascending: true })
        .order('day_of_week', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

// Fetch schedule for a specific employee
export function useEmployeeScheduleByEmployee(employeeId: string | null) {
  return useQuery({
    queryKey: ['employee-schedules', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      
      const { data, error } = await supabase
        .from('employee_schedules')
        .select('*')
        .eq('employee_id', employeeId)
        .order('day_of_week', { ascending: true });

      if (error) throw error;
      return data as EmployeeSchedule[];
    },
    enabled: !!employeeId,
  });
}

// Save schedule for an employee (upsert)
export function useSaveEmployeeSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ employee_id, schedules }: ScheduleFormData) => {
      // Delete existing schedules for this employee
      await supabase
        .from('employee_schedules')
        .delete()
        .eq('employee_id', employee_id);

      // Insert new schedules
      const { error } = await supabase
        .from('employee_schedules')
        .insert(schedules.map(s => ({
          employee_id,
          day_of_week: s.day_of_week,
          is_duty_day: s.is_duty_day,
          start_time: s.start_time,
          end_time: s.end_time,
        })));

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-schedules'] });
      toast.success('Schedule saved successfully');
    },
    onError: (error) => {
      console.error('Save schedule error:', error);
      toast.error('Failed to save schedule');
    },
  });
}

// Delete schedule for an employee
export function useDeleteEmployeeSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (employeeId: string) => {
      const { error } = await supabase
        .from('employee_schedules')
        .delete()
        .eq('employee_id', employeeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-schedules'] });
      toast.success('Schedule deleted');
    },
    onError: () => {
      toast.error('Failed to delete schedule');
    },
  });
}
