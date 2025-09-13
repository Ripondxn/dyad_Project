"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface ExportButtonsProps {
  data: any[];
  filename: string;
}

const ExportButtons = ({ data, filename }: ExportButtonsProps) => {
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    
    // Buffer to store the generated Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    
    // Convert the Excel buffer to a Blob
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    
    saveAs(blob, `${filename}.xlsx`);
  };

  const exportToPDF = () => {
    // In a real implementation, this would generate a PDF
    // For now, we'll just show an alert
    alert("PDF export functionality would be implemented here");
  };

  return (
    <div className="flex gap-2">
      <Button 
        onClick={exportToExcel} 
        variant="outline" 
        className="flex items-center gap-2"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Export to Excel
      </Button>
      <Button 
        onClick={exportToPDF} 
        variant="outline" 
        className="flex items-center gap-2"
      >
        <FileText className="h-4 w-4" />
        Export to PDF
      </Button>
    </div>
  );
};

export default ExportButtons;