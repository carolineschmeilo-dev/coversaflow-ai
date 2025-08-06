import { useState, useEffect, useCallback, useRef } from 'react';
import { Device } from '@capacitor/device';

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
      const info = await Device.getInfo();
      const hasMediaDevices = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;
      const hasWebAudio = 'AudioContext' in window || 'webkitAudioContext' in window;
      
      setIsSupported(hasMediaDevices && hasWebAudio && (info.platform === 'ios' || info.platform === 'android'));
    } catch (err) {
      setIsSupported(false);
    }
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (err) {
      setError('Microphone permission denied. Please enable microphone access.');
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