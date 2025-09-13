import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/ui/dashboard-layout';
import DataTable from '@/components/ui/data-table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
}

const Admin = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    // This RPC call is needed to get user emails from the auth.users table,
    // as it's not directly queryable by clients.
    // We assume an admin has permission to run this.
    const { data, error } = await supabase.rpc('get_all_users_with_profiles');

    if (error) {
      toast({ title: 'Error fetching users', description: error.message, variant: 'destructive' });
    } else {
      setProfiles(data);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setSelectedRole(profile.role);
    setIsDialogOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!editingProfile) return;
    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ role: selectedRole })
      .eq('id', editingProfile.id);

    if (error) {
      toast({ title: 'Error updating role', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'User role updated successfully!' });
      setIsDialogOpen(false);
      setEditingProfile(null);
      fetchProfiles(); // Refresh data
    }
    setIsSaving(false);
  };

  const columns = [
    { key: 'email', label: 'Email' },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'role', label: 'Role' },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500">Manage users and their roles.</p>
        </div>
        <DataTable
          data={profiles}
          columns={columns}
          onEdit={handleEdit}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p>
              Editing role for: <span className="font-medium">{editingProfile?.email}</span>
            </p>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Admin;