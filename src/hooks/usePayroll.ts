import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type PayrollPeriod = Tables<'payroll_periods'>;
export type PayrollRecord = Tables<'payroll_records'>;

export function usePayrollPeriods() {
  return useQuery({
    queryKey: ['payroll-periods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_periods')
        .select('*')
        .order('period_start', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function usePayrollRecords(periodId?: string) {
  return useQuery({
    queryKey: ['payroll-records', periodId],
    queryFn: async () => {
      if (!periodId) return [];
      
      const { data, error } = await supabase
        .from('payroll_records')
        .select('*, employees(employee_id, first_name, last_name)')
        .eq('payroll_period_id', periodId)
        .order('employees(last_name)', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!periodId,
  });
}

export function useCreatePayrollPeriod() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (period: TablesInsert<'payroll_periods'>) => {
      const { data, error } = await supabase
        .from('payroll_periods')
        .insert(period)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
      toast.success('Payroll period created');
    },
    onError: (error) => {
      toast.error('Failed to create payroll period: ' + error.message);
    },
  });
}

export function useRunPayroll() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ periodId, employeeIds }: { periodId: string; employeeIds?: string[] }) => {
      const { data, error } = await supabase.functions.invoke('compute-payroll', {
        body: { payroll_period_id: periodId, employee_ids: employeeIds },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-records'] });
      toast.success('Payroll computed successfully');
    },
    onError: (error) => {
      toast.error('Failed to compute payroll: ' + error.message);
    },
  });
}

export function useApprovePayroll() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (periodId: string) => {
      const { data, error } = await supabase
        .from('payroll_periods')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', periodId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
      toast.success('Payroll approved');
    },
    onError: (error) => {
      toast.error('Failed to approve payroll: ' + error.message);
    },
  });
}

export function useSalaryComponents() {
  return useQuery({
    queryKey: ['salary-components'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('salary_components')
        .select('*')
        .order('type', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useEmployeeLoans(employeeId?: string) {
  return useQuery({
    queryKey: ['employee-loans', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('employee_id', employeeId)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!employeeId,
  });
}

export function useDeletePayrollPeriod() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (periodId: string) => {
      // First delete related records
      const { error: recordsError } = await supabase
        .from('payroll_records')
        .delete()
        .eq('payroll_period_id', periodId);
      
      if (recordsError) throw recordsError;
      
      // Then delete the period
      const { error } = await supabase
        .from('payroll_periods')
        .delete()
        .eq('id', periodId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-records'] });
      toast.success('Payroll period deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete payroll period: ' + error.message);
    },
  });
}

export function useDeletePayrollRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (recordId: string) => {
      const { error } = await supabase
        .from('payroll_records')
        .delete()
        .eq('id', recordId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-records'] });
      toast.success('Payroll record deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete payroll record: ' + error.message);
    },
  });
}
