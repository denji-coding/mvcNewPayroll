import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TerminalSettings {
  work_start_time: string;
  work_end_time: string;
  grace_period_minutes: number;
  allow_manual_entry: boolean;
}

export function useTerminalSettings() {
  return useQuery({
    queryKey: ['settings', 'terminal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'terminal')
        .single();
      
      if (error) throw error;
      return data.value as unknown as TerminalSettings;
    },
  });
}

export function useUpdateTerminalSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: TerminalSettings) => {
      const { error } = await supabase
        .from('settings')
        .update({ value: JSON.parse(JSON.stringify(settings)) })
        .eq('key', 'terminal');
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'terminal'] });
      toast.success('Terminal settings updated');
    },
    onError: () => {
      toast.error('Failed to update settings');
    },
  });
}