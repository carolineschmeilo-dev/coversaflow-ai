import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Languages, Mail, LogOut, User, TestTube, Users, History } from "lucide-react";
import { CallSetup } from "@/components/CallSetup";
import { ActiveCall } from "@/components/ActiveCall";
import { GenderDetectionDemo } from "@/components/GenderDetectionDemo";
import { ContactsManager } from "@/components/ContactsManager";
import { useAuth } from "@/hooks/useAuth";

interface CallConfiguration {
  myLanguage: string;
  theirLanguage: string;
  theirPhoneNumber: string;
  myPhoneNumber: string;
}

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'setup' | 'call' | 'demo' | 'contacts' | 'history'>('home');
  const [callConfig, setCallConfig] = useState<CallConfiguration | null>(null);
  const { user, signOut } = useAuth();

  const startCallSetup = () => {
    setCurrentScreen('setup');
  };

  const startCall = (config: CallConfiguration) => {
    setCallConfig(config);
    setCurrentScreen('call');
  };

  const endCall = () => {
    setCurrentScreen('home');
    setCallConfig(null);
  };

  // Show different screens based on current state
  if (currentScreen === 'setup') {
    return <CallSetup onStartCall={startCall} />;
  }

  if (currentScreen === 'call' && callConfig) {
    return (
      <ActiveCall
        myLanguage={callConfig.myLanguage}
        theirLanguage={callConfig.theirLanguage}
        theirPhoneNumber={callConfig.theirPhoneNumber}
        onEndCall={endCall}
      />
    );
  }

  if (currentScreen === 'demo') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        {/* Header */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-2">
              <Languages className="w-6 h-6 text-primary" />
              <span className="font-semibold text-foreground">ConversaFlow</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentScreen('home')}
              >
                Back to Home
              </Button>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Demo Content */}
        <div className="container mx-auto px-4 py-8">
          <GenderDetectionDemo />
        </div>
      </div>
    );
  }

  if (currentScreen === 'contacts') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        {/* Header */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-2">
              <Languages className="w-6 h-6 text-primary" />
              <span className="font-semibold text-foreground">ConversaFlow</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentScreen('home')}
              >
                Back to Home
              </Button>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Contacts Content */}
        <div className="container mx-auto px-4 py-8">
          <ContactsManager 
            showCallButton={true}
            onSelectContact={(contact) => {
              // Pre-fill call setup with selected contact
              setCurrentScreen('setup');
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header with auth info */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Languages className="w-6 h-6 text-primary" />
            <span className="font-semibold text-foreground">ConversaFlow</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>{user?.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <Languages className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Break Language Barriers
            <span className="block text-primary">Instantly</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Real-time AI translation for phone conversations. Connect with anyone, anywhere, in any language.
          </p>
          
          {/* CTA Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 justify-center mb-12 max-w-4xl mx-auto">
            <Button 
              size="lg" 
              className="px-8 py-4 text-lg"
              onClick={startCallSetup}
            >
              <Phone className="mr-2 h-5 w-5" />
              Start Call
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="px-8 py-4 text-lg"
              onClick={() => setCurrentScreen('contacts')}
            >
              <Users className="mr-2 h-5 w-5" />
              Contacts
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="px-8 py-4 text-lg"
              onClick={() => setCurrentScreen('history')}
            >
              <History className="mr-2 h-5 w-5" />
              Call History
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="px-8 py-4 text-lg"
              onClick={() => window.location.href = '/demo'}
            >
              <TestTube className="mr-2 h-5 w-5" />
              See How It Works
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-card rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Phone className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-4 text-center">Smart Call Routing</h3>
            <p className="text-muted-foreground text-center">
              Our AI connects your call and maintains your caller ID for seamless communication.
            </p>
          </div>
          
          <div className="bg-card rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-secondary/50 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Languages className="h-8 w-8 text-secondary-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-4 text-center">Real-Time Translation</h3>
            <p className="text-muted-foreground text-center">
              Instant, natural-sounding translation preserving tone and meaning.
            </p>
          </div>
          
          <div className="bg-card rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-accent/50 w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Languages className="h-8 w-8 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-card-foreground mb-4 text-center">10+ Languages</h3>
            <p className="text-muted-foreground text-center">
              Support for major world languages with more coming soon.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-card rounded-2xl p-8 mb-16 shadow-lg">
          <h2 className="text-3xl font-bold text-card-foreground text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Setup Call</h3>
              <p className="text-muted-foreground">Enter phone numbers and select languages</p>
            </div>
            <div className="text-center">
              <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="text-lg font-semibold text-card-foreground mb-2">AI Connects</h3>
              <p className="text-muted-foreground">Our AI bridges the call maintaining your caller ID</p>
            </div>
            <div className="text-center">
              <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="text-lg font-semibold text-card-foreground mb-2">Talk Naturally</h3>
              <p className="text-muted-foreground">Speak normally while AI translates in real-time</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-center text-primary-foreground mb-16">
          <h2 className="text-3xl font-bold mb-4">Ready to Connect Across Languages?</h2>
          <p className="text-xl mb-6 opacity-90">Start your first translated call today</p>
          <Button 
            size="lg" 
            variant="secondary"
            className="px-8 py-4 text-lg"
            onClick={startCallSetup}
          >
            <Phone className="mr-2 h-5 w-5" />
            Start Translation Call
          </Button>
          <div className="mt-8 text-sm opacity-75">
            <p>Available as a mobile app soon!</p>
          </div>
        </div>

        {/* Contact */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Questions? We're Here to Help</h2>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.location.href = 'mailto:support@transbridge.ai'}
          >
            <Mail className="mr-2 h-5 w-5" />
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;