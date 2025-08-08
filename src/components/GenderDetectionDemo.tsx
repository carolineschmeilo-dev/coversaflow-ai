import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Volume2, User, Play, Square } from "lucide-react";
import { useVoiceCapture } from "@/hooks/useVoiceCapture";
import { useElevenLabsTTS } from "@/hooks/useElevenLabsTTS";
import { toast } from "sonner";

export const GenderDetectionDemo = () => {
  const [testText, setTestText] = useState("Hello! This is a test of the gender-matched voice translation system. How does my voice sound?");
  const [voiceSample, setVoiceSample] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const { isRecording, startRecording, stopRecording, error: recordingError } = useVoiceCapture();
  const { speak, isPlaying, detectedGender, error: ttsError } = useElevenLabsTTS();

  const handleCaptureVoice = async () => {
    if (isRecording) {
      setIsCapturing(true);
      const sample = await stopRecording();
      if (sample) {
        setVoiceSample(sample);
        toast.success("Voice sample captured! Gender detection will be used for TTS.");
      } else {
        toast.error("Failed to capture voice sample");
      }
      setIsCapturing(false);
    } else {
      await startRecording();
      toast.info("Recording voice sample... Speak for a few seconds.");
    }
  };

  const handleTestTTS = async () => {
    if (!testText.trim()) {
      toast.error("Please enter some text to test");
      return;
    }

    await speak({
      text: testText,
      language: 'en',
      audioSample: voiceSample || undefined
    });
  };

  const resetDemo = () => {
    setVoiceSample(null);
    setTestText("Hello! This is a test of the gender-matched voice translation system. How does my voice sound?");
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
                disabled={isCapturing}
                variant={voiceSample ? "outline" : "default"}
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
                    <span>{voiceSample ? "Re-capture Voice" : "Capture Voice"}</span>
                  </>
                )}
              </Button>
              
              {voiceSample && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <User className="w-3 h-3" />
                  <span>Voice captured</span>
                </Badge>
              )}
              
              {detectedGender && detectedGender !== 'unknown' && (
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
              {voiceSample 
                ? "The TTS will use a voice that matches your detected gender"
                : "Capture your voice first to enable gender matching"
              }
            </p>
          </div>

          {/* Errors */}
          {(recordingError || ttsError) && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">
                {recordingError || ttsError}
              </p>
            </div>
          )}

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