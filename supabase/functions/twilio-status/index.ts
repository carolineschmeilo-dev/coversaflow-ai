import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const callSid = formData.get('CallSid');
    const callStatus = formData.get('CallStatus');
    const from = formData.get('From');
    const to = formData.get('To');
    const duration = formData.get('CallDuration');

    console.log('Call status update:', {
      callSid,
      callStatus,
      from,
      to,
      duration
    });

    // Here you could store call logs in your database
    // For now, just log the status updates

    return new Response('OK', {
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error in twilio-status function:', error);
    return new Response('Error', {
      status: 500,
      headers: corsHeaders,
    });
  }
});