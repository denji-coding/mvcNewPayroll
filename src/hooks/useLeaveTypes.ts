import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getSafeErrorMessage } from '@/lib/errorHandler';

export interface LeaveType {
  id: string;
  name: string;
  default_credits: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useLeaveTypes() {
  return useQuery({
    queryKey: ['leave-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_types')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data as LeaveType[];
    },
  });
}

export function useCreateLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leaveType: {
      name: string;
      default_credits: number;
      description?: string;
      applyToAll?: boolean;
    }) => {
      const { applyToAll, ...insertData } = leaveType;
      const { data, error } = await supabase
        .from('leave_types')
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;

      // If applyToAll, create leave_credits for all active employees
      if (applyToAll) {
        const { data: employees } = await supabase
          .from('employees')
          .select('id')
          .eq('employment_status', 'active');

        if (employees && employees.length > 0) {
          const currentYear = new Date().getFullYear();
          // Map the leave type name to the enum value if possible
          const leaveTypeMap: Record<string, string> = {
            'Sick Leave': 'sick',
            'Vacation Leave': 'vacation',
            'Emergency Leave': 'emergency',
            'Maternity/Paternity Leave': 'maternity',
          };
          const enumValue = leaveTypeMap[leaveType.name] || 'sick';

          const credits = employees.map((emp) => ({
            employee_id: emp.id,
            leave_type: enumValue as any,
            year: currentYear,
            total_credits: leaveType.default_credits,
            used_credits: 0,
          }));

          await supabase.from('leave_credits').insert(credits);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
      queryClient.invalidateQueries({ queryKey: ['all-leave-credits'] });
      toast.success('Leave type created successfully');
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error, 'Failed to create leave type'));
    },
  });
}

export function useUpdateLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LeaveType> & { id: string }) => {
      const { data, error } = await supabase
        .from('leave_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
      toast.success('Leave type updated successfully');
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error, 'Failed to update leave type'));
    },
  });
}

export function useDeleteLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leave_types')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
      toast.success('Leave type deleted successfully');
    },
    onError: (error) => {
      toast.error(getSafeErrorMessage(error, 'Failed to delete leave type'));
    },
  });
}
