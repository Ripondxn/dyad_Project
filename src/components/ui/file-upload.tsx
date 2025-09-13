"use client";

import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Image, FileAudio, File } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FileUploadProps {
  onFilesAccepted: (files: File[]) => void;
}

const FileUpload = ({ onFilesAccepted }: FileUploadProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesAccepted(acceptedFiles);
  }, [onFilesAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'audio/*': ['.mp3', '.wav', '.ogg'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 10
  });

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-4">
            <Upload className="h-12 w-12 text-gray-400" />
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or click to select files
              </p>
            </div>
            <p className="text-xs text-gray-500">
              Supports: Images, PDFs, Audio, Text, Excel files
            </p>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
            <FileText className="h-6 w-6 text-blue-500 mb-1" />
            <span className="text-xs text-gray-600">PDF</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
            <Image className="h-6 w-6 text-green-500 mb-1" />
            <span className="text-xs text-gray-600">Images</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
            <FileAudio className="h-6 w-6 text-purple-500 mb-1" />
            <span className="text-xs text-gray-600">Audio</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
            <File className="h-6 w-6 text-yellow-500 mb-1" />
            <span className="text-xs text-gray-600">Text</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUpload;