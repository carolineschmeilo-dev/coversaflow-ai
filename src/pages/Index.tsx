import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Phone, Globe, Mic, MessageSquare, MessageCircle } from "lucide-react";
import { PhoneCallTranslator } from "@/components/PhoneCallTranslator";
import conversaflowLogo from "@/assets/conversaflow-logo.png";
import { EarlyAccessSignup } from "@/components/EarlyAccessSignup";

const Index = () => {
  console.log("Index component rendering");
  const [isInCall, setIsInCall] = useState(false);

  const startCall = () => {
    setIsInCall(true);
  };

  const endCall = () => {
    setIsInCall(false);
  };

  if (isInCall) {
    return <PhoneCallTranslator onEndCall={endCall} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8 max-w-3xl mx-auto">
          <div className="space-y-6">
            <div className="flex items-center justify-center mb-6">
              <img 
                src={conversaflowLogo} 
                alt="ConversaFlow.AI Logo" 
                className="w-20 h-20 mr-4"
              />
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary-glow to-accent bg-clip-text text-transparent">
                ConversaFlow.AI
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Break down language barriers with real-time translation for phone conversations. 
              Connect with anyone, anywhere, in their native language.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={startCall}
              className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Phone className="w-6 h-6 mr-2" />
              Start Phone Translation
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-6 rounded-full"
              onClick={() => {
                window.open('mailto:support@conversaflow.ai?subject=ConversaFlow.AI Support', '_blank');
              }}
            >
              <MessageCircle className="w-6 h-6 mr-2" />
              Talk to Us
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
          <Card className="p-6 bg-gradient-to-br from-card to-muted/20 border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary-glow rounded-lg flex items-center justify-center">
                <Mic className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Real-Time Translation</h3>
              <p className="text-muted-foreground">
                Instant voice translation with industry-leading accuracy and minimal latency.
              </p>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-muted/20 border-accent/10 hover:border-accent/30 transition-all duration-300 hover:shadow-lg">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-gradient-to-r from-accent to-primary rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold">50+ Languages</h3>
              <p className="text-muted-foreground">
                Support for major world languages with continuous expansion and updates.
              </p>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-muted/20 border-success/10 hover:border-success/30 transition-all duration-300 hover:shadow-lg">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-gradient-to-r from-success to-accent rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-success-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Smart Context</h3>
              <p className="text-muted-foreground">
                AI-powered context understanding for accurate and natural translations.
              </p>
            </div>
          </Card>
        </div>

        {/* How It Works */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary-glow rounded-full flex items-center justify-center mx-auto text-2xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="text-xl font-semibold">Select Languages</h3>
              <p className="text-muted-foreground">
                Choose your language and your contact's language from our extensive list.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center mx-auto text-2xl font-bold text-accent-foreground">
                2
              </div>
              <h3 className="text-xl font-semibold">Start Talking</h3>
              <p className="text-muted-foreground">
                Begin your conversation naturally - we'll handle the translation in real-time.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-success to-accent rounded-full flex items-center justify-center mx-auto text-2xl font-bold text-success-foreground">
                3
              </div>
              <h3 className="text-xl font-semibold">Connect Globally</h3>
              <p className="text-muted-foreground">
                Enjoy seamless communication without language barriers.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-12 border border-primary/20">
          <div className="text-center space-y-8">
            <h2 className="text-3xl font-bold">Ready to Connect the World?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the future of global communication. Start translating conversations 
              in real-time and break down language barriers today.
            </p>
            <Button 
              size="lg" 
              onClick={startCall}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary-glow hover:to-primary text-lg px-12 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Phone className="w-6 h-6 mr-2" />
              Try Phone Translation
            </Button>
            
            {/* Download Mobile App Section */}
            <div className="mt-8 p-6 bg-gradient-to-r from-accent/10 to-primary/10 rounded-2xl border border-accent/20">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">📱 Get the Mobile App</h3>
                <p className="text-muted-foreground">
                  For the best phone call translation experience, download our mobile app with full call integration.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => window.open('https://github.com/lovable-dev', '_blank')}
                    className="px-6 py-3"
                  >
                    📱 iOS App
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => window.open('https://github.com/lovable-dev', '_blank')}
                    className="px-6 py-3"
                  >
                    🤖 Android App
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => window.open('https://docs.lovable.dev/integrations/capacitor', '_blank')}
                    className="px-6 py-3"
                  >
                    📋 Build Instructions
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Export this project to GitHub and follow our Capacitor guide to build your own app
                </p>
              </div>
            </div>
            
            <div className="max-w-md mx-auto">
              <EarlyAccessSignup />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;