import { useState, useRef, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceRecorderProps {
  onTranscriptUpdate: (transcript: string) => void;
  onRecordingChange: (isRecording: boolean) => void;
  isDisabled?: boolean;
}

export default function VoiceRecorder({ 
  onTranscriptUpdate, 
  onRecordingChange,
  isDisabled = false 
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [microphoneLevel, setMicrophoneLevel] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastProcessedResultRef = useRef<number>(-1);
  const finalTranscriptRef = useRef<string>("");
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechTimeRef = useRef<number>(Date.now());

  // Check for speech recognition support and microphone permissions
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true);
    }

    // Check microphone permissions on component mount
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then((result) => {
        if (result.state === 'granted') {
          setPermissionGranted(true);
          setPermissionDenied(false);
        } else if (result.state === 'denied') {
          setPermissionDenied(true);
          setPermissionGranted(false);
        }
      }).catch(() => {
        // Permissions API not supported, will request on first use
      });
    }
  }, []);

  const startListening = async () => {
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('MediaDevices API not supported');
        setPermissionDenied(true);
        return;
      }

      // First, explicitly request microphone permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        streamRef.current = stream;
        
        // Reset permission denied state on success
        setPermissionDenied(false);
        setPermissionGranted(true);
      } catch (permissionError: any) {
        console.error('Microphone permission error:', permissionError);
        if (permissionError.name === 'NotAllowedError' || 
            permissionError.name === 'PermissionDeniedError') {
          setPermissionDenied(true);
        }
        throw permissionError;
      }

      // Set up audio analysis for visual feedback
      if (streamRef.current) {
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
        source.connect(analyserRef.current);
        analyserRef.current.fftSize = 256;
      }

      // Create speech recognition
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-IE';

      // Reset tracking variables
      lastProcessedResultRef.current = -1;
      finalTranscriptRef.current = "";

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setIsRecording(true);
        onRecordingChange(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        let currentInterim = '';
        let newFinalTranscript = '';
        let hasNewSpeech = false;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            if (i > lastProcessedResultRef.current) {
              const cleanedTranscript = transcript.trim();
              
              if (cleanedTranscript && cleanedTranscript.length > 0) {
                hasNewSpeech = true;
                lastSpeechTimeRef.current = Date.now();
                
                const formattedTranscript = cleanedTranscript.charAt(0).toUpperCase() + cleanedTranscript.slice(1);
                const punctuatedTranscript = formattedTranscript.endsWith('.') || 
                                            formattedTranscript.endsWith('?') || 
                                            formattedTranscript.endsWith('!') 
                                            ? formattedTranscript 
                                            : formattedTranscript + '.';
                
                newFinalTranscript = finalTranscriptRef.current ? 
                  finalTranscriptRef.current + ' ' + punctuatedTranscript : 
                  punctuatedTranscript;
                
                finalTranscriptRef.current = newFinalTranscript;
                lastProcessedResultRef.current = i;
              }
            }
          } else {
            currentInterim += transcript;
            if (transcript.trim().length > 0) {
              hasNewSpeech = true;
              lastSpeechTimeRef.current = Date.now();
            }
          }
        }
        
        // Update transcript
        if (newFinalTranscript) {
          onTranscriptUpdate(newFinalTranscript);
        }
        setInterimTranscript(currentInterim);
        
        // Manage smart pause - if user stops speaking
        if (hasNewSpeech) {
          setIsPaused(false);
          // Clear any existing silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          
          // Set new silence timer for 3 seconds
          silenceTimerRef.current = setTimeout(() => {
            setIsPaused(true);
          }, 3000);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        stopListening();
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setIsRecording(false);
        onRecordingChange(false);
      };

      recognitionRef.current.start();

      // Start monitoring microphone levels
      const monitorAudio = () => {
        if (analyserRef.current && isListening) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setMicrophoneLevel(average);
          requestAnimationFrame(monitorAudio);
        }
      };
      monitorAudio();
    } catch (error: any) {
      console.error('Error starting speech recognition:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
      } else if (error.name === 'NotFoundError') {
        console.error('No microphone found');
      } else if (error.name === 'NotSupportedError') {
        console.error('Microphone not supported');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Clear silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    
    setIsListening(false);
    setIsRecording(false);
    setInterimTranscript("");
    setMicrophoneLevel(0);
    setIsPaused(false);
    onRecordingChange(false);
  };

  const toggleRecording = () => {
    if (isListening) {
      stopListening();
    } else {
      setPermissionDenied(false); // Reset permission state when trying again
      startListening();
    }
  };

  if (!speechSupported) {
    return null;
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={toggleRecording}
        disabled={isDisabled}
        variant="outline"
        size="lg"
        className={`w-full h-12 sm:h-14 md:h-16 transition-all duration-300 rounded-xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 ${
          isRecording 
            ? 'bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 border-2 border-red-300 hover:border-red-400 text-red-700 shadow-red-200/50' 
            : 'bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-2 border-blue-300 hover:border-blue-400 text-blue-700 shadow-blue-200/50'
        }`}
      >
        {isRecording ? (
          <>
            <MicOff className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
            <span className="hidden sm:inline">Stop Recording</span>
            <span className="sm:hidden">Stop</span>
          </>
        ) : (
          <>
            <Mic className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
            {!permissionGranted && !permissionDenied ? (
              <>
                <span className="hidden sm:inline">🎤 Allow Microphone & Record</span>
                <span className="sm:hidden">🎤 Allow & Record</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">🎤 Record Your Answer</span>
                <span className="sm:hidden">🎤 Record</span>
              </>
            )}
          </>
        )}
      </Button>

      {/* Permission Denied Message */}
      {permissionDenied && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-center">
          <div className="text-red-700 text-sm font-medium mb-2">
            Microphone access needed
          </div>
          <div className="text-red-600 text-xs space-y-1">
            <div>Please allow microphone access when prompted</div>
            <div className="text-xs">On mobile: Check browser permissions in address bar</div>
          </div>
        </div>
      )}

      {isRecording && (
        <div className="space-y-4">
          {/* Enhanced Audio Level Indicator */}
          <div className="flex justify-center items-end gap-1 h-8 sm:h-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2 sm:p-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`w-1.5 sm:w-2 rounded-full transition-all duration-150 ${
                  microphoneLevel > i * 20 
                    ? 'bg-gradient-to-t from-blue-500 to-blue-400'
                    : 'bg-gray-300'
                }`}
                style={{
                  height: microphoneLevel > i * 20 
                    ? `${Math.min(32, 6 + i * 4)}px`
                    : '6px'
                }}
              />
            ))}
          </div>
          
          {/* Recording Status */}
          <div className="text-center">
            {isPaused ? (
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-yellow-50 text-yellow-700 rounded-full text-xs sm:text-sm font-medium border border-yellow-200">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-500 rounded-full"></div>
                <span className="hidden sm:inline">Paused - Start speaking to continue</span>
                <span className="sm:hidden">Paused - Speak to continue</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-50 text-red-700 rounded-full text-xs sm:text-sm font-medium border border-red-200">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse"></div>
                Listening...
              </div>
            )}
          </div>
          
          {/* Interim Transcript */}
          {interimTranscript && (
            <div className="p-2 sm:p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg text-xs sm:text-sm text-gray-700 italic border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Live transcription:</div>
              <div className="line-clamp-3">{interimTranscript}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}