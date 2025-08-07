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
    if (!text.trim()) return;

    setError(null);
    
    // Stop any currently playing audio
    stopSpeaking();

    try {
      setIsPlaying(true);

      const { data, error: functionError } = await supabase.functions.invoke('elevenlabs-tts', {
        body: { text, language, voiceId }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!data.audio) {
        throw new Error('No audio data received');
      }

      // Create audio blob from base64
      const audioBytes = Uint8Array.from(atob(data.audio), c => c.charCodeAt(0));
      const audioBlob = new Blob([audioBytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setError('Failed to play audio');
        setIsPlaying(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();

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