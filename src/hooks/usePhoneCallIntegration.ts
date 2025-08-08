import { useState, useEffect, useCallback, useRef } from 'react';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';

interface CallState {
  isActive: boolean;
  isRecording: boolean;
  callDuration: number;
  callerAudio?: MediaStream;
  receiverAudio?: MediaStream;
}

interface UsePhoneCallIntegrationReturn {
  callState: CallState;
  startCallRecording: () => Promise<void>;
  stopCallRecording: () => void;
  isSupported: boolean;
  error: string | null;
  requestPermissions: () => Promise<boolean>;
  setupCallIntegration: () => Promise<void>;
}

export const usePhoneCallIntegration = (): UsePhoneCallIntegrationReturn => {
  const [callState, setCallState] = useState<CallState>({
    isActive: false,
    isRecording: false,
    callDuration: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const callDurationInterval = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    checkSupport();
  }, []);

  useEffect(() => {
    if (callState.isActive) {
      callDurationInterval.current = setInterval(() => {
        setCallState(prev => ({
          ...prev,
          callDuration: prev.callDuration + 1
        }));
      }, 1000);
    } else {
      if (callDurationInterval.current) {
        clearInterval(callDurationInterval.current);
        callDurationInterval.current = null;
      }
    }

    return () => {
      if (callDurationInterval.current) {
        clearInterval(callDurationInterval.current);
      }
    };
  }, [callState.isActive]);

  const checkSupport = useCallback(async () => {
    try {
      const hasMediaDevices = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
      const hasWebAudio = 'AudioContext' in window || 'webkitAudioContext' in window;
      
      // Always enable support if we have the basic web APIs - Capacitor handles the rest
      setIsSupported(hasMediaDevices && hasWebAudio);
    } catch (err) {
      setIsSupported(false);
    }
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      console.log('Starting permission request...');
      
      // Check if we're in a Capacitor native app
      const info = await Device.getInfo();
      const isNativeApp = Capacitor.isNativePlatform();
      
      console.log('Device info:', info);
      console.log('Is native app:', isNativeApp);
      
      // First check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Your device does not support microphone access.');
        return false;
      }
      
      console.log('About to request microphone access...');
      
      // Request microphone permission through web API (works in both web and Capacitor)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      console.log('Successfully got microphone access');
      
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (err) {
      console.error('Permission request failed:', err);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          const info = await Device.getInfo();
          if (info.platform === 'android' || info.platform === 'ios') {
            setError('Microphone permission denied. Please go to your device Settings > Apps > CoversaFlow AI > Permissions and enable Microphone access, then restart the app.');
          } else {
            setError('Microphone permission denied. Please allow microphone access when prompted or check your browser settings.');
          }
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found. Please ensure your device has a microphone and try again.');
        } else if (err.name === 'NotReadableError') {
          setError('Microphone is being used by another application. Please close other apps using the microphone and try again.');
        } else if (err.name === 'OverconstrainedError') {
          setError('Microphone constraints not supported. Trying with basic settings...');
          // Try again with basic settings
          try {
            const basicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            basicStream.getTracks().forEach(track => track.stop());
            return true;
          } catch (basicErr) {
            setError('Failed to access microphone even with basic settings.');
          }
        } else {
          setError(`Microphone access failed: ${err.message}`);
        }
      } else {
        setError('Failed to access microphone. Please check your device settings and try again.');
      }
      return false;
    }
  }, []);

  const setupCallIntegration = useCallback(async () => {
    try {
      if (!isSupported) {
        throw new Error('Phone call integration not supported on this device');
      }

      // Initialize AudioContext for advanced audio processing
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup call integration');
    }
  }, [isSupported]);

  const startCallRecording = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        await setupCallIntegration();
      }

      // Get access to microphone with high quality settings
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        }
      });

      // Create MediaRecorder for capturing audio
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      const audioChunks: Blob[] = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
        // Process the audio blob for transcription
        console.log('Audio recorded:', audioBlob);
      };

      mediaRecorderRef.current.start(1000); // Capture in 1-second chunks

      setCallState(prev => ({
        ...prev,
        isActive: true,
        isRecording: true,
        callerAudio: stream,
        callDuration: 0
      }));

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start call recording');
    }
  }, [setupCallIntegration]);

  const stopCallRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (callState.callerAudio) {
      callState.callerAudio.getTracks().forEach(track => track.stop());
    }

    if (callState.receiverAudio) {
      callState.receiverAudio.getTracks().forEach(track => track.stop());
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setCallState({
      isActive: false,
      isRecording: false,
      callDuration: 0,
    });

    mediaRecorderRef.current = null;
  }, [callState.callerAudio, callState.receiverAudio]);

  return {
    callState,
    startCallRecording,
    stopCallRecording,
    isSupported,
    error,
    requestPermissions,
    setupCallIntegration,
  };
};