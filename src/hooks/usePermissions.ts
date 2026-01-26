import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export interface RolePermission {
  id: string;
  role: AppRole;
  permission_key: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// All available permissions
export const AVAILABLE_PERMISSIONS = [
  { key: 'page_dashboard', label: 'Dashboard', description: 'Access to the dashboard page' },
  { key: 'page_employees', label: 'Employees', description: 'Access to the employees page' },
  { key: 'page_branches', label: 'Branches', description: 'Access to the branches page' },
  { key: 'page_attendance', label: 'Attendance Management', description: 'Access to attendance management page' },
  { key: 'page_leaves', label: 'Leaves', description: 'Access to the leaves page' },
  { key: 'page_payroll', label: 'Payroll', description: 'Access to the payroll page' },
  { key: 'page_my_payslips', label: 'My Payslips', description: 'View and download personal payslips' },
  { key: 'page_reports', label: 'Reports', description: 'Access to the reports page' },
  { key: 'page_settings', label: 'Settings', description: 'Access to the settings page' },
  { key: 'page_clock_inout', label: 'Clock In/Out', description: 'Access to clock in/out functionality' },
  { key: 'page_my_attendance', label: 'My Attendance', description: 'View personal attendance records' },
  { key: 'page_dtr', label: 'Daily Time Record', description: 'Access to DTR records page' },
  { key: 'page_positions', label: 'Positions', description: 'Access to positions management' },
  { key: 'page_time_schedule', label: 'Time Schedule', description: 'Access to time schedule management' },
] as const;

export type PermissionKey = typeof AVAILABLE_PERMISSIONS[number]['key'];

// Fetch all permissions
export function useRolePermissions() {
  return useQuery({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .order('role', { ascending: true });

      if (error) throw error;
      return data as RolePermission[];
    },
  });
}

// Fetch permissions for a specific role
export function useRolePermissionsByRole(role: AppRole | null) {
  return useQuery({
    queryKey: ['role-permissions', role],
    queryFn: async () => {
      if (!role) return [];
      
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .eq('role', role);

      if (error) throw error;
      return data as RolePermission[];
    },
    enabled: !!role,
  });
}

// Check if current user has a specific permission
export function useHasPermission(permissionKey: PermissionKey) {
  const { role } = useAuth();
  const { data: permissions } = useRolePermissionsByRole(role);
  
  if (!role || !permissions) return true; // Default to true while loading
  
  const permission = permissions.find(p => p.permission_key === permissionKey);
  return permission?.enabled ?? false;
}

// Update a permission
export function useUpdatePermission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ role, permissionKey, enabled }: { role: AppRole; permissionKey: string; enabled: boolean }) => {
      // Try to update first
      const { data: existing } = await supabase
        .from('role_permissions')
        .select('id')
        .eq('role', role)
        .eq('permission_key', permissionKey)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('role_permissions')
          .update({ enabled })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('role_permissions')
          .insert({ role, permission_key: permissionKey, enabled });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast.success('Permission updated');
    },
    onError: () => {
      toast.error('Failed to update permission');
    },
  });
}

// Bulk update permissions for a role
export function useBulkUpdatePermissions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ role, permissions }: { role: AppRole; permissions: { key: string; enabled: boolean }[] }) => {
      for (const perm of permissions) {
        const { data: existing } = await supabase
          .from('role_permissions')
          .select('id')
          .eq('role', role)
          .eq('permission_key', perm.key)
          .single();

        if (existing) {
          await supabase
            .from('role_permissions')
            .update({ enabled: perm.enabled })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('role_permissions')
            .insert({ role, permission_key: perm.key, enabled: perm.enabled });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast.success('Permissions updated');
    },
    onError: () => {
      toast.error('Failed to update permissions');
    },
  });
}
