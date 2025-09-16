import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
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
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Troubleshooting Google Login</CardTitle>
          <CardDescription>
            Follow these steps to ensure your Google login is configured correctly. The most common issue is a missing or incorrect Redirect URI in your Google Cloud project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">Step 1: Copy Your Supabase Callback URL</h3>
            <p className="text-sm text-muted-foreground mb-2">
              This is the unique URL that Google needs to send users back to after they log in.
            </p>
            <div className="flex items-center gap-2">
              <p className="font-mono break-all p-2 bg-gray-100 rounded flex-grow text-sm">
                {supabaseCallbackUrl}
              </p>
              <Button variant="outline" size="icon" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Step 2: Add the URL to Google Cloud Console</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Go to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Cloud Console Credentials page</a>.</li>
              <li>Select the project you are using for this application.</li>
              <li>Find your OAuth 2.0 Client ID under the "OAuth 2.0 Client IDs" section and click on it to edit.</li>
              <li>Under the "Authorized redirect URIs" section, click "ADD URI".</li>
              <li>Paste the Supabase callback URL you copied in Step 1.</li>
              <li>Click "Save" at the bottom of the page.</li>
            </ol>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Step 3: Verify Your Supabase Configuration</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Supabase Dashboard</a> and select your project.</li>
              <li>Navigate to <span className="font-semibold">Authentication</span> &rarr; <span className="font-semibold">Providers</span>.</li>
              <li>Ensure the <span className="font-semibold">Google</span> provider is enabled.</li>
              <li>Make sure the Client ID and Client Secret from your Google Cloud project are correctly entered here.</li>
            </ol>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-center text-muted-foreground">
              After completing these steps, your Google login should work correctly.
            </p>
            <div className="text-center mt-4">
              <Button asChild>
                <Link to="/login">Back to Login</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleLoginHelp;