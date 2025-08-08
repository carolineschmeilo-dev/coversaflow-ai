import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ElevenLabsTTSOptions {
  text: string;
  language?: string;
  voiceId?: string;
  audioSample?: string; // Base64 encoded audio sample for gender detection
}

interface UseElevenLabsTTSReturn {
  speak: (options: ElevenLabsTTSOptions) => Promise<void>;
  isPlaying: boolean;
  stopSpeaking: () => void;
  error: string | null;
  detectedGender?: 'male' | 'female' | 'unknown';
}

export const useElevenLabsTTS = (): UseElevenLabsTTSReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [detectedGender, setDetectedGender] = useState<'male' | 'female' | 'unknown'>('unknown');

  const stopSpeaking = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    setIsPlaying(false);
  }, [currentAudio]);

  const speak = useCallback(async ({ text, language = 'en', voiceId, audioSample }: ElevenLabsTTSOptions) => {
    console.log('ElevenLabs TTS called with:', { text, language, voiceId, hasAudioSample: !!audioSample });
    if (!text.trim()) return;

    setError(null);
    
    // Stop any currently playing audio
    stopSpeaking();

    try {
      setIsPlaying(true);

      console.log('Calling detect-gender-and-tts function...');
      const { data, error: functionError } = await supabase.functions.invoke('detect-gender-and-tts', {
        body: { text, language, voiceId, audioSample }
      });

      console.log('Supabase function response:', { data, functionError });

      if (functionError) {
        console.error('Supabase function error:', functionError);
        throw new Error(functionError.message);
      }

      if (!data.audioContent) {
        console.error('No audio data in response:', data);
        throw new Error('No audio data received');
      }

      // Update detected gender if provided
      if (data.detectedGender) {
        setDetectedGender(data.detectedGender);
        console.log('Gender detected:', data.detectedGender);
      }

      // Create audio blob from base64
      console.log('Creating audio blob from base64 data...');
      const audioBytes = Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0));
      const audioBlob = new Blob([audioBytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio
      console.log('Creating audio element and attempting to play...');
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);

      audio.onended = () => {
        console.log('Audio playback ended');
        setIsPlaying(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setError('Failed to play audio');
        setIsPlaying(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
      };

      console.log('Starting audio playback...');
      await audio.play();
      console.log('Audio playback started successfully');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate speech';
      setError(errorMessage);
      setIsPlaying(false);
      console.error('ElevenLabs TTS error:', err);
    }
  }, [stopSpeaking]);

  return {
    speak,
    isPlaying,
    stopSpeaking,
    error,
    detectedGender
  };
};