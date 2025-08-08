import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Globe, Users, ArrowLeftRight, AlertTriangle, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTranslation } from "@/hooks/useTranslation";
import { usePhoneCallIntegration } from "@/hooks/usePhoneCallIntegration";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { useToast } from "@/hooks/use-toast";

interface Translation {
  id: string;
  originalText: string;
  translatedText: string;
  speaker: "person_a" | "person_b";
  timestamp: Date;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
}

interface ConferenceBridgeProps {
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

export function ConferenceBridge({ onEndCall }: ConferenceBridgeProps) {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [personALanguage, setPersonALanguage] = useState("en");
  const [personBLanguage, setPersonBLanguage] = useState("es");
  const [volume, setVolume] = useState(0.8);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<"person_a" | "person_b" | null>(null);
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState("");
  const [bridgeActive, setBridgeActive] = useState(false);

  const { toast } = useToast();
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    confidence,
    error: speechError,
    isSupported: speechSupported
  } = useSpeechRecognition();

  const { translate, isTranslating } = useTranslation();
  const { speak: elevenLabsSpeak, isPlaying: elevenLabsPlaying, error: elevenLabsError } = useElevenLabsTTS();
  const { 
    callState, 
    startCallRecording, 
    stopCallRecording, 
    isSupported: phoneSupported,
    error: phoneError,
    requestPermissions,
    setupCallIntegration
  } = usePhoneCallIntegration();

  const startTranslationBridge = useCallback(async () => {
    try {
      // Start phone recording for audio processing
      await startCallRecording();
      
      // Start speech recognition
      const currentLanguage = languages.find(l => l.code === personALanguage)?.speechLang || "en-US";
      await startListening(currentLanguage, true);
      
      setBridgeActive(true);
      toast({
        title: "Translation Bridge Active",
        description: "The app is now translating between both languages. Start your 3-way call!"
      });
    } catch (error) {
      console.error("Failed to start translation bridge:", error);
      toast({
        title: "Error",
        description: "Failed to start translation bridge. Please check permissions.",
        variant: "destructive"
      });
    }
  }, [startCallRecording, startListening, personALanguage, toast]);

  const stopTranslationBridge = useCallback(async () => {
    try {
      await stopCallRecording();
      stopListening();
      setBridgeActive(false);
      setCurrentSpeaker(null);
      toast({
        title: "Translation Bridge Stopped",
        description: "Translation bridge has been deactivated."
      });
    } catch (error) {
      console.error("Failed to stop translation bridge:", error);
    }
  }, [stopCallRecording, stopListening, toast]);

  const handleNewSpeech = useCallback(async (text: string) => {
    if (!text.trim() || text === lastProcessedTranscript) return;
    setLastProcessedTranscript(text);

    try {
      // Determine speaker and target language
      const sourceLanguage = currentSpeaker === "person_a" ? personALanguage : personBLanguage;
      const targetLanguage = currentSpeaker === "person_a" ? personBLanguage : personALanguage;

      // Translate the text
      const translationResult = await translate(text, sourceLanguage, targetLanguage);

      // Create translation record
      const translation: Translation = {
        id: Date.now().toString(),
        originalText: text,
        translatedText: translationResult.translatedText,
        speaker: currentSpeaker || "person_a",
        timestamp: new Date(),
        sourceLanguage,
        targetLanguage,
        confidence: confidence || 0.8
      };

      setTranslations(prev => [...prev, translation]);

      // Speak the translation
      await elevenLabsSpeak({
        text: translationResult.translatedText,
        language: targetLanguage
      });

    } catch (error) {
      console.error("Translation failed:", error);
      toast({
        title: "Translation Error",
        description: "Failed to translate speech. Please try again.",
        variant: "destructive"
      });
    }
  }, [lastProcessedTranscript, currentSpeaker, personALanguage, personBLanguage, translate, confidence, elevenLabsSpeak, toast]);

  // Handle speech recognition results
  useEffect(() => {
    if (transcript && bridgeActive && currentSpeaker) {
      handleNewSpeech(transcript);
    }
  }, [transcript, bridgeActive, currentSpeaker, handleNewSpeech]);

  const requestAllPermissions = useCallback(async () => {
    try {
      await requestPermissions();
      await setupCallIntegration();
      setPermissionsGranted(true);
      setIsSetupComplete(true);
      toast({
        title: "Permissions Granted",
        description: "All permissions granted successfully!"
      });
    } catch (error) {
      console.error("Permission request failed:", error);
      toast({
        title: "Permission Error",
        description: "Failed to get required permissions. Please enable microphone access.",
        variant: "destructive"
      });
    }
  }, [requestPermissions, setupCallIntegration, toast]);

  const getLanguageName = (code: string) => languages.find(l => l.code === code)?.name || code;
  const getLanguageFlag = (code: string) => languages.find(l => l.code === code)?.flag || "🌐";

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!speechSupported || !phoneSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Device Not Supported</h2>
          <p className="text-muted-foreground mb-4">
            Your device doesn't support the required features for conference bridge translation.
          </p>
          <Button onClick={onEndCall} variant="outline" className="w-full">
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  if (!permissionsGranted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Permissions Required</h2>
          <p className="text-muted-foreground mb-4">
            We need microphone access to enable translation bridge functionality.
          </p>
          <Button onClick={requestAllPermissions} className="w-full mb-3">
            Grant Permissions
          </Button>
          <Button onClick={onEndCall} variant="outline" className="w-full">
            Cancel
          </Button>
        </Card>
      </div>
    );
  }

  if (!isSetupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg p-6">
          <div className="text-center mb-6">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Conference Bridge Setup</h2>
            <p className="text-muted-foreground">
              Set up your translation bridge between two languages
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Person A Language</label>
              <Select value={personALanguage} onValueChange={setPersonALanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-center">
              <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Person B Language</label>
              <Select value={personBLanguage} onValueChange={setPersonBLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Audio Volume: {Math.round(volume * 100)}%
              </label>
              <Slider
                value={[volume]}
                onValueChange={([newValue]) => setVolume(newValue)}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>

            <Button 
              onClick={() => setIsSetupComplete(true)}
              className="w-full"
              disabled={personALanguage === personBLanguage}
            >
              Complete Setup
            </Button>

            {personALanguage === personBLanguage && (
              <p className="text-sm text-destructive text-center">
                Please select different languages for Person A and Person B
              </p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Conference Bridge</h1>
                <p className="text-muted-foreground">Translation bridge active</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={bridgeActive ? "default" : "secondary"}>
                {bridgeActive ? "Active" : "Inactive"}
              </Badge>
              {callState.isActive && (
                <Badge variant="outline">
                  Call: {formatDuration(callState.callDuration)}
                </Badge>
              )}
            </div>
          </div>
        </Card>

        {/* Instructions */}
        {!bridgeActive && (
          <Alert>
            <Globe className="h-4 w-4" />
            <AlertDescription>
              <strong>How to use:</strong> Start the bridge, then create a 3-way call with both people. 
              The app will listen and translate between {getLanguageName(personALanguage)} and {getLanguageName(personBLanguage)}.
            </AlertDescription>
          </Alert>
        )}

        {/* Language Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="text-3xl mb-2">{getLanguageFlag(personALanguage)}</div>
            <div className="font-medium">{getLanguageName(personALanguage)}</div>
            <Badge variant={currentSpeaker === "person_a" ? "default" : "outline"} className="mt-2">
              Person A
            </Badge>
          </Card>

          <Card className="p-4 text-center flex items-center justify-center">
            <ArrowLeftRight className="h-8 w-8 text-primary" />
          </Card>

          <Card className="p-4 text-center">
            <div className="text-3xl mb-2">{getLanguageFlag(personBLanguage)}</div>
            <div className="font-medium">{getLanguageName(personBLanguage)}</div>
            <Badge variant={currentSpeaker === "person_b" ? "default" : "outline"} className="mt-2">
              Person B
            </Badge>
          </Card>
        </div>

        {/* Speaker Selection */}
        {bridgeActive && (
          <Card className="p-4">
            <h3 className="font-medium mb-3">Who is speaking?</h3>
            <div className="flex gap-3">
              <Button
                variant={currentSpeaker === "person_a" ? "default" : "outline"}
                onClick={() => setCurrentSpeaker("person_a")}
                className="flex-1"
              >
                Person A ({getLanguageName(personALanguage)})
              </Button>
              <Button
                variant={currentSpeaker === "person_b" ? "default" : "outline"}
                onClick={() => setCurrentSpeaker("person_b")}
                className="flex-1"
              >
                Person B ({getLanguageName(personBLanguage)})
              </Button>
            </div>
          </Card>
        )}

        {/* Status */}
        {bridgeActive && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  isListening ? "bg-red-500 animate-pulse" : "bg-gray-400"
                )} />
                <span className="text-sm">
                  {isListening ? "Listening..." : "Not listening"}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {isTranslating && <Badge variant="secondary">Translating...</Badge>}
                {elevenLabsPlaying && <Badge variant="secondary">Speaking...</Badge>}
              </div>
            </div>
            
            {transcript && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Current speech:</p>
                <p className="font-medium">{transcript}</p>
              </div>
            )}
          </Card>
        )}

        {/* Translation History */}
        {translations.length > 0 && (
          <Card className="p-4">
            <h3 className="font-medium mb-3">Translation History</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {translations.slice(-10).map((translation) => (
                <div key={translation.id} className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={translation.speaker === "person_a" ? "default" : "secondary"}>
                      {translation.speaker === "person_a" ? "Person A" : "Person B"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {translation.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Original:</span> {translation.originalText}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Translation:</span> {translation.translatedText}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Controls */}
        <Card className="p-4">
          <div className="flex gap-3">
            {!bridgeActive ? (
              <Button 
                onClick={startTranslationBridge}
                className="flex-1"
                disabled={!currentSpeaker}
              >
                <Phone className="h-4 w-4 mr-2" />
                Start Translation Bridge
              </Button>
            ) : (
              <Button 
                onClick={stopTranslationBridge}
                variant="destructive"
                className="flex-1"
              >
                <PhoneOff className="h-4 w-4 mr-2" />
                Stop Translation Bridge
              </Button>
            )}
            
            <Button onClick={onEndCall} variant="outline">
              Exit
            </Button>
          </div>
        </Card>

        {/* Errors */}
        {(speechError || phoneError || elevenLabsError) && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {speechError || phoneError || elevenLabsError}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}