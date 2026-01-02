import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SalaryComponent {
  id: string;
  name: string;
  type: string;
  description: string | null;
  is_taxable: boolean;
  is_mandatory: boolean;
  created_at: string;
}

export interface EmployeeSalaryAdjustment {
  id: string;
  employee_id: string;
  component_id: string;
  amount: number;
  is_recurring: boolean;
  effective_from: string | null;
  effective_to: string | null;
  created_at: string;
  component?: SalaryComponent;
  employee?: {
    first_name: string;
    last_name: string;
    employee_id: string;
  };
}

export function useSalaryComponents() {
  return useQuery({
    queryKey: ['salary-components'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('salary_components')
        .select('*')
        .order('type', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as SalaryComponent[];
    },
  });
}

export function useCreateSalaryComponent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (component: {
      name: string;
      type: string;
      description?: string;
      is_taxable?: boolean;
      is_mandatory?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('salary_components')
        .insert(component)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-components'] });
      toast({ title: 'Salary component created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating salary component', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateSalaryComponent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SalaryComponent> & { id: string }) => {
      const { data, error } = await supabase
        .from('salary_components')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-components'] });
      toast({ title: 'Salary component updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating salary component', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteSalaryComponent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('salary_components')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-components'] });
      toast({ title: 'Salary component deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting salary component', description: error.message, variant: 'destructive' });
    },
  });
}

// Employee Salary Adjustments
export function useEmployeeSalaryAdjustments(employeeId?: string) {
  return useQuery({
    queryKey: ['employee-salary-adjustments', employeeId],
    queryFn: async () => {
      let query = supabase
        .from('employee_salary_adjustments')
        .select(`
          *,
          component:salary_components(*),
          employee:employees(first_name, last_name, employee_id)
        `)
        .order('created_at', { ascending: false });
      
      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as EmployeeSalaryAdjustment[];
    },
    enabled: employeeId ? !!employeeId : true,
  });
}

export function useCreateEmployeeSalaryAdjustment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (adjustment: {
      employee_id: string;
      component_id: string;
      amount: number;
      is_recurring?: boolean;
      effective_from?: string;
      effective_to?: string;
    }) => {
      const { data, error } = await supabase
        .from('employee_salary_adjustments')
        .insert(adjustment)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-salary-adjustments'] });
      toast({ title: 'Salary adjustment created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating salary adjustment', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateEmployeeSalaryAdjustment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmployeeSalaryAdjustment> & { id: string }) => {
      const { data, error } = await supabase
        .from('employee_salary_adjustments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-salary-adjustments'] });
      toast({ title: 'Salary adjustment updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating salary adjustment', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteEmployeeSalaryAdjustment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('employee_salary_adjustments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-salary-adjustments'] });
      toast({ title: 'Salary adjustment deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting salary adjustment', description: error.message, variant: 'destructive' });
    },
  });
}
