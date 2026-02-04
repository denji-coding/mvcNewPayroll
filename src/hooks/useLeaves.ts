import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { getSafeErrorMessage } from '@/lib/errorHandler';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type LeaveRequest = Tables<'leave_requests'>;
export type LeaveRequestInsert = TablesInsert<'leave_requests'>;
export type LeaveCredit = Tables<'leave_credits'>;

export function useLeaveRequests(status?: 'pending' | 'manager_approved' | 'hr_approved' | 'rejected' | 'cancelled') {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('leave-requests-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leave_requests',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
          queryClient.invalidateQueries({ queryKey: ['my-leave-requests'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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

export function useAllLeaveCredits() {
  const currentYear = new Date().getFullYear();
  
  return useQuery({
    queryKey: ['all-leave-credits', currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_credits')
        .select('*, employees(id, first_name, last_name, employee_id)')
        .eq('year', currentYear)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateLeaveCredit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (credit: {
      employee_id: string;
      leave_type: 'sick' | 'vacation' | 'emergency';
      total_credits: number;
    }) => {
      const currentYear = new Date().getFullYear();
      
      // Check if credit already exists for this employee/type/year
      const { data: existing } = await supabase
        .from('leave_credits')
        .select('id')
        .eq('employee_id', credit.employee_id)
        .eq('leave_type', credit.leave_type)
        .eq('year', currentYear)
        .single();
      
      if (existing) {
        throw new Error('Leave credit already exists for this employee and leave type');
      }
      
      const { data, error } = await supabase
        .from('leave_credits')
        .insert({
          employee_id: credit.employee_id,
          leave_type: credit.leave_type,
          year: currentYear,
          total_credits: credit.total_credits,
          used_credits: 0,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-credits'] });
      queryClient.invalidateQueries({ queryKey: ['all-leave-credits'] });
      toast.success('Leave credit added successfully');
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error, 'Failed to add leave credit'));
    },
  });
}

export function useUpdateLeaveCredit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, total_credits, used_credits }: { 
      id: string; 
      total_credits?: number;
      used_credits?: number;
    }) => {
      const updates: TablesUpdate<'leave_credits'> = {};
      if (total_credits !== undefined) updates.total_credits = total_credits;
      if (used_credits !== undefined) updates.used_credits = used_credits;
      
      const { data, error } = await supabase
        .from('leave_credits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-credits'] });
      queryClient.invalidateQueries({ queryKey: ['all-leave-credits'] });
      toast.success('Leave credit updated successfully');
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error, 'Failed to update leave credit'));
    },
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (request: Omit<LeaveRequestInsert, 'employee_id'>) => {
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
      toast.error(getSafeErrorMessage(error, 'Failed to submit leave request'));
    },
  });
}

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient();
  const { user, role } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, remarks, action }: { id: string; remarks?: string; action: 'approve' | 'reject' }) => {
      // First get the leave request details
      const { data: leaveRequest, error: fetchError } = await supabase
        .from('leave_requests')
        .select('employee_id, leave_type, total_days')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
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
        
        // Deduct leave credits when HR approves
        if (action === 'approve' && leaveRequest) {
          const currentYear = new Date().getFullYear();
          
          // Find the leave credit record
          const { data: creditRecord } = await supabase
            .from('leave_credits')
            .select('id, used_credits')
            .eq('employee_id', leaveRequest.employee_id)
            .eq('leave_type', leaveRequest.leave_type)
            .eq('year', currentYear)
            .single();
          
          if (creditRecord) {
            // Deduct the days from leave credits
            await supabase
              .from('leave_credits')
              .update({ 
                used_credits: (creditRecord.used_credits || 0) + leaveRequest.total_days 
              })
              .eq('id', creditRecord.id);
          }
        }
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
      queryClient.invalidateQueries({ queryKey: ['leave-credits'] });
      queryClient.invalidateQueries({ queryKey: ['all-leave-credits'] });
      toast.success(`Leave request ${variables.action === 'approve' ? 'approved' : 'rejected'}`);
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error, 'Failed to process leave request'));
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
