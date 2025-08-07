import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Globe, VolumeIcon, AlertTriangle, Shield, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTranslation } from "@/hooks/useTranslation";
import { usePhoneCallIntegration } from "@/hooks/usePhoneCallIntegration";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { toast } from "@/hooks/use-toast";

interface Translation {
  id: string;
  originalText: string;
  translatedText: string;
  speaker: "caller" | "receiver";
  timestamp: Date;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  audioProcessed: boolean;
}

interface PhoneCallTranslatorProps {
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

export function PhoneCallTranslator({ onEndCall }: PhoneCallTranslatorProps) {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [callerLanguage, setCallerLanguage] = useState("en");
  const [receiverLanguage, setReceiverLanguage] = useState("es");
  const [volume, setVolume] = useState(0.8);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  const speechRecognition = useSpeechRecognition();
  const { translate, isTranslating } = useTranslation();
  const elevenLabsTTS = useElevenLabsTTS();
  const phoneIntegration = usePhoneCallIntegration();

  const requestPermissions = useCallback(async () => {
    try {
      const granted = await phoneIntegration.requestPermissions();
      setPermissionsGranted(granted);
      
      if (granted) {
        await phoneIntegration.setupCallIntegration();
        setIsSetupComplete(true);
        toast({
          title: "Permissions Granted",
          description: "Phone call integration is ready to use.",
        });
      }
    } catch (error) {
      toast({
        title: "Permission Error",
        description: "Failed to get required permissions.",
        variant: "destructive",
      });
    }
  }, [phoneIntegration]);

  const speakTranslationDuringCall = useCallback(async (text: string, language: string) => {
    if (!text || !phoneIntegration.callState.isActive) {
      console.log('Not speaking - no text or call not active:', { text, isActive: phoneIntegration.callState.isActive });
      return;
    }

    try {
      console.log('Speaking translation with ElevenLabs:', { text, language });
      await elevenLabsTTS.speak({ 
        text, 
        language,
      });
      console.log('ElevenLabs TTS completed successfully');
    } catch (error) {
      console.error('ElevenLabs TTS failed, falling back to browser speech:', error);
      
      // Fallback to browser speech synthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        const voice = speechSynthesis.getVoices().find(v => v.lang.startsWith(language));
        if (voice) utterance.voice = voice;
        utterance.volume = volume;
        utterance.rate = 0.9;
        
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
        console.log('Browser speech synthesis started as fallback');
      }
    }
  }, [elevenLabsTTS, phoneIntegration.callState.isActive, volume]);

  const handleNewSpeech = useCallback(async (
    text: string, 
    fromLang: string, 
    toLang: string, 
    speaker: "caller" | "receiver"
  ) => {
    console.log('handleNewSpeech called with:', { text, fromLang, toLang, speaker });
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
      audioProcessed: true,
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

      // Speak the translation during the call
      console.log('Translation result:', result);
      if (result.translatedText && result.translatedText !== text) {
        console.log('Attempting to speak translation:', result.translatedText, toLang);
        speakTranslationDuringCall(result.translatedText, toLang);
      } else {
        console.log('No translation to speak - text unchanged or empty');
      }

    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: "Translation Error",
        description: "Failed to translate speech.",
        variant: "destructive",
      });
    }
  }, [translate, speechRecognition.confidence, speakTranslationDuringCall]);

  // Listen for speech recognition results and trigger translation
  useEffect(() => {
    console.log('Speech recognition state:', {
      finalTranscript: speechRecognition.finalTranscript,
      isListening: speechRecognition.isListening,
      isCallActive: phoneIntegration.callState.isActive,
      transcript: speechRecognition.transcript,
      interimTranscript: speechRecognition.interimTranscript
    });
    
    if (speechRecognition.finalTranscript && phoneIntegration.callState.isActive) {
      console.log('Triggering translation for:', speechRecognition.finalTranscript);
      handleNewSpeech(
        speechRecognition.finalTranscript,
        callerLanguage,
        receiverLanguage,
        "caller"
      );
      // Reset the transcript after processing
      speechRecognition.resetTranscript();
    }
  }, [speechRecognition.finalTranscript, phoneIntegration.callState.isActive, callerLanguage, receiverLanguage, handleNewSpeech, speechRecognition.resetTranscript]);

  const startPhoneCallTranslation = useCallback(async () => {
    if (!isSetupComplete) {
      await requestPermissions();
      return;
    }

    try {
      await phoneIntegration.startCallRecording();
      
      // Start speech recognition for caller's side
      const lang = languages.find(l => l.code === callerLanguage)?.speechLang || "en-US";
      console.log('Starting speech recognition with language:', lang);
      speechRecognition.startListening(lang, true);

      toast({
        title: "Call Translation Active",
        description: "Your phone call is now being translated in real-time.",
      });
    } catch (error) {
      toast({
        title: "Failed to Start",
        description: "Could not start phone call translation.",
        variant: "destructive",
      });
    }
  }, [isSetupComplete, requestPermissions, phoneIntegration, callerLanguage, speechRecognition]);

  const stopPhoneCallTranslation = useCallback(() => {
    phoneIntegration.stopCallRecording();
    speechRecognition.stopListening();
    elevenLabsTTS.stopSpeaking();
    
    toast({
      title: "Translation Stopped",
      description: "Phone call translation has been ended.",
    });
  }, [phoneIntegration, speechRecognition, elevenLabsTTS]);

  const handleEndCall = () => {
    stopPhoneCallTranslation();
    onEndCall?.();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getLanguageName = (code: string) => {
    return languages.find(lang => lang.code === code)?.name || code;
  };

  const getLanguageFlag = (code: string) => {
    return languages.find(lang => lang.code === code)?.flag || "🌐";
  };

  // Show setup screen if not supported
  if (!phoneIntegration.isSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card p-4 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Smartphone className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-4">Mobile App Required</h2>
          <p className="text-muted-foreground mb-6">
            Phone call integration requires the native mobile app. Please install the app on your iOS or Android device.
          </p>
          <div className="space-y-3">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Export this project to GitHub and build the mobile app using Capacitor.
              </AlertDescription>
            </Alert>
            <Button onClick={onEndCall} variant="outline" className="w-full">
              Use Regular Translation Instead
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Show permissions screen
  if (!permissionsGranted || !isSetupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card p-4 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Shield className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-4">Setup Phone Integration</h2>
          <p className="text-muted-foreground mb-6">
            To translate phone calls in real-time, we need access to your microphone and call audio.
          </p>
          
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Required Permissions:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Microphone access</li>
                  <li>• Call audio recording</li>
                  <li>• Speech recognition</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button 
              onClick={requestPermissions} 
              className="w-full"
              disabled={!phoneIntegration.isSupported}
            >
              Grant Permissions & Setup
            </Button>

            <Button onClick={onEndCall} variant="outline" className="w-full">
              Cancel
            </Button>
          </div>

          {phoneIntegration.error && (
            <Alert className="mt-4" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {phoneIntegration.error}
              </AlertDescription>
            </Alert>
          )}
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
            📞 Live Phone Translation
          </h1>
          <p className="text-muted-foreground">
            Real-time translation during active phone calls
          </p>
        </div>

        {/* Call Status */}
        <Card className="p-6 bg-gradient-to-r from-card to-muted/20 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={cn(
                "w-4 h-4 rounded-full animate-pulse",
                phoneIntegration.callState.isActive ? "bg-success" : "bg-muted"
              )} />
              <span className="text-lg font-semibold">
                {phoneIntegration.callState.isActive ? "Phone Call Translation Active" : "Ready to Translate Calls"}
              </span>
              {phoneIntegration.callState.isActive && (
                <Badge variant="secondary">
                  {formatDuration(phoneIntegration.callState.callDuration)}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                {getLanguageFlag(callerLanguage)} ↔ {getLanguageFlag(receiverLanguage)}
              </span>
            </div>
          </div>
        </Card>

        {/* Language Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-primary">Your Language (Caller)</h3>
              <Select value={callerLanguage} onValueChange={setCallerLanguage}>
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
              <h3 className="font-semibold text-accent">Other Person's Language</h3>
              <Select value={receiverLanguage} onValueChange={setReceiverLanguage}>
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

        {/* Instructions */}
        <Card className="p-6 bg-gradient-to-r from-warning/10 to-primary/10 border-warning/20">
          <h3 className="font-semibold mb-3 flex items-center">
            <Smartphone className="w-5 h-5 mr-2" />
            How to Use Phone Call Translation
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <Badge variant="outline">Step 1</Badge>
              <p>Start your phone call normally</p>
            </div>
            <div className="space-y-2">
              <Badge variant="outline">Step 2</Badge>
              <p>Tap "Start Translation" below</p>
            </div>
            <div className="space-y-2">
              <Badge variant="outline">Step 3</Badge>
              <p>Translation audio plays through speaker</p>
            </div>
          </div>
        </Card>

        {/* Speech Recognition Status */}
        {speechRecognition.isListening && (
          <Card className="p-4 bg-primary/10 border-primary/30">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
              <span className="font-medium">Listening to call audio...</span>
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
            <h3 className="font-semibold">Call Translation History</h3>
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
                  translation.speaker === "caller" 
                    ? "bg-primary/10 ml-8" 
                    : "bg-accent/10 mr-8"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant={translation.speaker === "caller" ? "default" : "secondary"}>
                      {translation.speaker === "caller" ? "You" : "Them"}
                    </Badge>
                    {translation.audioProcessed && (
                      <Badge variant="outline" className="text-xs">
                        📞 From Call
                      </Badge>
                    )}
                  </div>
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
                    </div>
                    <p className="font-medium">"{translation.originalText}"</p>
                  </div>

                  {/* Translation */}
                  {translation.translatedText ? (
                    <div className="p-3 bg-success/10 border border-success/20 rounded-md">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium text-success">
                          Spoken Translation:
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
                          Translating and speaking...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {translations.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Ready to translate your phone call</p>
                <p className="text-sm">Start a call and begin translation to see results here</p>
              </div>
            )}
          </div>
        </Card>

        {/* Audio Controls */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <VolumeIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Translation Volume: {Math.round(volume * 100)}%</span>
            </div>
            <Slider
              value={[volume]}
              onValueChange={(value) => setVolume(value[0])}
              max={1}
              min={0}
              step={0.1}
              className="w-full max-w-xs mx-auto"
            />
          </div>
        </Card>

        {/* Call Controls */}
        <Card className="p-6">
          <div className="flex items-center justify-center space-x-6">
            <Button
              variant={phoneIntegration.callState.isActive ? "destructive" : "default"}
              size="lg"
              onClick={phoneIntegration.callState.isActive ? stopPhoneCallTranslation : startPhoneCallTranslation}
              className="rounded-full px-8 py-4"
            >
              {phoneIntegration.callState.isActive ? (
                <>
                  <MicOff className="w-6 h-6 mr-2" />
                  Stop Translation
                </>
              ) : (
                <>
                  <Mic className="w-6 h-6 mr-2" />
                  Start Translation
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={handleEndCall}
              className="rounded-full px-8 py-4"
            >
              <PhoneOff className="w-6 h-6 mr-2" />
              Exit
            </Button>
          </div>
          
          <div className="text-center mt-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              {phoneIntegration.callState.isActive 
                ? "Translation is active - translations will be spoken aloud during your call" 
                : "Make sure you're on a phone call before starting translation"}
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