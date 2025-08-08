import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PhoneOff, Mic, MicOff, Volume2, VolumeX, AlertTriangle, RefreshCw } from 'lucide-react';
import { translationService, TranslationResult } from '@/services/translationService';

interface Message {
  id: string;
  text: string;
  translation?: string;
  speaker: 'user' | 'ai' | 'recipient';
  timestamp: Date;
  needsClarification?: boolean;
  confidence?: number;
  detectedSlang?: string[];
}

interface ActiveCallProps {
  myLanguage: string;
  theirLanguage: string;
  theirPhoneNumber: string;
  onEndCall: () => void;
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

export const ActiveCall: React.FC<ActiveCallProps> = ({
  myLanguage,
  theirLanguage,
  theirPhoneNumber,
  onEndCall
}) => {
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'translating'>('connecting');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessingTranslation, setIsProcessingTranslation] = useState(false);

  const getLanguageInfo = (code: string) => {
    return languages.find(lang => lang.code === code) || { name: code, flag: '🌐' };
  };

  const myLangInfo = getLanguageInfo(myLanguage);
  const theirLangInfo = getLanguageInfo(theirLanguage);

  useEffect(() => {
    // Simulate call connection flow
    const timer1 = setTimeout(() => setCallStatus('connected'), 2000);
    const timer2 = setTimeout(() => {
      setCallStatus('translating');
      // Start with demo conversation including slang
      simulateConversation();
    }, 4000);

    // Call duration timer
    const durationTimer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearInterval(durationTimer);
    };
  }, []);

  const simulateConversation = async () => {
    const demoMessages = [
      { text: "Hello, how are you today?", speaker: 'user' as const },
      { text: "That meeting was fire!", speaker: 'user' as const },
      { text: "No cap, this project is bussin", speaker: 'user' as const },
      { text: "I understand the proposal", speaker: 'user' as const }
    ];

    for (let i = 0; i < demoMessages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await processMessage(demoMessages[i].text, demoMessages[i].speaker);
    }
  };

  const processMessage = async (text: string, speaker: 'user' | 'recipient') => {
    const messageId = Date.now().toString();
    
    // Add original message
    const originalMessage: Message = {
      id: messageId,
      text,
      speaker,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, originalMessage]);
    setIsProcessingTranslation(true);

    try {
      // Translate the message
      const result: TranslationResult = await translationService.translateWithFallback(
        text, 
        speaker === 'user' ? myLanguage : theirLanguage,
        speaker === 'user' ? theirLanguage : myLanguage
      );

      // Add AI response
      if (result.needsClarification) {
        const clarificationMessage: Message = {
          id: messageId + '_clarification',
          text: translationService.getClarificationMessage(result.detectedSlang || []),
          speaker: 'ai',
          timestamp: new Date(),
          needsClarification: true
        };
        setMessages(prev => [...prev, clarificationMessage]);
      }

      // Add translation
      const translationMessage: Message = {
        id: messageId + '_translation',
        text: result.translatedText,
        speaker: 'ai',
        timestamp: new Date(),
        confidence: result.confidence,
        detectedSlang: result.detectedSlang
      };
      
      setMessages(prev => [...prev, translationMessage]);
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsProcessingTranslation(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'connecting':
        return 'Connecting to AI translator...';
      case 'connected':
        return 'Calling recipient...';
      case 'translating':
        return 'Translation active';
    }
  };

  const getStatusColor = () => {
    switch (callStatus) {
      case 'connecting':
        return 'bg-yellow-500';
      case 'connected':
        return 'bg-blue-500';
      case 'translating':
        return 'bg-green-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Call Status */}
        <div className="text-center mb-8">
          <div className={`w-4 h-4 rounded-full mx-auto mb-4 ${getStatusColor()} animate-pulse`}></div>
          <h1 className="text-xl font-semibold text-foreground mb-2">{getStatusText()}</h1>
          <p className="text-lg font-mono text-muted-foreground">{formatDuration(callDuration)}</p>
        </div>

        {/* Translation Setup Display */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <div className="text-2xl mb-2">{myLangInfo.flag}</div>
                <p className="text-sm font-medium text-foreground">{myLangInfo.name}</p>
                <p className="text-xs text-muted-foreground">You</p>
              </div>
              
              <div className="flex-1 text-center">
                <div className="w-8 h-0.5 bg-primary mx-auto mb-4"></div>
                <Badge variant="secondary" className="text-xs">
                  AI Translating
                </Badge>
                <div className="w-8 h-0.5 bg-primary mx-auto mt-4"></div>
              </div>
              
              <div className="text-center flex-1">
                <div className="text-2xl mb-2">{theirLangInfo.flag}</div>
                <p className="text-sm font-medium text-foreground">{theirLangInfo.name}</p>
                <p className="text-xs text-muted-foreground">{theirPhoneNumber}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Translation Activity */}
        {callStatus === 'translating' && (
          <Card className="mb-8">
            <CardContent className="p-4">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {messages.map((message) => (
                  <div key={message.id} className={`rounded-lg p-3 ${
                    message.speaker === 'user' 
                      ? 'bg-primary/10 ml-4' 
                      : message.speaker === 'ai'
                      ? 'bg-secondary/50 mx-2'
                      : 'bg-accent/10 mr-4'
                  }`}>
                    <p className="text-sm text-foreground">{message.text}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">
                        {message.speaker === 'user' ? 'You' : 
                         message.speaker === 'ai' ? 'AI Translation' : 
                         theirPhoneNumber} • {message.speaker === 'user' ? myLangInfo.name : 
                         message.speaker === 'ai' ? 'System' : theirLangInfo.name}
                      </p>
                      {message.needsClarification && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Needs Clarification
                        </Badge>
                      )}
                      {message.confidence && message.confidence < 0.8 && (
                        <Badge variant="secondary" className="text-xs">
                          Low Confidence: {Math.round(message.confidence * 100)}%
                        </Badge>
                      )}
                      {message.detectedSlang && message.detectedSlang.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          Slang: {message.detectedSlang.join(', ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {isProcessingTranslation && (
                  <div className="bg-secondary/30 rounded-lg p-3 mx-2">
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <p className="text-sm text-muted-foreground">Processing translation...</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Call Controls */}
        <div className="flex justify-center space-x-4 mb-8">
          <Button
            variant={isMuted ? "destructive" : "secondary"}
            size="lg"
            className="w-16 h-16 rounded-full"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>
          
          <Button
            variant="destructive"
            size="lg"
            className="w-20 h-16 rounded-full"
            onClick={onEndCall}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
          
          <Button
            variant={isSpeakerOn ? "default" : "secondary"}
            size="lg"
            className="w-16 h-16 rounded-full"
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
          >
            {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </Button>
        </div>

        {/* Instructions */}
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Speak naturally. The AI will translate in real-time and ask for clarification when needed.
            </p>
            <p className="text-xs text-muted-foreground">
              Using slang or local expressions? The AI will detect them and suggest clearer alternatives.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};