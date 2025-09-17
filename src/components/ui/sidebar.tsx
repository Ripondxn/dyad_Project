"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Upload, List, User, Shield, BarChart, Menu } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
}

const Sidebar = ({ isCollapsed, setIsCollapsed, className }: SidebarProps) => {
  const location = useLocation();
  const { isAdmin } = useUser();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/upload', label: 'Upload Data', icon: Upload },
    { href: '/transactions', label: 'Transactions', icon: List },
    { href: '/profile', label: 'My Profile', icon: User },
  ];

  if (isAdmin) {
    navItems.push({ href: '/admin', label: 'Admin Panel', icon: Shield });
  }

  const isMobileSheet = !setIsCollapsed || typeof setIsCollapsed !== 'function' || setIsCollapsed.toString() === '() => {}';

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className={cn(
        "flex items-center border-b px-4 h-14 lg:h-[60px]",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <BarChart className="h-7 w-7 text-primary" />
            <h1 className="text-xl font-bold">Transaction Guru</h1>
          </div>
        )}
        {!isMobileSheet && (
          <Button
            onClick={() => setIsCollapsed(!isCollapsed)}
            variant="ghost"
            size="icon"
            className="shrink-0"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">{isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span>
          </Button>
        )}
      </div>
      <nav className={cn(
        "flex-1 space-y-2",
        isCollapsed ? "px-2 py-4" : "p-4"
      )}>
        <TooltipProvider delayDuration={0}>
          {navItems.map((item) => (
            isCollapsed ? (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary md:h-8 md:w-8",
                      location.pathname === item.href && "bg-accent text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  location.pathname === item.href && "bg-muted text-primary"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          ))}
        </TooltipProvider>
      </nav>
    </div>
  );
};

export default Sidebar;