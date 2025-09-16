"use client";

import * as React from "react";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sidebar } from "./sidebar";
import { UserNav } from "../UserNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const [isSidebarHidden, setIsSidebarHidden] = React.useState(false);

  const toggleSidebar = () => {
    setIsSidebarHidden(prev => !prev);
  };

  if (isMobile) {
    return (
      <div className="min-h-screen w-full">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <Sidebar />
            </SheetContent>
          </Sheet>
          <UserNav />
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <Sidebar isHidden={isSidebarHidden} />
      <main className={cn(
        "transition-[margin-left] duration-300 ease-in-out",
        isSidebarHidden ? "ml-0" : "ml-64"
      )}>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4">
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
          <UserNav />
        </header>
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}