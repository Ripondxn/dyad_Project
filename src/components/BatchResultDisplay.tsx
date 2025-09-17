"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

export interface ProcessedItem {
  source: string;
  status: 'success' | 'error';
  error?: string;
  formattedResult?: string;
  parsedData?: any;
  attachmentFile?: File | null;
}

interface BatchResultDisplayProps {
  results: ProcessedItem[];
  onSave: () => void;
  onClear: () => void;
  isSaving: boolean;
}

const BatchResultDisplay: React.FC<BatchResultDisplayProps> = ({ results, onSave, onClear, isSaving }) => {
  const successfulCount = results.filter(r => r.status === 'success').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Processing Results</CardTitle>
        <CardDescription>
          Review the extracted data below. {successfulCount > 0 ? `Click "Save" to add all ${successfulCount} valid transactions.` : 'No transactions were successfully processed.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full pr-4">
          <div className="space-y-4">
            {results.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg bg-white">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium truncate">{item.source}</h3>
                  {item.status === 'success' ? (
                    <span className="flex items-center text-sm text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" /> Success
                    </span>
                  ) : (
                    <span className="flex items-center text-sm text-red-600">
                      <AlertCircle className="h-4 w-4 mr-1" /> Failed
                    </span>
                  )}
                </div>
                {item.status === 'success' ? (
                  <pre className="text-xs font-mono bg-gray-50 p-2 rounded-md whitespace-pre-wrap">
                    {item.formattedResult}
                  </pre>
                ) : (
                  <p className="text-xs text-red-700 bg-red-50 p-2 rounded-md">{item.error}</p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClear} disabled={isSaving}>
          <X className="h-4 w-4 mr-2" />
          Process More
        </Button>
        <Button onClick={onSave} disabled={isSaving || successfulCount === 0}>
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isSaving ? 'Saving...' : `Save ${successfulCount} Transactions`}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BatchResultDisplay;