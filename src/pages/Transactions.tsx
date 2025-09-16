"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/ui/dashboard-layout";
import DataTable from "@/components/ui/data-table";
import ExportButtons from "@/components/ui/export-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Paperclip, Printer, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { useReactToPrint } from 'react-to-print';
import PrintableTransactions from '@/components/PrintableTransactions';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

interface Transaction {
  id: string;
  document: string;
  type: string;
  date: string;
  amount: string;
  customer: string;
  items_description?: string;
  attachment_url?: string;
}

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
});

const Transactions = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [rawContent, setRawContent] = useState('');
  const [formData, setFormData] = useState({
    document: "", type: "Invoice", date: "", amount: "", customer: "", items_description: "",
  });
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<{
    customer: string;
    type: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
  }>({ customer: '', type: '', startDate: undefined, endDate: undefined });

  const handlePrint = useReactToPrint({
    documentTitle: "Transactions Report",
  });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("You must be logged in to view transactions.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.from('transactions').select('*').order('timestamp', { ascending: false });

    if (error) {
      showError(error.message);
    } else if (data) {
      const formattedData = data.map(t => ({
        id: t.id,
        document: t.extracted_details?.document || '',
        type: t.message_type || 'N/A',
        date: t.extracted_details?.date || '',
        amount: t.extracted_details?.amount || '',
        customer: t.extracted_details?.customer || '',
        items_description: t.items_description || '',
        attachment: t.attachment_url ? (
          <a href={t.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-500 hover:underline">
            <Paperclip className="h-4 w-4 mr-1" /> View
          </a>
        ) : 'None',
        attachment_url: t.attachment_url,
      }));
      setTransactions(formattedData);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  useEffect(() => {
    const newTransaction = location.state?.newTransaction;
    if (newTransaction) {
      setFormData({
        document: newTransaction.document || "",
        type: newTransaction.type || "Invoice",
        date: newTransaction.date || new Date().toISOString().split('T')[0],
        amount: newTransaction.amount || "",
        customer: newTransaction.customer || "",
        items_description: newTransaction.items_description || "",
      });
      setRawContent(newTransaction.content || '');
      setEditingTransaction(null);
      setAttachmentFile(null);
      setIsDialogOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const customerMatch = filters.customer ? t.customer.toLowerCase().includes(filters.customer.toLowerCase()) : true;
      const typeMatch = filters.type ? t.type === filters.type : true;
      const transactionDate = new Date(t.date);
      const startDateMatch = filters.startDate ? transactionDate >= filters.startDate : true;
      const endDateMatch = filters.endDate ? transactionDate <= filters.endDate : true;
      return customerMatch && typeMatch && startDateMatch && endDateMatch;
    });
  }, [transactions, filters]);

  const columns = [
    { key: "document", label: "Document #" }, { key: "type", label: "Type" }, { key: "date", label: "Date" },
    { key: "amount", label: "Amount" }, { key: "customer", label: "Customer" }, { key: "items_description", label: "Items Description" },
    { key: "attachment", label: "Attachment" },
  ];

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setFormData({
      document: transaction.document, type: transaction.type, date: transaction.date,
      amount: transaction.amount, customer: transaction.customer, items_description: transaction.items_description || "",
    });
    setRawContent(transaction.content || '');
    setAttachmentFile(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) { showError(error.message); } else {
      toast({ title: "Transaction deleted", description: "The transaction has been removed successfully." });
      fetchTransactions();
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to save transactions.");
      }

      let attachmentUrl = editingTransaction?.attachment_url || null;
      if (attachmentFile) {
        try {
          const fileData = await toBase64(attachmentFile);
          const { data: driveData, error: driveError } = await supabase.functions.invoke('upload-to-drive', {
              body: {
                  fileName: attachmentFile.name,
                  fileType: attachmentFile.type,
                  fileData: fileData,
              }
          });

          if (driveError) throw driveError;
          attachmentUrl = driveData.webViewLink;
        } catch (error: any) {
          const detailedError = error.context?.body?.error || error.message;
          throw new Error(`Failed to upload to Google Drive: ${detailedError}`);
        }
      }

      const transactionData = {
        user_id: user.id,
        message_type: formData.type,
        content: rawContent,
        extracted_details: {
          document: formData.document,
          amount: formData.amount,
          customer: formData.customer,
          date: formData.date
        },
        items_description: formData.items_description,
        attachment_url: attachmentUrl,
      };

      const { data: savedData, error: dbError } = editingTransaction
        ? await supabase.from('transactions').update(transactionData).eq('id', editingTransaction.id).select().single()
        : await supabase.from('transactions').insert(transactionData).select().single();

      if (dbError) throw dbError;

      toast({ title: `Transaction ${editingTransaction ? 'updated' : 'added'}`, description: `The transaction has been successfully ${editingTransaction ? 'updated' : 'added'}.` });
      setIsDialogOpen(false);
      setEditingTransaction(null);
      
      if (savedData) {
        const syncToast = showLoading("Syncing to Google Drive CSV...");
        const transactionForCsv = {
          id: savedData.id,
          document: savedData.extracted_details.document,
          type: savedData.message_type,
          date: savedData.extracted_details.date,
          amount: savedData.extracted_details.amount,
          customer: savedData.extracted_details.customer,
          items_description: savedData.items_description,
          attachment_url: savedData.attachment_url,
        };

        const { error: syncError } = await supabase.functions.invoke('sync-transaction-to-drive', {
          body: { transaction: transactionForCsv }
        });

        dismissToast(syncToast);
        if (syncError) {
          const detailedError = syncError.context?.body?.error || syncError.message;
          showError(`Failed to sync to CSV: ${detailedError}`);
        } else {
          showSuccess("Successfully synced to Google Drive CSV.");
        }
      }
      
      fetchTransactions();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachmentFile(e.target.files ? e.target.files[0] : null);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ customer: '', type: '', startDate: undefined, endDate: undefined });
  };

  if (loading) {
    return <DashboardLayout><div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div></DashboardLayout>;
  }

  return (
    <>
      <div className="print:hidden">
        <DashboardLayout>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
                <p className="text-gray-500">Manage your extracted transaction data</p>
              </div>
              <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
                <ExportButtons data={filteredTransactions} filename="transactions" />
                <Button onClick={() => handlePrint(() => printRef.current)} variant="outline"><Printer className="h-4 w-4 mr-2" />Print PDF</Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingTransaction(null);
                      setFormData({ document: "", type: "Invoice", date: "", amount: "", customer: "", items_description: "" });
                      setRawContent(''); setAttachmentFile(null);
                    }}><Plus className="h-4 w-4 mr-2" />Add Transaction</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>{editingTransaction ? "Edit Transaction" : "Add New Transaction"}</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="document" className="text-right">Document #</Label><Input id="document" name="document" value={formData.document} onChange={handleInputChange} className="col-span-3" /></div>
                      <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="type" className="text-right">Type</Label><Select name="type" value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Invoice">Invoice</SelectItem><SelectItem value="Receipt">Receipt</SelectItem><SelectItem value="Bill">Bill</SelectItem></SelectContent></Select></div>
                      <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="date" className="text-right">Date</Label><Input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} className="col-span-3" /></div>
                      <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="amount" className="text-right">Amount</Label><Input id="amount" name="amount" value={formData.amount} onChange={handleInputChange} className="col-span-3" /></div>
                      <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="customer" className="text-right">Customer</Label><Input id="customer" name="customer" value={formData.customer} onChange={handleInputChange} className="col-span-3" /></div>
                      <div className="grid grid-cols-4 items-start gap-4"><Label htmlFor="items_description" className="text-right pt-2">Items Desc</Label><Textarea id="items_description" name="items_description" value={formData.items_description} onChange={handleInputChange} className="col-span-3 min-h-[80px]" /></div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="attachment" className="text-right">Attachment</Label>
                        <Input id="attachment" name="attachment" type="file" onChange={handleFileChange} className="col-span-3" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleSave} disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {editingTransaction ? "Update" : "Add"} Transaction</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Card>
              <CardHeader><CardTitle>Advanced Filters</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <div className="space-y-2"><Label htmlFor="customerFilter">Customer</Label><Input id="customerFilter" placeholder="Filter by customer..." value={filters.customer} onChange={(e) => handleFilterChange('customer', e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="typeFilter">Type</Label><Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}><SelectTrigger><SelectValue placeholder="Filter by type..." /></SelectTrigger><SelectContent><SelectItem value="Invoice">Invoice</SelectItem><SelectItem value="Receipt">Receipt</SelectItem><SelectItem value="Bill">Bill</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Start Date</Label><DatePicker date={filters.startDate} setDate={(date) => handleFilterChange('startDate', date)} placeholder="Select start date" /></div>
                  <div className="space-y-2"><Label>End Date</Label><DatePicker date={filters.endDate} setDate={(date) => handleFilterChange('endDate', date)} placeholder="Select end date" /></div>
                  <Button onClick={clearFilters} variant="ghost"><X className="h-4 w-4 mr-2" />Clear Filters</Button>
                </div>
              </CardContent>
            </Card>

            <DataTable data={filteredTransactions} columns={columns} onEdit={handleEdit} onDelete={handleDelete} />
          </div>
        </DashboardLayout>
      </div>
      <PrintableTransactions ref={printRef} transactions={filteredTransactions} columns={columns} />
    </>
  );
};

export default Transactions;