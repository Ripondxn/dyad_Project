"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/ui/dashboard-layout";
import DataTable from "@/components/ui/data-table";
import ExportButtons from "@/components/ui/export-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Filter,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const Transactions = () => {
  const [transactions, setTransactions] = useState([
    {
      id: "1",
      document: "INV-2023-001",
      type: "Invoice",
      date: "2023-06-15",
      amount: "$1,250.00",
      customer: "John Smith",
      status: "Processed",
    },
    {
      id: "2",
      document: "REC-2023-045",
      type: "Receipt",
      date: "2023-06-14",
      amount: "$85.75",
      customer: "Sarah Johnson",
      status: "Processed",
    },
    {
      id: "3",
      document: "BILL-2023-012",
      type: "Bill",
      date: "2023-06-12",
      amount: "$2,450.00",
      customer: "ABC Supplies",
      status: "Processed",
    },
    {
      id: "4",
      document: "INV-2023-002",
      type: "Invoice",
      date: "2023-06-10",
      amount: "$3,200.00",
      customer: "Tech Solutions Inc",
      status: "Processing",
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [formData, setFormData] = useState({
    document: "",
    type: "Invoice",
    date: "",
    amount: "",
    customer: "",
    status: "Processed",
  });
  const { toast } = useToast();

  const columns = [
    { key: "document", label: "Document #" },
    { key: "type", label: "Type" },
    { key: "date", label: "Date" },
    { key: "amount", label: "Amount" },
    { key: "customer", label: "Customer" },
    { key: "status", label: "Status" },
  ];

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setFormData({
      document: transaction.document,
      type: transaction.type,
      date: transaction.date,
      amount: transaction.amount,
      customer: transaction.customer,
      status: transaction.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
    toast({
      title: "Transaction deleted",
      description: "The transaction has been removed successfully.",
    });
  };

  const handleSave = () => {
    if (editingTransaction) {
      // Update existing transaction
      setTransactions(transactions.map(t => 
        t.id === editingTransaction.id ? { ...formData, id: editingTransaction.id } : t
      ));
      toast({
        title: "Transaction updated",
        description: "The transaction has been updated successfully.",
      });
    } else {
      // Add new transaction
      const newTransaction = {
        ...formData,
        id: (transactions.length + 1).toString(),
      };
      setTransactions([...transactions, newTransaction]);
      toast({
        title: "Transaction added",
        description: "The new transaction has been added successfully.",
      });
    }
    
    setIsDialogOpen(false);
    setEditingTransaction(null);
    setFormData({
      document: "",
      type: "Invoice",
      date: "",
      amount: "",
      customer: "",
      status: "Processed",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
                  setFormData({
                    document: "",
                    type: "Invoice",
                    date: "",
                    amount: "",
                    customer: "",
                    status: "Processed",
                  });
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
                    <Label htmlFor="document" className="text-right">
                      Document #
                    </Label>
                    <Input
                      id="document"
                      name="document"
                      value={formData.document}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">
                      Type
                    </Label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="col-span-3 border rounded-md px-3 py-2"
                    >
                      <option value="Invoice">Invoice</option>
                      <option value="Receipt">Receipt</option>
                      <option value="Bill">Bill</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">
                      Date
                    </Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">
                      Amount
                    </Label>
                    <Input
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="customer" className="text-right">
                      Customer
                    </Label>
                    <Input
                      id="customer"
                      name="customer"
                      value={formData.customer}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">
                      Status
                    </Label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="col-span-3 border rounded-md px-3 py-2"
                    >
                      <option value="Processed">Processed</option>
                      <option value="Processing">Processing</option>
                      <option value="Error">Error</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
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