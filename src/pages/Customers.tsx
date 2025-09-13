"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/ui/dashboard-layout";
import DataTable from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Building,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const Customers = () => {
  const [customers, setCustomers] = useState([
    {
      id: "1",
      name: "John Smith",
      email: "john.smith@example.com",
      phone: "+1 (555) 123-4567",
      type: "Customer",
      transactions: 12,
    },
    {
      id: "2",
      name: "Sarah Johnson",
      email: "sarah.j@example.com",
      phone: "+1 (555) 987-6543",
      type: "Customer",
      transactions: 8,
    },
    {
      id: "3",
      name: "ABC Supplies",
      email: "orders@abcsupplies.com",
      phone: "+1 (555) 456-7890",
      type: "Vendor",
      transactions: 5,
    },
    {
      id: "4",
      name: "Tech Solutions Inc",
      email: "info@techsolutions.com",
      phone: "+1 (555) 234-5678",
      type: "Vendor",
      transactions: 3,
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    type: "Customer",
  });
  const { toast } = useToast();

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "type", label: "Type" },
    { key: "transactions", label: "Transactions" },
  ];

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      type: customer.type,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setCustomers(customers.filter(c => c.id !== id));
    toast({
      title: "Customer deleted",
      description: "The customer has been removed successfully.",
    });
  };

  const handleSave = () => {
    if (editingCustomer) {
      // Update existing customer
      setCustomers(customers.map(c => 
        c.id === editingCustomer.id ? { ...formData, id: editingCustomer.id, transactions: editingCustomer.transactions } : c
      ));
      toast({
        title: "Customer updated",
        description: "The customer has been updated successfully.",
      });
    } else {
      // Add new customer
      const newCustomer = {
        ...formData,
        id: (customers.length + 1).toString(),
        transactions: 0,
      };
      setCustomers([...customers, newCustomer]);
      toast({
        title: "Customer added",
        description: "The new customer has been added successfully.",
      });
    }
    
    setIsDialogOpen(false);
    setEditingCustomer(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      type: "Customer",
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers & Vendors</h1>
            <p className="text-gray-500">Manage your business partners</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingCustomer(null);
                  setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    type: "Customer",
                  });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Party
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCustomer ? "Edit Party" : "Add New Party"}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
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
                      <option value="Customer">Customer</option>
                      <option value="Vendor">Vendor</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    {editingCustomer ? "Update" : "Add"} Party
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <DataTable 
          data={customers} 
          columns={columns} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </DashboardLayout>
  );
};

export default Customers;