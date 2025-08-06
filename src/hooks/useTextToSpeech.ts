import { useState, useCallback } from 'react';

interface TextToSpeechOptions {
  text: string;
  voiceId?: string;
  modelId?: string;
}

export const useTextToSpeech = () => {
  console.log("useTextToSpeech hook initializing");
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);

  const speak = useCallback(async ({ text }: TextToSpeechOptions) => {
    try {
      console.log("Speaking text:", text);
      setIsPlaying(true);

      // Use browser's built-in speech synthesis for now
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = volume;
      utterance.rate = 0.9;
      
      return new Promise<void>((resolve) => {
        utterance.onend = () => {
          setIsPlaying(false);
          resolve();
        };
        utterance.onerror = () => {
          setIsPlaying(false);
          resolve();
        };
        speechSynthesis.speak(utterance);
      });
    } catch (error) {
      setIsPlaying(false);
      console.error('Text-to-speech error:', error);
      throw error;
    }
  }, [volume]);

  const speakAsCallerVoice = useCallback((text: string) => {
    return speak({ text });
  }, [speak]);

  const speakAsReceiverVoice = useCallback((text: string) => {
    return speak({ text });
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