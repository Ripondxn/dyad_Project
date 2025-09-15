import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { showError } from '@/utils/toast';

const GoogleCallback = () => {
  const [message, setMessage] = useState('Connecting to Google Drive, please wait...');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const error = params.get('error');

      if (error) {
        setMessage(`Error connecting to Google Drive: ${error}`);
        showError(`Failed to connect: ${error}`);
        setTimeout(() => navigate('/profile'), 3000);
        return;
      }

      if (!code) {
        setMessage('Authorization code not found. Redirecting...');
        showError('Could not find authorization code from Google.');
        setTimeout(() => navigate('/profile'), 3000);
        return;
      }

      // Construct the redirect URI exactly as it was used in the initial request
      const redirectUri = `${window.location.origin}/google-callback`;

      const { error: functionError } = await supabase.functions.invoke('google-auth-callback', {
        body: { code, redirectUri }, // Pass the redirectUri to the function
      });

      if (functionError) {
        setMessage(`An error occurred: ${functionError.message}`);
        showError(`Server error: ${functionError.message}`);
        setTimeout(() => navigate('/profile'), 4000);
      } else {
        setMessage('Successfully connected! Redirecting...');
        setTimeout(() => navigate('/profile'), 1500);
      }
    };

    handleCallback();
  }, [location, navigate]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-lg text-muted-foreground">{message}</p>
    </div>
  );
};

export default GoogleCallback;