import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Volume2, User, Play, Square } from "lucide-react";
import { toast } from "sonner";

export const GenderDetectionDemo = () => {
  const [testText, setTestText] = useState("Hello! This is a simple demo.");
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceCaptured, setVoiceCaptured] = useState(false);
  const [detectedGender, setDetectedGender] = useState<'male' | 'female' | null>(null);
  const handleCaptureVoice = async () => {
    if (isRecording) {
      setIsRecording(false);
      setVoiceCaptured(true);
      // Simulate gender detection
      const randomGender = Math.random() > 0.5 ? 'female' : 'male';
      setDetectedGender(randomGender);
      toast.success(`Voice captured! Detected ${randomGender} voice.`);
    } else {
      setIsRecording(true);
      toast.info("Recording voice sample... Speak for a few seconds.");
      // Simulate recording for 3 seconds
      setTimeout(() => {
        if (isRecording) {
          setIsRecording(false);
          setVoiceCaptured(true);
          const randomGender = Math.random() > 0.5 ? 'female' : 'male';
          setDetectedGender(randomGender);
          toast.success(`Voice captured! Detected ${randomGender} voice.`);
        }
      }, 3000);
    }
  };

  const handleTestTTS = async () => {
    if (!testText.trim()) {
      toast.error("Please enter some text to test");
      return;
    }

    setIsPlaying(true);
    toast.success("Playing text with matched voice...");

    try {
      // Use Web Speech API for demonstration
      const utterance = new SpeechSynthesisUtterance(testText);
      
      // Get available voices
      const voices = speechSynthesis.getVoices();
      
      // Try to select a voice based on detected gender
      if (detectedGender && voices.length > 0) {
        const genderVoices = voices.filter(voice => {
          const name = voice.name.toLowerCase();
          return detectedGender === 'female' 
            ? name.includes('female') || name.includes('woman') || name.includes('samantha') || name.includes('victoria')
            : name.includes('male') || name.includes('man') || name.includes('daniel') || name.includes('alex');
        });
        
        if (genderVoices.length > 0) {
          utterance.voice = genderVoices[0];
        }
      }
      
      utterance.rate = 0.9;
      utterance.pitch = detectedGender === 'female' ? 1.2 : 0.8;
      
      utterance.onend = () => {
        setIsPlaying(false);
      };
      
      speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('TTS error:', error);
      toast.error("Sorry, text-to-speech is not available in your browser");
      setIsPlaying(false);
    }
  };

  const resetDemo = () => {
    setVoiceCaptured(false);
    setDetectedGender(null);
    setTestText("Hello! This is a simple demo.");
    speechSynthesis.cancel();
    setIsPlaying(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Gender Detection Demo</span>
          </CardTitle>
          <CardDescription>
            Test automatic gender detection for voice-matched translations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Capture Voice Sample */}
          <div className="space-y-3">
            <h3 className="font-semibold">Step 1: Capture Your Voice</h3>
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleCaptureVoice}
                variant={voiceCaptured ? "outline" : "default"}
                className="flex items-center space-x-2"
              >
                {isRecording ? (
                  <>
                    <Square className="w-4 h-4" />
                    <span>Stop Recording</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>{voiceCaptured ? "Re-capture Voice" : "Capture Voice"}</span>
                  </>
                )}
              </Button>
              
              {voiceCaptured && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>Voice captured</span>
                </Badge>
              )}
              
              {detectedGender && (
                <Badge className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>{detectedGender === 'female' ? 'Female' : 'Male'} voice detected</span>
                </Badge>
              )}
            </div>
            
            {isRecording && (
              <div className="flex items-center space-x-2 text-primary">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-sm">Recording... Speak clearly for a few seconds</span>
              </div>
            )}
          </div>

          {/* Step 2: Test Text */}
          <div className="space-y-3">
            <h3 className="font-semibold">Step 2: Enter Test Text</h3>
            <Textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Enter text to test gender-matched TTS..."
              rows={3}
            />
          </div>

          {/* Step 3: Test TTS */}
          <div className="space-y-3">
            <h3 className="font-semibold">Step 3: Test Gender-Matched Voice</h3>
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleTestTTS}
                disabled={isPlaying || !testText.trim()}
                className="flex items-center space-x-2"
              >
                {isPlaying ? (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>Playing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Test Voice</span>
                  </>
                )}
              </Button>
              
              <Button
                onClick={resetDemo}
                variant="outline"
                size="sm"
              >
                Reset Demo
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {voiceCaptured 
                ? "The voice will be adjusted based on your detected gender"
                : "Capture your voice first to enable gender matching"
              }
            </p>
          </div>

          {/* Simple demo note */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Demo Mode:</strong> This is a simplified demonstration using your browser's built-in text-to-speech. The full system uses advanced AI for better voice matching.
            </p>
          </div>

          {/* How it works */}
          <div className="p-4 bg-muted/30 rounded-md">
            <h4 className="font-semibold mb-2">How it works:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Record a voice sample (2-3 seconds of speech)</li>
              <li>AI analyzes voice frequency patterns</li>
              <li>Gender is detected based on vocal characteristics</li>
              <li>TTS selects a matching voice (female/male)</li>
              <li>Translation uses the appropriate gendered voice</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};