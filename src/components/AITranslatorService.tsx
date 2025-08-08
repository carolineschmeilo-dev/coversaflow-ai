import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Phone, PhoneCall, Users, Globe, Mic, Volume2, ArrowLeftRight, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AITranslatorServiceProps {
  onBack?: () => void;
}

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "pt-BR", name: "Brazilian Portuguese", flag: "🇧🇷" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
];

export function AITranslatorService({ onBack }: AITranslatorServiceProps) {
  const [callerLanguage, setCallerLanguage] = useState("en");
  const [receiverLanguage, setReceiverLanguage] = useState("es");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [step, setStep] = useState<"setup" | "call" | "active">("setup");
  const [callId, setCallId] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Demo phone number for the AI translator service
  const AI_TRANSLATOR_NUMBER = "+1-555-TRANSLATE"; // This would be a real Twilio number

  const getLanguageName = (code: string) => languages.find(l => l.code === code)?.name || code;
  const getLanguageFlag = (code: string) => languages.find(l => l.code === code)?.flag || "🌐";

  const copyPhoneNumber = () => {
    navigator.clipboard.writeText(AI_TRANSLATOR_NUMBER);
    toast({
      title: "Phone Number Copied",
      description: "The AI translator phone number has been copied to your clipboard."
    });
  };

  const startCall = () => {
    if (!receiverPhone.trim()) {
      toast({
        title: "Phone Number Required", 
        description: "Please enter the person you want to call.",
        variant: "destructive"
      });
      return;
    }
    setStep("call");
    setCallId(`call_${Date.now()}`);
  };

  const endCall = () => {
    setStep("setup");
    setCallId(null);
  };

  if (step === "setup") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-8">
          <div className="text-center mb-8">
            <PhoneCall className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">AI Conference Translator</h1>
            <p className="text-muted-foreground text-lg">
              Call our AI service to translate between you and someone else in real-time
            </p>
          </div>

          <div className="space-y-6">
            {/* Language Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Your Language</label>
                <Select value={callerLanguage} onValueChange={setCallerLanguage}>
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
                <label className="text-sm font-medium mb-2 block">Their Language</label>
                <Select value={receiverLanguage} onValueChange={setReceiverLanguage}>
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
            </div>

            {/* Phone Number Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">Person to Call</label>
              <input
                type="tel"
                placeholder="+1 555 123 4567"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* How it works */}
            <Alert>
              <PhoneCall className="h-4 w-4" />
              <AlertDescription>
                <strong>How it works:</strong> Call {AI_TRANSLATOR_NUMBER}, say the person's number and languages. 
                Our AI will call them and translate between you both in real-time.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={startCall} 
              className="w-full"
              size="lg"
              disabled={callerLanguage === receiverLanguage}
            >
              <Phone className="h-5 w-5 mr-2" />
              Start AI Translation Call
            </Button>

            {callerLanguage === receiverLanguage && (
              <p className="text-sm text-destructive text-center">
                Please select different languages
              </p>
            )}

            <Button onClick={onBack} variant="outline" className="w-full">
              Back to Options
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (step === "call") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-8">
          <div className="text-center space-y-6">
            <PhoneCall className="h-16 w-16 text-primary mx-auto animate-pulse" />
            <h2 className="text-2xl font-bold">Ready to Call</h2>
            
            {/* Instructions */}
            <div className="bg-muted p-6 rounded-lg text-left space-y-4">
              <h3 className="font-semibold text-lg">📞 Call Instructions:</h3>
              <ol className="space-y-2 text-sm">
                <li><strong>1.</strong> Call: <span className="font-mono bg-background px-2 py-1 rounded">{AI_TRANSLATOR_NUMBER}</span></li>
                <li><strong>2.</strong> When AI answers, say: "Translate {getLanguageName(callerLanguage)} to {getLanguageName(receiverLanguage)}"</li>
                <li><strong>3.</strong> Say the phone number: "{receiverPhone}"</li>
                <li><strong>4.</strong> Wait for the AI to call them and connect you</li>
                <li><strong>5.</strong> Start talking naturally - AI translates everything!</li>
              </ol>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <Button 
                onClick={copyPhoneNumber}
                variant="outline"
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Number
              </Button>
              <Button 
                onClick={() => window.open(`tel:${AI_TRANSLATOR_NUMBER}`)}
                className="flex-1"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Now
              </Button>
            </div>

            {/* Translation Setup */}
            <div className="grid grid-cols-3 gap-4 py-4">
              <div className="text-center p-4 bg-card rounded-lg border">
                <div className="text-2xl mb-2">{getLanguageFlag(callerLanguage)}</div>
                <div className="font-medium text-sm">{getLanguageName(callerLanguage)}</div>
                <Badge variant="default" className="mt-1 text-xs">You</Badge>
              </div>
              
              <div className="text-center p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
                <div className="text-2xl mb-2">🤖</div>
                <div className="font-medium text-sm">AI Translator</div>
                <Badge variant="secondary" className="mt-1 text-xs">Live</Badge>
              </div>
              
              <div className="text-center p-4 bg-card rounded-lg border">
                <div className="text-2xl mb-2">{getLanguageFlag(receiverLanguage)}</div>
                <div className="font-medium text-sm">{getLanguageName(receiverLanguage)}</div>
                <Badge variant="outline" className="mt-1 text-xs">Them</Badge>
              </div>
            </div>

            <Button onClick={endCall} variant="outline" className="w-full">
              Back to Setup
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}