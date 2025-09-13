"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/ui/dashboard-layout";
import FileUpload from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload as UploadIcon, 
  FileText, 
  Image, 
  Mic, 
  Paperclip,
  Play,
  Type
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Upload = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("");
  const { toast } = useToast();

  const handleFilesAccepted = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    toast({
      title: "Files added",
      description: `${newFiles.length} file(s) added successfully`,
    });
  };

  const handleProcess = () => {
    if (files.length === 0 && !text.trim()) {
      toast({
        title: "No data provided",
        description: "Please upload files or enter text to process",
        variant: "destructive",
      });
      return;
    }

    // In a real implementation, this would call an API to process the data
    toast({
      title: "Processing started",
      description: "Your data is being processed. This may take a few moments.",
    });

    // Simulate processing delay
    setTimeout(() => {
      toast({
        title: "Processing complete",
        description: "Data extraction finished successfully!",
      });
    }, 3000);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Data</h1>
          <p className="text-gray-500">Upload documents for AI-powered data extraction</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UploadIcon className="h-5 w-5" />
                Upload Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload onFilesAccepted={handleFilesAccepted} />
              
              {files.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-2">Selected Files</h3>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          {file.type.startsWith('image/') ? (
                            <Image className="h-5 w-5 text-green-500" />
                          ) : file.type === 'application/pdf' ? (
                            <FileText className="h-5 w-5 text-red-500" />
                          ) : file.type.startsWith('audio/') ? (
                            <Mic className="h-5 w-5 text-purple-500" />
                          ) : (
                            <Paperclip className="h-5 w-5 text-blue-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Text Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Text Input
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Paste text content here for extraction..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[200px]"
                />
                <div className="text-xs text-gray-500">
                  Enter text content such as invoice details, receipt information, or customer data
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audio Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Audio Input
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Play className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Record Audio</h3>
              <p className="text-sm text-gray-500 mb-4 text-center">
                Record voice memos with transaction details for automatic extraction
              </p>
              <Button>
                Start Recording
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Process Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleProcess}
            size="lg"
            className="px-8"
          >
            Process Data
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Upload;