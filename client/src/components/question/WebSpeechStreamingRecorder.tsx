import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Square, Volume2, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WebSpeechStreamingRecorderProps {
  onTranscriptUpdate: (transcript: string) => void;
  onRecordingChange?: (isRecording: boolean) => void;
  isDisabled?: boolean;
  buttonSize?: 'sm' | 'default' | 'lg';
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  className?: string;
  eventType?: 'sample-question' | 'interview-question';
}

const WebSpeechStreamingRecorder: React.FC<WebSpeechStreamingRecorderProps> = ({
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
  const [isListening, setIsListening] = useState(false); // Actively hearing speech
  const [permissionError, setPermissionError] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const [debugInfo, setDebugInfo] = useState("");
  const [noSpeechCount, setNoSpeechCount] = useState(0);

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>("");
  const isStartingRef = useRef<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastSpeechTimeRef = useRef<number>(Date.now());
  const animationFrameRef = useRef<number | null>(null);

  // Check browser support and mobile detection
  useEffect(() => {
    // Hide voice recording on mobile devices - they have built-in keyboard speech-to-text
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      setIsSupported(false);
      console.log('Mobile device detected - using built-in keyboard speech-to-text instead of Web Speech API');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      setPermissionError("Speech recognition not supported. Please use Chrome, Edge, or Safari.");
      return;
    }

    // Check if we're in a restricted environment
    const isIframe = window !== window.top;
    const isHttps = window.location.protocol === 'https:';
    
    console.log('Web Speech API environment check:', {
      isIframe,
      isHttps,
      origin: window.location.origin,
      userAgent: navigator.userAgent
    });

    if (isIframe) {
      console.warn('Running in iframe - Web Speech API may be restricted');
    }
    
    if (!isHttps && window.location.hostname !== 'localhost') {
      setPermissionError("Speech recognition requires HTTPS connection.");
      setIsSupported(false);
      return;
    }
  }, []);

  // Create speech recognition when needed
  const createRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Speech Recognition API not available');
      setDebugInfo('Speech recognition not supported in this browser');
      return null;
    }
    
    console.log('Creating Speech Recognition instance...');

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    // Android-specific optimizations
    if (/Android/i.test(navigator.userAgent)) {
      console.log('Applying Android-specific speech recognition settings');
      // Android Chrome needs longer timeout and different sensitivity
      try {
        // Extended settings for Android Chrome
        if ('serviceURI' in recognition) {
          (recognition as any).serviceURI = null; // Use default service
        }
        // Force English language model for better recognition
        recognition.lang = 'en-US';
        // Android might need these additional settings
        if ('audioCapture' in recognition) {
          (recognition as any).audioCapture = true;
        }
      } catch (e) {
        console.log('Android optimization not supported, using defaults');
      }
    }

    // Handle results
    recognition.onresult = (event: any) => {
      console.log('Recognition result event:', event);
      setDebugInfo(`Got ${event.results.length} results`);
      
      let finalText = '';
      let interimText = '';
      let hasInterim = false;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalText += transcript + ' ';
        } else {
          interimText += transcript;
          hasInterim = true;
        }
      }

      // User is actively speaking
      if (hasInterim || finalText.trim()) {
        setIsListening(true);
        lastSpeechTimeRef.current = Date.now();
      }

      // Update final transcript
      if (finalText.trim()) {
        finalTranscriptRef.current += finalText;
        console.log('Final transcript added:', finalText);
        console.log('Total transcript:', finalTranscriptRef.current);
        setDebugInfo(`Got text: "${finalText}"`);
        
        // Dispatch event with accumulated transcript
        const transcriptEvent = new CustomEvent('voiceTranscriptUpdate', {
          detail: { 
            transcript: finalTranscriptRef.current.trim(),
            eventType: eventType,
            source: 'web-speech',
            isPartial: false
          }
        });
        window.dispatchEvent(transcriptEvent);
        
        // Call prop callback - THIS IS THE MAIN WAY TO UPDATE ON MOBILE
        onTranscriptUpdate(finalTranscriptRef.current.trim());
      }

      // Also send interim results for real-time display
      if (interimText) {
        const combinedTranscript = finalTranscriptRef.current + interimText;
        console.log('Interim transcript:', interimText);
        console.log('Combined transcript being sent:', combinedTranscript);
        setDebugInfo(`Hearing: "${interimText}"`);
        
        // Dispatch interim update
        const transcriptEvent = new CustomEvent('voiceTranscriptUpdate', {
          detail: { 
            transcript: combinedTranscript.trim(),
            eventType: eventType,
            source: 'web-speech',
            isPartial: true
          }
        });
        window.dispatchEvent(transcriptEvent);
        
        // Call prop callback with combined text - THIS IS THE MAIN WAY TO UPDATE ON MOBILE
        console.log('Calling onTranscriptUpdate with:', combinedTranscript.trim());
        onTranscriptUpdate(combinedTranscript.trim());
      }
    };

    // Handle errors
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setDebugInfo(`Error: ${event.error}`);
      
      if (event.error === 'not-allowed') {
        setPermissionError("Microphone access denied. Please allow microphone access and refresh the page.");
        setIsRecording(false);
        onRecordingChange(false);
      } else if (event.error === 'no-speech') {
        // This is normal - just means no speech was detected
        console.log('No speech detected, continuing...');
        setDebugInfo("Speak louder and clearer - trying again");
        // Auto-restart recognition immediately on mobile for better responsiveness
        if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          setTimeout(() => {
            if (isRecording && recognitionRef.current) {
              console.log('Auto-restarting recognition on mobile after no-speech');
              try {
                recognitionRef.current.start();
              } catch (e) {
                console.log('Recognition already running');
              }
            }
          }, 100);
        }
      } else if (event.error === 'audio-capture') {
        setPermissionError("No microphone found. Please check your microphone connection.");
        setIsRecording(false);
        onRecordingChange(false);
      } else if (event.error === 'network') {
        console.error('Network error details:', {
          error: event.error,
          message: event.message,
          timestamp: new Date().toISOString()
        });
        setPermissionError("Speech service unreachable. This may be due to network restrictions or browser security. Try opening in a new tab or different browser.");
        setIsRecording(false);
        onRecordingChange(false);
      } else if (event.error === 'service-not-allowed') {
        setPermissionError("Speech service unavailable. Please use Chrome or Edge browser for best results.");
        setIsRecording(false);
        onRecordingChange(false);
      } else if (event.error === 'aborted') {
        // This can happen during normal operation, don't show error
        console.log('Recognition aborted, will restart if recording...');
      } else {
        // Only show error for unknown issues
        console.error(`Unhandled speech recognition error: ${event.error}`);
      }
    };

    // Handle end event with Android-specific handling
    recognition.onend = () => {
      console.log('Speech recognition ended');
      setDebugInfo("Recognition stopped");
      
      // Android-specific auto-restart with longer delay and more attempts
      if (/Android/i.test(navigator.userAgent) && noSpeechCount < 5 && isRecording && !isStartingRef.current) {
        console.log(`Auto-restarting recognition for Android (attempt ${noSpeechCount + 1}/5)`);
        setDebugInfo(`Trying again (${noSpeechCount + 1}/5) - speak very loudly and clearly`);
        setTimeout(() => {
          if (isRecording && recognitionRef.current) {
            try {
              recognitionRef.current.start();
              setNoSpeechCount(prev => prev + 1);
            } catch (e) {
              console.log('Android auto-restart failed:', e);
              setDebugInfo("Recognition failed - try typing instead");
            }
          }
        }, 1000); // Longer delay for Android
      } else if (isRecording && !isStartingRef.current) {
        // Non-Android or too many attempts
        console.log('Restarting speech recognition...');
        setTimeout(() => {
          if (isRecording && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (error: any) {
              console.error('Failed to restart recognition:', error);
              if (!error.message?.includes('already started')) {
                setPermissionError("Speech recognition stopped. Please click Stop and Start again.");
                setIsRecording(false);
                onRecordingChange(false);
              }
            }
          }
        }, 500);
      } else {
        // Recording was stopped intentionally
        setIsRecording(false);
        onRecordingChange(false);
      }
    };

    recognition.onstart = () => {
      console.log('Speech recognition started');
      isStartingRef.current = false;
      setPermissionError("");
      setDebugInfo("Recognition started - speak now");
      
      // Mobile debug
      console.log('Recognition started on mobile:', {
        userAgent: navigator.userAgent,
        eventType,
        isMobile: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      });
    };

    recognition.onspeechstart = () => {
      console.log('Speech detected');
      setIsListening(true);
      lastSpeechTimeRef.current = Date.now();
      setDebugInfo("Speech detected!");
    };

    recognition.onspeechend = () => {
      console.log('Speech ended');
      setDebugInfo("Speech ended - processing...");
      // Don't immediately set to false, let the timer handle it
    };

    recognition.onnomatch = () => {
      console.log('No speech match');
      setDebugInfo("No clear words detected - speak louder/clearer");
    };

    recognition.onaudiostart = () => {
      console.log('Audio capture started');
      setDebugInfo("Audio capture started");
    };

    return recognition;
  }, [eventType, onTranscriptUpdate]);

  // Monitor for speech timeout
  useEffect(() => {
    if (!isRecording) return;

    const checkSpeechTimeout = setInterval(() => {
      const timeSinceLastSpeech = Date.now() - lastSpeechTimeRef.current;
      if (timeSinceLastSpeech > 1000 && isListening) {
        setIsListening(false);
      }
    }, 500);

    return () => clearInterval(checkSpeechTimeout);
  }, [isRecording, isListening]);

  // Audio monitoring functions
  const startAudioMonitoring = async () => {
    try {
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      source.connect(analyserRef.current);

      const updateAudioLevel = () => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalizedLevel = Math.min(average / 128, 1);
        setAudioLevel(normalizedLevel);

        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();
    } catch (error) {
      console.error('Failed to start audio monitoring:', error);
    }
  };

  const stopAudioMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setAudioLevel(0);
  };

  const startRecording = useCallback(async () => {
    if (isStartingRef.current) return;

    try {
      console.log(`Starting Web Speech recognition for ${eventType}...`);
      setPermissionError("");
      // Don't clear existing transcript - we want to append
      isStartingRef.current = true;
      lastSpeechTimeRef.current = Date.now();
      
      // Request microphone permission and start audio monitoring
      try {
        await startAudioMonitoring();
      } catch (err) {
        console.error('Microphone permission denied:', err);
        setPermissionError("Microphone access required. Please allow microphone access and try again.");
        isStartingRef.current = false;
        return;
      }
      
      // Create fresh recognition instance
      if (!recognitionRef.current) {
        console.log('Creating new recognition instance...');
        recognitionRef.current = createRecognition();
        if (!recognitionRef.current) {
          console.error('Failed to create recognition instance');
          setPermissionError("Speech recognition not available on this device/browser.");
          setDebugInfo("Speech recognition not supported");
          isStartingRef.current = false;
          return;
        }
        console.log('Recognition instance created successfully');
      }
      
      console.log('Starting recognition...');
      recognitionRef.current.start();
      setIsRecording(true);
      setIsListening(false);
      setNoSpeechCount(0); // Reset counter when starting new recording
      onRecordingChange(true);
      console.log('Recognition started successfully');
      
    } catch (error: any) {
      console.error('Failed to start speech recognition:', error);
      
      if (error.message?.includes('already started')) {
        // Recognition is already running, just update state
        console.log('Recognition already running, updating state');
        setIsRecording(true);
        onRecordingChange(true);
        setDebugInfo("Recognition resumed");
      } else {
        console.error('Recognition start error details:', {
          name: error.name,
          message: error.message,
          code: error.code
        });
        
        // More specific error messages
        if (error.name === 'NotAllowedError') {
          setPermissionError("Microphone permission denied. Please allow microphone access in browser settings.");
          setDebugInfo("Microphone permission denied");
        } else if (error.name === 'NotSupportedError') {
          setPermissionError("Speech recognition not supported on this device.");  
          setDebugInfo("Speech recognition not supported");
        } else {
          setPermissionError("Voice recording failed. Try refreshing the page or using Chrome browser.");
          setDebugInfo(`Error: ${error.message || error.name || 'Unknown error'}`);
        }
        isStartingRef.current = false;
      }
    }
  }, [eventType, onRecordingChange, createRecognition]);

  const stopRecording = useCallback(() => {
    if (!recognitionRef.current) return;

    console.log('Stopping Web Speech recognition...');
    isStartingRef.current = false;
    
    try {
      recognitionRef.current.stop();
      // Clear the reference so it gets recreated on next start
      recognitionRef.current = null;
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }
    
    setIsRecording(false);
    setIsListening(false);
    onRecordingChange(false);
    stopAudioMonitoring();
    setDebugInfo("");
    
    // Send final transcript
    if (finalTranscriptRef.current.trim()) {
      const transcriptEvent = new CustomEvent('voiceTranscriptUpdate', {
        detail: { 
          transcript: finalTranscriptRef.current.trim(),
          eventType: eventType,
          source: 'web-speech',
          isPartial: false
        }
      });
      window.dispatchEvent(transcriptEvent);
    }
  }, [eventType, onRecordingChange]);

  if (!isSupported) {
    // Check if it's mobile
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      return (
        <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-600">
            📱 <strong>Mobile Tip:</strong> Use your keyboard's microphone button for speech-to-text
          </p>
        </div>
      );
    }
    
    return (
      <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">{permissionError}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Recording Controls */}
      <div className="flex flex-col items-center space-y-3">
        <div className="flex items-center space-x-2">
          {/* Start/Play Button */}
          <Button
            size="sm"
            variant="default"
            onClick={startRecording}
            disabled={isDisabled || isRecording}
            className={`${
              isRecording 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isRecording && isListening ? (
              <Volume2 className="w-4 h-4" />
            ) : isRecording && !isListening ? (
              <Timer className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>

          {/* Stop Button */}
          <Button
            size="sm"
            variant="destructive"
            onClick={stopRecording}
            disabled={isDisabled || !isRecording}
            className={`${
              !isRecording 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            <Square className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Status Text */}
        <div className="text-center">
          <p className="text-sm font-medium">
            {isRecording && isListening ? (
              <span className="text-green-600">🎤 Listening...</span>
            ) : isRecording && !isListening ? (
              <span className="text-orange-600">⏳ Waiting for speech...</span>
            ) : (
              <span className="text-gray-600">Ready to record</span>
            )}
          </p>
        </div>

        {/* Audio Level Indicator */}
        {isRecording && (
          <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-8 rounded-full transition-all duration-100 ${
                  audioLevel > (i + 1) / 5
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
                style={{
                  height: `${Math.max(8, 32 * ((i + 1) / 5))}px`
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Error Messages */}
      {permissionError && (
        <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{permissionError}</p>
        </div>
      )}




    </div>
  );
};

export default WebSpeechStreamingRecorder;