import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Languages, TestTube } from "lucide-react";
import { ActiveCall } from "@/components/ActiveCall";
import { CallSetup } from "@/components/CallSetup";

interface CallConfiguration {
  myLanguage: string;
  theirLanguage: string;
  theirPhoneNumber: string;
  myPhoneNumber: string;
}

const CallDemo = () => {
  const [currentScreen, setCurrentScreen] = useState<'intro' | 'setup' | 'call'>('intro');
  const [callConfig, setCallConfig] = useState<CallConfiguration | null>(null);

  const startSetup = () => {
    setCurrentScreen('setup');
  };

  const startCall = (config: CallConfiguration) => {
    setCallConfig(config);
    setCurrentScreen('call');
  };

  const endCall = () => {
    setCurrentScreen('intro');
    setCallConfig(null);
  };

  const goToAuth = () => {
    window.location.href = '/auth';
  };

  // Show call interface
  if (currentScreen === 'call' && callConfig) {
    return (
      <div className="relative">
        {/* Demo banner */}
        <div className="bg-primary/10 border-b border-primary/20 p-2 text-center">
          <p className="text-sm">
            <TestTube className="inline w-4 h-4 mr-1" />
            <strong>Demo Mode</strong> - Experience the call interface without signing up
          </p>
        </div>
        
        <ActiveCall
          myLanguage={callConfig.myLanguage}
          theirLanguage={callConfig.theirLanguage}
          theirPhoneNumber={callConfig.theirPhoneNumber}
          onEndCall={endCall}
        />
      </div>
    );
  }

  // Show setup
  if (currentScreen === 'setup') {
    return (
      <div className="relative">
        {/* Demo banner */}
        <div className="bg-primary/10 border-b border-primary/20 p-2 text-center">
          <p className="text-sm">
            <TestTube className="inline w-4 h-4 mr-1" />
            <strong>Demo Mode</strong> - Try the translation setup
          </p>
        </div>
        
        <CallSetup onStartCall={startCall} />
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
              Try ConversaFlow
              <span className="block text-2xl text-primary mt-2">No Registration Required</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Experience real-time AI translation with gender-matched voices before signing up
            </p>
          </div>

          {/* Demo Features */}
          <div className="grid md:grid-cols-3 gap-6 my-12">
            <div className="bg-card rounded-xl p-6 border">
              <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Languages className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Live Translation</h3>
              <p className="text-sm text-muted-foreground">
                See real-time translation between 10+ languages
              </p>
            </div>
            
            <div className="bg-card rounded-xl p-6 border">
              <div className="bg-secondary/50 w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
                <TestTube className="h-6 w-6 text-secondary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Gender Detection</h3>
              <p className="text-sm text-muted-foreground">
                AI matches voice gender for natural conversations
              </p>
            </div>
            
            <div className="bg-card rounded-xl p-6 border">
              <div className="bg-accent/50 w-12 h-12 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Languages className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Smart Features</h3>
              <p className="text-sm text-muted-foreground">
                Slang detection, confidence scores, and clarifications
              </p>
            </div>
          </div>

          {/* Demo CTA */}
          <div className="space-y-4">
            <Button 
              size="lg" 
              className="px-12 py-4 text-lg"
              onClick={startSetup}
            >
              <TestTube className="mr-2 h-5 w-5" />
              Start Demo Call
            </Button>
            
            <p className="text-sm text-muted-foreground">
              No signup required • Full feature demo • Takes 2 minutes
            </p>
          </div>

          {/* Sign Up Encouragement */}
          <div className="bg-muted/30 rounded-xl p-6 mt-12">
            <h3 className="font-semibold mb-2">Want to save your contacts and call history?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a free account to access contacts management, call history, and favorites
            </p>
            <Button variant="outline" onClick={goToAuth}>
              Create Free Account
            </Button>
          </div>

          {/* Demo Limitations */}
          <div className="text-xs text-muted-foreground border-t pt-6">
            <p><strong>Demo Limitations:</strong> No data saved • No contact management • Limited to one session</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallDemo;