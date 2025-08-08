import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Globe, VolumeIcon, Send, Key } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "@/hooks/use-toast";

interface Translation {
  id: string;
  originalText: string;
  translatedText: string;
  speaker: "user" | "contact";
  timestamp: Date;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
}

interface RealTimeTranslatorProps {
  onEndCall?: () => void;
}

const languages = [
  { code: "en", name: "English", flag: "🇺🇸", speechLang: "en-US" },
  { code: "es", name: "Spanish", flag: "🇪🇸", speechLang: "es-ES" },
  { code: "fr", name: "French", flag: "🇫🇷", speechLang: "fr-FR" },
  { code: "de", name: "German", flag: "🇩🇪", speechLang: "de-DE" },
  { code: "it", name: "Italian", flag: "🇮🇹", speechLang: "it-IT" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹", speechLang: "pt-PT" },
  { code: "pt-BR", name: "Brazilian Portuguese", flag: "🇧🇷", speechLang: "pt-BR" },
  { code: "ru", name: "Russian", flag: "🇷🇺", speechLang: "ru-RU" },
  { code: "zh", name: "Chinese", flag: "🇨🇳", speechLang: "zh-CN" },
  { code: "ja", name: "Japanese", flag: "🇯🇵", speechLang: "ja-JP" },
  { code: "ko", name: "Korean", flag: "🇰🇷", speechLang: "ko-KR" },
];

export function RealTimeTranslator({ onEndCall }: RealTimeTranslatorProps) {
  const [isCallActive, setIsCallActive] = useState(true);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [userLanguage, setUserLanguage] = useState("en");
  const [contactLanguage, setContactLanguage] = useState("es");
  const [callDuration, setCallDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [manualText, setManualText] = useState("");
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  const speechRecognition = useSpeechRecognition();
  const { translate, isTranslating } = useTranslation();

  // Simulate call duration
  useEffect(() => {
    if (!isCallActive) return;
    
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isCallActive]);

  // Handle speech recognition results
  useEffect(() => {
    if (speechRecognition.finalTranscript) {
      handleNewSpeech(speechRecognition.finalTranscript, userLanguage, contactLanguage, "user");
      speechRecognition.resetTranscript();
    }
  }, [speechRecognition.finalTranscript, userLanguage, contactLanguage]);

  const handleNewSpeech = useCallback(async (
    text: string, 
    fromLang: string, 
    toLang: string, 
    speaker: "user" | "contact"
  ) => {
    if (!text.trim()) return;

    const translationId = Date.now().toString();
    
    // Add original message
    const originalTranslation: Translation = {
      id: translationId,
      originalText: text,
      translatedText: "",
      speaker,
      timestamp: new Date(),
      sourceLanguage: fromLang,
      targetLanguage: toLang,
      confidence: speechRecognition.confidence || 0.9,
    };

    setTranslations(prev => [...prev, originalTranslation]);

    // Translate the text
    try {
      const result = await translate(text, fromLang, toLang);
      
      // Update with translation
      setTranslations(prev => prev.map(t => 
        t.id === translationId 
          ? { ...t, translatedText: result.translatedText, confidence: result.confidence }
          : t
      ));

      // Speak the translation using ElevenLabs or browser TTS
      if (result.translatedText && result.translatedText !== text) {
        speakText(result.translatedText, toLang);
      }

    } catch (error) {
      toast({
        title: "Translation Error",
        description: "Failed to translate text. Please try again.",
        variant: "destructive",
      });
    }
  }, [translate, speechRecognition.confidence]);

  const speakText = useCallback(async (text: string, language: string) => {
    if (!text) return;

    try {
      // Try ElevenLabs if API key is provided
      if (elevenLabsApiKey) {
        // For now, we'll use browser TTS as ElevenLabs requires more setup
        // TODO: Implement ElevenLabs TTS with the provided API key
      }
      
      // Fallback to browser TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        const voice = speechSynthesis.getVoices().find(v => v.lang.startsWith(language));
        if (voice) utterance.voice = voice;
        utterance.volume = volume;
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('TTS error:', error);
    }
  }, [elevenLabsApiKey, volume]);

  const startListening = useCallback(() => {
    const lang = languages.find(l => l.code === userLanguage)?.speechLang || "en-US";
    speechRecognition.startListening(lang, true);
  }, [userLanguage, speechRecognition.startListening]);

  const handleManualSubmit = useCallback(() => {
    if (manualText.trim()) {
      handleNewSpeech(manualText, userLanguage, contactLanguage, "user");
      setManualText("");
    }
  }, [manualText, userLanguage, contactLanguage, handleNewSpeech]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    speechRecognition.stopListening();
    onEndCall?.();
  };

  const getLanguageName = (code: string) => {
    return languages.find(lang => lang.code === code)?.name || code;
  };

  const getLanguageFlag = (code: string) => {
    return languages.find(lang => lang.code === code)?.flag || "🌐";
  };

  if (!speechRecognition.isSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card p-4 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-destructive">Speech Recognition Not Supported</h2>
          <p className="text-muted-foreground mb-4">
            Your browser doesn't support speech recognition. Please use Chrome, Safari, or Edge for the best experience.
          </p>
          <Button onClick={onEndCall}>Go Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            CoversaFlow.AI - Live
          </h1>
          <p className="text-muted-foreground">
            Real-time speech translation powered by AI
          </p>
        </div>

        {/* Call Status */}
        <Card className="p-6 bg-gradient-to-r from-card to-muted/20 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={cn(
                "w-4 h-4 rounded-full animate-pulse",
                isCallActive ? "bg-success" : "bg-destructive"
              )} />
              <span className="text-lg font-semibold">
                {isCallActive ? "Live Translation Active" : "Session Ended"}
              </span>
              <Badge variant="secondary">
                {formatDuration(callDuration)}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                {getLanguageFlag(userLanguage)} ↔ {getLanguageFlag(contactLanguage)}
              </span>
            </div>
          </div>
        </Card>

        {/* ElevenLabs API Key Input */}
        {showApiKeyInput && (
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4" />
                <h3 className="font-semibold">ElevenLabs API Key (Optional)</h3>
              </div>
              <div className="flex space-x-2">
                <Input
                  type="password"
                  placeholder="Enter your ElevenLabs API key for premium voice quality"
                  value={elevenLabsApiKey}
                  onChange={(e) => setElevenLabsApiKey(e.target.value)}
                />
                <Button 
                  variant="outline" 
                  onClick={() => setShowApiKeyInput(false)}
                >
                  Hide
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your free API key at elevenlabs.io. Without it, we'll use browser TTS.
              </p>
            </div>
          </Card>
        )}

        {/* Language Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-primary">Your Language</h3>
              <Select value={userLanguage} onValueChange={setUserLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="p-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-accent">Translate To</h3>
              <Select value={contactLanguage} onValueChange={setContactLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>
        </div>

        {/* Manual Text Input */}
        <Card className="p-4">
          <div className="space-y-3">
            <h3 className="font-semibold">Type to Translate</h3>
            <div className="flex space-x-2">
              <Input
                placeholder="Type your message here..."
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
              />
              <Button onClick={handleManualSubmit} disabled={!manualText.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Speech Recognition Status */}
        {speechRecognition.isListening && (
          <Card className="p-4 bg-primary/10 border-primary/30">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
              <span className="font-medium">Listening...</span>
              {speechRecognition.interimTranscript && (
                <span className="text-muted-foreground italic">
                  "{speechRecognition.interimTranscript}"
                </span>
              )}
            </div>
          </Card>
        )}

        {/* Translation Display */}
        <Card className="p-6 h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Live Translation</h3>
            {isTranslating && (
              <Badge variant="secondary" className="animate-pulse">
                Translating...
              </Badge>
            )}
          </div>
          <div className="space-y-4">
            {translations.map((translation) => (
              <div 
                key={translation.id} 
                className={cn(
                  "animate-fade-in p-4 rounded-lg space-y-3",
                  translation.speaker === "user" 
                    ? "bg-primary/10 ml-8" 
                    : "bg-accent/10 mr-8"
                )}
              >
                <div className="flex items-center justify-between">
                  <Badge variant={translation.speaker === "user" ? "default" : "secondary"}>
                    {translation.speaker === "user" ? "You" : "Contact"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {translation.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {/* Original Speech */}
                  <div className="p-3 bg-muted/30 rounded-md">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        Original:
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {getLanguageFlag(translation.sourceLanguage)} {getLanguageName(translation.sourceLanguage)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(translation.confidence * 100)}% confidence
                      </Badge>
                    </div>
                    <p className="font-medium">"{translation.originalText}"</p>
                  </div>

                  {/* Translation */}
                  {translation.translatedText ? (
                    <div className="p-3 bg-success/10 border border-success/20 rounded-md">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium text-success">
                          Translation:
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {getLanguageFlag(translation.targetLanguage)} {getLanguageName(translation.targetLanguage)}
                        </Badge>
                      </div>
                      <p className="font-medium text-success-foreground">
                        {translation.translatedText}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-warning/10 rounded-md border border-warning/20">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-warning border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-medium text-warning">
                          Translating to {getLanguageName(translation.targetLanguage)}...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {translations.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Mic className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Ready to translate your speech</p>
                <p className="text-sm">Click the microphone to start speaking or type a message</p>
              </div>
            )}
          </div>
        </Card>

        {/* Audio Controls */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <VolumeIcon className="w-4 h-4" />
              <span className="text-sm font-medium">TTS Volume: {Math.round(volume * 100)}%</span>
            </div>
            <Slider
              value={[volume]}
              onValueChange={(value) => setVolume(value[0])}
              max={1}
              min={0}
              step={0.1}
              className="w-full max-w-xs mx-auto"
            />
            <div className="flex justify-center space-x-2 mt-4">
              {!showApiKeyInput && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiKeyInput(true)}
                >
                  <Key className="w-4 h-4 mr-2" />
                  ElevenLabs Setup
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Call Controls */}
        <Card className="p-6">
          <div className="flex items-center justify-center space-x-6">
            <Button
              variant={speechRecognition.isListening ? "default" : "secondary"}
              size="lg"
              onClick={speechRecognition.isListening ? speechRecognition.stopListening : startListening}
              className="rounded-full p-4"
            >
              {speechRecognition.isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>

            <Button
              variant="destructive"
              size="lg"
              onClick={handleEndCall}
              className="rounded-full p-4"
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
          </div>
          
          <div className="text-center mt-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              {speechRecognition.isListening ? "Tap microphone to stop listening" : "Tap microphone to start speaking"}
            </p>
            {speechRecognition.error && (
              <p className="text-sm text-destructive">{speechRecognition.error}</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}