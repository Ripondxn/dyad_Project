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
  Loader2,
  Camera
} from "lucide-react";
import BatchResultDisplay, { ProcessedItem } from "@/components/BatchResultDisplay";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import CameraCapture from "@/components/CameraCapture";

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
});

const Upload = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [processedItems, setProcessedItems] = useState<ProcessedItem[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const navigate = useNavigate();
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleFilesAccepted = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    showSuccess(`${newFiles.length} file(s) added successfully`);
  };

  const handleCapture = (file: File) => {
    handleFilesAccepted([file]);
  };

  const processSingleItem = async (item: { type: 'file', file: File } | { type: 'text', content: string }): Promise<ProcessedItem> => {
    try {
      let functionArgs: { text?: string; filePath?: string; signedUrl?: string } = {};
      let sourceName = '';
      let attachmentFile: File | null = null;

      if (item.type === 'text') {
        functionArgs.text = item.content;
        sourceName = 'Text Input';
      } else {
        const file = item.file;
        sourceName = file.name;
        attachmentFile = file;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("You must be logged in to upload files.");
        
        const filePath = `${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('transaction_uploads').upload(filePath, file);
        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
        
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from('transaction_uploads').createSignedUrl(filePath, 60);
        if (signedUrlError) throw new Error(`Failed to create secure link: ${signedUrlError.message}`);
        
        functionArgs.filePath = filePath;
        functionArgs.signedUrl = signedUrlData.signedUrl;
      }

      const { data, error } = await supabase.functions.invoke('process-transaction', { body: functionArgs });
      if (error) throw error;
      
      const { extractedData } = data;
      if (!extractedData.document) {
        const now = new Date();
        extractedData.document = `AUTO-${now.toISOString().replace(/[-:.]/g, "").slice(0, -1)}`;
      }
      
      const formattedResult = `
Document #: ${extractedData.document || 'N/A'}
Type: ${extractedData.type || 'N/A'}
Merchant: ${extractedData.customer || 'N/A'}
Date: ${extractedData.date || 'N/A'}
Total: ${extractedData.amount ? `$${extractedData.amount}` : 'N/A'}
      `.trim();

      return { source: sourceName, status: 'success', formattedResult, parsedData: extractedData, attachmentFile };
    } catch (error: any) {
      const source = item.type === 'file' ? item.file.name : 'Text Input';
      return { source, status: 'error', error: error.message || "An unknown error occurred." };
    }
  };

  const handleProcessBatch = async () => {
    if (files.length === 0 && !text.trim()) {
      showError("Please upload files or enter text to process");
      return;
    }

    setIsProcessing(true);
    const loadingToast = showLoading(`Processing ${files.length + (text.trim() ? 1 : 0)} items...`);

    const tasksToProcess: (({ type: 'file', file: File }) | ({ type: 'text', content: string }))[] = [];
    if (text.trim()) {
      tasksToProcess.push({ type: 'text', content: text });
    }
    files.forEach(file => {
      tasksToProcess.push({ type: 'file', file });
    });

    const results = await Promise.all(tasksToProcess.map(item => processSingleItem(item)));
    
    setProcessedItems(results);
    dismissToast(loadingToast);
    const successCount = results.filter(r => r.status === 'success').length;
    showSuccess(`Processing complete! ${successCount} items succeeded.`);
    setFiles([]);
    setText("");
    setIsProcessing(false);
  };

  const handleSaveBatch = async () => {
    setIsSaving(true);
    const loadingToast = showLoading("Saving transactions...");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in.");

      const successfulItems = processedItems.filter(item => item.status === 'success');
      if (successfulItems.length === 0) throw new Error("No successful transactions to save.");

      // Step 1: Upload all attachments to Google Drive in parallel
      const attachmentUploadPromises = successfulItems.map(async (item) => {
        if (!item.attachmentFile) return { ...item, attachment_url: null };
        const fileData = await toBase64(item.attachmentFile);
        const { data, error } = await supabase.functions.invoke('upload-to-drive', {
          body: { fileName: item.attachmentFile.name, fileType: item.attachmentFile.type, fileData }
        });
        if (error) throw new Error(`Failed to upload ${item.source} to Drive: ${error.message}`);
        return { ...item, attachment_url: data.webViewLink };
      });
      const itemsWithAttachmentUrls = await Promise.all(attachmentUploadPromises);

      // Step 2: Prepare data for bulk database insert
      const transactionsToInsert = itemsWithAttachmentUrls.map(item => ({
        user_id: user.id,
        message_type: item.parsedData.type,
        content: item.formattedResult,
        extracted_details: {
          document: item.parsedData.document,
          customer: item.parsedData.customer,
          date: item.parsedData.date,
          totalAmount: parseFloat(item.parsedData.amount) || 0,
        },
        items_description: item.parsedData.items_description,
        attachment_url: item.attachment_url,
      }));

      // Step 3: Bulk insert into Supabase
      const { data: savedTransactions, error: dbError } = await supabase
        .from('transactions')
        .insert(transactionsToInsert)
        .select();
      if (dbError) throw dbError;

      // Step 4: Sync to Google Drive CSV (can be done in background, but we'll await for confirmation)
      const syncPromises = savedTransactions.map(t => {
        const details = t.extracted_details;
        const csvData = {
          id: t.id, document: details.document, type: t.message_type, date: details.date,
          amount: details.totalAmount, customer: details.customer, items_description: t.items_description,
          attachment_url: t.attachment_url,
        };
        return supabase.functions.invoke('sync-transaction-to-drive', { body: { transaction: csvData } });
      });
      await Promise.all(syncPromises);

      dismissToast(loadingToast);
      showSuccess(`${savedTransactions.length} transactions saved and synced successfully!`);
      handleClearResults();
      navigate("/transactions");

    } catch (error: any) {
      dismissToast(loadingToast);
      showError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearResults = () => {
    setProcessedItems([]);
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        handleFilesAccepted([audioFile]);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      showSuccess("Recording started...");
    } catch (err) {
      showError("Microphone access was denied.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      showSuccess("Recording stopped.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {processedItems.length > 0 ? "Extraction Results" : "Upload Data"}
          </h1>
          <p className="text-gray-500">
            {processedItems.length > 0
              ? "Review the extracted data and save it."
              : "Upload documents, images, audio, or text for AI-powered data extraction."}
          </p>
        </div>

        {processedItems.length > 0 ? (
          <BatchResultDisplay
            results={processedItems}
            onSave={handleSaveBatch}
            onClear={handleClearResults}
            isSaving={isSaving}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><UploadIcon className="h-5 w-5" />Upload Files</CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUpload onFilesAccepted={handleFilesAccepted} />
                  {files.length > 0 && (
                    <div className="mt-6 space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 overflow-hidden">
                            {file.type.startsWith('image/') ? <Image className="h-5 w-5 text-green-500 flex-shrink-0" /> : file.type === 'application/pdf' ? <FileText className="h-5 w-5 text-red-500 flex-shrink-0" /> : file.type.startsWith('audio/') ? <Mic className="h-5 w-5 text-purple-500 flex-shrink-0" /> : <Paperclip className="h-5 w-5 text-blue-500 flex-shrink-0" />}
                            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>Remove</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Type className="h-5 w-5" />Text Input</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea placeholder="Paste text content here..." value={text} onChange={(e) => setText(e.target.value)} className="min-h-[200px]" />
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Camera className="h-5 w-5" />Camera Input</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setIsCameraOpen(true)} className="w-full"><Camera className="h-4 w-4 mr-2" />Open Camera</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Mic className="h-5 w-5" />Audio Input</CardTitle>
                </CardHeader>
                <CardContent>
                  {!isRecording ? (
                    <Button onClick={handleStartRecording} className="w-full"><Mic className="h-4 w-4 mr-2" />Start Recording</Button>
                  ) : (
                    <Button onClick={handleStopRecording} variant="destructive" className="w-full"><StopCircle className="h-4 w-4 mr-2" />Stop Recording</Button>
                  )}
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleProcessBatch} size="lg" disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Process Data
              </Button>
            </div>
          </>
        )}
      </div>
      <CameraCapture open={isCameraOpen} onOpenChange={setIsCameraOpen} onCapture={handleCapture} />
    </DashboardLayout>
  );
};

export default Upload;