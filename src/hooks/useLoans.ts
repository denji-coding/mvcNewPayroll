import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Loan {
  id: string;
  employee_id: string;
  loan_type: string;
  principal_amount: number;
  monthly_amortization: number;
  remaining_balance: number;
  total_paid: number;
  start_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  employee?: {
    first_name: string;
    last_name: string;
    employee_id: string;
  };
}

export function useLoans() {
  return useQuery({
    queryKey: ['loans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          employee:employees(first_name, last_name, employee_id)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Loan[];
    },
  });
}

export function useEmployeeLoans(employeeId?: string) {
  return useQuery({
    queryKey: ['loans', 'employee', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('employee_id', employeeId!)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Loan[];
    },
    enabled: !!employeeId,
  });
}

export function useActiveLoans() {
  return useQuery({
    queryKey: ['loans', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          employee:employees(first_name, last_name, employee_id)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Loan[];
    },
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (loan: {
      employee_id: string;
      loan_type: string;
      principal_amount: number;
      monthly_amortization: number;
      start_date: string;
    }) => {
      const { data, error } = await supabase
        .from('loans')
        .insert({
          ...loan,
          remaining_balance: loan.principal_amount,
          total_paid: 0,
          status: 'active',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({ title: 'Loan created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating loan', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateLoan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Loan> & { id: string }) => {
      const { data, error } = await supabase
        .from('loans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({ title: 'Loan updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating loan', description: error.message, variant: 'destructive' });
    },
  });
}

export function useRecordLoanPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      // First get current loan data
      const { data: loan, error: fetchError } = await supabase
        .from('loans')
        .select('remaining_balance, total_paid')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const newRemainingBalance = (loan.remaining_balance || 0) - amount;
      const newTotalPaid = (loan.total_paid || 0) + amount;
      const newStatus = newRemainingBalance <= 0 ? 'paid' : 'active';
      
      const { data, error } = await supabase
        .from('loans')
        .update({
          remaining_balance: Math.max(0, newRemainingBalance),
          total_paid: newTotalPaid,
          status: newStatus,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({ title: 'Payment recorded successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error recording payment', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteLoan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('loans')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({ title: 'Loan deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting loan', description: error.message, variant: 'destructive' });
    },
  });
}
