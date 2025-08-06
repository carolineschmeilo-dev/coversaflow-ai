import { useState, useCallback, useEffect } from 'react';

interface TextToSpeechOptions {
  text: string;
  language?: string;
  voiceId?: string;
}

// Language to voice mapping for better pronunciation
const LANGUAGE_VOICE_MAP: Record<string, string[]> = {
  'en': ['en-US', 'en-GB', 'en-AU'],
  'es': ['es-ES', 'es-MX', 'es-AR'],
  'fr': ['fr-FR', 'fr-CA'],
  'de': ['de-DE', 'de-AT'],
  'it': ['it-IT'],
  'pt': ['pt-BR', 'pt-PT'],
  'ru': ['ru-RU'],
  'zh': ['zh-CN', 'zh-TW'],
  'ja': ['ja-JP'],
  'ko': ['ko-KR'],
  'ar': ['ar-SA'],
  'hi': ['hi-IN'],
  'nl': ['nl-NL'],
  'sv': ['sv-SE'],
  'no': ['no-NO'],
  'da': ['da-DK'],
  'fi': ['fi-FI'],
  'pl': ['pl-PL'],
  'tr': ['tr-TR'],
  'th': ['th-TH'],
  'vi': ['vi-VN'],
};

export const useTextToSpeech = () => {
  console.log("useTextToSpeech hook initializing");
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices);
      console.log("Available voices:", voices.map(v => `${v.name} (${v.lang})`));
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Find best voice for a given language
  const findBestVoice = useCallback((language: string): SpeechSynthesisVoice | null => {
    if (!language || availableVoices.length === 0) return null;

    const preferredLangs = LANGUAGE_VOICE_MAP[language] || [language];
    
    // Try to find exact match first
    for (const prefLang of preferredLangs) {
      const exactMatch = availableVoices.find(voice => 
        voice.lang.toLowerCase() === prefLang.toLowerCase()
      );
      if (exactMatch) return exactMatch;
    }

    // Try partial match (e.g., 'es' matches 'es-ES')
    for (const prefLang of preferredLangs) {
      const partialMatch = availableVoices.find(voice => 
        voice.lang.toLowerCase().startsWith(prefLang.split('-')[0])
      );
      if (partialMatch) return partialMatch;
    }

    return null;
  }, [availableVoices]);

  const speak = useCallback(async ({ text, language = 'en' }: TextToSpeechOptions) => {
    try {
      console.log("Speaking text:", text, "in language:", language);
      
      // Stop any ongoing speech
      speechSynthesis.cancel();
      setIsPlaying(true);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = volume;
      utterance.rate = 1.2; // Faster speech rate
      utterance.pitch = 1.0;

      // Set appropriate voice for the language
      const bestVoice = findBestVoice(language);
      if (bestVoice) {
        utterance.voice = bestVoice;
        utterance.lang = bestVoice.lang;
        console.log("Using voice:", bestVoice.name, "for language:", language);
      } else {
        utterance.lang = language;
        console.log("No specific voice found, using default for language:", language);
      }
      
      return new Promise<void>((resolve) => {
        utterance.onend = () => {
          setIsPlaying(false);
          resolve();
        };
        utterance.onerror = (error) => {
          console.error("Speech synthesis error:", error);
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
  }, [volume, findBestVoice]);

  const speakInLanguage = useCallback((text: string, language: string) => {
    return speak({ text, language });
  }, [speak]);

  const stopSpeaking = useCallback(() => {
    speechSynthesis.cancel();
    setIsPlaying(false);
  }, []);

  const setAudioVolume = useCallback((newVolume: number) => {
    setVolume(Math.max(0, Math.min(1, newVolume)));
  }, []);

  return {
    speak,
    speakInLanguage,
    stopSpeaking,
    isPlaying,
    volume,
    setVolume: setAudioVolume,
    availableVoices,
  };
};