import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import DebugInfo from '@/components/DebugInfo';

const HealthCheck = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runCheck = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('health_check')
        .select('status')
        .limit(1)
        .single();

      if (queryError) {
        throw queryError;
      }

      if (data) {
        setResult(`Successfully connected to Supabase! The database returned: status = '${data.status}'`);
      } else {
        setError('Connected to Supabase, but no data was returned. This might indicate an issue with the test table or RLS policies.');
      }
    } catch (e: any)
    {
      console.error("Health Check Error:", e);
      setError(`Failed to connect. Error: ${e.message}. This confirms an issue with your Supabase URL, Anon Key, or CORS settings.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-lg space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Supabase Connection Health Check</CardTitle>
            <CardDescription>
              This tool will help diagnose the "Failed to fetch" error by attempting a simple, direct connection to your database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runCheck} disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Run Connection Test
            </Button>
            {result && (
              <div className="p-4 bg-green-100 border border-green-300 text-green-800 rounded-md">
                <h3 className="font-bold">Success!</h3>
                <p>{result}</p>
              </div>
            )}
            {error && (
              <div className="p-4 bg-red-100 border border-red-300 text-red-800 rounded-md">
                <h3 className="font-bold">Connection Failed</h3>
                <p>{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
        <DebugInfo />
      </div>
    </div>
  );
};

export default HealthCheck;