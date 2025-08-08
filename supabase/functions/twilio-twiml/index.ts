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
    const url = new URL(req.url);
    const conference = url.searchParams.get('conference') || 'translation-room';
    
    console.log('Generating TwiML for conference:', conference);

    // Generate TwiML for conference call
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial>
        <Conference 
            statusCallback="https://rsgvdpxtwplrqwqdiisv.supabase.co/functions/v1/twilio-conference-status"
            statusCallbackEvent="start,end,join,leave"
            statusCallbackMethod="POST"
            record="true"
            recordingStatusCallback="https://rsgvdpxtwplrqwqdiisv.supabase.co/functions/v1/twilio-recording"
        >${conference}</Conference>
    </Dial>
</Response>`;

    return new Response(twiml, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/xml' 
      },
    });

  } catch (error) {
    console.error('Error in twilio-twiml function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});