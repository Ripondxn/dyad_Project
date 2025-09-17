import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/ui/dashboard-layout';
import DataTable from '@/components/ui/data-table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, KeyRound, Save, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const newUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['user', 'admin']),
  status: z.enum(['active', 'inactive']),
});
type NewUserFormValues = z.infer<typeof newUserSchema>;

const apiKeySchema = z.object({
  apiKey: z.string().min(10, 'API Key seems too short.'),
});
type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

const googleKeysSchema = z.object({
  clientId: z.string().min(10, 'Client ID seems too short.'),
  clientSecret: z.string().min(10, 'Client Secret seems too short.'),
});
type GoogleKeysFormValues = z.infer<typeof googleKeysSchema>;

const currencySettingsSchema = z.object({
  currencySymbol: z.string().min(1, 'Symbol is required').max(5, 'Symbol is too long'),
  currencyCode: z.string().min(3, 'Code must be 3 characters').max(3, 'Code must be 3 characters').toUpperCase(),
});
type CurrencySettingsFormValues = z.infer<typeof currencySettingsSchema>;

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
  const [editingFirstName, setEditingFirstName] = useState('');
  const [editingLastName, setEditingLastName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  const [isSavingGoogleKeys, setIsSavingGoogleKeys] = useState(false);
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<NewUserFormValues>({
    resolver: zodResolver(newUserSchema),
  });

  const {
    register: registerApiKey,
    handleSubmit: handleSubmitApiKey,
    formState: { errors: errorsApiKey },
    reset: resetApiKeyForm,
  } = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
  });

  const {
    register: registerGoogleKeys,
    handleSubmit: handleSubmitGoogleKeys,
    formState: { errors: errorsGoogleKeys },
    reset: resetGoogleKeysForm,
  } = useForm<GoogleKeysFormValues>({
    resolver: zodResolver(googleKeysSchema),
  });

  const {
    register: registerCurrency,
    handleSubmit: handleSubmitCurrency,
    formState: { errors: errorsCurrency },
    setValue: setCurrencyValue,
  } = useForm<CurrencySettingsFormValues>({
    resolver: zodResolver(currencySettingsSchema),
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

  useEffect(() => { 
    fetchProfiles();
    const fetchCurrencySettings = async () => {
        const { data, error } = await supabase
            .from('app_settings')
            .select('currency_symbol, currency_code')
            .eq('id', 1)
            .single();

        if (data) {
            setCurrencyValue('currencySymbol', data.currency_symbol);
            setCurrencyValue('currencyCode', data.currency_code);
        } else if (error) {
            toast({ title: 'Error fetching currency settings', description: error.message, variant: 'destructive' });
        }
    };
    fetchCurrencySettings();
  }, [fetchProfiles, setCurrencyValue, toast]);

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setSelectedRole(profile.role);
    setSelectedStatus(profile.status);
    setEditingFirstName(profile.first_name || '');
    setEditingLastName(profile.last_name || '');
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
    const { error } = await supabase.from('profiles').update({ 
      role: selectedRole, 
      status: selectedStatus,
      first_name: editingFirstName,
      last_name: editingLastName,
    }).eq('id', editingProfile.id);
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

  const handleUpdateApiKey = async (data: ApiKeyFormValues) => {
    setIsSavingApiKey(true);
    const { error } = await supabase
      .from('api_keys')
      .update({ key_value: data.apiKey })
      .eq('service_name', 'GEMINI');

    if (error) {
      toast({ title: 'Error updating API Key', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'API Key updated successfully!' });
      resetApiKeyForm();
    }
    setIsSavingApiKey(false);
  };

  const handleUpdateGoogleKeys = async (data: GoogleKeysFormValues) => {
    setIsSavingGoogleKeys(true);
    const updates = [
      supabase.from('api_keys').upsert({ service_name: 'GOOGLE_CLIENT_ID', key_value: data.clientId }, { onConflict: 'service_name' }),
      supabase.from('api_keys').upsert({ service_name: 'GOOGLE_CLIENT_SECRET', key_value: data.clientSecret }, { onConflict: 'service_name' }),
    ];
    const results = await Promise.all(updates);
    const hasError = results.some(res => res.error);

    if (hasError) {
      toast({ title: 'Error updating Google Drive keys', description: 'One or more keys failed to update.', variant: 'destructive' });
    } else {
      toast({ title: 'Google Drive keys updated successfully!' });
      resetGoogleKeysForm();
    }
    setIsSavingGoogleKeys(false);
  };

  const handleUpdateCurrency = async (data: CurrencySettingsFormValues) => {
    setIsSavingCurrency(true);
    const { error } = await supabase
        .from('app_settings')
        .update({
            currency_symbol: data.currencySymbol,
            currency_code: data.currencyCode,
        })
        .eq('id', 1);

    if (error) {
        toast({ title: 'Error updating currency', description: error.message, variant: 'destructive' });
    } else {
        toast({ title: 'Currency settings updated!' });
    }
    setIsSavingCurrency(false);
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" />Gemini API Key</CardTitle>
              <CardDescription>Update the API key for the AI language model (Gemini).</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitApiKey(handleUpdateApiKey)} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="apiKey">New Gemini API Key</Label>
                  <Input id="apiKey" type="password" placeholder="Enter the new API key" {...registerApiKey('apiKey')} />
                  {errorsApiKey.apiKey && <p className="text-sm text-red-500">{errorsApiKey.apiKey.message}</p>}
                </div>
                <Button type="submit" disabled={isSavingApiKey}>{isSavingApiKey && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Update API Key</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Save className="h-5 w-5" />Google Drive Configuration</CardTitle>
              <CardDescription>Enter your Google OAuth credentials to enable saving files to Google Drive.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitGoogleKeys(handleUpdateGoogleKeys)} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="clientId">Google Client ID</Label>
                  <Input id="clientId" type="password" placeholder="Enter your Google Client ID" {...registerGoogleKeys('clientId')} />
                  {errorsGoogleKeys.clientId && <p className="text-sm text-red-500">{errorsGoogleKeys.clientId.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="clientSecret">Google Client Secret</Label>
                  <Input id="clientSecret" type="password" placeholder="Enter your Google Client Secret" {...registerGoogleKeys('clientSecret')} />
                  {errorsGoogleKeys.clientSecret && <p className="text-sm text-red-500">{errorsGoogleKeys.clientSecret.message}</p>}
                </div>
                <Button type="submit" disabled={isSavingGoogleKeys}>{isSavingGoogleKeys && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Google Keys</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" />Currency Settings</CardTitle>
              <CardDescription>Set the default currency symbol and code for the application.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitCurrency(handleUpdateCurrency)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="currencySymbol">Currency Symbol</Label>
                    <Input id="currencySymbol" placeholder="$" {...registerCurrency('currencySymbol')} />
                    {errorsCurrency.currencySymbol && <p className="text-sm text-red-500">{errorsCurrency.currencySymbol.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="currencyCode">Currency Code (3-letter)</Label>
                    <Input id="currencyCode" placeholder="USD" {...registerCurrency('currencyCode')} />
                    {errorsCurrency.currencyCode && <p className="text-sm text-red-500">{errorsCurrency.currencyCode.message}</p>}
                  </div>
                </div>
                <Button type="submit" disabled={isSavingCurrency}>
                  {isSavingCurrency && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Currency Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <p>Editing user: <span className="font-medium">{editingProfile?.email}</span></p>
            <div className="space-y-2"><Label htmlFor="firstName">First Name</Label><Input id="firstName" value={editingFirstName} onChange={(e) => setEditingFirstName(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="lastName">Last Name</Label><Input id="lastName" value={editingLastName} onChange={(e) => setEditingLastName(e.target.value)} /></div>
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