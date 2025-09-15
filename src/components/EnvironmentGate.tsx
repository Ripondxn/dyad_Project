import React from 'react';
import DebugInfo from '@/components/DebugInfo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const EnvironmentGate = ({ children }: { children: React.ReactNode }) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-lg space-y-6">
          <Card className="border-red-500 border-2">
            <CardHeader>
              <CardTitle className="text-red-600">Configuration Error</CardTitle>
              <CardDescription>
                Your application is missing essential Supabase environment variables.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                The application cannot start because it doesn't know how to connect to your Supabase project. Please ensure you have a <code>.env</code> file in the root of your project with the correct values.
              </p>
              <DebugInfo />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default EnvironmentGate;