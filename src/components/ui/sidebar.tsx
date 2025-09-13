import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useUser } from '@/hooks/use-user';
import {
  LayoutDashboard,
  List,
  Upload,
  Shield,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: List },
  { href: '/upload', label: 'Upload', icon: Upload },
];

const adminNavItems = [
  { href: '/admin', label: 'Admin', icon: Shield },
];

export function Sidebar() {
  const { isAdmin } = useUser();

  const renderNavItems = (items: typeof navItems) => {
    return items.map((item) => (
      <NavLink
        key={item.href}
        to={item.href}
        end
        className={({ isActive }) =>
          cn(
            'w-full',
            isActive
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground hover:text-primary hover:bg-primary/5',
          )
        }
      >
        <Button variant="ghost" className="w-full justify-start">
          <item.icon className="mr-2 h-4 w-4" />
          {item.label}
        </Button>
      </NavLink>
    ));
  };

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <NavLink to="/" className="flex items-center gap-2 font-semibold">
            <span className="">My App</span>
          </NavLink>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {renderNavItems(navItems)}
            {isAdmin && renderNavItems(adminNavItems)}
          </nav>
        </div>
      </div>
    </div>
  );
}