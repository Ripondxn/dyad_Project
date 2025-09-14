import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/ui/dashboard-layout';
import DataTable from '@/components/ui/data-table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const newUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['user', 'admin']),
  status: z.enum(['active', 'inactive']),
});
type NewUserFormValues = z.infer<typeof newUserSchema>;

interface Profile {
  id: string; email: string; first_name: string | null; last_name: string | null; role: string; status: string;
}

const Admin = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserSchema),
  });

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

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setSelectedRole(profile.role);
    setSelectedStatus(profile.status);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (profileId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return;
    try {
      const { error } = await supabase.functions.invoke('delete-user', { body: { userIdToDelete: profileId } });
      if (error) throw error;
      toast({ title: 'User deleted successfully!' });
      fetchProfiles();
    } catch (error: any) {
      toast({ title: 'Error deleting user', description: error.message, variant: 'destructive' });
    }
  };

  const handleUpdateChanges = async () => {
    if (!editingProfile) return;
    setIsSaving(true);
    const { error } = await supabase.from('profiles').update({ role: selectedRole, status: selectedStatus }).eq('id', editingProfile.id);
    if (error) {
      toast({ title: 'Error updating user', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'User updated successfully!' });
      setIsEditDialogOpen(false);
      setEditingProfile(null);
      fetchProfiles();
    }
    setIsSaving(false);
  };

  const handleCreateUser = async (data: NewUserFormValues) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.functions.invoke('create-user', {
        body: {
          email: data.email, password: data.password, firstName: data.firstName,
          lastName: data.lastName, role: data.role, status: data.status,
        },
      });
      if (error) throw error;
      toast({ title: 'User created successfully!' });
      setIsCreateDialogOpen(false);
      reset();
      fetchProfiles();
    } catch (error: any) {
      toast({ title: 'Error creating user', description: error.message, variant: 'destructive' });
    }
    setIsSaving(false);
  };

  const columns = [
    { key: 'email', label: 'Email' }, { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' }, { key: 'role', label: 'Role' }, { key: 'status', label: 'Status' },
  ];

  const formattedData = profiles.map(p => ({ ...p, status: <Badge variant={p.status === 'active' ? 'default' : 'destructive'}>{p.status}</Badge> }));

  if (loading) {
    return <DashboardLayout><div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-500">Manage users and their roles.</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Create User</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create New User</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit(handleCreateUser)} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label htmlFor="firstName">First Name</Label><Input id="firstName" {...register('firstName')} />{errors.firstName && <p className="text-sm text-red-500">{errors.firstName.message}</p>}</div>
                  <div className="space-y-1"><Label htmlFor="lastName">Last Name</Label><Input id="lastName" {...register('lastName')} />{errors.lastName && <p className="text-sm text-red-500">{errors.lastName.message}</p>}</div>
                </div>
                <div className="space-y-1"><Label htmlFor="email">Email</Label><Input id="email" type="email" {...register('email')} />{errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}</div>
                <div className="space-y-1"><Label htmlFor="password">Password</Label><Input id="password" type="password" {...register('password')} />{errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label htmlFor="role">Role</Label><select id="role" {...register('role')} className="w-full border rounded-md px-3 py-2"><option value="user">User</option><option value="admin">Admin</option></select>{errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}</div>
                  <div className="space-y-1"><Label htmlFor="status">Status</Label><select id="status" {...register('status')} className="w-full border rounded-md px-3 py-2"><option value="active">Active</option><option value="inactive">Inactive</option></select>{errors.status && <p className="text-sm text-red-500">{errors.status.message}</p>}</div>
                </div>
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create User</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <DataTable data={formattedData} columns={columns} onEdit={(row) => handleEdit(profiles.find(p => p.id === row.id)!)} onDelete={handleDelete} />
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <p>Editing role for: <span className="font-medium">{editingProfile?.email}</span></p>
            <div className="space-y-2"><Label htmlFor="role">Role</Label><Select value={selectedRole} onValueChange={setSelectedRole}><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger><SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="status">Status</Label><Select value={selectedStatus} onValueChange={setSelectedStatus}><SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateChanges} disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Admin;