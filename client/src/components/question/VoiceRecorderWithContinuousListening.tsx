import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Gauge, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface VoiceRecorderWithContinuousListeningProps {
  onTranscriptUpdate: (transcript: string) => void;
  onRecordingChange?: (isRecording: boolean) => void;
  onConfidenceUpdate?: (confidence: number) => void;
  onPronunciationFeedback?: (feedback: PronunciationFeedback) => void;
  isDisabled?: boolean;
  buttonSize?: 'sm' | 'default' | 'lg';
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
  showInterimTranscript?: boolean;
  showConfidenceScore?: boolean;
  showPronunciationFeedback?: boolean;
  eventType?: 'sample-question' | 'interview-question';
}

interface PronunciationFeedback {
  clarity: number; // 0-100
  pace: 'too_fast' | 'too_slow' | 'good' | 'unknown';
  volume: 'too_quiet' | 'too_loud' | 'good' | 'unknown';
  stability: number; // 0-100, measures voice consistency
}

const VoiceRecorderWithContinuousListening: React.FC<VoiceRecorderWithContinuousListeningProps> = ({
  onTranscriptUpdate,
  onRecordingChange = () => {},
  onConfidenceUpdate = () => {},
  onPronunciationFeedback = () => {},
  isDisabled = false,
  buttonSize = 'lg',
  buttonVariant = 'default',
  className = '',
  showInterimTranscript = true,
  showConfidenceScore = true,
  showPronunciationFeedback = true,
  eventType = 'interview-question'
}) => {
  const [isSupported, setIsSupported] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [permissionError, setPermissionError] = useState("");
  const [confidenceScore, setConfidenceScore] = useState<number>(0);
  const [pronunciationFeedback, setPronunciationFeedback] = useState<PronunciationFeedback>({
    clarity: 0,
    pace: 'unknown',
    volume: 'unknown',
    stability: 0
  });
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>("");
  const lastProcessedResultRef = useRef<number>(-1);
  const shouldKeepListeningRef = useRef<boolean>(false);
  const accumulatedTranscriptRef = useRef<string>("");
  const waitingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Audio analysis refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioMonitoringRef = useRef<number | null>(null);
  const volumeHistoryRef = useRef<number[]>([]);
  const speechPatternsRef = useRef<{
    wordsPerMinute: number;
    pauseDurations: number[];
    volumeVariations: number[];
  }>({
    wordsPerMinute: 0,
    pauseDurations: [],
    volumeVariations: []
  });

  // Audio analysis functions
  const setupAudioAnalysis = async (): Promise<MediaStream | null> => {
    try {
      console.log('Requesting microphone access for voice recorder...');
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      console.log('Microphone access granted! Setting up audio analysis...');
      streamRef.current = stream;
      
      // Setup audio context and analyser
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.3;
      
      return stream;
    } catch (error) {
      console.error('Error setting up audio analysis:', error);
      setPermissionError("Microphone access required for pronunciation analysis.");
      return null;
    }
  };

  const startAudioMonitoring = () => {
    if (!analyserRef.current) return;
    
    const analyzeAudio = () => {
      if (!analyserRef.current || !shouldKeepListeningRef.current) return;
      
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
      volumeHistoryRef.current.push(volume);
      
      // Debug audio level detection
      if (volume > 10) {
        console.log('Audio level detected:', volume);
      }
      
      // Keep only last 50 volume readings for analysis
      if (volumeHistoryRef.current.length > 50) {
        volumeHistoryRef.current.shift();
      }
      
      // Analyze pronunciation feedback
      if (volumeHistoryRef.current.length >= 10) {
        const avgVolume = volumeHistoryRef.current.reduce((a, b) => a + b, 0) / volumeHistoryRef.current.length;
        const volumeVariance = volumeHistoryRef.current.reduce((acc, vol) => acc + Math.pow(vol - avgVolume, 2), 0) / volumeHistoryRef.current.length;
        const stability = Math.max(0, 100 - volumeVariance);
        
        // Determine volume feedback
        let volumeFeedback: 'too_quiet' | 'too_loud' | 'good' | 'unknown' = 'good';
        if (avgVolume < 15) volumeFeedback = 'too_quiet';
        else if (avgVolume > 80) volumeFeedback = 'too_loud';
        
        // Calculate clarity based on frequency distribution
        const clarity = Math.min(100, (avgVolume / 60) * stability);
        
        const feedback: PronunciationFeedback = {
          clarity: Math.round(clarity),
          pace: 'good', // Will be enhanced with speech pattern analysis
          volume: volumeFeedback,
          stability: Math.round(stability)
        };
        
        setPronunciationFeedback(feedback);
        onPronunciationFeedback(feedback);
        
        // Calculate confidence score based on multiple factors
        const confidence = Math.round((clarity + stability) / 2);
        setConfidenceScore(confidence);
        onConfidenceUpdate(confidence);
      }
      
      audioMonitoringRef.current = requestAnimationFrame(analyzeAudio);
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
    
    // Reset audio states
    setAudioLevel(0);
    volumeHistoryRef.current = [];
  };

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (waitingTimeoutRef.current) {
        clearTimeout(waitingTimeoutRef.current);
      }
      stopAudioMonitoring();
    };
  }, []);

  const startListening = async () => {
    try {
      console.log('Starting continuous voice recording with pronunciation analysis...');
      setPermissionError("");
      setInterimTranscript("");
      
      // Reset tracking variables for new session
      lastProcessedResultRef.current = -1;
      finalTranscriptRef.current = "";
      shouldKeepListeningRef.current = true;
      accumulatedTranscriptRef.current = "";
      
      // Reset audio analysis states
      setConfidenceScore(0);
      setPronunciationFeedback({
        clarity: 0,
        pace: 'unknown',
        volume: 'unknown',
        stability: 0
      });
      volumeHistoryRef.current = [];
      
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!SpeechRecognition) {
        setPermissionError("Speech recognition not supported in this browser.");
        return;
      }
      
      // Setup audio analysis first
      const audioStream = await setupAudioAnalysis();
      if (!audioStream) {
        return; // Error already set in setupAudioAnalysis
      }

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-IE';
      recognitionRef.current.maxAlternatives = 1;

      setIsRecording(true);
      onRecordingChange(true);

      recognitionRef.current.onstart = () => {
        console.log('Continuous speech recognition started');
        setPermissionError("");
        // Start audio monitoring for pronunciation analysis
        startAudioMonitoring();
        // Don't clear waiting state here - let it be cleared when speech is actually detected
      };

      recognitionRef.current.onresult = (event: any) => {
        // Set speaking state and clear waiting state when we detect any speech activity
        if (isWaiting || !isSpeaking) {
          console.log('Continuous - Speech detected, activating speaking state');
          setIsWaiting(false);
          setIsSpeaking(true);
          if (waitingTimeoutRef.current) {
            clearTimeout(waitingTimeoutRef.current);
            waitingTimeoutRef.current = null;
          }
        }
        
        let currentInterim = '';
        let latestFinalTranscript = '';
        
        // Find the LATEST (longest) final result - this prevents accumulation
        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            const cleanedTranscript = transcript.trim();
            if (cleanedTranscript && cleanedTranscript.length > 0) {
              // Keep only the longest final result (most complete speech)
              if (cleanedTranscript.length > latestFinalTranscript.length) {
                latestFinalTranscript = cleanedTranscript;
                console.log('Continuous - Found longer final result:', cleanedTranscript);
              }
            }
          } else {
            // Show interim results
            currentInterim += transcript;
          }
        }
        
        // Only update if we have a final transcript that's different from what we stored
        if (latestFinalTranscript && latestFinalTranscript !== finalTranscriptRef.current) {
          const formattedTranscript = latestFinalTranscript.charAt(0).toUpperCase() + latestFinalTranscript.slice(1);
          const punctuatedTranscript = formattedTranscript.endsWith('.') || 
                                      formattedTranscript.endsWith('?') || 
                                      formattedTranscript.endsWith('!')
                                      ? formattedTranscript 
                                      : formattedTranscript + '.';
          
          // Combine with any previously accumulated text
          const fullTranscript = accumulatedTranscriptRef.current ? 
            accumulatedTranscriptRef.current + ' ' + punctuatedTranscript : 
            punctuatedTranscript;
          
          console.log('Continuous - Updating to combined transcript:', fullTranscript);
          finalTranscriptRef.current = latestFinalTranscript;
          
          // Dispatch custom event for transcript update
          const transcriptEvent = new CustomEvent('voiceTranscriptUpdate', {
            detail: { 
              transcript: fullTranscript,
              eventType: eventType,
              source: 'voice-recorder' 
            }
          });
          console.log('VoiceRecorder - Dispatching event:', { transcript: fullTranscript, eventType, source: 'voice-recorder' });
          window.dispatchEvent(transcriptEvent);
          
          // Also call the prop callback for backward compatibility
          onTranscriptUpdate(fullTranscript);
        }
        
        setInterimTranscript(currentInterim);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Continuous speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setPermissionError("Microphone access denied. Please allow microphone access in your browser.");
        } else if (event.error === 'no-speech') {
          console.log('No speech detected');
          // Don't stop listening for no-speech - it's normal
          return;
        } else if (event.error === 'network') {
          console.log('Network error in speech recognition - this is common in development environments');
          setPermissionError("Voice recognition temporarily unavailable. Please type your answer or try refreshing the page.");
        } else {
          console.log(`Speech recognition error: ${event.error} - continuing without stopping`);
          setPermissionError(`Voice recognition issue: ${event.error}. Please type your answer.`);
        }
        
        // Only stop listening for critical errors
        if (event.error === 'not-allowed' || event.error === 'network') {
          stopListening();
        }
      };

      recognitionRef.current.onend = () => {
        console.log('Continuous speech recognition ended');
        
        // If we should keep listening, save current text and restart recognition
        if (shouldKeepListeningRef.current) {
          // Save current final transcript to accumulated text before restarting
          if (finalTranscriptRef.current) {
            const formattedTranscript = finalTranscriptRef.current.charAt(0).toUpperCase() + finalTranscriptRef.current.slice(1);
            const punctuatedTranscript = formattedTranscript.endsWith('.') || 
                                        formattedTranscript.endsWith('?') || 
                                        formattedTranscript.endsWith('!')
                                        ? formattedTranscript 
                                        : formattedTranscript + '.';
            
            accumulatedTranscriptRef.current = accumulatedTranscriptRef.current ? 
              accumulatedTranscriptRef.current + ' ' + punctuatedTranscript : 
              punctuatedTranscript;
            
            console.log('Continuous - Accumulated transcript before restart:', accumulatedTranscriptRef.current);
          }
          
          console.log('Continuous - Restarting recognition to continue listening...');
          setIsWaiting(true); // Show waiting state during restart
          setIsSpeaking(false); // Clear speaking state when recognition ends
          setTimeout(() => {
            if (shouldKeepListeningRef.current && recognitionRef.current) {
              try {
                // Reset for new recognition session
                finalTranscriptRef.current = "";
                recognitionRef.current.start();
              } catch (error) {
                console.error('Failed to restart recognition:', error);
                // If restart fails, stop recording
                setIsRecording(false);
                setIsWaiting(false);
                onRecordingChange(false);
                setInterimTranscript("");
                shouldKeepListeningRef.current = false;
              }
            } else {
              // If we're not supposed to keep listening, clear waiting state
              setIsWaiting(false);
            }
          }, 1000); // 1 second delay to show waiting state clearly
        } else {
          // User manually stopped or error occurred
          setIsRecording(false);
          setIsWaiting(false);
          onRecordingChange(false);
          setInterimTranscript("");
        }
      };

      // Start recognition
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start continuous recognition:', error);
      setPermissionError("Failed to start speech recognition. Please try again.");
      setIsRecording(false);
      onRecordingChange(false);
    }
  };

  const stopListening = () => {
    console.log('Stopping continuous recording...');
    
    // Signal that we should stop listening
    shouldKeepListeningRef.current = false;
    
    // Clear any waiting timeout
    if (waitingTimeoutRef.current) {
      clearTimeout(waitingTimeoutRef.current);
      waitingTimeoutRef.current = null;
    }
    
    // Stop audio monitoring
    stopAudioMonitoring();
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    setIsRecording(false);
    setIsWaiting(false);
    setIsSpeaking(false);
    onRecordingChange(false);
    setInterimTranscript("");
  };

  if (!isSupported) {
    return (
      <div className="text-sm text-gray-500 text-center p-4">
        Voice recording is not supported in this browser. Please use Chrome, Safari, or Edge.
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="flex items-center space-x-3">
        <Button
          onClick={isRecording ? (isWaiting ? stopListening : undefined) : startListening}
          disabled={isDisabled || (isRecording && isSpeaking)}
          size={buttonSize}
          variant={!isRecording ? buttonVariant : isWaiting ? "secondary" : "destructive"}
          className={`
            font-medium transition-all duration-200
            ${buttonSize === 'lg' ? 'h-12 px-6' : ''}
            ${!isRecording
              ? buttonVariant === 'default' ? "bg-blue-500 hover:bg-blue-600 text-white" : ""
              : isWaiting
              ? "bg-gray-400 hover:bg-gray-500 text-white" 
              : isSpeaking
              ? "bg-red-500 text-white cursor-default"
              : "bg-red-500 hover:bg-red-600 text-white"
            }
          `}
        >
          {!isRecording ? (
            <>
              <Mic className="h-5 w-5 mr-2" />
              Start Recording
            </>
          ) : isWaiting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              <span>Waiting...</span>
              <span className="mx-2 opacity-60">|</span>
              <span>Stop</span>
            </div>
          ) : isSpeaking ? (
            <>
              <Mic className="h-5 w-5 mr-2 animate-pulse" />
              Recording
            </>
          ) : (
            <>
              <MicOff className="h-5 w-5 mr-2" />
              Stop Recording
            </>
          )}
        </Button>
      </div>

      {permissionError && (
        <div className="text-sm text-red-600 text-center max-w-md">
          {permissionError}
        </div>
      )}

      {showInterimTranscript && interimTranscript && (
        <div className="text-sm text-gray-500 italic text-center max-w-md">
          "{interimTranscript}"
        </div>
      )}

      {/* Audio Level Indicator Only */}
      {isRecording && (
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              {audioLevel > 10 ? (
                <Volume2 className="h-4 w-4 text-green-600" />
              ) : (
                <VolumeX className="h-4 w-4 text-gray-400" />
              )}
              <span className="text-xs text-gray-600">Audio Level</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-100 ${
                    audioLevel > 70 ? 'bg-red-500' :
                    audioLevel > 30 ? 'bg-green-500' :
                    audioLevel > 10 ? 'bg-yellow-500' :
                    'bg-gray-300'
                  }`}
                  style={{ width: `${Math.min(100, audioLevel)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-8">{Math.round(audioLevel)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorderWithContinuousListening;