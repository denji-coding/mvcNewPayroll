import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type LeaveRequest = Tables<'leave_requests'>;
export type LeaveRequestInsert = TablesInsert<'leave_requests'>;
export type LeaveCredit = Tables<'leave_credits'>;

export function useLeaveRequests(status?: 'pending' | 'manager_approved' | 'hr_approved' | 'rejected' | 'cancelled') {
  return useQuery({
    queryKey: ['leave-requests', status],
    queryFn: async () => {
      let query = supabase
        .from('leave_requests')
        .select('*, employees(first_name, last_name, employee_id, branch_id)')
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useMyLeaveRequests() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-leave-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // First get the employee record for the current user
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!employee) return [];

      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', employee.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}

export function useLeaveCredits(employeeId?: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['leave-credits', employeeId || user?.id],
    queryFn: async () => {
      let empId = employeeId;
      
      if (!empId && user?.id) {
        const { data: employee } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        empId = employee?.id;
      }
      
      if (!empId) return [];

      const currentYear = new Date().getFullYear();
      const { data, error } = await supabase
        .from('leave_credits')
        .select('*')
        .eq('employee_id', empId)
        .eq('year', currentYear);
      
      if (error) throw error;
      return data;
    },
    enabled: !!(employeeId || user?.id),
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (request: Omit<LeaveRequestInsert, 'employee_id'>) => {
      // Get employee ID for current user
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user?.id)
        .single();
      
      if (!employee) throw new Error('Employee record not found');

      const { data, error } = await supabase
        .from('leave_requests')
        .insert({ ...request, employee_id: employee.id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-leave-requests'] });
      toast.success('Leave request submitted successfully');
    },
    onError: (error) => {
      toast.error('Failed to submit leave request: ' + error.message);
    },
  });
}

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient();
  const { user, role } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, remarks, action }: { id: string; remarks?: string; action: 'approve' | 'reject' }) => {
      const updates: TablesUpdate<'leave_requests'> = {};
      
      if (role === 'branch_manager') {
        updates.manager_id = user?.id;
        updates.manager_action_at = new Date().toISOString();
        updates.manager_remarks = remarks;
        updates.status = action === 'approve' ? 'manager_approved' : 'rejected';
      } else if (role === 'hr_admin') {
        updates.hr_id = user?.id;
        updates.hr_action_at = new Date().toISOString();
        updates.hr_remarks = remarks;
        updates.status = action === 'approve' ? 'hr_approved' : 'rejected';
      }

      const { data, error } = await supabase
        .from('leave_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success(`Leave request ${variables.action === 'approve' ? 'approved' : 'rejected'}`);
    },
    onError: (error) => {
      toast.error('Failed to process leave request: ' + error.message);
    },
  });
}

// Calculate working days between two dates
export function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}
