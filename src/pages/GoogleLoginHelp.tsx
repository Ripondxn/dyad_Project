import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, AlertTriangle } from 'lucide-react';
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
            This error indicates a configuration mismatch in your Google Cloud Console. Please carefully check the following settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <Card className="border-red-500 border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                Critical Check: Authorized Redirect URI
              </CardTitle>
              <CardDescription>
                The "403: access_denied" error is almost always caused by a mistake in this specific setting. Please double-check it carefully.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                In the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Credentials page</a>, click on your <strong>OAuth 2.0 Client ID</strong>.
              </p>
              <p className="text-sm">
                Scroll down to the <strong>Authorized redirect URIs</strong> section. One of the URIs in the list <strong>must exactly match</strong> the following value:
              </p>
              <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-md">
                <p className="font-mono break-all text-sm flex-grow">
                  {supabaseCallbackUrl}
                </p>
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-2">
                <li>Check for typos: `http` instead of `https`.</li>
                <li>Ensure there are no extra characters or trailing slashes (`/`).</li>
                <li>Use the copy button to be 100% sure.</li>
                <li>After adding or correcting the URL, remember to click <strong>Save</strong> at the bottom of the Google Cloud page.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader className="flex-row items-start gap-4 space-y-0">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mt-1" />
              <div>
                <CardTitle className="text-lg">Other Common Fixes</CardTitle>
                <CardDescription className="text-yellow-800">
                  If the redirect URI is correct, the issue is likely one of these settings.
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
                  On the same <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">OAuth consent screen</a>, find "User type". It <strong className="text-red-600">must</strong> be set to <strong className="text-green-600">External</strong>. If it's "Internal", only users in your Google Workspace can log in.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle className="text-lg">Final Checks: API & Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-1">1. Enable Identity Platform API</h3>
                  <p className="text-sm text-muted-foreground">
                      Ensure the "Identity Platform" API is enabled for your project. If it's not, click the "Enable" button on the Google page.
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-2">
                      <a href="https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com" target="_blank" rel="noopener noreferrer">
                          Enable Identity Platform API
                      </a>
                  </Button>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">2. Verify Supabase Configuration</h3>
                  <p className="text-sm text-muted-foreground">
                    The Client ID and Secret must be copied exactly from Google Cloud into your Supabase dashboard's Google provider settings.
                  </p>
                </div>
            </CardContent>
          </Card>

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