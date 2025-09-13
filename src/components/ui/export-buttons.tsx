import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonsProps {
  data: any[];
  filename: string;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ data, filename }) => {
  const { toast } = useToast();

  const handleExportCSV = () => {
    if (data.length === 0) {
      toast({
        title: "No data to export",
        variant: "destructive",
      });
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" onClick={handleExportCSV}>
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  );
};

export default ExportButtons;