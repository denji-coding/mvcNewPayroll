import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { startOfMonth, endOfMonth, format, addDays } from 'date-fns';

export function useEmployeeDashboard() {
  const { user } = useAuth();

  const { data: employeeId } = useQuery({
    queryKey: ['employee-id', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      return data?.id || null;
    },
    enabled: !!user?.id,
  });

  const { data: attendanceSummary, isLoading: attendanceLoading } = useQuery({
    queryKey: ['employee-attendance-summary', employeeId],
    queryFn: async () => {
      if (!employeeId) return null;

      const today = format(new Date(), 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');

      // Get today's attendance
      const { data: todayAttendance } = await supabase
        .from('attendance')
        .select('status, time_in, time_out')
        .eq('employee_id', employeeId)
        .eq('date', today)
        .maybeSingle();

      // Get monthly attendance
      const { data: monthlyAttendance } = await supabase
        .from('attendance')
        .select('status')
        .eq('employee_id', employeeId)
        .gte('date', monthStart)
        .lte('date', monthEnd);

      const monthlyPresent = monthlyAttendance?.filter(a => a.status === 'present' || a.status === 'late').length || 0;
      const monthlyLate = monthlyAttendance?.filter(a => a.status === 'late').length || 0;
      const monthlyAbsent = monthlyAttendance?.filter(a => a.status === 'absent').length || 0;

      return {
        todayStatus: todayAttendance?.status || null,
        todayTimeIn: todayAttendance?.time_in || null,
        todayTimeOut: todayAttendance?.time_out || null,
        monthlyPresent,
        monthlyLate,
        monthlyAbsent,
      };
    },
    enabled: !!employeeId,
  });

  const { data: leaveCredits, isLoading: creditsLoading } = useQuery({
    queryKey: ['employee-leave-credits', employeeId],
    queryFn: async () => {
      if (!employeeId) return null;

      const currentYear = new Date().getFullYear();
      const { data } = await supabase
        .from('leave_credits')
        .select('leave_type, total_credits, used_credits')
        .eq('employee_id', employeeId)
        .eq('year', currentYear);

      const credits: Record<string, { total: number; used: number }> = {};
      data?.forEach(credit => {
        credits[credit.leave_type] = {
          total: Number(credit.total_credits) || 0,
          used: Number(credit.used_credits) || 0,
        };
      });

      return credits;
    },
    enabled: !!employeeId,
  });

  const { data: recentPayslips, isLoading: payslipsLoading } = useQuery({
    queryKey: ['employee-recent-payslips', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];

      const { data } = await supabase
        .from('payroll_records')
        .select('id, net_pay, payroll_periods!inner(period_start, period_end, status)')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false })
        .limit(5);

      return data || [];
    },
    enabled: !!employeeId,
  });

  const { data: upcomingHolidays, isLoading: holidaysLoading } = useQuery({
    queryKey: ['upcoming-holidays'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const futureDate = format(addDays(new Date(), 60), 'yyyy-MM-dd');

      const { data } = await supabase
        .from('holidays')
        .select('id, name, date, type')
        .gte('date', today)
        .lte('date', futureDate)
        .order('date', { ascending: true })
        .limit(5);

      return data || [];
    },
  });

  const { data: announcements, isLoading: announcementsLoading } = useQuery({
    queryKey: ['employee-announcements'],
    queryFn: async () => {
      const { data } = await supabase
        .from('announcements')
        .select('id, title, content, published_at')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(5);

      return data || [];
    },
  });

  return {
    attendanceSummary,
    leaveCredits,
    recentPayslips,
    upcomingHolidays,
    announcements,
    isLoading: attendanceLoading || creditsLoading || payslipsLoading || holidaysLoading || announcementsLoading,
  };
}
