import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getSafeErrorMessage } from '@/lib/errorHandler';

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: string;
  year: number;
  created_at: string;
}

export function useHolidays(year?: number) {
  const currentYear = year || new Date().getFullYear();
  
  return useQuery({
    queryKey: ['holidays', currentYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .eq('year', currentYear)
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data as Holiday[];
    },
  });
}

export function useCreateHoliday() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (holiday: Omit<Holiday, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('holidays')
        .insert(holiday)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast({ title: 'Holiday created successfully' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error creating holiday', 
        description: getSafeErrorMessage(error, 'Failed to create holiday'), 
        variant: 'destructive' 
      });
    },
  });
}

export function useUpdateHoliday() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Holiday> & { id: string }) => {
      const { data, error } = await supabase
        .from('holidays')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast({ title: 'Holiday updated successfully' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error updating holiday', 
        description: getSafeErrorMessage(error, 'Failed to update holiday'), 
        variant: 'destructive' 
      });
    },
  });
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('holidays')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast({ title: 'Holiday deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error deleting holiday', 
        description: getSafeErrorMessage(error, 'Failed to delete holiday'), 
        variant: 'destructive' 
      });
    },
  });
}
