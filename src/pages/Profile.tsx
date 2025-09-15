import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/ui/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import AvatarUpload from '@/components/AvatarUpload';
import config from '@/config';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [googleAuthUrl, setGoogleAuthUrl] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfileAndGoogleStatus = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, avatar_url, google_drive_refresh_token')
          .eq('id', user.id)
          .single();

        if (error) {
          toast({ title: 'Error fetching profile', description: error.message, variant: 'destructive' });
        } else if (data) {
          setFirstName(data.first_name || '');
          setLastName(data.last_name || '');
          setAvatarUrl(data.avatar_url);
          setIsGoogleConnected(!!data.google_drive_refresh_token);
        }
      }
      setLoading(false);
    };
    
    const prepareGoogleAuthUrl = async () => {
        setIsConnecting(true);
        const { data: clientIdData, error } = await supabase
            .from('api_keys')
            .select('key_value')
            .eq('service_name', 'GOOGLE_CLIENT_ID')
            .single();

        if (error || !clientIdData || !clientIdData.key_value) {
            console.error("Google Client ID not configured in admin panel or is empty.");
            setGoogleAuthUrl(null);
        } else {
            const redirectUri = `${config.SITE_URL}/google-callback`;
            console.log("ACTION REQUIRED: Please add this exact URL to your Google Cloud Console 'Authorized redirect URIs':", redirectUri);
            
            const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
            url.searchParams.set('client_id', clientIdData.key_value.trim());
            url.searchParams.set('redirect_uri', redirectUri);
            url.searchParams.set('response_type', 'code');
            url.searchParams.set('scope', 'https://www.googleapis.com/auth/drive.file');
            url.searchParams.set('access_type', 'offline');
            url.searchParams.set('prompt', 'consent');
            setGoogleAuthUrl(url.toString());
        }
        setIsConnecting(false);
    };

    fetchProfileAndGoogleStatus();
    prepareGoogleAuthUrl();
  }, [toast]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('profiles').update({
        first_name: firstName,
        last_name: lastName,
        avatar_url: avatarUrl,
      }).eq('id', user.id);

      if (error) {
        toast({ title: 'Error updating profile', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Profile updated successfully!' });
      }
    }
    setSaving(false);
  };

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
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500">Manage your personal information and settings.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your photo and personal details here.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <AvatarUpload url={avatarUrl} onUpload={(url) => setAvatarUrl(url)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>Connect your account to external services.</CardDescription>
          </CardHeader>
          <CardContent>
            {isConnecting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isGoogleConnected ? (
              <div className="flex items-center justify-between">
                <p className="font-medium text-green-600">Connected to Google Drive</p>
                <Button variant="destructive" disabled>Disconnect (coming soon)</Button>
              </div>
            ) : googleAuthUrl ? (
              <Button asChild>
                <a href={googleAuthUrl}>
                  <Save className="mr-2 h-4 w-4" /> Connect to Google Drive
                </a>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Google Drive integration is not configured by the administrator.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;