import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Languages, TestTube, Clock, AlertTriangle } from "lucide-react";
import { GenderDetectionDemo } from "@/components/GenderDetectionDemo";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DemoLimiter } from "@/utils/demoLimiter";
import { toast } from "sonner";

const CallDemo = () => {
  const [currentScreen, setCurrentScreen] = useState<'intro' | 'demo' | 'blocked'>('intro');
  const [demoLimitInfo, setDemoLimitInfo] = useState<{ allowed: boolean; remaining: number; reason?: string } | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(300); // 5 minutes

  useEffect(() => {
    // Check demo limits on component mount
    const limitCheck = DemoLimiter.canUseDemo();
    setDemoLimitInfo(limitCheck);
    
    if (!limitCheck.allowed) {
      setCurrentScreen('blocked');
    }
  }, []);

  useEffect(() => {
    // Time tracking for active demo
    if (currentScreen === 'demo') {
      const startTime = Date.now();
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, 300 - elapsed);
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          toast.error("Demo time limit reached. Create an account for unlimited access!");
          setCurrentScreen('intro');
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentScreen]);

  const startDemo = () => {
    const limitCheck = DemoLimiter.canUseDemo();
    if (!limitCheck.allowed) {
      setCurrentScreen('blocked');
      setDemoLimitInfo(limitCheck);
      return;
    }
    
    DemoLimiter.trackDemoUsage();
    DemoLimiter.createDemoSession();
    setCurrentScreen('demo');
  };

  const endDemo = () => {
    DemoLimiter.endDemoSession();
    setCurrentScreen('intro');
  };

  const goToAuth = () => {
    window.location.href = '/auth';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show blocked screen if demo limit reached
  if (currentScreen === 'blocked') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold mb-2">Demo Limit Reached</h2>
            <p className="text-muted-foreground mb-4">
              {demoLimitInfo?.reason || "You've reached the daily demo limit."}
            </p>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Create a free account to get unlimited access to all features including contacts, call history, and more.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button onClick={goToAuth} className="w-full">
              Create Free Account
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'} className="w-full">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show voice demo
  if (currentScreen === 'demo') {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-background to-secondary/20">
        {/* Demo banner with timer */}
        <div className="bg-primary/10 border-b border-primary/20 p-2">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <p className="text-sm">
              <TestTube className="inline w-4 h-4 mr-1" />
              <strong>Voice Demo</strong> - Try the AI translation features
            </p>
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4" />
              <span className={timeRemaining < 60 ? "text-destructive font-medium" : ""}>
                Time remaining: {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-2">
              <Languages className="w-6 h-6 text-primary" />
              <span className="font-semibold text-foreground">ConversaFlow Demo</span>
            </div>
            <Button variant="outline" onClick={endDemo}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Demo Intro
            </Button>
          </div>
        </div>

        {/* Demo Content */}
        <div className="container mx-auto px-4 py-8">
          <GenderDetectionDemo />
        </div>
      </div>
    );
  }

  // Show intro screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Languages className="w-6 h-6 text-primary" />
            <span className="font-semibold text-foreground">ConversaFlow Demo</span>
          </div>
          <Button variant="outline" onClick={goToAuth}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </div>
      </div>

      {/* Demo Introduction */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div>
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <TestTube className="w-10 h-10 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Try Our AI Voice Features
              <span className="block text-2xl text-primary mt-2">Interactive Demo</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Test gender detection and voice matching technology in your browser
            </p>
          </div>

          {/* Demo Features */}
          <div className="grid md:grid-cols-3 gap-6 my-12">
            <div className="bg-card rounded-xl p-6 border">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Languages className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Voice Capture</h3>
              <p className="text-sm text-muted-foreground">
                Record your voice and see how our AI analyzes it
              </p>
            </div>
            
            <div className="bg-card rounded-xl p-6 border">
              <div className="bg-secondary/50 w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
                <TestTube className="h-6 w-6 text-secondary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Gender Detection</h3>
              <p className="text-sm text-muted-foreground">
                AI detects voice characteristics for natural conversations
              </p>
            </div>
            
            <div className="bg-card rounded-xl p-6 border">
              <div className="bg-accent/50 w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Languages className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Voice Matching</h3>
              <p className="text-sm text-muted-foreground">
                Text-to-speech with gender-matched voices
              </p>
            </div>
          </div>

          {/* Demo CTA */}
          <div className="space-y-4">
            <Button 
              size="lg" 
              className="px-12 py-4 text-lg"
              onClick={startDemo}
            >
              <TestTube className="mr-2 h-5 w-5" />
              Try Voice Demo
            </Button>
            
            <p className="text-sm text-muted-foreground">
              No signup required • Works in your browser • Takes 2 minutes
            </p>
          </div>

          {/* Sign Up Encouragement */}
          <div className="bg-muted/30 rounded-xl p-6 mt-12">
            <h3 className="font-semibold mb-2">Ready for real phone translations?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a free account to make actual translated calls with contacts and call history
            </p>
            <Button variant="outline" onClick={goToAuth}>
              Create Free Account
            </Button>
          </div>

          {/* Demo Limitations & Usage */}
          <div className="bg-muted/30 rounded-xl p-6 mt-8">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
              <div>
                <h3 className="font-semibold mb-2">Demo Limitations</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Maximum 3 demos per day</li>
                  <li>• 5-minute time limit per session</li>
                  <li>• Voice demo only (no actual calls)</li>
                  <li>• Uses browser text-to-speech</li>
                </ul>
                {demoLimitInfo && (
                  <p className="text-sm font-medium mt-2">
                    Remaining demos today: {demoLimitInfo.remaining}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallDemo;