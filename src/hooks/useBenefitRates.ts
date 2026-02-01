import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BenefitRates {
  philhealth_rate: number;
  pagibig_employee_rate: number;
  pagibig_ceiling: number;
}

const DEFAULT_RATES: BenefitRates = {
  philhealth_rate: 5.0,
  pagibig_employee_rate: 2.0,
  pagibig_ceiling: 5000,
};

export function useBenefitRates() {
  return useQuery({
    queryKey: ['settings', 'benefit_rates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'benefit_rates')
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned, use defaults
          return DEFAULT_RATES;
        }
        throw error;
      }
      return (data.value as unknown as BenefitRates) || DEFAULT_RATES;
    },
  });
}

export function useUpdateBenefitRates() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (rates: BenefitRates) => {
      // Try update first
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('key', 'benefit_rates')
        .single();

      if (existing) {
        const { error } = await supabase
          .from('settings')
          .update({ value: JSON.parse(JSON.stringify(rates)) })
          .eq('key', 'benefit_rates');
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('settings')
          .insert({ key: 'benefit_rates', value: JSON.parse(JSON.stringify(rates)) });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'benefit_rates'] });
      toast.success('Benefit rates updated');
    },
    onError: () => {
      toast.error('Failed to update benefit rates');
    },
  });
}
