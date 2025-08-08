import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Languages, ArrowRight, Users } from 'lucide-react';
import { ContactPicker } from './ContactPicker';
import { useTwilioCall } from '@/hooks/useTwilioCall';

interface CallSetupProps {
  onStartCall: (setup: CallConfiguration) => void;
}

interface CallConfiguration {
  myLanguage: string;
  theirLanguage: string;
  theirPhoneNumber: string;
  myPhoneNumber: string;
}

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
];

export const CallSetup: React.FC<CallSetupProps> = ({ onStartCall }) => {
  const [myLanguage, setMyLanguage] = useState<string>('');
  const [theirLanguage, setTheirLanguage] = useState<string>('');
  const [theirPhoneNumber, setTheirPhoneNumber] = useState<string>('');
  const [contactName, setContactName] = useState<string>('');
  // Use your actual Twilio phone number
  const [myPhoneNumber] = useState<string>('+14425001890'); // Your Twilio number
  const { initiateCall, isLoading } = useTwilioCall();

  const handleContactSelect = (phoneNumber: string, name?: string) => {
    setTheirPhoneNumber(phoneNumber);
    setContactName(name || '');
  };

  const handleStartCall = async () => {
    if (myLanguage && theirLanguage && theirPhoneNumber) {
      const result = await initiateCall({
        myLanguage,
        theirLanguage,
        theirPhoneNumber,
        myPhoneNumber
      });
      
      if (result.success) {
        onStartCall({
          myLanguage,
          theirLanguage,
          theirPhoneNumber,
          myPhoneNumber
        });
      }
    }
  };

  const isValid = myLanguage && theirLanguage && theirPhoneNumber;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Languages className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">TransBridge</h1>
          <p className="text-muted-foreground">Connect across languages instantly</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Setup Translation Call
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* User's phone number - pre-populated */}
            <div className="space-y-2">
              <Label htmlFor="myPhoneNumber">Your Phone Number</Label>
              <Input
                id="myPhoneNumber"
                type="tel"
                value={myPhoneNumber}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                📱 In the mobile app, this is automatically detected from your device
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="myLanguage">Your Language</Label>
              <Select value={myLanguage} onValueChange={setMyLanguage}>
                <SelectTrigger id="myLanguage">
                  <SelectValue placeholder="Select your language" />
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

            <div className="flex items-center justify-center py-2">
              <ArrowRight className="w-6 h-6 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="theirPhoneNumber">Who do you want to call?</Label>
              <div className="flex space-x-2">
                <Input
                  id="theirPhoneNumber"
                  type="tel"
                  placeholder="Enter phone number or select from contacts"
                  value={contactName ? `${contactName} (${theirPhoneNumber})` : theirPhoneNumber}
                  onChange={(e) => {
                    setTheirPhoneNumber(e.target.value);
                    setContactName('');
                  }}
                  className="flex-1"
                />
                <ContactPicker onSelectContact={handleContactSelect}>
                  <Button variant="outline" size="icon" type="button">
                    <Users className="w-4 h-4" />
                  </Button>
                </ContactPicker>
              </div>
              <p className="text-xs text-muted-foreground">
                📞 In the mobile app, tap the contacts button to select from your phone's contacts
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="theirLanguage">Their Language</Label>
              <Select value={theirLanguage} onValueChange={setTheirLanguage}>
                <SelectTrigger id="theirLanguage">
                  <SelectValue placeholder="Select their language" />
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

            <Button 
              onClick={handleStartCall} 
              disabled={!isValid || isLoading}
              className="w-full mt-6"
              size="lg"
            >
              <Phone className="w-4 h-4 mr-2" />
              {isLoading ? 'Initiating Call...' : 'Start Translation Call'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};