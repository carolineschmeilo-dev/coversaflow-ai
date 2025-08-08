import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface CallConfiguration {
  myLanguage: string;
  theirLanguage: string;
  theirPhoneNumber: string;
  myPhoneNumber: string;
}

export const useTwilioCall = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [callSid, setCallSid] = useState<string | null>(null);
  const { toast } = useToast();

  const initiateCall = async (config: CallConfiguration) => {
    setIsLoading(true);
    try {
      console.log('Initiating call with config:', config);
      
      // Generate a unique conference name for this translation session
      const conferenceId = `translation-${Date.now()}`;
      
      const { data, error } = await supabase.functions.invoke('twilio-call', {
        body: {
          to: config.theirPhoneNumber,
          from: config.myPhoneNumber,
          conference: conferenceId
        }
      });

      if (error) throw error;

      if (data.success) {
        setCallSid(data.callSid);
        toast({
          title: "Call Initiated",
          description: `Calling ${config.theirPhoneNumber}...`,
        });
        
        return {
          success: true,
          callSid: data.callSid,
          conferenceId
        };
      } else {
        throw new Error(data.error || 'Failed to initiate call');
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      toast({
        title: "Call Failed",
        description: error instanceof Error ? error.message : 'Failed to initiate call',
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const endCall = () => {
    setCallSid(null);
    toast({
      title: "Call Ended",
      description: "The translation call has been ended.",
    });
  };

  return {
    initiateCall,
    endCall,
    isLoading,
    callSid,
    isCallActive: !!callSid
  };
};