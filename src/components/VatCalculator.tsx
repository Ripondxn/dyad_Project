"use client";

import React, { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface VatDetails {
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  vatStatus: 'exclusive' | 'inclusive' | 'exempt';
}

interface VatCalculatorProps {
  value: VatDetails;
  onChange: (details: VatDetails) => void;
}

const VatCalculator: React.FC<VatCalculatorProps> = ({ value, onChange }) => {
  
  useEffect(() => {
    let { subtotal, vatRate, totalAmount, vatStatus } = value;
    let newSubtotal = subtotal;
    let newVatAmount = 0;
    let newTotalAmount = totalAmount;
    let newVatRate = vatRate;

    if (vatStatus === 'exclusive') {
      newVatAmount = subtotal * (vatRate / 100);
      newTotalAmount = subtotal + newVatAmount;
    } else if (vatStatus === 'inclusive') {
      newSubtotal = totalAmount / (1 + vatRate / 100);
      newVatAmount = totalAmount - newSubtotal;
    } else if (vatStatus === 'exempt') {
      newSubtotal = totalAmount;
      newVatAmount = 0;
      newVatRate = 0;
    }

    if (
      newSubtotal.toFixed(4) !== value.subtotal.toFixed(4) ||
      newVatAmount.toFixed(4) !== value.vatAmount.toFixed(4) ||
      newTotalAmount.toFixed(4) !== value.totalAmount.toFixed(4) ||
      newVatRate !== value.vatRate
    ) {
      onChange({
        ...value,
        subtotal: newSubtotal,
        vatAmount: newVatAmount,
        totalAmount: newTotalAmount,
        vatRate: newVatRate,
      });
    }
  }, [value, onChange]);

  const handleInputChange = (field: keyof VatDetails, val: string) => {
    const numValue = parseFloat(val) || 0;
    onChange({ ...value, [field]: numValue });
  };

  const handleStatusChange = (status: VatDetails['vatStatus']) => {
    onChange({
      subtotal: value.totalAmount || value.subtotal,
      vatRate: status === 'exempt' ? 0 : value.vatRate,
      vatAmount: 0,
      totalAmount: value.totalAmount || value.subtotal,
      vatStatus: status,
    });
  };

  return (
    <div className="space-y-4 p-4 border rounded-md bg-gray-50">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">VAT Status</Label>
        <div className="col-span-3">
          <Select value={value.vatStatus} onValueChange={handleStatusChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="exclusive">Exclusive</SelectItem>
              <SelectItem value="inclusive">Inclusive</SelectItem>
              <SelectItem value="exempt">Exempt</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {value.vatStatus === 'inclusive' ? (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="totalAmount" className="text-right">Total Amount</Label>
          <Input id="totalAmount" type="number" value={value.totalAmount} onChange={e => handleInputChange('totalAmount', e.target.value)} className="col-span-3" />
        </div>
      ) : (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="subtotal" className="text-right">
            {value.vatStatus === 'exempt' ? 'Total Amount' : 'Subtotal'}
          </Label>
          <Input id="subtotal" type="number" value={value.vatStatus === 'exempt' ? value.totalAmount : value.subtotal} onChange={e => handleInputChange(value.vatStatus === 'exempt' ? 'totalAmount' : 'subtotal', e.target.value)} className="col-span-3" />
        </div>
      )}

      {value.vatStatus !== 'exempt' && (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="vatRate" className="text-right">VAT Rate (%)</Label>
          <Input id="vatRate" type="number" value={value.vatRate} onChange={e => handleInputChange('vatRate', e.target.value)} className="col-span-3" />
        </div>
      )}

      <div className="grid grid-cols-4 items-center gap-4 mt-6 pt-4 border-t">
        <Label className="text-right font-semibold">Subtotal</Label>
        <p className="col-span-3 font-mono text-sm p-2 bg-white rounded-md">${value.subtotal.toFixed(2)}</p>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right font-semibold">VAT Amount</Label>
        <p className="col-span-3 font-mono text-sm p-2 bg-white rounded-md">${value.vatAmount.toFixed(2)}</p>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right font-semibold">Total Amount</Label>
        <p className="col-span-3 font-mono text-sm p-2 bg-white rounded-md">${value.totalAmount.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default VatCalculator;