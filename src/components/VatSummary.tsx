"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { DateRange } from 'react-day-picker';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { subDays, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/contexts/CurrencyContext';

const VatSummary = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfQuarter(new Date()),
    to: endOfQuarter(new Date()),
  });
  const [summary, setSummary] = useState<{ totalVat: number; netSales: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const { currencySymbol } = useCurrency();

  useEffect(() => {
    const fetchVatData = async () => {
      if (!dateRange?.from || !dateRange?.to) return;
      setLoading(true);

      const { data, error } = await supabase
        .from('transactions')
        .select('extracted_details')
        .gte('timestamp', dateRange.from.toISOString())
        .lte('timestamp', dateRange.to.toISOString());

      if (error) {
        console.error(error);
        setSummary(null);
      } else {
        const totals = data.reduce(
          (acc, t) => {
            const details = t.extracted_details;
            if (details) {
                const vatAmount = parseFloat(details.vatAmount) || 0;
                const subtotal = parseFloat(details.subtotal) || 0;
                acc.totalVat += vatAmount;
                acc.netSales += subtotal;
            }
            return acc;
          },
          { totalVat: 0, netSales: 0 }
        );
        setSummary(totals);
      }
      setLoading(false);
    };
    fetchVatData();
  }, [dateRange]);

  const handlePresetChange = (value: string) => {
    const now = new Date();
    switch (value) {
      case 'this_quarter':
        setDateRange({ from: startOfQuarter(now), to: endOfQuarter(now) });
        break;
      case 'last_quarter':
        const lastQuarterStart = startOfQuarter(subDays(now, 90));
        const lastQuarterEnd = endOfQuarter(subDays(now, 90));
        setDateRange({ from: lastQuarterStart, to: lastQuarterEnd });
        break;
      case 'this_year':
        setDateRange({ from: startOfYear(now), to: endOfYear(now) });
        break;
      default:
        break;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
          <div>
            <CardTitle>VAT Summary</CardTitle>
            <CardDescription>Overview of your VAT position for the selected period.</CardDescription>
          </div>
          <Select onValueChange={handlePresetChange} defaultValue="this_quarter">
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select a period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_quarter">This Quarter</SelectItem>
              <SelectItem value="last_quarter">Last Quarter</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : summary ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center pt-4">
            <div>
              <p className="text-sm text-muted-foreground">Total VAT Collected</p>
              <p className="text-2xl font-bold">{currencySymbol}{summary.totalVat.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Sales (Net)</p>
              <p className="text-2xl font-bold">{currencySymbol}{summary.netSales.toFixed(2)}</p>
            </div>
          </div>
        ) : (
          <p className="text-center text-muted-foreground pt-4">No data available for this period.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default VatSummary;