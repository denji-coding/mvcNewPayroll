import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export function useTodayAttendance() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['my-attendance-today', user?.id, today],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get employee record for current user
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (empError || !employee) return null;

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employee.id)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;
      return { attendance: data, employeeId: employee.id };
    },
    enabled: !!user?.id,
  });
}

export function useClockIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employeeId: string) => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const timeIn = now.toISOString();

      // Calculate late minutes (assuming 9 AM start)
      const startHour = 9;
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      const lateMinutes = currentHour > startHour || (currentHour === startHour && currentMinutes > 0)
        ? (currentHour - startHour) * 60 + currentMinutes
        : 0;

      const status = lateMinutes > 0 ? 'late' : 'present';

      const { data, error } = await supabase
        .from('attendance')
        .insert({
          employee_id: employeeId,
          date: today,
          time_in: timeIn,
          status,
          late_minutes: lateMinutes > 0 ? lateMinutes : 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Clocked in successfully!');
    },
    onError: (error) => {
      toast.error('Failed to clock in: ' + error.message);
    },
  });
}

export function useClockOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ attendanceId, timeIn }: { attendanceId: string; timeIn: string }) => {
      const now = new Date();
      const timeOut = now.toISOString();

      // Calculate hours worked
      const startTime = new Date(timeIn);
      const hoursWorked = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);

      // Calculate undertime (assuming 8-hour workday ending at 6 PM)
      const endHour = 18;
      const currentHour = now.getHours();
      const undertimeMinutes = currentHour < endHour
        ? (endHour - currentHour) * 60 - now.getMinutes()
        : 0;

      // Calculate overtime (if worked past 6 PM)
      const overtimeHours = currentHour >= endHour
        ? (currentHour - endHour) + (now.getMinutes() / 60)
        : 0;

      const { data, error } = await supabase
        .from('attendance')
        .update({
          time_out: timeOut,
          hours_worked: Math.round(hoursWorked * 100) / 100,
          undertime_minutes: undertimeMinutes > 0 ? undertimeMinutes : 0,
          overtime_hours: Math.round(overtimeHours * 100) / 100,
        })
        .eq('id', attendanceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Clocked out successfully!');
    },
    onError: (error) => {
      toast.error('Failed to clock out: ' + error.message);
    },
  });
}
