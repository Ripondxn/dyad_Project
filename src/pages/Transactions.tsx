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
import VatCalculator, { VatDetails } from "@/components/VatCalculator";
import { useAppSettings } from "@/hooks/use-app-settings";

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
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [rawContent, setRawContent] = useState('');
  const [formData, setFormData] = useState({
    document: "", type: "Invoice", date: "", customer: "", items_description: "",
  });
  const [vatDetails, setVatDetails] = useState<VatDetails>({
    subtotal: 0, vatRate: 0, vatAmount: 0, totalAmount: 0, vatStatus: 'exclusive',
  });
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const { data: appSettings } = useAppSettings();

  const [filters, setFilters] = useState<{
    customer: string;
    type: string;
    document: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
  }>({ customer: '', type: '', document: '', startDate: undefined, endDate: undefined });

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
      const rawData = data.map(t => {
        const details = t.extracted_details || {};
        return {
          id: t.id,
          document: details.document || '',
          type: t.message_type || 'N/A',
          date: details.date || '',
          customer: details.customer || '',
          items_description: t.items_description || '',
          subtotal: parseFloat(details.subtotal || details.amount || 0),
          vatAmount: parseFloat(details.vatAmount || 0),
          totalAmount: parseFloat(details.totalAmount || details.amount || 0),
          vatRate: details.vatRate || 0,
          vatStatus: details.vatStatus || 'exclusive',
          attachment_url: t.attachment_url,
        };
      });
      setTransactions(rawData);
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
        customer: newTransaction.customer || "",
        items_description: newTransaction.items_description || "",
      });
      setVatDetails({
        subtotal: 0,
        vatRate: 0,
        vatAmount: 0,
        totalAmount: parseFloat(newTransaction.amount) || 0,
        vatStatus: 'inclusive',
      });
      setRawContent(newTransaction.content || '');
      setEditingTransaction(null);
      if (newTransaction.attachmentFile) {
        setAttachmentFile(newTransaction.attachmentFile);
      } else {
        setAttachmentFile(null);
      }
      setIsDialogOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const customerMatch = filters.customer ? t.customer.toLowerCase().includes(filters.customer.toLowerCase()) : true;
      const typeMatch = filters.type ? t.type === filters.type : true;
      const documentMatch = filters.document ? t.document.toLowerCase().includes(filters.document.toLowerCase()) : true;
      const transactionDate = new Date(t.date);
      const startDateMatch = filters.startDate ? transactionDate >= filters.startDate : true;
      const endDateMatch = filters.endDate ? transactionDate <= filters.endDate : true;
      return customerMatch && typeMatch && documentMatch && startDateMatch && endDateMatch;
    });
  }, [transactions, filters]);

  const displayTransactions = useMemo(() => {
    const symbol = appSettings?.currency_symbol ?? '$';
    return filteredTransactions.map(t => ({
      ...t,
      subtotal: `${symbol}${t.subtotal.toFixed(2)}`,
      vatAmount: `${symbol}${t.vatAmount.toFixed(2)}`,
      totalAmount: `${symbol}${t.totalAmount.toFixed(2)}`,
      attachment: t.attachment_url ? (
        <a href={t.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-500 hover:underline">
          <Paperclip className="h-4 w-4 mr-1" /> View
        </a>
      ) : 'None',
    }));
  }, [filteredTransactions, appSettings]);

  const columns = [
    { key: "document", label: "Reference No" }, { key: "type", label: "Type" }, { key: "date", label: "Date" },
    { key: "customer", label: "Customer" }, { key: "subtotal", label: "Subtotal" }, { key: "vatAmount", label: "VAT Amount" },
    { key: "totalAmount", label: "Total Amount" }, { key: "attachment", label: "Attachment" },
  ];

  const handleEdit = (transaction: any) => {
    const originalTransaction = transactions.find(t => t.id === transaction.id);
    if (!originalTransaction) return;

    setEditingTransaction(originalTransaction);
    setFormData({
      document: originalTransaction.document, type: originalTransaction.type, date: originalTransaction.date,
      customer: originalTransaction.customer, items_description: originalTransaction.items_description || "",
    });
    setVatDetails({
      subtotal: originalTransaction.subtotal,
      vatRate: originalTransaction.vatRate,
      vatAmount: originalTransaction.vatAmount,
      totalAmount: originalTransaction.totalAmount,
      vatStatus: originalTransaction.vatStatus,
    });
    setRawContent(originalTransaction.content || '');
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
      if (!user) throw new Error("You must be logged in to save transactions.");

      let attachmentUrl = editingTransaction?.attachment_url || null;
      if (attachmentFile) {
        const fileData = await toBase64(attachmentFile);
        const { data: driveData, error: driveError } = await supabase.functions.invoke('upload-to-drive', {
            body: { fileName: attachmentFile.name, fileType: attachmentFile.type, fileData: fileData }
        });
        if (driveError) throw new Error(`Failed to upload to Google Drive: ${driveError.message}`);
        attachmentUrl = driveData.webViewLink;
      }

      const transactionData = {
        user_id: user.id,
        message_type: formData.type,
        content: rawContent,
        extracted_details: {
          document: formData.document,
          customer: formData.customer,
          date: formData.date,
          ...vatDetails,
        },
        items_description: formData.items_description,
        attachment_url: attachmentUrl,
      };

      const { data: savedData, error: dbError } = editingTransaction
        ? await supabase.from('transactions').update(transactionData).eq('id', editingTransaction.id).select().single()
        : await supabase.from('transactions').insert(transactionData).select().single();

      if (dbError) throw dbError;

      toast({ title: `Transaction ${editingTransaction ? 'updated' : 'added'}`, description: `Successfully ${editingTransaction ? 'updated' : 'added'}.` });
      setIsDialogOpen(false);
      
      if (savedData) {
        const syncToast = showLoading("Syncing to Google Drive CSV...");
        const details = savedData.extracted_details;
        const transactionForCsv = {
          id: savedData.id, document: details.document, type: savedData.message_type, date: details.date,
          amount: details.totalAmount, customer: details.customer, items_description: savedData.items_description,
          attachment_url: savedData.attachment_url,
        };
        const { error: syncError } = await supabase.functions.invoke('sync-transaction-to-drive', { body: { transaction: transactionForCsv } });
        dismissToast(syncToast);
        if (syncError) showError(`Failed to sync to CSV: ${syncError.message}`);
        else showSuccess("Successfully synced to Google Drive CSV.");
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
    setFilters({ customer: '', type: '', document: '', startDate: undefined, endDate: undefined });
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
                      setFormData({ document: "", type: "Invoice", date: "", customer: "", items_description: "" });
                      setVatDetails({ subtotal: 0, vatRate: 0, vatAmount: 0, totalAmount: 0, vatStatus: 'exclusive' });
                      setRawContent(''); setAttachmentFile(null);
                    }}><Plus className="h-4 w-4 mr-2" />Add Transaction</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>{editingTransaction ? "Edit Transaction" : "Add New Transaction"}</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="document" className="text-right">Reference No</Label><Input id="document" name="document" value={formData.document} onChange={handleInputChange} className="col-span-3" /></div>
                      <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="type" className="text-right">Type</Label><Select name="type" value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}><SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Invoice">Invoice</SelectItem><SelectItem value="Receipt">Receipt</SelectItem><SelectItem value="Bill">Bill</SelectItem><SelectItem value="Quotation">Quotation</SelectItem><SelectItem value="Utility">Utility</SelectItem></SelectContent></Select></div>
                      <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="date" className="text-right">Date</Label><Input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} className="col-span-3" /></div>
                      <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="customer" className="text-right">Customer</Label><Input id="customer" name="customer" value={formData.customer} onChange={handleInputChange} className="col-span-3" /></div>
                      <div className="grid grid-cols-4 items-start gap-4"><Label htmlFor="items_description" className="text-right pt-2">Items Desc</Label><Textarea id="items_description" name="items_description" value={formData.items_description} onChange={handleInputChange} className="col-span-3 min-h-[80px]" /></div>
                      
                      <VatCalculator value={vatDetails} onChange={setVatDetails} />

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="attachment" className="text-right">Attachment</Label>
                        <div className="col-span-3">
                          {attachmentFile ? (
                            <div className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
                              <div className="flex items-center gap-2 overflow-hidden"><Paperclip className="h-4 w-4 text-gray-500 flex-shrink-0" /><span className="text-sm font-medium text-gray-800 truncate">{attachmentFile.name}</span></div>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAttachmentFile(null)}><X className="h-4 w-4" /></Button>
                            </div>
                          ) : ( <Input id="attachment" name="attachment" type="file" onChange={handleFileChange} /> )}
                        </div>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2"><Label htmlFor="documentFilter">Reference No</Label><Input id="documentFilter" placeholder="Filter by reference..." value={filters.document} onChange={(e) => handleFilterChange('document', e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="customerFilter">Customer</Label><Input id="customerFilter" placeholder="Filter by customer..." value={filters.customer} onChange={(e) => handleFilterChange('customer', e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="typeFilter">Type</Label><Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}><SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger><SelectContent><SelectItem value="Invoice">Invoice</SelectItem><SelectItem value="Receipt">Receipt</SelectItem><SelectItem value="Bill">Bill</SelectItem><SelectItem value="Quotation">Quotation</SelectItem><SelectItem value="Utility">Utility</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Start Date</Label><DatePicker date={filters.startDate} setDate={(date) => handleFilterChange('startDate', date)} placeholder="Select start date" /></div>
                  <div className="space-y-2"><Label>End Date</Label><DatePicker date={filters.endDate} setDate={(date) => handleFilterChange('endDate', date)} placeholder="Select end date" /></div>
                  <Button onClick={clearFilters} variant="ghost" className="md:col-span-1"><X className="h-4 w-4 mr-2" />Clear Filters</Button>
                </div>
              </CardContent>
            </Card>

            <DataTable data={displayTransactions} columns={columns} onEdit={handleEdit} onDelete={handleDelete} />
          </div>
        </DashboardLayout>
      </div>
      <PrintableTransactions ref={printRef} transactions={displayTransactions} columns={columns.filter(c => c.key !== 'attachment')} />
    </>
  );
};

export default Transactions;