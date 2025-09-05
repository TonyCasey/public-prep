import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Square, Upload } from 'lucide-react';

const AudioDebugTest: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setError('');
      setResult(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try different mimeTypes
      const mimeTypes = [
        'audio/webm',
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/mp4'
      ];
      
      let selectedMimeType = 'audio/webm';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log('Using mimeType:', mimeType);
          break;
        }
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: selectedMimeType
      });
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('Chunk received:', event.data.size);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: selectedMimeType });
        console.log('Recording complete. Blob size:', audioBlob.size);
        
        // Test upload
        const formData = new FormData();
        formData.append('audio', audioBlob, 'test-recording.webm');
        
        try {
          const response = await fetch('/api/audio-debug/test-upload', {
            method: 'POST',
            body: formData
          });
          
          const data = await response.json();
          setResult(data);
        } catch (err) {
          setError('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
    } catch (err) {
      setError('Failed to start recording: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Audio Recording Debug Test</h2>
      
      <div className="space-y-4">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          variant={isRecording ? "destructive" : "default"}
          size="lg"
          className="w-full"
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

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <h3 className="font-semibold mb-2">Upload Result:</h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AudioDebugTest;