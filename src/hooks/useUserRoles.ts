import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export interface UserWithRole {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: AppRole | null;
  role_id: string | null;
}

export interface BranchManager {
  id: string;
  branch_id: string;
  user_id: string;
  assigned_at: string;
  branch?: {
    name: string;
    code: string;
  };
}

export function useUsersWithRoles() {
  return useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .order('last_name');
      
      if (profilesError) throw profilesError;
      
      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, user_id, role');
      
      if (rolesError) throw rolesError;
      
      // Combine profiles with their roles
      const usersWithRoles: UserWithRole[] = profiles.map(profile => {
        const userRole = roles.find(r => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || null,
          role_id: userRole?.id || null,
        };
      });
      
      return usersWithRoles;
    },
  });
}

export function useBranchManagers() {
  return useQuery({
    queryKey: ['branch-managers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branch_managers')
        .select(`
          *,
          branch:branches(name, code)
        `);
      
      if (error) throw error;
      return data as BranchManager[];
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, role, existingRoleId }: { userId: string; role: AppRole; existingRoleId: string | null }) => {
      if (existingRoleId) {
        // Update existing role
        const { data, error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('id', existingRoleId)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Insert new role
        const { data, error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({ title: 'User role updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating user role', description: error.message, variant: 'destructive' });
    },
  });
}

export function useAssignBranchManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, branchId }: { userId: string; branchId: string }) => {
      // First check if user is already a manager for this branch
      const { data: existing } = await supabase
        .from('branch_managers')
        .select('id')
        .eq('user_id', userId)
        .eq('branch_id', branchId)
        .single();
      
      if (existing) {
        throw new Error('User is already a manager for this branch');
      }
      
      const { data, error } = await supabase
        .from('branch_managers')
        .insert({ user_id: userId, branch_id: branchId })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-managers'] });
      toast({ title: 'Branch manager assigned successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error assigning branch manager', description: error.message, variant: 'destructive' });
    },
  });
}

export function useRemoveBranchManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('branch_managers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-managers'] });
      toast({ title: 'Branch manager removed successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error removing branch manager', description: error.message, variant: 'destructive' });
    },
  });
}
