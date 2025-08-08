import { useState, useRef, useCallback } from 'react';

interface UseVoiceCaptureReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  error: string | null;
}

export const useVoiceCapture = (): UseVoiceCaptureReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please check microphone permissions.');
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      
      if (!mediaRecorder || mediaRecorder.state !== 'recording') {
        resolve(null);
        return;
      }

      mediaRecorder.onstop = async () => {
        try {
          // Stop all tracks
          mediaRecorder.stream.getTracks().forEach(track => track.stop());

          // Create audio blob from chunks
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Convert to base64
          const reader = new FileReader();
          reader.onload = () => {
            const base64Audio = (reader.result as string).split(',')[1];
            resolve(base64Audio);
          };
          reader.onerror = () => {
            setError('Failed to process audio');
            resolve(null);
          };
          reader.readAsDataURL(audioBlob);

        } catch (err) {
          console.error('Error processing recording:', err);
          setError('Failed to process recording');
          resolve(null);
        }
      };

      mediaRecorder.stop();
      setIsRecording(false);
    });
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording,
    error
  };
};