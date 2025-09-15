import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from './ui/button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DebugInfo = () => {
  const [origin, setOrigin] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(origin);
    toast({ title: 'Copied to clipboard!' });
  };

  if (!origin || origin === 'null') { // The origin can be 'null' in some sandboxed iframes
    return null;
  }

  return (
    <Card className="mt-6 bg-yellow-50 border-yellow-300">
      <CardHeader>
        <CardTitle className="text-yellow-900">Troubleshooting Step</CardTitle>
        <CardDescription className="text-yellow-800">
          If you see a "Failed to fetch" error, please follow this instruction carefully.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-yellow-900 mb-2">
          Your app is running from the following address (origin):
        </p>
        <div className="flex items-center gap-2 p-2 bg-yellow-100 rounded-md">
          <code className="text-yellow-900 font-mono text-sm break-all">{origin}</code>
          <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy to clipboard">
            <Copy className="h-4 w-4 text-yellow-800" />
          </Button>
        </div>
        <p className="text-sm text-yellow-900 mt-4">
          Please copy this exact value and add it to the <strong>CORS Origins</strong> list in your Supabase project's API settings. This will authorize your app to communicate with Supabase.
        </p>
      </CardContent>
    </Card>
  );
};

export default DebugInfo;