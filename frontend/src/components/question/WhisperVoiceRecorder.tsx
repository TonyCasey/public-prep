import React, { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Square, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';

interface WhisperVoiceRecorderProps {
  onTranscriptUpdate: (transcript: string) => void;
  onRecordingChange?: (isRecording: boolean) => void;
  isDisabled?: boolean;
  buttonSize?: 'sm' | 'default' | 'lg';
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
  eventType?: 'sample-question' | 'interview-question';
}

const WhisperVoiceRecorder: React.FC<WhisperVoiceRecorderProps> = ({
  onTranscriptUpdate,
  onRecordingChange = () => {},
  isDisabled = false,
  buttonSize = 'lg',
  buttonVariant = 'default',
  className = '',
  eventType = 'interview-question'
}) => {
  const [isSupported, setIsSupported] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [permissionError, setPermissionError] = useState("");
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioMonitoringRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check browser support
  React.useEffect(() => {
    const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
    const hasGetUserMedia = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    
    if (!hasMediaRecorder || !hasGetUserMedia) {
      setIsSupported(false);
      setPermissionError("Voice recording not supported in this browser. Please use Chrome, Firefox, or Safari.");
    }
  }, []);

  // Audio level monitoring
  const startAudioMonitoring = () => {
    if (!analyserRef.current) return;
    
    const analyzeAudio = () => {
      if (!analyserRef.current || !isRecording) return;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate RMS (Root Mean Square) for volume level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / bufferLength);
      const volume = Math.min(100, (rms / 255) * 100);
      
      setAudioLevel(volume);
      
      if (isRecording) {
        audioMonitoringRef.current = requestAnimationFrame(analyzeAudio);
      }
    };
    
    analyzeAudio();
  };

  const stopAudioMonitoring = () => {
    if (audioMonitoringRef.current) {
      cancelAnimationFrame(audioMonitoringRef.current);
      audioMonitoringRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setAudioLevel(0);
  };

  const startRecording = async () => {
    try {
      console.log(`Starting Whisper voice recorder for ${eventType}...`);
      setPermissionError("");
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      console.log('Microphone access granted for Whisper recorder');
      streamRef.current = stream;
      
      // Setup audio monitoring
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.3;
      
      // Setup MediaRecorder for high-quality audio
      const options: MediaRecorderOptions = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      };
      
      // Fallback for browsers that don't support webm
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        options.mimeType = 'audio/mp4';
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        console.log('Recording stopped, processing audio...');
        await processRecording();
      };
      
      // Start recording
      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      onRecordingChange(true);
      
      // Start audio monitoring
      startAudioMonitoring();
      
      // Start duration timer
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setPermissionError("Microphone access denied. Please allow microphone access in your browser settings.");
        } else if (error.name === 'NotFoundError') {
          setPermissionError("No microphone found. Please check your microphone connection.");
        } else {
          setPermissionError("Failed to start recording. Please check your microphone.");
        }
      }
    }
  };

  const stopRecording = () => {
    console.log('Stopping Whisper voice recorder...');
    
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    setIsRecording(false);
    onRecordingChange(false);
    stopAudioMonitoring();
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const processRecording = async () => {
    if (audioChunksRef.current.length === 0) {
      console.error('No audio data to process');
      return;
    }
    
    try {
      setIsProcessing(true);
      
      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
      });
      
      console.log('Processing audio blob:', {
        size: audioBlob.size,
        type: audioBlob.type
      });
      
      // Prepare form data for upload
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      // Send to Whisper API
      const response = await fetch('/api/speech/transcribe', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorResult = await response.json();
        
        if (response.status === 429 && errorResult.quotaExceeded) {
          setPermissionError("OpenAI quota exceeded. Please type your answer or add more OpenAI credits.");
          return;
        }
        
        throw new Error(errorResult.error || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.transcript) {
        console.log('Whisper transcription successful:', result.transcript);
        
        // Dispatch custom event for transcript update
        const transcriptEvent = new CustomEvent('voiceTranscriptUpdate', {
          detail: { 
            transcript: result.transcript,
            eventType: eventType,
            source: 'whisper-recorder' 
          }
        });
        console.log('WhisperRecorder - Dispatching event:', { 
          transcript: result.transcript, 
          eventType, 
          source: 'whisper-recorder' 
        });
        window.dispatchEvent(transcriptEvent);
        
        // Also call the prop callback
        onTranscriptUpdate(result.transcript);
      } else {
        throw new Error(result.error || 'Transcription failed');
      }
      
    } catch (error) {
      console.error('Failed to process recording:', error);
      setPermissionError("Failed to process audio. Please try again.");
    } finally {
      setIsProcessing(false);
      setRecordingDuration(0);
      audioChunksRef.current = [];
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVolumeColor = (): string => {
    if (audioLevel < 10) return 'bg-gray-300';
    if (audioLevel < 30) return 'bg-yellow-400';
    if (audioLevel < 60) return 'bg-green-400';
    return 'bg-green-500';
  };

  if (!isSupported) {
    return (
      <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">{permissionError}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Recording Button */}
      <div className="flex flex-col items-center space-y-3">
        <Button
          size={buttonSize}
          variant={buttonVariant}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isDisabled || isProcessing}
          className={`relative ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isProcessing ? (
            <>
              <Upload className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : isRecording ? (
            <>
              <Square className="w-4 h-4 mr-2" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              Start Recording
            </>
          )}
        </Button>

        {/* Recording Duration */}
        {isRecording && (
          <div className="text-sm text-gray-600 font-mono">
            Recording: {formatDuration(recordingDuration)}
          </div>
        )}

        {/* Audio Level Indicator */}
        {isRecording && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Audio:</span>
            <div className="flex space-x-1">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-4 rounded-full transition-colors duration-150 ${
                    audioLevel > (i + 1) * 10 ? getVolumeColor() : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Messages */}
      {permissionError && (
        <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{permissionError}</p>
        </div>
      )}

      {/* Instructions */}
      {!isRecording && !isProcessing && (
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Uses OpenAI Whisper for accurate speech recognition
          </p>
        </div>
      )}
    </div>
  );
};

export default WhisperVoiceRecorder;