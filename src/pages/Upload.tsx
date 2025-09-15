"use client";

import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  StopCircle,
  Type,
  Loader2
} from "lucide-react";
import ExtractionResult from "@/components/ExtractionResult";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";

const Upload = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractionResult, setExtractionResult] = useState<string | null>(null);
  const [parsedTransactionData, setParsedTransactionData] = useState<any | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const navigate = useNavigate();

  const handleFilesAccepted = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    showSuccess(`${newFiles.length} file(s) added successfully`);
  };

  const handleProcess = async () => {
    if (files.length === 0 && !text.trim()) {
      showError("Please upload files or enter text to process");
      return;
    }

    setIsProcessing(true);
    const loadingToast = showLoading("Your data is being processed by our AI...");

    try {
      let functionArgs: { text?: string; filePath?: string; signedUrl?: string } = {};

      if (text.trim()) {
        functionArgs.text = text;
      } else if (files.length > 0) {
        const file = files[0];
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("You must be logged in to upload files.");
        
        const filePath = `${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('transaction_uploads')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`Failed to upload file: ${uploadError.message}`);
        }
        
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('transaction_uploads')
          .createSignedUrl(filePath, 60);

        if (signedUrlError) {
            throw new Error(`Failed to create secure link for processing: ${signedUrlError.message}`);
        }
        
        functionArgs.filePath = filePath;
        functionArgs.signedUrl = signedUrlData.signedUrl;
      }

      const { data, error } = await supabase.functions.invoke('process-transaction', {
        body: functionArgs,
      });

      if (error) {
        // Check if the error context is a response object that can be parsed
        if (error.context && typeof error.context.json === 'function') {
          const errorBody = await error.context.json();
          // Throw a new error with the specific message from the function
          throw new Error(errorBody.error || error.message);
        }
        // Fallback for other types of errors
        throw error;
      }
      
      const { extractedData } = data;
      
      if (!extractedData.document) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        extractedData.document = `AUTO-${year}${month}${day}-${hours}${minutes}${seconds}`;
      }
      
      const formattedResult = `
Transaction Details:
--------------------
Document #: ${extractedData.document || 'N/A'}
Type: ${extractedData.type || 'N/A'}
Merchant: ${extractedData.customer || 'N/A'}
Date: ${extractedData.date || 'N/A'}
Total Amount: ${extractedData.amount ? `$${extractedData.amount}` : 'N/A'}
      `.trim();

      setExtractionResult(formattedResult);
      setParsedTransactionData(extractedData);
      showSuccess("Data extraction finished successfully!");

    } catch (error: any) {
      console.error("Processing error:", error);
      // The error message is now the detailed one from the function
      showError(error.message || "An unknown error occurred during processing.");
    } finally {
      setIsProcessing(false);
      dismissToast(loadingToast);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveTransaction = () => {
    if (!parsedTransactionData) return;

    const newTransactionData = {
      ...parsedTransactionData,
      content: extractionResult,
    };
    
    navigate("/transactions", { state: { newTransaction: newTransactionData } });
  };

  const handleClearResult = () => {
    setExtractionResult(null);
    setParsedTransactionData(null);
    setFiles([]);
    setText("");
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        handleFilesAccepted([audioFile]);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      showSuccess("Recording started. Click stop when you're done.");
    } catch (err) {
      showError("Microphone access was denied. Please enable it in your browser settings.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      showSuccess("Recording stopped. Your audio file has been added.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {extractionResult ? "Extraction Result" : "Upload Data"}
          </h1>
          <p className="text-gray-500">
            {extractionResult
              ? "Review the extracted data and save it as a transaction."
              : "Upload documents, images, audio, or text for AI-powered data extraction."}
          </p>
        </div>

        {extractionResult ? (
          <ExtractionResult
            result={extractionResult}
            onSave={handleSaveTransaction}
            onClear={handleClearResult}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* File Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UploadIcon className="h-5 w-5" />
                    Upload Files (PDF, Image, Audio)
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
                            <div className="flex items-center gap-2 overflow-hidden">
                              {file.type.startsWith('image/') ? (
                                <Image className="h-5 w-5 text-green-500 flex-shrink-0" />
                              ) : file.type === 'application/pdf' ? (
                                <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />
                              ) : file.type.startsWith('audio/') ? (
                                <Mic className="h-5 w-5 text-purple-500 flex-shrink-0" />
                              ) : (
                                <Paperclip className="h-5 w-5 text-blue-500 flex-shrink-0" />
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900 truncate">
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
                  <Mic className={`h-12 w-12 mb-4 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {isRecording ? "Recording..." : "Record Audio"}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 text-center">
                    Record voice memos with transaction details for automatic extraction.
                  </p>
                  {!isRecording ? (
                    <Button onClick={handleStartRecording}>
                      <Mic className="h-4 w-4 mr-2" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button onClick={handleStopRecording} variant="destructive">
                      <StopCircle className="h-4 w-4 mr-2" />
                      Stop Recording
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Process Button */}
            <div className="flex justify-end">
              <Button 
                onClick={handleProcess}
                size="lg"
                className="px-8"
                disabled={isProcessing}
              >
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isProcessing ? "Processing..." : "Process Data"}
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Upload;