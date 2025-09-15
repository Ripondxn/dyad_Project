// @ts-ignore
/// <reference types="https://raw.githubusercontent.com/denoland/deno/main/cli/tsc/d.ts/lib.deno.d.ts" />

// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1. Get user from request
    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('User not found');

    const { code, redirectUri } = await req.json();
    if (!code) throw new Error('Authorization code is missing');
    if (!redirectUri) throw new Error('Redirect URI is missing from the request body');

    // 2. Get Google credentials from database
    const supabaseAdmin = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: keys, error: keysError } = await supabaseAdmin
      .from('api_keys')
      .select('service_name, key_value')
      .in('service_name', ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']);

    if (keysError) throw keysError;

    const clientId = keys.find(k => k.service_name === 'GOOGLE_CLIENT_ID')?.key_value.trim();
    const clientSecret = keys.find(k => k.service_name === 'GOOGLE_CLIENT_SECRET')?.key_value.trim();

    if (!clientId || !clientSecret) throw new Error('Google credentials not configured in admin panel.');

    // 3. Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error("Google Token API Error:", tokens);
      throw new Error(tokens.error_description || 'Failed to fetch tokens from Google');
    }

    // 4. Save refresh token to user's profile
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + tokens.expires_in);

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        google_drive_refresh_token: tokens.refresh_token,
        google_drive_access_token: tokens.access_token,
        google_drive_token_expiry: expiryDate.toISOString(),
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ message: 'Successfully connected' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });

  } catch (error) {
    console.error('Google auth callback error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
})