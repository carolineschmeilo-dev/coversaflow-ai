import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TextToSpeechOptions {
  text: string;
  voiceId?: string;
  modelId?: string;
}

const VOICE_IDS = {
  caller: 'TX3LPaxmHKxFdv7VOQHJ', // Liam - male voice for caller
  receiver: 'EXAVITQu4vr4xnSDxMaL', // Sarah - female voice for receiver
} as const;

export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);

  const speak = useCallback(async ({ text, voiceId, modelId }: TextToSpeechOptions) => {
    try {
      setIsPlaying(true);

      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text,
          voiceId: voiceId || VOICE_IDS.caller,
          modelId: modelId || 'eleven_turbo_v2_5'
        }
      });

      if (error) throw error;

      // Convert the response to audio blob
      const audioBlob = new Blob([data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audio.volume = volume;
      
      return new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setIsPlaying(false);
          resolve();
        };
        
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          setIsPlaying(false);
          reject(new Error('Audio playback failed'));
        };
        
        audio.play().catch(reject);
      });
    } catch (error) {
      setIsPlaying(false);
      console.error('Text-to-speech error:', error);
      throw error;
    }
  }, [volume]);

  const speakAsCallerVoice = useCallback((text: string) => {
    return speak({ text, voiceId: VOICE_IDS.caller });
  }, [speak]);

  const speakAsReceiverVoice = useCallback((text: string) => {
    return speak({ text, voiceId: VOICE_IDS.receiver });
  }, [speak]);

  const setAudioVolume = useCallback((newVolume: number) => {
    setVolume(Math.max(0, Math.min(1, newVolume)));
  }, []);

  return {
    speak,
    speakAsCallerVoice,
    speakAsReceiverVoice,
    isPlaying,
    volume,
    setVolume: setAudioVolume,
  };
};