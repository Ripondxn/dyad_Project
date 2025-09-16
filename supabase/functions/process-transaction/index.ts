// @ts-ignore
/// <reference types="https://raw.githubusercontent.com/denoland/deno/main/cli/tsc/d.ts/lib.deno.d.ts" />

// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
// @ts-ignore
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.15.0";
// @ts-ignore
import { encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  let fileToDelete: string | null = null;
  const supabaseAdmin = createClient(
    // @ts-ignore
    Deno.env.get('SUPABASE_URL') ?? '',
    // @ts-ignore
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: apiKeyData, error: apiKeyError } = await supabaseAdmin
      .from('api_keys').select('key_value').eq('service_name', 'GEMINI').single();
    if (apiKeyError || !apiKeyData) throw new Error('Could not retrieve Gemini API key.');

    const geminiApiKey = apiKeyData.key_value;
    if (!geminiApiKey || geminiApiKey === 'YOUR_GEMINI_API_KEY_GOES_HERE') {
        return new Response(JSON.stringify({ error: 'Gemini API key is not configured.' }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const { text, filePath, signedUrl } = await req.json();
    let promptContent;

    if (text) {
      promptContent = text;
    } else if (signedUrl && filePath) {
      fileToDelete = filePath;

      const fileResponse = await fetch(signedUrl);
      if (!fileResponse.ok) {
        throw new Error(`Failed to download file from secure link: ${fileResponse.statusText}`);
      }
      const fileBlob = await fileResponse.blob();

      const fileType = fileBlob.type;
      const fileData = encode(await fileBlob.arrayBuffer());

      promptContent = { inlineData: { data: fileData, mimeType: fileType } };
    } else {
      return new Response(JSON.stringify({ error: 'No content provided' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `
      Extract the following details from the provided content (text, image of a receipt/invoice, or an audio recording describing a transaction):
      - Merchant name (customer)
      - Transaction date (in YYYY-MM-DD format)
      - Total amount: Prioritize finding a numeric value labeled 'Grand Total', 'Total', or 'Total Amount'. If a clear numeric total is not available, use the amount written out in words. Extract it as a number, without currency symbols.
      - Document number (look for labels like 'Invoice #', 'Invoice No.', 'Receipt #', 'Bill No.', 'Document ID', etc. If available)
      - Document type (e.g., Invoice, Receipt, Bill)
      - Items description (a concise summary of the items or services, if available in the document body)

      Format the output as a JSON object with the keys: "customer", "date", "amount", "document", "type", "items_description".
      If a value is not found, use an empty string "" or null.
      The final output must be only the JSON object, with no other text or markdown formatting.
    `;

    const result = await model.generateContent([prompt, promptContent]);
    const response = await result.response;
    
    if (!response.candidates || response.candidates.length === 0) {
        const blockReason = response.promptFeedback?.blockReason;
        const safetyRatings = response.promptFeedback?.safetyRatings;
        console.error("Gemini response was blocked or had no candidates.", { blockReason, safetyRatings });
        
        let errorMessage = "The AI model returned an empty response.";
        if (blockReason) {
            errorMessage = `The request was blocked by the AI for safety reasons: ${blockReason}.`;
        } else if (safetyRatings && safetyRatings.length > 0) {
            errorMessage += ` Potential safety issues detected: ${JSON.stringify(safetyRatings)}`;
        }
        throw new Error(errorMessage);
    }

    const aiText = response.text();
    if (!aiText) {
        throw new Error("The AI model returned a valid response, but it contained no text to parse.");
    }
    
    let extractedData;
    try {
      const cleanedJsonString = aiText.replace(/```json\n/g, '').replace(/\n```/g, '').trim();
      extractedData = JSON.parse(cleanedJsonString);
    } catch (jsonError) {
      console.error("Failed to parse JSON from Gemini response:", aiText);
      throw new Error("AI model returned an invalid format. Could not parse transaction details.");
    }

    return new Response(JSON.stringify({ extractedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });

  } catch (error) {
    console.error('Error processing transaction:', error);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    });
  } finally {
    if (fileToDelete) {
      const { error: deleteError } = await supabaseAdmin.storage.from('transaction_uploads').remove([fileToDelete]);
      if (deleteError) {
        console.error(`CRITICAL: Failed to delete uploaded file ${fileToDelete}:`, deleteError.message);
      }
    }
  }
})