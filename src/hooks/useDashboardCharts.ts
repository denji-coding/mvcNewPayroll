import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

export function useAttendanceTrend() {
  return useQuery({
    queryKey: ['attendance-trend'],
    queryFn: async () => {
      const days = 7;
      const result = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        const dayLabel = format(subDays(new Date(), i), 'EEE');

        const { data } = await supabase
          .from('attendance')
          .select('status')
          .eq('date', date);

        const present = data?.filter(a => a.status === 'present' || a.status === 'late').length || 0;
        const absent = data?.filter(a => a.status === 'absent').length || 0;

        result.push({
          day: dayLabel,
          present,
          absent,
        });
      }

      return result;
    },
  });
}

export function useLeavesByStatus() {
  return useQuery({
    queryKey: ['leaves-by-status'],
    queryFn: async () => {
      const { data } = await supabase
        .from('leave_requests')
        .select('status');

      const counts: Record<string, number> = {
        pending: 0,
        manager_approved: 0,
        hr_approved: 0,
        rejected: 0,
      };

      data?.forEach(leave => {
        if (leave.status && counts[leave.status] !== undefined) {
          counts[leave.status]++;
        }
      });

      return [
        { name: 'Pending', value: counts.pending, fill: 'hsl(var(--chart-1))' },
        { name: 'Manager Approved', value: counts.manager_approved, fill: 'hsl(var(--chart-2))' },
        { name: 'HR Approved', value: counts.hr_approved, fill: 'hsl(var(--chart-3))' },
        { name: 'Rejected', value: counts.rejected, fill: 'hsl(var(--chart-4))' },
      ].filter(item => item.value > 0);
    },
  });
}

export function useEmployeesByBranch() {
  return useQuery({
    queryKey: ['employees-by-branch'],
    queryFn: async () => {
      const { data: branches } = await supabase
        .from('branches')
        .select('id, name')
        .eq('is_active', true);

      const result = [];

      for (const branch of branches || []) {
        const { count } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true })
          .eq('branch_id', branch.id)
          .eq('employment_status', 'active');

        result.push({
          name: branch.name.length > 15 ? branch.name.substring(0, 15) + '...' : branch.name,
          employees: count || 0,
        });
      }

      // Also count employees without branch
      const { count: noBranchCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .is('branch_id', null)
        .eq('employment_status', 'active');

      if (noBranchCount && noBranchCount > 0) {
        result.push({
          name: 'Unassigned',
          employees: noBranchCount,
        });
      }

      return result;
    },
  });
}

export function usePayrollSummary() {
  return useQuery({
    queryKey: ['payroll-summary'],
    queryFn: async () => {
      // Get last 4 payroll periods
      const { data: periods } = await supabase
        .from('payroll_periods')
        .select('id, period_start, period_end, status')
        .order('period_start', { ascending: false })
        .limit(4);

      const result = [];

      for (const period of (periods || []).reverse()) {
        const { data: records } = await supabase
          .from('payroll_records')
          .select('net_pay')
          .eq('payroll_period_id', period.id);

        const total = records?.reduce((sum, r) => sum + (Number(r.net_pay) || 0), 0) || 0;

        result.push({
          period: format(new Date(period.period_start), 'MMM d'),
          total: total / 1000, // In thousands
        });
      }

      return result;
    },
  });
}
