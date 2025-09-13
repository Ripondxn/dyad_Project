// @ts-ignore
/// <reference types="https://raw.githubusercontent.com/denoland/deno/main/cli/tsc/d.ts/lib.deno.d.ts" />

// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
// @ts-ignore
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.15.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// @ts-ignore
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not set in Supabase secrets.");
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

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
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { text, fileData, fileType } = await req.json();

    let promptContent;
    if (text) {
      promptContent = text;
    } else if (fileData && fileType) {
      promptContent = {
        inlineData: {
          data: fileData,
          mimeType: fileType,
        },
      };
    } else {
      return new Response(JSON.stringify({ error: 'No content provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = `
      Extract the following details from the provided content (text or image of a receipt/invoice):
      - Merchant name (customer)
      - Transaction date (in YYYY-MM-DD format)
      - Total amount (as a number, without currency symbols)
      - Document number (if available)
      - Document type (e.g., Invoice, Receipt, Bill)
      - Items description (a concise summary of the items or services, if available in the document body)

      Format the output as a JSON object with the keys: "customer", "date", "amount", "document", "type", "items_description".
      If a value is not found, use an empty string "" or null.
      The final output must be only the JSON object, with no other text or markdown formatting.
    `;

    const result = await model.generateContent([prompt, promptContent]);
    const response = await result.response;
    const aiText = response.text();
    
    const cleanedJsonString = aiText.replace(/```json\n/g, '').replace(/\n```/g, '').trim();
    const extractedData = JSON.parse(cleanedJsonString);

    return new Response(JSON.stringify({ extractedData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error processing transaction:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})