import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, FileText, Upload, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-white border-r hidden md:block">
        <div className="p-4">
          <h1 className="text-2xl font-bold">Docu-Track</h1>
        </div>
        <nav className="mt-6">
          <NavLink 
            to="/transactions" 
            className={({ isActive }) => 
              `flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200 ${isActive ? 'bg-gray-200' : ''}`
            }
          >
            <FileText className="w-5 h-5 mr-3" />
            Transactions
          </NavLink>
          <NavLink 
            to="/upload" 
            className={({ isActive }) => 
              `flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200 ${isActive ? 'bg-gray-200' : ''}`
            }
          >
            <Upload className="w-5 h-5 mr-3" />
            Upload
          </NavLink>
        </nav>
        <div className="absolute bottom-0 w-64 p-4 border-t">
          <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;