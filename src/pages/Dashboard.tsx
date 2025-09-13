"use client";

import React from "react";
import DashboardLayout from "@/components/ui/dashboard-layout";
import KPICard from "@/components/ui/kpi-card";
import { 
  DollarSign, 
  FileText, 
  Users, 
  TrendingUp, 
  Calendar,
  CreditCard,
  Activity
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const Dashboard = () => {
  // Mock data for KPI cards
  const kpiData = [
    { title: "Total Transactions", value: "142", description: "All processed documents", icon: <FileText className="h-4 w-4" /> },
    { title: "Total Value", value: "$24,560", description: "Sum of all transactions", icon: <DollarSign className="h-4 w-4" /> },
    { title: "Customers", value: "86", description: "Active customers", icon: <Users className="h-4 w-4" /> },
    { title: "Processing Rate", value: "98%", description: "Successful extractions", icon: <TrendingUp className="h-4 w-4" /> },
  ];

  // Mock data for chart
  const chartData = [
    { name: "Jan", transactions: 45 },
    { name: "Feb", transactions: 52 },
    { name: "Mar", transactions: 48 },
    { name: "Apr", transactions: 78 },
    { name: "May", transactions: 65 },
    { name: "Jun", transactions: 90 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Overview of your data extraction activities</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpiData.map((kpi, index) => (
            <KPICard
              key={index}
              title={kpi.title}
              value={kpi.value}
              description={kpi.description}
              icon={kpi.icon}
            />
          ))}
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Transaction Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="transactions" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: 1, name: "Invoice #INV-2023-001", date: "2 hours ago", type: "invoice" },
                  { id: 2, name: "Receipt #REC-2023-045", date: "5 hours ago", type: "receipt" },
                  { id: 3, name: "Customer: John Smith", date: "1 day ago", type: "customer" },
                  { id: 4, name: "Vendor: ABC Supplies", date: "1 day ago", type: "vendor" },
                  { id: 5, name: "Bill #BILL-2023-012", date: "2 days ago", type: "bill" },
                ].map((activity) => (
                  <div key={activity.id} className="flex items-center">
                    <div className="flex-shrink-0">
                      {activity.type === "invoice" && <FileText className="h-5 w-5 text-blue-500" />}
                      {activity.type === "receipt" && <CreditCard className="h-5 w-5 text-green-500" />}
                      {activity.type === "customer" && <Users className="h-5 w-5 text-purple-500" />}
                      {activity.type === "vendor" && <Users className="h-5 w-5 text-orange-500" />}
                      {activity.type === "bill" && <FileText className="h-5 w-5 text-red-500" />}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{activity.name}</p>
                      <p className="text-xs text-gray-500">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[
                    { id: 1, document: "INV-2023-001", type: "Invoice", date: "2023-06-15", amount: "$1,250.00", status: "Processed" },
                    { id: 2, document: "REC-2023-045", type: "Receipt", date: "2023-06-14", amount: "$85.75", status: "Processed" },
                    { id: 3, document: "BILL-2023-012", type: "Bill", date: "2023-06-12", amount: "$2,450.00", status: "Processed" },
                    { id: 4, document: "INV-2023-002", type: "Invoice", date: "2023-06-10", amount: "$3,200.00", status: "Processing" },
                  ].map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.document}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${transaction.status === "Processed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;