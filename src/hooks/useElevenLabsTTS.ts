import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ElevenLabsTTSOptions {
  text: string;
  language?: string;
  voiceId?: string;
}

interface UseElevenLabsTTSReturn {
  speak: (options: ElevenLabsTTSOptions) => Promise<void>;
  isPlaying: boolean;
  stopSpeaking: () => void;
  error: string | null;
}

export const useElevenLabsTTS = (): UseElevenLabsTTSReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  const stopSpeaking = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
    }
    setIsPlaying(false);
  }, [currentAudio]);

  const speak = useCallback(async ({ text, language = 'en', voiceId }: ElevenLabsTTSOptions) => {
    console.log('ElevenLabs TTS called with:', { text, language, voiceId });
    if (!text.trim()) return;

    setError(null);
    
    // Stop any currently playing audio
    stopSpeaking();

    try {
      setIsPlaying(true);

      console.log('Calling Supabase function...');
      const { data, error: functionError } = await supabase.functions.invoke('elevenlabs-tts', {
        body: { text, language, voiceId }
      });

      console.log('Supabase function response:', { data, functionError });

      if (functionError) {
        console.error('Supabase function error:', functionError);
        throw new Error(functionError.message);
      }

      if (!data.audio) {
        console.error('No audio data in response:', data);
        throw new Error('No audio data received');
      }

      // Create audio blob from base64
      console.log('Creating audio blob from base64 data...');
      const audioBytes = Uint8Array.from(atob(data.audio), c => c.charCodeAt(0));
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
    error
  };
};