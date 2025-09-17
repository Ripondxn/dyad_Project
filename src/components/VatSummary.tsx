"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { DateRange } from 'react-day-picker';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { 
  startOfQuarter, 
  endOfQuarter, 
  startOfYear, 
  endOfYear, 
  addQuarters, 
  subQuarters, 
  addYears, 
  subYears 
} from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppSettings } from '@/hooks/use-app-settings';

const VatSummary = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfQuarter(new Date()),
    to: endOfQuarter(new Date()),
  });
  const [summary, setSummary] = useState<{ totalVat: number; netSales: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const { data: appSettings } = useAppSettings();

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
        const lastQuarter = subQuarters(now, 1);
        setDateRange({ from: startOfQuarter(lastQuarter), to: endOfQuarter(lastQuarter) });
        break;
      case 'next_quarter':
        const nextQuarter = addQuarters(now, 1);
        setDateRange({ from: startOfQuarter(nextQuarter), to: endOfQuarter(nextQuarter) });
        break;
      case 'this_year':
        setDateRange({ from: startOfYear(now), to: endOfYear(now) });
        break;
      case 'last_year':
        const lastYear = subYears(now, 1);
        setDateRange({ from: startOfYear(lastYear), to: endOfYear(lastYear) });
        break;
      case 'next_year':
        const nextYear = addYears(now, 1);
        setDateRange({ from: startOfYear(nextYear), to: endOfYear(nextYear) });
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
              <SelectItem value="next_quarter">Next Quarter</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
              <SelectItem value="next_year">Next Year</SelectItem>
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
              <p className="text-2xl font-bold">{appSettings?.currency_symbol ?? '$'}{summary.totalVat.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Sales (Net)</p>
              <p className="text-2xl font-bold">{appSettings?.currency_symbol ?? '$'}{summary.netSales.toFixed(2)}</p>
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