import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getSafeErrorMessage } from '@/lib/errorHandler';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type PayrollPeriod = Tables<'payroll_periods'>;
export type PayrollRecord = Tables<'payroll_records'>;

export function usePayrollPeriods() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('payroll-periods-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payroll_periods',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!periodId) return;

    const channel = supabase
      .channel('payroll-records-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payroll_records',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['payroll-records', periodId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, periodId]);

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
      toast.error(getSafeErrorMessage(error, 'Failed to create payroll period'));
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
      toast.error(getSafeErrorMessage(error, 'Failed to compute payroll'));
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
      
      // Send email notifications to employees
      try {
        const { error: emailError } = await supabase.functions.invoke('send-payslip-emails', {
          body: { payroll_period_id: periodId },
        });
        
        if (emailError) {
          console.error('Failed to send payslip emails:', emailError);
          // Don't throw - approval succeeded, just email failed
        }
      } catch (emailErr) {
        console.error('Error invoking send-payslip-emails:', emailErr);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
      toast.success('Payroll approved and employees notified');
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error, 'Failed to approve payroll'));
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
      toast.error(getSafeErrorMessage(error, 'Failed to delete payroll period'));
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
      toast.error(getSafeErrorMessage(error, 'Failed to delete payroll record'));
    },
  });
}
