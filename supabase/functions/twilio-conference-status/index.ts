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
    const conferenceSid = formData.get('ConferenceSid');
    const statusCallbackEvent = formData.get('StatusCallbackEvent');
    const conferenceName = formData.get('FriendlyName');
    const participantCount = formData.get('ParticipantCount');

    console.log('Conference status update:', {
      conferenceSid,
      statusCallbackEvent,
      conferenceName,
      participantCount
    });

    // Here you could handle conference events like:
    // - Conference started/ended
    // - Participants joined/left
    // - Update UI in real-time via WebSocket or polling

    return new Response('OK', {
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error in twilio-conference-status function:', error);
    return new Response('Error', {
      status: 500,
      headers: corsHeaders,
    });
  }
});