import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const DebugInfo = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Debugging Information</CardTitle>
        <CardDescription>
          These are the environment variables your application is currently using to connect to Supabase.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div>
          <p className="font-semibold">Supabase URL:</p>
          <p className="font-mono break-all p-2 bg-gray-100 rounded">
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
          If the URL is "NOT SET", it means your <code>.env</code> file is missing or not configured correctly. The "Failed to fetch" or "ERR_NAME_NOT_RESOLVED" error happens because the app is trying to connect to an empty URL.
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugInfo;