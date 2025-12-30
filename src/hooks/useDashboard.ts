import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Get employee count
      const { count: employeeCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('employment_status', 'active');

      // Get branch count
      const { count: branchCount } = await supabase
        .from('branches')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get today's attendance
      const { data: todayAttendance } = await supabase
        .from('attendance')
        .select('status')
        .eq('date', today);

      const presentToday = todayAttendance?.filter(a => a.status === 'present' || a.status === 'late').length || 0;

      // Get pending leaves
      const { count: pendingLeaves } = await supabase
        .from('leave_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Get current month payroll total
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const { data: payrollRecords } = await supabase
        .from('payroll_records')
        .select('net_pay, payroll_periods!inner(period_start)')
        .gte('payroll_periods.period_start', startOfMonth.toISOString().split('T')[0]);

      const payrollTotal = payrollRecords?.reduce((sum, r) => sum + (Number(r.net_pay) || 0), 0) || 0;

      return {
        employeeCount: employeeCount || 0,
        branchCount: branchCount || 0,
        presentToday,
        pendingLeaves: pendingLeaves || 0,
        payrollTotal,
        attendanceRate: employeeCount ? Math.round((presentToday / employeeCount) * 100) : 0,
      };
    },
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const { data: leaveRequests } = await supabase
        .from('leave_requests')
        .select('*, employees(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: announcements } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(5);

      return {
        leaveRequests: leaveRequests || [],
        announcements: announcements || [],
      };
    },
  });
}
