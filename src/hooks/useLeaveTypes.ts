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

const VALID_LEAVE_TYPE_ENUMS = ['sick', 'vacation', 'emergency', 'maternity', 'paternity', 'bereavement', 'unpaid'] as const;

/** Map leave type display name to DB enum (leave_credits.leave_type). Must match DB enum values. */
export const LEAVE_TYPE_NAME_TO_ENUM: Record<string, string> = {
  'Sick Leave': 'sick',
  'Vacation Leave': 'vacation',
  'Emergency Leave': 'emergency',
  'Maternity/Paternity Leave': 'maternity',
  'Paternity Leave': 'paternity',
  'Bereavement Leave': 'bereavement',
  'Unpaid Leave': 'unpaid',
};

/** Returns the DB leave_type enum value for a leave type name. Falls back to 'unpaid' for unknown names. */
export function getLeaveTypeEnum(name: string): (typeof VALID_LEAVE_TYPE_ENUMS)[number] {
  const exact = LEAVE_TYPE_NAME_TO_ENUM[name];
  if (exact && VALID_LEAVE_TYPE_ENUMS.includes(exact as any)) return exact as (typeof VALID_LEAVE_TYPE_ENUMS)[number];
  const slug = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '');
  const found = VALID_LEAVE_TYPE_ENUMS.find((e) => e === slug);
  return found ?? 'unpaid';
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

      // If applyToAll, create leave_credits for all employees who don't already have this type for the current year
      if (applyToAll !== false) {
        const currentYear = new Date().getFullYear();
        const enumValue = getLeaveTypeEnum(leaveType.name);

        const { data: employees } = await supabase.from('employees').select('id');
        if (employees && employees.length > 0) {
          const { data: existingCredits } = await supabase
            .from('leave_credits')
            .select('employee_id')
            .eq('leave_type', enumValue)
            .eq('year', currentYear);
          const existingEmployeeIds = new Set((existingCredits ?? []).map((c) => c.employee_id));

          const employeesToAdd = employees.filter((emp) => !existingEmployeeIds.has(emp.id));
          if (employeesToAdd.length > 0) {
            const credits = employeesToAdd.map((emp) => ({
              employee_id: emp.id,
              leave_type: enumValue,
              year: currentYear,
              total_credits: leaveType.default_credits,
              used_credits: 0,
            }));
            const { error: creditsError } = await supabase.from('leave_credits').insert(credits);
            if (creditsError) throw creditsError;
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-types'] });
      queryClient.invalidateQueries({ queryKey: ['all-leave-credits'] });
      queryClient.invalidateQueries({ queryKey: ['leave-credits'] });
      queryClient.invalidateQueries({ queryKey: ['my-leave-requests'] });
      toast.success('Leave type created and applied to all employees');
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
