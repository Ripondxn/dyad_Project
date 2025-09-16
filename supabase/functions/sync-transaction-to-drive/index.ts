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
const CSV_FILE_NAME = 'transactions.csv';

// Helper to format a transaction object into a CSV row, handling commas and quotes
const toCsvRow = (transaction: any) => {
    const columns = [
        transaction.id || '',
        transaction.document || '',
        transaction.type || '',
        transaction.date || '',
        transaction.amount || '',
        transaction.customer || '',
        transaction.items_description || '',
        transaction.attachment_url || '',
    ];
    return columns.map(val => {
        const str = String(val ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    }).join(',');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1. Authenticate user
    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('User not found');

    const { transaction } = await req.json();
    if (!transaction) throw new Error('Transaction data is required.');

    const supabaseAdmin = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Get user's profile, or fallback to an admin's profile
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, google_drive_refresh_token, google_drive_access_token, google_drive_token_expiry')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    if (!profile.google_drive_refresh_token) {
      const { data: adminProfile, error: adminError } = await supabaseAdmin
        .from('profiles')
        .select('id, google_drive_refresh_token, google_drive_access_token, google_drive_token_expiry')
        .eq('role', 'admin')
        .not('google_drive_refresh_token', 'is', null)
        .limit(1)
        .single();

      if (adminError || !adminProfile) {
        throw new Error('Your Google Drive is not connected, and no admin account is configured as a fallback. Please connect your account or contact an administrator.');
      }
      profile = adminProfile;
    }

    // 3. Refresh access token if it's expired
    let accessToken = profile.google_drive_access_token;
    if (!profile.google_drive_token_expiry || new Date() >= new Date(profile.google_drive_token_expiry)) {
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
      }).eq('id', profile.id);
    }

    // 4. Find or create the application folder in Google Drive
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

    // 5. Find the transactions.csv file
    const searchFileUrl = `https://www.googleapis.com/drive/v3/files?q=name='${CSV_FILE_NAME}' and '${folderId}' in parents and trashed=false&fields=files(id)`;
    const searchFileResponse = await fetch(searchFileUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const searchFileResult = await searchFileResponse.json();
    const fileId = searchFileResult.files && searchFileResult.files.length > 0 ? searchFileResult.files[0].id : null;

    // 6. Create or update the file
    if (fileId) {
        // File exists: Append new data
        const downloadResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const existingContent = await downloadResponse.text();
        const newContent = existingContent.trimEnd() + '\n' + toCsvRow(transaction);

        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'text/csv' },
            body: newContent,
        });
    } else {
        // File doesn't exist: Create with header
        const header = "id,document,type,date,amount,customer,items_description,attachment_url\n";
        const newContent = header + toCsvRow(transaction);

        const metadata = { name: CSV_FILE_NAME, parents: [folderId], mimeType: 'text/csv' };
        
        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const close_delim = `\r\n--${boundary}--`;

        const body =
            delimiter +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            `Content-Type: text/csv\r\n\r\n` +
            newContent +
            close_delim;

        await fetch(`https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body: body,
        });
    }

    return new Response(JSON.stringify({ message: 'CSV updated successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });

  } catch (error) {
    console.error('Sync to Drive CSV error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  }
})