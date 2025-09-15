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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1. Authenticate user and get their profile with Google tokens
    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('User not found');

    const supabaseAdmin = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('google_drive_refresh_token, google_drive_access_token, google_drive_token_expiry')
      .eq('id', user.id)
      .single();

    if (profileError || !profile.google_drive_refresh_token) {
      throw new Error('Google Drive is not connected for this user.');
    }

    // 2. Refresh access token if it's expired
    let accessToken = profile.google_drive_access_token;
    if (new Date() >= new Date(profile.google_drive_token_expiry)) {
      const { data: keys, error: keysError } = await supabaseAdmin
        .from('api_keys')
        .select('service_name, key_value')
        .in('service_name', ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET']);
      if (keysError) throw keysError;

      const clientId = keys.find(k => k.service_name === 'GOOGLE_CLIENT_ID')?.key_value;
      const clientSecret = keys.find(k => k.service_name === 'GOOGLE_CLIENT_SECRET')?.key_value;

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: profile.google_drive_refresh_token,
          grant_type: 'refresh_token',
        }),
      });
      const tokens = await response.json();
      if (!response.ok) throw new Error(tokens.error_description || 'Failed to refresh token');
      
      accessToken = tokens.access_token;
      const expiryDate = new Date();
      expiryDate.setSeconds(expiryDate.getSeconds() + tokens.expires_in);

      await supabaseAdmin.from('profiles').update({
        google_drive_access_token: accessToken,
        google_drive_token_expiry: expiryDate.toISOString(),
      }).eq('id', user.id);
    }

    // 3. Find or create the application folder in Google Drive
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

    // 4. Upload the file
    const { fileName, fileType, fileData } = await req.json();
    const metadata = { name: fileName, parents: [folderId] };
    
    // Using multipart upload
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

    // 5. Make the file publicly readable (or get a shareable link)
    await fetch(`https://www.googleapis.com/drive/v3/files/${uploadedFile.id}/permissions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    });

    // 6. Get the web view link
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