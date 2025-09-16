import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const GoogleLoginHelp = () => {
  const { toast } = useToast();
  const supabaseCallbackUrl = 'https://ckhkmempzhluwtufltdl.supabase.co/auth/v1/callback';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(supabaseCallbackUrl);
    toast({ title: 'Callback URL copied to clipboard!' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Troubleshooting Google Login (403: access_denied)</CardTitle>
          <CardDescription>
            This error almost always indicates a configuration mismatch in the Google Cloud Console. Please carefully check the following settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader className="flex-row items-start gap-4 space-y-0">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mt-1" />
              <div>
                <CardTitle className="text-lg">Most Common Fixes</CardTitle>
                <CardDescription className="text-yellow-800">
                  Start here. The issue is likely one of these settings.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">1. Check Publishing Status</h3>
                <p className="text-sm text-muted-foreground">
                  Go to the <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">OAuth consent screen</a>. Under "Publishing status", ensure it says <strong className="text-green-600">In production</strong>. If it says "Testing", click "PUBLISH APP".
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">2. Check User Type</h3>
                <p className="text-sm text-muted-foreground">
                  On the same <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">OAuth consent screen</a>, find "User type". It <strong className="text-red-600">must</strong> be set to <strong className="text-green-600">External</strong>. If it's "Internal", only users in your Google Workspace can log in. You may need to recreate the consent screen if this is set incorrectly.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle className="text-lg">Step 1: Enable Required APIs</CardTitle>
                <CardDescription>
                    Supabase requires certain Google APIs to be enabled to function correctly.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                    Click the link below and ensure the "Identity Platform" API is enabled for your project. If it's not, click the "Enable" button on the Google page.
                </p>
                <Button asChild variant="outline">
                    <a href="https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com" target="_blank" rel="noopener noreferrer">
                        Enable Identity Platform API
                    </a>
                </Button>
                <p className="text-xs text-gray-500 mt-2">This is the most common cause of the `access_denied` error when other settings are correct.</p>
            </CardContent>
          </Card>

          <div>
            <h3 className="font-semibold text-lg mb-2">Step 2: Verify Your Supabase Callback URL</h3>
            <p className="text-sm text-muted-foreground mb-2">
              This URL must be present in your Google Cloud project's "Authorized redirect URIs".
            </p>
            <div className="flex items-center gap-2">
              <p className="font-mono break-all p-2 bg-gray-100 rounded flex-grow text-sm">
                {supabaseCallbackUrl}
              </p>
              <Button variant="outline" size="icon" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
             <ol className="list-decimal list-inside space-y-1 text-sm mt-2 pl-2">
              <li>Go to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Credentials page</a>.</li>
              <li>Click on your OAuth 2.0 Client ID to edit it.</li>
              <li>Ensure the URL above is listed under "Authorized redirect URIs".</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Step 3: Verify Your Supabase Configuration</h3>
            <p className="text-sm text-muted-foreground mb-2">
              The Client ID and Secret must be copied exactly from Google Cloud into your Supabase dashboard.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm pl-2">
              <li>In the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Credentials page</a>, find your OAuth Client ID. Make sure its "Type" is <strong className="text-green-600">Web application</strong>.</li>
              <li>Copy the "Client ID" and "Client secret" again.</li>
              <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Supabase Dashboard</a> &rarr; Authentication &rarr; Providers.</li>
              <li>In the Google provider settings, paste the credentials again to be sure they are correct.</li>
            </ol>
          </div>

          <div className="pt-4 border-t text-center">
            <Button asChild>
              <Link to="/login">Back to Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleLoginHelp;