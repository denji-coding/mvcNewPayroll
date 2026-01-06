import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getSafeErrorMessage } from '@/lib/errorHandler';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Attendance = Tables<'attendance'>;
export type AttendanceInsert = TablesInsert<'attendance'>;
export type AttendanceUpdate = TablesUpdate<'attendance'>;

export function useAttendanceByDate(date: string) {
  return useQuery({
    queryKey: ['attendance', date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*, employees(employee_id, first_name, last_name)')
        .eq('date', date)
        .order('time_in', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useAttendanceStats(date: string) {
  return useQuery({
    queryKey: ['attendance-stats', date],
    queryFn: async () => {
      const { data: attendance, error } = await supabase
        .from('attendance')
        .select('status')
        .eq('date', date);
      
      if (error) throw error;

      const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('employment_status', 'active');

      const stats = {
        present: attendance?.filter(a => a.status === 'present').length || 0,
        late: attendance?.filter(a => a.status === 'late').length || 0,
        absent: (totalEmployees || 0) - (attendance?.length || 0),
        onLeave: attendance?.filter(a => a.status === 'on_leave').length || 0,
      };

      return stats;
    },
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: AttendanceUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('attendance')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance updated');
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error, 'Failed to update attendance'));
    },
  });
}

export function useEmployeeAttendance(employeeId: string | undefined, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['employee-attendance', employeeId, startDate, endDate],
    queryFn: async () => {
      if (!employeeId) return [];
      
      let query = supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .order('date', { ascending: false });
      
      if (startDate) query = query.gte('date', startDate);
      if (endDate) query = query.lte('date', endDate);
      
      const { data, error } = await query.limit(30);
      
      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
  });
}
