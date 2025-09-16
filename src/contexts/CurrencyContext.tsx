import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CurrencyContextType {
  currencySymbol: string;
  setCurrencySymbol: (symbol: string) => void;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrencySettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('currency_symbol')
        .eq('id', 1)
        .single();

      if (error) {
        console.error('Error fetching currency settings:', error);
      } else if (data) {
        setCurrencySymbol(data.currency_symbol);
      }
      setLoading(false);
    };

    fetchCurrencySettings();
  }, []);

  return (
    <CurrencyContext.Provider value={{ currencySymbol, setCurrencySymbol, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};