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
import { Badge } from '@/components/ui/badge';

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  status: string;
}

const Admin = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
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
    setSelectedStatus(profile.status);
    setIsDialogOpen(true);
  };

  const handleDelete = async (profileId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userIdToDelete: profileId },
      });
      if (error) throw error;
      toast({ title: 'User deleted successfully!' });
      fetchProfiles();
    } catch (error: any) {
      toast({ title: 'Error deleting user', description: error.message, variant: 'destructive' });
    }
  };

  const handleSaveChanges = async () => {
    if (!editingProfile) return;
    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ role: selectedRole, status: selectedStatus })
      .eq('id', editingProfile.id);

    if (error) {
      toast({ title: 'Error updating user', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'User updated successfully!' });
      setIsDialogOpen(false);
      setEditingProfile(null);
      fetchProfiles();
    }
    setIsSaving(false);
  };

  const columns = [
    { key: 'email', label: 'Email' },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
  ];

  const formattedData = profiles.map(p => ({
    ...p,
    status: <Badge variant={p.status === 'active' ? 'default' : 'destructive'}>{p.status}</Badge>
  }));

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
          data={formattedData}
          columns={columns}
          onEdit={(row) => handleEdit(profiles.find(p => p.id === row.id)!)}
          onDelete={handleDelete}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
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
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
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