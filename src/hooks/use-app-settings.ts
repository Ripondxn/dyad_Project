import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const fetchAppSettings = async () => {
  const { data, error } = await supabase
    .from('app_settings')
    .select('currency_symbol, currency_code')
    .eq('id', 1)
    .single();

  if (error) {
    console.error('Error fetching app settings:', error);
    // Return default values on error
    return { currency_symbol: '$', currency_code: 'USD' };
  }
  
  return data || { currency_symbol: '$', currency_code: 'USD' };
};

export const useAppSettings = () => {
  return useQuery({
    queryKey: ['app-settings'],
    queryFn: fetchAppSettings,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};