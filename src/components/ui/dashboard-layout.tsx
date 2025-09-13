import React from "react";
import Sidebar from "@/components/ui/sidebar";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;