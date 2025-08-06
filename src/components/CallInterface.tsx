import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Globe, VolumeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { toast } from "@/hooks/use-toast";

interface Translation {
  id: string;
  originalText: string;
  translatedText: string;
  speaker: "caller" | "receiver";
  timestamp: Date;
  sourceLanguage: string;
  targetLanguage: string;
  showingOriginal: boolean; // For real-time effect
  showingTranslation: boolean; // For real-time effect
}

interface CallInterfaceProps {
  onEndCall?: () => void;
}

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
];

// Simulated conversation data for demo
const simulatedConversation = [
  { 
    speaker: "caller" as const, 
    originalText: "Hola, ¿cómo estás hoy?", // Caller speaks Spanish
    translatedText: "Hello, how are you today?", // Translated TO English for receiver
    sourceLanguage: "es",
    targetLanguage: "en"
  },
  { 
    speaker: "receiver" as const, 
    originalText: "Very well, thank you. And you?", // Receiver speaks English
    translatedText: "Muy bien, gracias. ¿Y tú?", // Translated TO Spanish for caller
    sourceLanguage: "en",
    targetLanguage: "es"
  },
  { 
    speaker: "caller" as const, 
    originalText: "Quería discutir el proyecto contigo.", // Caller speaks Spanish
    translatedText: "I wanted to discuss the project with you.", // Translated TO English
    sourceLanguage: "es",
    targetLanguage: "en"
  },
  { 
    speaker: "receiver" as const, 
    originalText: "Perfect, I'm ready to talk about that.", // Receiver speaks English
    translatedText: "Perfecto, estoy listo para hablar sobre eso.", // Translated TO Spanish
    sourceLanguage: "en",
    targetLanguage: "es"
  }
];

export function CallInterface({ onEndCall }: CallInterfaceProps) {
  console.log("CallInterface component rendering");
  
  const [isCallActive, setIsCallActive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [callerLanguage, setCallerLanguage] = useState("es"); // Caller speaks Spanish
  const [receiverLanguage, setReceiverLanguage] = useState("en"); // Receiver speaks English
  const [callDuration, setCallDuration] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [speakingQueue, setSpeakingQueue] = useState<string[]>([]);
  
  const { speakInLanguage, stopSpeaking, isPlaying, volume, setVolume } = useTextToSpeech();

  // Simulate call duration
  useEffect(() => {
    if (!isCallActive) return;
    
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isCallActive]);

  // Simulate real-time conversation with staged translation
  useEffect(() => {
    if (!isCallActive || currentMessageIndex >= simulatedConversation.length) return;

    const timeout = setTimeout(async () => {
      const message = simulatedConversation[currentMessageIndex];
      const translationId = Date.now().toString();
      
      // Step 1: Show original text first (what the person actually said)
      const originalTranslation: Translation = {
        id: translationId,
        originalText: message.originalText,
        translatedText: message.translatedText,
        speaker: message.speaker,
        timestamp: new Date(),
        sourceLanguage: message.sourceLanguage,
        targetLanguage: message.targetLanguage,
        showingOriginal: true,
        showingTranslation: false,
      };

      setTranslations(prev => [...prev, originalTranslation]);

      // Step 2: After 1.5 seconds, show "Translating..." and then the translation
      setTimeout(() => {
        setTranslations(prev => prev.map(t => 
          t.id === translationId 
            ? { ...t, showingTranslation: true }
            : t
        ));

        // Step 3: Play audio for the translation if enabled
        if (audioEnabled && isSpeakerOn && !isMuted) {
          setTimeout(async () => {
            try {
              setSpeakingQueue(prev => [...prev, translationId]);
              await speakInLanguage(message.translatedText, message.targetLanguage);
              setSpeakingQueue(prev => prev.filter(id => id !== translationId));
            } catch (error) {
              console.error("Audio playback failed:", error);
              setSpeakingQueue(prev => prev.filter(id => id !== translationId));
              toast({
                title: "Audio Error",
                description: "Failed to play audio. Check your connection.",
                variant: "destructive",
              });
            }
          }, 500); // Small delay before audio
        }
      }, 1500); // Translation appears after 1.5 seconds
      
      setCurrentMessageIndex(prev => prev + 1);
    }, 1000 + currentMessageIndex * 3000); // Stagger conversations

    return () => clearTimeout(timeout);
  }, [isCallActive, currentMessageIndex, audioEnabled, isSpeakerOn, isMuted, speakInLanguage]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    onEndCall?.();
  };

  const getLanguageName = (code: string) => {
    return languages.find(lang => lang.code === code)?.name || code;
  };

  const getLanguageFlag = (code: string) => {
    return languages.find(lang => lang.code === code)?.flag || "🌐";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Real-Time Call Translator
          </h1>
          <p className="text-muted-foreground">
            Breaking language barriers in real-time conversations
          </p>
        </div>

        {/* Call Status */}
        <Card className="p-6 bg-gradient-to-r from-card to-muted/20 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={cn(
                "w-4 h-4 rounded-full animate-pulse-glow",
                isCallActive ? "bg-success" : "bg-destructive"
              )} />
              <span className="text-lg font-semibold">
                {isCallActive ? "Call Active" : "Call Ended"}
              </span>
              <Badge variant="secondary">
                {formatDuration(callDuration)}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-primary" />
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
              <h3 className="font-semibold text-primary">Your Language</h3>
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
              <h3 className="font-semibold text-accent">Contact's Language</h3>
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

        {/* Translation Display */}
        <Card className="p-6 h-96 overflow-y-auto">
          <h3 className="font-semibold mb-4 text-center">Live Translation</h3>
          <div className="space-y-4">
            {translations.map((translation, index) => (
              <div 
                key={translation.id} 
                className={cn(
                  "animate-fade-in p-4 rounded-lg space-y-3 relative transition-all duration-300",
                  translation.speaker === "caller" 
                    ? "bg-primary/10 ml-8" 
                    : "bg-accent/10 mr-8",
                  speakingQueue.includes(translation.id) && "ring-2 ring-primary/50 bg-primary/20"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant={translation.speaker === "caller" ? "default" : "secondary"}>
                      {translation.speaker === "caller" ? "You" : "Contact"}
                    </Badge>
                    {speakingQueue.includes(translation.id) && (
                      <Badge variant="outline" className="animate-pulse">
                        🔊 Speaking
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {translation.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {/* Original Speech */}
                  {translation.showingOriginal && (
                    <div className="p-3 bg-muted/30 rounded-md">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          {translation.speaker === "caller" ? "You said" : "Contact said"}:
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {getLanguageFlag(translation.sourceLanguage)} {getLanguageName(translation.sourceLanguage)}
                        </Badge>
                      </div>
                      <p className="font-medium">
                        "{translation.originalText}"
                      </p>
                    </div>
                  )}

                  {/* Translation */}
                  {translation.showingTranslation ? (
                    <div className="p-3 bg-success/10 rounded-md border border-success/20">
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
                  ) : translation.showingOriginal && (
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
                <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Waiting for conversation to start...</p>
                <p className="text-sm">Speech will be translated in real-time</p>
              </div>
            )}
          </div>
        </Card>

        {/* Audio Controls */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <VolumeIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Volume: {Math.round(volume * 100)}%</span>
              {isPlaying && (
                <Badge variant="secondary" className="animate-pulse">
                  🎵 Playing Audio
                </Badge>
              )}
              {speakingQueue.length > 0 && (
                <Badge variant="outline">
                  {speakingQueue.length} in queue
                </Badge>
              )}
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
              <Button
                variant="outline"
                size="sm"
                onClick={stopSpeaking}
                disabled={!isPlaying}
              >
                ⏹️ Stop Audio
              </Button>
            </div>
          </div>
        </Card>

        {/* Call Controls */}
        <Card className="p-6">
          <div className="flex items-center justify-center space-x-6">
            <Button
              variant={isMuted ? "destructive" : "secondary"}
              size="lg"
              onClick={() => setIsMuted(!isMuted)}
              className="rounded-full p-4"
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>

            <Button
              variant="destructive"
              size="lg"
              onClick={handleEndCall}
              className="rounded-full p-6 bg-destructive hover:bg-destructive/90"
            >
              <PhoneOff className="w-8 h-8" />
            </Button>

            <Button
              variant={isSpeakerOn ? "default" : "secondary"}
              size="lg"
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className="rounded-full p-4"
            >
              {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </Button>

            <Button
              variant={audioEnabled ? "default" : "secondary"}
              size="lg"
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="rounded-full p-4"
            >
              🔊
            </Button>
          </div>
          
          <div className="text-center mt-4 space-y-1">
            <p className="text-xs text-muted-foreground">
              Audio: {audioEnabled ? "Enabled" : "Disabled"} • 
              Speaker: {isSpeakerOn ? "On" : "Off"} • 
              Mic: {isMuted ? "Muted" : "Active"}
              {speakingQueue.length > 0 && ` • ${speakingQueue.length} speaking`}
            </p>
          </div>
        </Card>

        {/* Features Info */}
        <Card className="p-6 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-primary">Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div>🎯 Real-time translation</div>
              <div>🌍 50+ languages supported</div>
              <div>💬 Conversation history</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}