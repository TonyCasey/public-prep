import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Square, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeepgramStreamingRecorderProps {
  onTranscriptUpdate: (transcript: string) => void;
  onRecordingChange?: (isRecording: boolean) => void;
  isDisabled?: boolean;
  buttonSize?: 'sm' | 'default' | 'lg';
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
  eventType?: 'sample-question' | 'interview-question';
}

const DeepgramStreamingRecorder: React.FC<DeepgramStreamingRecorderProps> = ({
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
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [permissionError, setPermissionError] = useState("");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioMonitoringRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const chunkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedTranscriptRef = useRef<string>("");

  // Check browser support
  useEffect(() => {
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
      
      // Calculate volume level
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
    setAudioLevel(0);
  };


  // Process accumulated chunks into a complete audio file
  const processAccumulatedChunks = async () => {
    if (audioChunksRef.current.length === 0 || isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      // Create a complete audio file from all accumulated chunks
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
      });
      
      console.log('Processing accumulated chunks:', {
        chunkCount: audioChunksRef.current.length,
        totalSize: audioBlob.size,
        type: audioBlob.type
      });
      
      // Clear chunks after creating blob
      audioChunksRef.current = [];
      
      // Send to Deepgram API
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const response = await fetch('/api/deepgram/transcribe', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.transcript) {
          const newTranscript = result.transcript.trim();
          
          if (newTranscript.length > 0) {
            // Append to accumulated transcript
            if (accumulatedTranscriptRef.current.length > 0) {
              accumulatedTranscriptRef.current += ' ' + newTranscript;
            } else {
              accumulatedTranscriptRef.current = newTranscript;
            }
            
            console.log('Streaming transcript update:', newTranscript);
            console.log('Total transcript:', accumulatedTranscriptRef.current);
            
            // Dispatch event with accumulated transcript
            const transcriptEvent = new CustomEvent('voiceTranscriptUpdate', {
              detail: { 
                transcript: accumulatedTranscriptRef.current,
                eventType: eventType,
                source: 'deepgram-streaming',
                isPartial: true
              }
            });
            window.dispatchEvent(transcriptEvent);
            
            // Also call the prop callback with accumulated transcript
            onTranscriptUpdate(accumulatedTranscriptRef.current);
          }
        }
      }
    } catch (error) {
      console.error('Failed to process accumulated chunks:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      console.log(`Starting Deepgram streaming recorder for ${eventType}...`);
      setPermissionError("");
      accumulatedTranscriptRef.current = "";
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });
      
      console.log('Microphone access granted for streaming recorder');
      streamRef.current = stream;
      
      // Setup audio monitoring
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.3;
      
      // Setup MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('New audio chunk received:', {
            size: event.data.size,
            type: event.data.type
          });
          
          // Accumulate chunks for later processing
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Start recording with larger timeslice for better audio quality
      mediaRecorderRef.current.start(3000); // Collect data every 3 seconds
      setIsRecording(true);
      onRecordingChange(true);
      
      // Start audio monitoring
      startAudioMonitoring();
      
      // Start duration timer
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      // Process accumulated chunks every 3 seconds
      chunkIntervalRef.current = setInterval(() => {
        if (!isProcessing && audioChunksRef.current.length > 0) {
          processAccumulatedChunks();
        }
      }, 3000);
      
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

  const stopRecording = async () => {
    console.log('Stopping streaming recorder...');
    
    // Clear chunk processing interval
    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    }
    
    // Stop recording
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // Process any remaining chunks after a short delay
      setTimeout(async () => {
        if (audioChunksRef.current.length > 0) {
          await processAccumulatedChunks();
        }
        
        // Send final transcript update
        if (accumulatedTranscriptRef.current) {
          const transcriptEvent = new CustomEvent('voiceTranscriptUpdate', {
            detail: { 
              transcript: accumulatedTranscriptRef.current,
              eventType: eventType,
              source: 'deepgram-streaming',
              isPartial: false
            }
          });
          window.dispatchEvent(transcriptEvent);
        }
      }, 500);
    }
    
    // Clean up
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setIsRecording(false);
    onRecordingChange(false);
    stopAudioMonitoring();
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
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
          disabled={isDisabled}
          className={`relative ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isRecording ? (
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

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center space-x-2 text-purple-600">
            <Zap className="w-4 h-4 animate-bounce" />
            <span className="text-xs">Processing...</span>
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
      {!isRecording && (
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Real-time transcription powered by Deepgram
          </p>
        </div>
      )}
    </div>
  );
};

export default DeepgramStreamingRecorder;