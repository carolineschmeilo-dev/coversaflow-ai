import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, language = 'en', voiceId = 'EXAVITQu4vr4xnSDxMaL' } = await req.json()

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY')
    if (!elevenLabsApiKey) {
      return new Response(
        JSON.stringify({ error: 'ElevenLabs API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Map language codes to appropriate voices
    const languageVoiceMap: Record<string, string> = {
      'en': 'EXAVITQu4vr4xnSDxMaL', // Sarah
      'es': 'pFZP5JQG7iQjIQuC4Bku', // Lily
      'fr': 'XB0fDUnXU5powFXDhCwa', // Charlotte
      'de': 'CwhRBWXzGAHq8TQ4Fs17', // Roger
      'it': 'FGY2WhTYpPnrIDTdsKH5', // Laura
      'pt': 'cgSgspJ2msm6clMCkdW9', // Jessica
      'pt-BR': 'cgSgspJ2msm6clMCkdW9', // Jessica
      'ru': 'N2lVS1w4EtoT3dr4eOWO', // Callum
      'zh': 'SAz9YHcvj6GT2YYXdXww', // River
      'ja': 'TX3LPaxmHKxFdv7VOQHJ', // Liam
      'ko': 'bIHbv24MWmeRgasZH58o' // Will
    }

    const selectedVoiceId = languageVoiceMap[language] || voiceId

    // Call ElevenLabs API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs API error:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to generate speech' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const audioBuffer = await response.arrayBuffer()
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)))

    return new Response(
      JSON.stringify({ 
        audio: base64Audio,
        contentType: 'audio/mpeg'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in elevenlabs-tts function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})