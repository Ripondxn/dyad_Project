"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/ui/dashboard-layout";
import DataTable from "@/components/ui/data-table";
import ExportButtons from "@/components/ui/export-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toast";

interface Transaction {
  id: string;
  document: string;
  type: string;
  date: string;
  amount: string;
  customer: string;
  attachment_url?: string;
}

const Transactions = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [rawContent, setRawContent] = useState('');
  const [formData, setFormData] = useState({
    document: "",
    type: "Invoice",
    date: "",
    amount: "",
    customer: "",
  });
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("You must be logged in to view transactions.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      showError(error.message);
    } else if (data) {
      const formattedData = data.map(t => ({
        id: t.id,
        document: t.extracted_details?.document || '',
        type: t.message_type || 'N/A',
        date: t.timestamp ? new Date(t.timestamp).toISOString().split('T')[0] : '',
        amount: t.extracted_details?.amount || '',
        customer: t.extracted_details?.customer || '',
        attachment: t.attachment_url ? (
          <a href={t.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-500 hover:underline">
            <Paperclip className="h-4 w-4 mr-1" />
            View
          </a>
        ) : 'None',
        // Keep original attachment_url for editing
        attachment_url: t.attachment_url,
      }));
      setTransactions(formattedData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    if (location.state && location.state.newTransaction) {
      const { newTransaction } = location.state;
      
      setEditingTransaction(null);
      setFormData({
        document: newTransaction.document || "",
        type: newTransaction.type || "Receipt",
        date: newTransaction.date || "",
        amount: newTransaction.amount || "",
        customer: newTransaction.customer || "",
      });
      setRawContent(newTransaction.content || '');
      setAttachmentFile(null);
      setIsDialogOpen(true);

      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const columns = [
    { key: "document", label: "Document #" },
    { key: "type", label: "Type" },
    { key: "date", label: "Date" },
    { key: "amount", label: "Amount" },
    { key: "customer", label: "Customer" },
    { key: "attachment", label: "Attachment" },
  ];

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setFormData({
      document: transaction.document,
      type: transaction.type,
      date: transaction.date,
      amount: transaction.amount,
      customer: transaction.customer,
    });
    setAttachmentFile(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      showError(error.message);
    } else {
      toast({
        title: "Transaction deleted",
        description: "The transaction has been removed successfully.",
      });
      fetchTransactions();
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("You must be logged in to save transactions.");
      setIsSaving(false);
      return;
    }

    let attachmentUrl = editingTransaction?.attachment_url || null;

    if (attachmentFile) {
      const fileExt = attachmentFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('transaction_attachments')
        .upload(filePath, attachmentFile);

      if (uploadError) {
        showError(`Failed to upload attachment: ${uploadError.message}`);
        setIsSaving(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('transaction_attachments')
        .getPublicUrl(filePath);
      
      attachmentUrl = urlData.publicUrl;
    }

    const transactionData = {
      user_id: user.id,
      message_type: formData.type,
      timestamp: formData.date,
      content: rawContent,
      extracted_details: {
        document: formData.document,
        amount: formData.amount,
        customer: formData.customer,
        date: formData.date,
      },
      attachment_url: attachmentUrl,
    };

    let query;
    if (editingTransaction) {
      query = supabase.from('transactions').update(transactionData).eq('id', editingTransaction.id);
    } else {
      query = supabase.from('transactions').insert(transactionData);
    }

    const { error } = await query;

    if (error) {
      if (error.code === '23505') { // PostgreSQL unique violation error code
        showError("A transaction with this Document # already exists.");
      } else {
        showError(error.message);
      }
    } else {
      toast({
        title: `Transaction ${editingTransaction ? 'updated' : 'added'}`,
        description: `The transaction has been ${editingTransaction ? 'updated' : 'added'} successfully.`,
      });
      setIsDialogOpen(false);
      setEditingTransaction(null);
      fetchTransactions();
    }
    setIsSaving(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachmentFile(e.target.files[0]);
    } else {
      setAttachmentFile(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-500">Manage your extracted transaction data</p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            <ExportButtons data={transactions} filename="transactions" />
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingTransaction(null);
                  setFormData({ document: "", type: "Invoice", date: "", amount: "", customer: "" });
                  setRawContent('');
                  setAttachmentFile(null);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingTransaction ? "Edit Transaction" : "Add New Transaction"}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="document" className="text-right">Document #</Label>
                    <Input id="document" name="document" value={formData.document} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">Type</Label>
                    <select id="type" name="type" value={formData.type} onChange={handleInputChange} className="col-span-3 border rounded-md px-3 py-2">
                      <option value="Invoice">Invoice</option>
                      <option value="Receipt">Receipt</option>
                      <option value="Bill">Bill</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">Date</Label>
                    <Input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">Amount</Label>
                    <Input id="amount" name="amount" value={formData.amount} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="customer" className="text-right">Customer</Label>
                    <Input id="customer" name="customer" value={formData.customer} onChange={handleInputChange} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="attachment" className="text-right">Attachment</Label>
                    <Input id="attachment" name="attachment" type="file" onChange={handleFileChange} className="col-span-3" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingTransaction ? "Update" : "Add"} Transaction
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <DataTable 
          data={transactions} 
          columns={columns} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </DashboardLayout>
  );
};

export default Transactions;