"use client";

import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  List,
  User,
  Shield,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";

interface SidebarProps {
  isHidden?: boolean;
}

const navLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload Data", icon: Upload },
  { href: "/transactions", label: "Transactions", icon: List },
  { href: "/profile", label: "Profile", icon: User },
];

const adminLinks = [
  { href: "/admin", label: "Admin Panel", icon: Shield },
];

export function Sidebar({ isHidden = false }: SidebarProps) {
  const location = useLocation();
  const { isAdmin } = useUser();

  const renderLink = ({ href, label, icon: Icon }: typeof navLinks[0]) => (
    <li key={href}>
      <Link
        to={href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          location.pathname === href && "bg-sidebar-accent text-sidebar-accent-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    </li>
  );

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-sidebar transition-transform duration-300 ease-in-out sm:flex",
      isHidden ? "-translate-x-full" : "translate-x-0"
    )}>
      <div className="flex h-14 items-center border-b px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Settings className="h-6 w-6" />
          <span>Transaction Guru</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="grid items-start px-4 text-sm font-medium">
          {navLinks.map(renderLink)}
          {isAdmin && adminLinks.map(renderLink)}
        </ul>
      </nav>
    </aside>
  );
}