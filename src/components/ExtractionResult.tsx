import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Save, X } from 'lucide-react';

interface ExtractionResultProps {
  result: string;
  onSave: () => void;
  onClear: () => void;
}

const ExtractionResult: React.FC<ExtractionResultProps> = ({ result, onSave, onClear }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Extracted Data</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          readOnly
          value={result}
          className="min-h-[250px] font-mono text-sm bg-gray-50"
        />
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClear}>
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
        <Button onClick={onSave}>
          <Save className="h-4 w-4 mr-2" />
          Save as Transaction
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ExtractionResult;