"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

interface ExportButtonsProps {
  data: any[];
  filename: string;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ data, filename }) => {
  const downloadCSV = () => {
    if (!data || data.length === 0) {
      return;
    }

    const headers = Object.keys(data[0]).filter(key => typeof data[0][key] !== 'object' || data[0][key] === null);

    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers
          .map(header => {
            let cell = row[header];
            if (cell === null || cell === undefined) {
              return '';
            }
            
            let cellString = String(cell);
            if (/[",\n]/.test(cellString)) {
              cellString = `"${cellString.replace(/"/g, '""')}"`;
            }
            return cellString;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" onClick={downloadCSV}>
      <FileDown className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  );
};

export default ExportButtons;