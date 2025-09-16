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

const APP_FOLDER_NAME = 'Dyad App Transaction Attachments';

// Helper to get Google API keys from the database
const getGoogleApiKeys = async (supabaseAdmin: any) => {
  const { data: keys, error } = await supabaseAdmin
    .from('api_keys')
    .select('service_name, key_value')
    .in('service_name', ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']);
  if (error) throw error;

  const clientId = keys.find(k => k.service_name === 'GOOGLE_CLIENT_ID')?.key_value;
  const clientSecret = keys.find(k => k.service_name === 'GOOGLE_CLIENT_SECRET')?.key_value;

  if (!clientId || !clientSecret) {
    throw new Error('Google API keys (Client ID or Secret) are not configured in the admin panel.');
  }
  return { clientId, clientSecret };
};

// Helper to refresh a Google access token
const refreshGoogleToken = async (refreshToken: string, clientId: string, clientSecret: string) => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const tokens = await response.json();
  if (!response.ok) throw new Error(tokens.error_description || 'Failed to refresh Google token');
  return tokens;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1. Authenticate the user making the request
    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('User not found');

    // Use the admin client for all subsequent secure database operations
    const supabaseAdmin = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Check if the current user has their Google Drive connected
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, google_drive_refresh_token, google_drive_access_token, google_drive_token_expiry')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    // 3. If the user's drive is not connected, find an admin's profile as a fallback
    if (!profile.google_drive_refresh_token) {
      const { data: adminProfile, error: adminError } = await supabaseAdmin
        .from('profiles')
        .select('id, google_drive_refresh_token, google_drive_access_token, google_drive_token_expiry')
        .eq('role', 'admin')
        .not('google_drive_refresh_token', 'is', null) // Ensure the admin has a token
        .limit(1)
        .single();

      if (adminError || !adminProfile) {
        throw new Error('Your Google Drive is not connected, and no admin account is configured as a fallback. Please connect your account or contact an administrator.');
      }
      profile = adminProfile; // Use the admin's profile for the upload
    }

    // 4. Refresh the access token if it's expired or missing
    let accessToken = profile.google_drive_access_token;
    const isTokenExpired = !profile.google_drive_token_expiry || new Date() >= new Date(profile.google_drive_token_expiry);

    if (isTokenExpired) {
      const { clientId, clientSecret } = await getGoogleApiKeys(supabaseAdmin);
      const tokens = await refreshGoogleToken(profile.google_drive_refresh_token, clientId, clientSecret);
      
      accessToken = tokens.access_token;
      const expiryDate = new Date();
      expiryDate.setSeconds(expiryDate.getSeconds() + tokens.expires_in);

      // Update the tokens in the database for whichever account we are using (user or admin)
      await supabaseAdmin.from('profiles').update({
        google_drive_access_token: accessToken,
        google_drive_token_expiry: expiryDate.toISOString(),
      }).eq('id', profile.id);
    }

    // 5. Find or create the application folder in Google Drive
    const searchFolderUrl = `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.folder' and name='${APP_FOLDER_NAME}' and trashed=false&spaces=drive`;
    const searchResponse = await fetch(searchFolderUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const searchResult = await searchResponse.json();
    
    let folderId;
    if (searchResult.files && searchResult.files.length > 0) {
      folderId = searchResult.files[0].id;
    } else {
      const createFolderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: APP_FOLDER_NAME,
          mimeType: 'application/vnd.google-apps.folder',
        }),
      });
      const newFolder = await createFolderResponse.json();
      folderId = newFolder.id;
    }

    // 6. Upload the file using multipart upload
    const { fileName, fileType, fileData } = await req.json();
    const metadata = { name: fileName, parents: [folderId] };
    
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const close_delim = `\r\n--${boundary}--`;

    const body =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${fileType}\r\n` +
        'Content-Transfer-Encoding: base64\r\n\r\n' +
        fileData +
        close_delim;

    const uploadResponse = await fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: body,
    });

    const uploadedFile = await uploadResponse.json();
    if (!uploadResponse.ok) throw new Error(uploadedFile.error.message || 'File upload failed');

    // 7. Make the file publicly readable so it can be linked
    await fetch(`https://www.googleapis.com/drive/v3/files/${uploadedFile.id}/permissions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    });

    // 8. Get the web view link to store in the database
    const fileDetailsResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${uploadedFile.id}?fields=webViewLink`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const fileDetails = await fileDetailsResponse.json();

    return new Response(JSON.stringify({ webViewLink: fileDetails.webViewLink }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });

  } catch (error) {
    console.error('Upload to Drive error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
})