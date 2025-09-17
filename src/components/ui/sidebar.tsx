"use client";

import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Upload, List, User, Shield, BarChart } from 'lucide-react';
import { useUser } from '@/hooks/use-user';

const Sidebar = ({ className }: { className?: string }) => {
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

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex items-center gap-2 border-b px-4 py-6">
        <BarChart className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-bold">Transaction Guru</h1>
      </div>
      <nav className="flex-1 space-y-2 p-4">
        {navItems.map((item) => (
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
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;