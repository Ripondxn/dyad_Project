import { useEffect, useState } from "react";
import DashboardLayout from "@/components/ui/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Upload, List, DollarSign, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import VatSummary from "@/components/VatSummary";

interface SummaryData {
  totalTransactions: number;
  totalValue: number;
  recentUploads: number;
}

const Index = () => {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummaryData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('extracted_details, timestamp');

      if (error) {
        console.error("Error fetching summary data:", error);
        setLoading(false);
        return;
      }

      if (data) {
        const totalTransactions = data.length;
        
        const totalValue = data.reduce((sum, transaction) => {
          const amount = parseFloat(transaction.extracted_details?.totalAmount || transaction.extracted_details?.amount);
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);

        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const recentUploads = data.filter(t => t.timestamp && t.timestamp > oneHourAgo).length;

        setSummaryData({
          totalTransactions,
          totalValue,
          recentUploads,
        });
      }
      setLoading(false);
    };

    fetchSummaryData();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back! Here's a summary of your activity.</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <List className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{summaryData?.totalTransactions ?? 0}</div>
                  <p className="text-xs text-muted-foreground">All recorded transactions</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Extracted Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    ${summaryData?.totalValue.toFixed(2) ?? '0.00'}
                  </div>
                  <p className="text-xs text-muted-foreground">Sum of all transaction amounts</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">+{summaryData?.recentUploads ?? 0}</div>
                  <p className="text-xs text-muted-foreground">In the last hour</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <VatSummary />

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Get Started</CardTitle>
                    <CardDescription>Ready to extract data from a new document?</CardDescription>
                </CardHeader>
                <CardContent>
                    <Link to="/upload">
                        <Button className="w-full">
                            <Upload className="mr-2 h-4 w-4" /> Upload Data
                        </Button>
                    </Link>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Manage Your Data</CardTitle>
                    <CardDescription>View, edit, and export your transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Link to="/transactions">
                        <Button variant="outline" className="w-full">
                            View Transactions <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;