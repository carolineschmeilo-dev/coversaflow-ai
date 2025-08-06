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
    originalText: "Hello, how are you today?", 
    translatedText: "Hola, ¿cómo estás hoy?",
    sourceLanguage: "en",
    targetLanguage: "es"
  },
  { 
    speaker: "receiver" as const, 
    originalText: "Muy bien, gracias. ¿Y tú?", 
    translatedText: "Very well, thank you. And you?",
    sourceLanguage: "es",
    targetLanguage: "en"
  },
  { 
    speaker: "caller" as const, 
    originalText: "I'm doing great. I wanted to discuss the project with you.", 
    translatedText: "Me va muy bien. Quería discutir el proyecto contigo.",
    sourceLanguage: "en",
    targetLanguage: "es"
  },
  { 
    speaker: "receiver" as const, 
    originalText: "Perfecto, estoy listo para hablar sobre eso.", 
    translatedText: "Perfect, I'm ready to talk about that.",
    sourceLanguage: "es",
    targetLanguage: "en"
  }
];

export function CallInterface({ onEndCall }: CallInterfaceProps) {
  console.log("CallInterface component rendering");
  
  const [isCallActive, setIsCallActive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [callerLanguage, setCallerLanguage] = useState("en");
  const [receiverLanguage, setReceiverLanguage] = useState("es");
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

  // Simulate real-time conversation
  useEffect(() => {
    if (!isCallActive || currentMessageIndex >= simulatedConversation.length) return;

    const timeout = setTimeout(async () => {
      const message = simulatedConversation[currentMessageIndex];
      const newTranslation: Translation = {
        id: Date.now().toString(),
        originalText: message.originalText,
        translatedText: message.translatedText,
        speaker: message.speaker,
        timestamp: new Date(),
        sourceLanguage: message.sourceLanguage,
        targetLanguage: message.targetLanguage,
      };

      setTranslations(prev => [...prev, newTranslation]);
      setCurrentMessageIndex(prev => prev + 1);
      
      // Play audio for translated text if audio is enabled and speaker is on
      if (audioEnabled && isSpeakerOn && !isMuted) {
        try {
          // Add to speaking queue to show who's talking
          setSpeakingQueue(prev => [...prev, newTranslation.id]);
          
          // Speak the translated text in the target language with native pronunciation
          await speakInLanguage(message.translatedText, message.targetLanguage);
          
          // Remove from speaking queue when done
          setSpeakingQueue(prev => prev.filter(id => id !== newTranslation.id));
        } catch (error) {
          console.error("Audio playback failed:", error);
          setSpeakingQueue(prev => prev.filter(id => id !== newTranslation.id));
          toast({
            title: "Audio Error",
            description: "Failed to play audio. Check your connection.",
            variant: "destructive",
          });
        }
      }
    }, 1500 + currentMessageIndex * 2500); // Faster intervals

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
                  "animate-fade-in p-4 rounded-lg space-y-2 relative",
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
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {getLanguageFlag(translation.sourceLanguage)} {translation.originalText}
                  </p>
                  <p className="font-medium">
                    {getLanguageFlag(translation.targetLanguage)} {translation.translatedText}
                  </p>
                </div>
              </div>
            ))}
            
            {translations.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Waiting for conversation to start...</p>
                <p className="text-sm">Your speech will be translated in real-time</p>
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