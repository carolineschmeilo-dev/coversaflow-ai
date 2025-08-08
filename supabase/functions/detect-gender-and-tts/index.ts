import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Voice mappings based on detected gender
const VOICE_MAPPINGS = {
  female: [
    'EXAVITQu4vr4xnSDxMaL', // Sarah
    '9BWtsMINqrJLrRacOk9x', // Aria  
    'FGY2WhTYpPnrIDTdsKH5', // Laura
    'XB0fDUnXU5powFXDhCwa', // Charlotte
    'Xb7hH8MSUJpSbSDYk0k2', // Alice
    'cgSgspJ2msm6clMCkdW9', // Jessica
    'pFZP5JQG7iQjIQuC4Bku', // Lily
  ],
  male: [
    'CwhRBWXzGAHq8TQ4Fs17', // Roger
    'IKne3meq5aSn9XLyUdCD', // Charlie
    'JBFqnCBsd6RMkjVDRZzb', // George
    'TX3LPaxmHKxFdv7VOQHJ', // Liam
    'bIHbv24MWmeRgasZH58o', // Will
    'cjVigY5qzO86Huf0OWal', // Eric
    'iP95p4xoKVk53GoZ742B', // Chris
    'onwK4e9ZLuTAKqWW03F9', // Daniel
  ]
};

// Simple gender detection based on audio characteristics
function detectGenderFromAudio(audioBuffer: ArrayBuffer): 'male' | 'female' {
  // Convert audio buffer to Float32Array for analysis
  const audioData = new Float32Array(audioBuffer.byteLength / 4);
  const dataView = new DataView(audioBuffer);
  
  for (let i = 0; i < audioData.length; i++) {
    audioData[i] = dataView.getFloat32(i * 4, true);
  }
  
  // Simple pitch detection algorithm
  // Calculate average frequency using zero-crossing analysis
  let zeroCrossings = 0;
  for (let i = 1; i < audioData.length; i++) {
    if ((audioData[i] >= 0) !== (audioData[i - 1] >= 0)) {
      zeroCrossings++;
    }
  }
  
  // Estimate fundamental frequency
  const sampleRate = 44100; // Assuming standard sample rate
  const estimatedFreq = (zeroCrossings * sampleRate) / (2 * audioData.length);
  
  // Gender classification based on typical voice frequency ranges
  // Female voices typically have higher fundamental frequencies (165-265 Hz)
  // Male voices typically have lower fundamental frequencies (85-180 Hz)
  if (estimatedFreq > 150) {
    return 'female';
  } else {
    return 'male';
  }
}

function selectVoiceForGender(gender: 'male' | 'female'): string {
  const voices = VOICE_MAPPINGS[gender];
  // Return a random voice from the appropriate gender category
  return voices[Math.floor(Math.random() * voices.length)];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, audioSample, language = 'en' } = await req.json();

    if (!text) {
      throw new Error('Text is required for TTS');
    }

    let selectedVoice = 'EXAVITQu4vr4xnSDxMaL'; // Default to Sarah

    // If audio sample is provided, detect gender and select appropriate voice
    if (audioSample) {
      try {
        console.log('Audio sample provided, detecting gender...');
        
        // Convert base64 audio to buffer
        const audioBuffer = Uint8Array.from(atob(audioSample), c => c.charCodeAt(0)).buffer;
        
        // Detect gender from audio sample
        const detectedGender = detectGenderFromAudio(audioBuffer);
        console.log('Detected gender:', detectedGender);
        
        // Select appropriate voice
        selectedVoice = selectVoiceForGender(detectedGender);
        console.log('Selected voice for', detectedGender, ':', selectedVoice);
        
      } catch (genderError) {
        console.error('Gender detection failed, using default voice:', genderError);
        // Continue with default voice if gender detection fails
      }
    }

    // Get ElevenLabs API key
    const elevenLabsApiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!elevenLabsApiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    console.log('Generating TTS with voice:', selectedVoice);

    // Call ElevenLabs TTS API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: true
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    // Convert audio response to base64
    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    return new Response(
      JSON.stringify({ 
        audioContent: audioBase64,
        detectedGender: audioSample ? (selectedVoice === VOICE_MAPPINGS.female[0] ? 'female' : 'male') : 'unknown',
        selectedVoice: selectedVoice
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in detect-gender-and-tts function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});