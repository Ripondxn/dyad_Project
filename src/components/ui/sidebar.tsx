"use client";

import React from "react";
import { Home, FileText } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

export const Sidebar = () => {
  return (
    <aside className="hidden w-64 flex-col border-r bg-background sm:flex">
      <div className="p-4 text-2xl font-bold">My App</div>
      <nav className="flex flex-col gap-2 p-2">
        <SidebarLink to="/" icon={<Home className="h-5 w-5" />}>
          Home
        </SidebarLink>
        <SidebarLink to="/transactions" icon={<FileText className="h-5 w-5" />}>
          Transactions
        </SidebarLink>
      </nav>
    </aside>
  );
};

const SidebarLink = ({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) => {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
          isActive && "bg-muted text-primary"
        )
      }
    >
      {icon}
      {children}
    </NavLink>
  );
};

export default Sidebar;