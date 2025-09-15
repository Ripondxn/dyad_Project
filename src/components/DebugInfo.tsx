import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DebugInfo = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied to clipboard!` });
  };

  // This is the known correct project ID from my context.
  const correctSupabaseUrl = "https://ckhkmempzhluwtufltdl.supabase.co";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Debugging Information</CardTitle>
        <CardDescription>
          These are the environment variables your application is currently using to connect to Supabase.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="font-semibold">Correct Supabase URL:</p>
          <div className="flex items-center gap-2">
            <p className="font-mono break-all p-2 bg-gray-100 rounded flex-grow">
              {correctSupabaseUrl}
            </p>
            <Button variant="outline" size="icon" onClick={() => copyToClipboard(correctSupabaseUrl, 'Correct URL')}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
           <p className="text-xs text-gray-500 mt-1">Use the copy button and paste this exact value into your `VITE_SUPABASE_URL` environment variable.</p>
        </div>
        <hr />
        <div>
          <p className="font-semibold">URL Your App is Currently Using:</p>
          <p className="font-mono break-all p-2 bg-red-100 rounded text-red-800">
            {supabaseUrl || 'NOT SET - This is the cause of the error.'}
          </p>
        </div>
        <div>
          <p className="font-semibold">Supabase Anon Key:</p>
          <p className="font-mono break-all p-2 bg-gray-100 rounded">
            {supabaseAnonKey ? `${supabaseAnonKey.substring(0, 15)}...` : 'NOT SET'}
          </p>
        </div>
        <div className="pt-2 text-xs text-gray-500">
          If the "URL Your App is Currently Using" does not exactly match the "Correct Supabase URL", the connection will fail. After correcting it, you must restart the app.
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugInfo;