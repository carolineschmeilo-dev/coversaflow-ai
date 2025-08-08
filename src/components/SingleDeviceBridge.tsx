import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mic, MicOff, Volume2, VolumeX, RotateCcw, ArrowLeftRight, AlertTriangle, Shield, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTranslation } from "@/hooks/useTranslation";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { useToast } from "@/hooks/use-toast";

interface Translation {
  id: string;
  originalText: string;
  translatedText: string;
  direction: "a_to_b" | "b_to_a";
  timestamp: Date;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
}

interface SingleDeviceBridgeProps {
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

export function SingleDeviceBridge({ onEndCall }: SingleDeviceBridgeProps) {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [languageA, setLanguageA] = useState("en");
  const [languageB, setLanguageB] = useState("es");
  const [volume, setVolume] = useState(0.8);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [currentDirection, setCurrentDirection] = useState<"a_to_b" | "b_to_a">("a_to_b");
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState("");
  const [isActive, setIsActive] = useState(false);

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

  const startTranslation = useCallback(async () => {
    try {
      const sourceLanguage = currentDirection === "a_to_b" ? languageA : languageB;
      const speechLang = languages.find(l => l.code === sourceLanguage)?.speechLang || "en-US";
      
      await startListening(speechLang, false); // Continuous = false for turn-based
      setIsActive(true);
      
      toast({
        title: "Translation Started",
        description: `Listening for ${languages.find(l => l.code === sourceLanguage)?.name}...`
      });
    } catch (error) {
      console.error("Failed to start translation:", error);
      toast({
        title: "Error",
        description: "Failed to start translation. Please check microphone permissions.",
        variant: "destructive"
      });
    }
  }, [startListening, currentDirection, languageA, languageB, toast]);

  const stopTranslation = useCallback(() => {
    stopListening();
    setIsActive(false);
    toast({
      title: "Translation Stopped",
      description: "Ready for next input."
    });
  }, [stopListening, toast]);

  const switchDirection = useCallback(() => {
    const newDirection = currentDirection === "a_to_b" ? "b_to_a" : "a_to_b";
    setCurrentDirection(newDirection);
    
    if (isActive) {
      stopListening();
      setIsActive(false);
    }
    
    toast({
      title: "Direction Switched",
      description: `Ready to translate ${currentDirection === "a_to_b" ? 
        `${getLanguageName(languageB)} → ${getLanguageName(languageA)}` : 
        `${getLanguageName(languageA)} → ${getLanguageName(languageB)}`}`
    });
  }, [currentDirection, languageA, languageB, isActive, stopListening, toast]);

  const handleNewSpeech = useCallback(async (text: string) => {
    if (!text.trim() || text === lastProcessedTranscript) return;
    setLastProcessedTranscript(text);

    try {
      const sourceLanguage = currentDirection === "a_to_b" ? languageA : languageB;
      const targetLanguage = currentDirection === "a_to_b" ? languageB : languageA;

      // Translate the text
      const translationResult = await translate(text, sourceLanguage, targetLanguage);

      // Create translation record
      const translation: Translation = {
        id: Date.now().toString(),
        originalText: text,
        translatedText: translationResult.translatedText,
        direction: currentDirection,
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

      // Auto-stop after translation
      stopTranslation();

    } catch (error) {
      console.error("Translation failed:", error);
      toast({
        title: "Translation Error",
        description: "Failed to translate speech. Please try again.",
        variant: "destructive"
      });
    }
  }, [lastProcessedTranscript, currentDirection, languageA, languageB, translate, confidence, elevenLabsSpeak, stopTranslation, toast]);

  // Handle speech recognition results
  useEffect(() => {
    if (transcript && isActive) {
      handleNewSpeech(transcript);
    }
  }, [transcript, isActive, handleNewSpeech]);

  const requestAllPermissions = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermissionsGranted(true);
      toast({
        title: "Permissions Granted",
        description: "Microphone access granted successfully!"
      });
    } catch (error) {
      console.error("Permission request failed:", error);
      toast({
        title: "Permission Error",
        description: "Failed to get microphone access. Please enable microphone permissions.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const getLanguageName = (code: string) => languages.find(l => l.code === code)?.name || code;
  const getLanguageFlag = (code: string) => languages.find(l => l.code === code)?.flag || "🌐";

  if (!speechSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Device Not Supported</h2>
          <p className="text-muted-foreground mb-4">
            Your device doesn't support speech recognition.
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
          <h2 className="text-xl font-semibold mb-2">Microphone Access Required</h2>
          <p className="text-muted-foreground mb-4">
            We need microphone access to translate speech between languages.
          </p>
          <Button onClick={requestAllPermissions} className="w-full mb-3">
            Grant Microphone Access
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
            <Smartphone className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Single Device Translation</h2>
            <p className="text-muted-foreground">
              Set up languages for turn-based translation
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Language A (First person)</label>
              <Select value={languageA} onValueChange={setLanguageA}>
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
              <label className="text-sm font-medium mb-2 block">Language B (Second person)</label>
              <Select value={languageB} onValueChange={setLanguageB}>
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
              disabled={languageA === languageB}
            >
              Start Translation
            </Button>

            {languageA === languageB && (
              <p className="text-sm text-destructive text-center">
                Please select different languages
              </p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const sourceLanguage = currentDirection === "a_to_b" ? languageA : languageB;
  const targetLanguage = currentDirection === "a_to_b" ? languageB : languageA;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Single Device Translation</h1>
                <p className="text-muted-foreground">Turn-based translation for two people</p>
              </div>
            </div>
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Listening" : "Ready"}
            </Badge>
          </div>
        </Card>

        {/* Instructions */}
        <Alert>
          <Smartphone className="h-4 w-4" />
          <AlertDescription>
            <strong>How to use:</strong> Tap "Start" before each person speaks. The app will listen, translate, and speak the result out loud. Then tap "Switch" to change direction.
          </AlertDescription>
        </Alert>

        {/* Current Direction Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={cn(
            "p-4 text-center transition-all duration-300",
            currentDirection === "a_to_b" ? "ring-2 ring-primary bg-primary/5" : "opacity-60"
          )}>
            <div className="text-3xl mb-2">{getLanguageFlag(languageA)}</div>
            <div className="font-medium">{getLanguageName(languageA)}</div>
            <Badge variant={currentDirection === "a_to_b" ? "default" : "outline"} className="mt-2">
              {currentDirection === "a_to_b" ? "Speaking" : "Listening"}
            </Badge>
          </Card>

          <Card className="p-4 text-center flex items-center justify-center">
            <ArrowLeftRight className="h-8 w-8 text-primary" />
          </Card>

          <Card className={cn(
            "p-4 text-center transition-all duration-300",
            currentDirection === "b_to_a" ? "ring-2 ring-primary bg-primary/5" : "opacity-60"
          )}>
            <div className="text-3xl mb-2">{getLanguageFlag(languageB)}</div>
            <div className="font-medium">{getLanguageName(languageB)}</div>
            <Badge variant={currentDirection === "b_to_a" ? "default" : "outline"} className="mt-2">
              {currentDirection === "b_to_a" ? "Speaking" : "Listening"}
            </Badge>
          </Card>
        </div>

        {/* Current Status */}
        <Card className="p-4">
          <div className="text-center space-y-3">
            <div className="text-lg font-medium">
              {isActive ? `Listening for ${getLanguageName(sourceLanguage)}...` : 
               `Ready to translate ${getLanguageName(sourceLanguage)} → ${getLanguageName(targetLanguage)}`}
            </div>
            
            {isTranslating && (
              <Badge variant="secondary" className="mx-2">Translating...</Badge>
            )}
            {elevenLabsPlaying && (
              <Badge variant="secondary" className="mx-2">Speaking...</Badge>
            )}
            
            {transcript && isActive && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Heard:</p>
                <p className="font-medium">{transcript}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Controls */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {!isActive ? (
              <Button 
                onClick={startTranslation}
                className="flex items-center justify-center gap-2"
                size="lg"
              >
                <Mic className="h-5 w-5" />
                Start Listening
              </Button>
            ) : (
              <Button 
                onClick={stopTranslation}
                variant="secondary"
                className="flex items-center justify-center gap-2"
                size="lg"
              >
                <MicOff className="h-5 w-5" />
                Stop Listening
              </Button>
            )}
            
            <Button 
              onClick={switchDirection}
              variant="outline"
              className="flex items-center justify-center gap-2"
              size="lg"
              disabled={isActive}
            >
              <RotateCcw className="h-5 w-5" />
              Switch Direction
            </Button>
            
            <Button 
              onClick={onEndCall}
              variant="outline"
              size="lg"
            >
              Exit
            </Button>
          </div>
        </Card>

        {/* Translation History */}
        {translations.length > 0 && (
          <Card className="p-4">
            <h3 className="font-medium mb-3">Translation History</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {translations.slice(-10).reverse().map((translation) => (
                <div key={translation.id} className="bg-muted p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={translation.direction === "a_to_b" ? "default" : "secondary"}>
                      {translation.direction === "a_to_b" ? 
                        `${getLanguageFlag(languageA)} → ${getLanguageFlag(languageB)}` :
                        `${getLanguageFlag(languageB)} → ${getLanguageFlag(languageA)}`
                      }
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

        {/* Errors */}
        {(speechError || elevenLabsError) && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {speechError || elevenLabsError}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}