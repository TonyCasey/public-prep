import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SimpleVoiceRecorderProps {
  onTranscriptUpdate: (transcript: string) => void;
  onRecordingChange?: (isRecording: boolean) => void;
}

const SimpleVoiceRecorder: React.FC<SimpleVoiceRecorderProps> = ({
  onTranscriptUpdate,
  onRecordingChange = () => {}
}) => {
  const [isSupported, setIsSupported] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [permissionError, setPermissionError] = useState("");

  const recognitionRef = useRef<any>(null);
  const fullTranscriptRef = useRef<string>("");
  const lastProcessedResultRef = useRef<number>(-1);

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
    };
  }, []);

  const startListening = async () => {
    try {
      console.log('Starting recording...');
      setPermissionError("");
      setInterimTranscript("");
      
      // Reset tracking variables for new session
      lastProcessedResultRef.current = -1;
      fullTranscriptRef.current = "";
      
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!SpeechRecognition) {
        setPermissionError("Speech recognition not supported in this browser.");
        return;
      }

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;

      setIsListening(true);
      setIsRecording(true);
      onRecordingChange(true);

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
        setPermissionError("");
      };

      recognitionRef.current.onresult = (event: any) => {
        let currentInterim = '';
        let newFinalTranscript = '';
        
        // Process only NEW results using resultIndex (this is the key!)
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            // Only process if this is a new result we haven't seen before
            if (i > lastProcessedResultRef.current) {
              const cleanedTranscript = transcript.trim();
              
              if (cleanedTranscript && cleanedTranscript.length > 0) {
                console.log('Adding new final result:', cleanedTranscript);
                
                const formattedTranscript = cleanedTranscript.charAt(0).toUpperCase() + cleanedTranscript.slice(1);
                const punctuatedTranscript = formattedTranscript.endsWith('.') || 
                                            formattedTranscript.endsWith('?') || 
                                            formattedTranscript.endsWith('!') 
                                            ? formattedTranscript 
                                            : formattedTranscript + '.';
                
                newFinalTranscript = fullTranscriptRef.current ? 
                  fullTranscriptRef.current + ' ' + punctuatedTranscript : 
                  punctuatedTranscript;
                
                fullTranscriptRef.current = newFinalTranscript;
                lastProcessedResultRef.current = i;
              }
            } else {
              console.log('Skipping already processed result at index:', i);
            }
          } else {
            // Show interim results
            currentInterim += transcript;
          }
        }
        
        // Update transcript if we have new final text
        if (newFinalTranscript) {
          onTranscriptUpdate(newFinalTranscript);
        }
        setInterimTranscript(currentInterim);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setPermissionError("Microphone access denied. Please allow microphone access in your browser.");
        } else if (event.error === 'no-speech') {
          console.log('No speech detected');
        } else {
          setPermissionError(`Speech recognition error: ${event.error}`);
        }
        stopListening();
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        setIsRecording(false);
        onRecordingChange(false);
        setInterimTranscript("");
      };

      // Start recognition
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setPermissionError("Failed to start speech recognition. Please try again.");
      setIsListening(false);
      setIsRecording(false);
      onRecordingChange(false);
    }
  };

  const stopListening = () => {
    console.log('Stopping recording...');
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    setIsListening(false);
    setIsRecording(false);
    onRecordingChange(false);
    setInterimTranscript("");
  };

  const formatTranscript = (text: string): string => {
    if (!text) return '';
    
    // Capitalize first letter and add punctuation if needed
    const trimmed = text.trim();
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    
    // Add period if it doesn't end with punctuation
    if (!capitalized.endsWith('.') && !capitalized.endsWith('?') && !capitalized.endsWith('!')) {
      return capitalized + '.';
    }
    
    return capitalized;
  };

  if (!isSupported) {
    return (
      <div className="text-sm text-gray-500 text-center p-4">
        Voice recording is not supported in this browser. Please use Chrome, Safari, or Edge.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex items-center space-x-3">
        <Button
          onClick={isRecording ? stopListening : startListening}
          disabled={isListening && !isRecording}
          size="lg"
          variant={isRecording ? "destructive" : "default"}
          className={`
            h-12 px-6 font-medium transition-all duration-200
            ${isRecording 
              ? "bg-red-500 hover:bg-red-600 text-white" 
              : "bg-blue-500 hover:bg-blue-600 text-white"
            }
          `}
        >
          {isListening && !isRecording ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : isRecording ? (
            <MicOff className="h-5 w-5 mr-2" />
          ) : (
            <Mic className="h-5 w-5 mr-2" />
          )}
          {isListening && !isRecording ? "Processing..." : isRecording ? "Stop Recording" : "Start Recording"}
        </Button>
      </div>

      {permissionError && (
        <div className="text-sm text-red-600 text-center max-w-md">
          {permissionError}
        </div>
      )}

      {interimTranscript && (
        <div className="text-sm text-gray-500 italic text-center max-w-md">
          "{interimTranscript}"
        </div>
      )}
    </div>
  );
};

export default SimpleVoiceRecorder;