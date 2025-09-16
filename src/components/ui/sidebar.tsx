"use client";

import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  List,
  User,
  Shield,
  Settings,
  ChevronsLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  isCollapsed?: boolean;
  toggleCollapse?: () => void;
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

export function Sidebar({ isCollapsed = false, toggleCollapse }: SidebarProps) {
  const location = useLocation();
  const { isAdmin } = useUser();

  const renderLink = ({ href, label, icon: Icon }: typeof navLinks[0]) => (
    <li key={href}>
      {isCollapsed ? (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to={href}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:h-8 md:w-8",
                  location.pathname === href && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="sr-only">{label}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
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
      )}
    </li>
  );

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-sidebar transition-[width] duration-300 ease-in-out sm:flex",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className={cn(
        "flex h-14 items-center border-b px-6",
        isCollapsed && "justify-center px-2"
      )}>
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Settings className="h-6 w-6" />
          {!isCollapsed && <span>Data Extractor</span>}
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className={cn(
          "grid items-start px-4 text-sm font-medium",
          isCollapsed && "justify-center gap-2 px-2"
        )}>
          {navLinks.map(renderLink)}
          {isAdmin && adminLinks.map(renderLink)}
        </ul>
      </nav>
      {toggleCollapse && (
        <div className="mt-auto border-t p-4">
          <Button variant="ghost" size="icon" className="w-full" onClick={toggleCollapse}>
            <ChevronsLeft className={cn("h-5 w-5 transition-transform", !isCollapsed && "rotate-180")} />
          </Button>
        </div>
      )}
    </aside>
  );
}