import express from 'express';
import multer from 'multer';
import { createClient } from '@deepgram/sdk';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit for audio files
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

// Initialize Deepgram client only if API key is available
let deepgram: any = null;

const initializeDeepgram = () => {
  if (process.env.DEEPGRAM_API_KEY && !deepgram) {
    deepgram = createClient(process.env.DEEPGRAM_API_KEY);
  }
  return deepgram;
};

// Convert audio to text using Deepgram
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    if (!process.env.DEEPGRAM_API_KEY) {
      return res.status(500).json({ 
        error: 'Deepgram API key not configured.',
        success: false 
      });
    }

    console.log('Deepgram API key is configured:', process.env.DEEPGRAM_API_KEY?.substring(0, 10) + '...');
    console.log('Transcribing audio file with Deepgram:', {
      size: req.file.size,
      mimetype: req.file.mimetype,
      originalname: req.file.originalname,
      bufferLength: req.file.buffer.length
    });
    
    // Debug: Save audio file to disk to verify it's valid
    const debugFilePath = path.join(process.cwd(), `debug-audio-${Date.now()}.webm`);
    fs.writeFileSync(debugFilePath, req.file.buffer);
    console.log('Debug: Saved audio file to:', debugFilePath);
    
    // Check if the audio data appears to be valid WebM
    const firstBytes = req.file.buffer.slice(0, 4);
    const isWebM = firstBytes.toString('hex') === '1a45dfa3';
    console.log('Audio validation:', {
      firstBytesHex: firstBytes.toString('hex'),
      isWebM: isWebM,
      expectedWebMHeader: '1a45dfa3'
    });

    // Initialize Deepgram client
    const client = initializeDeepgram();
    if (!client) {
      return res.status(500).json({ 
        error: 'Deepgram API key not configured.',
        success: false 
      });
    }

    // Test basic API first
    console.log('Testing Deepgram with most basic configuration...');
    
    // Use Deepgram to transcribe the audio with minimal config
    const { result, error } = await client.listen.prerecorded.transcribeFile(
      req.file.buffer,
      {
        // Start with absolutely minimal config - no model specified
        punctuate: true
      }
    );

    if (error) {
      console.error('Deepgram transcription error:', error);
      return res.status(500).json({ 
        error: 'Failed to transcribe audio with Deepgram.',
        success: false 
      });
    }

    // Extract transcript from result
    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript;

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ 
        error: 'No speech detected in audio.',
        success: false 
      });
    }

    console.log('Deepgram transcription successful:', transcript);

    res.json({ 
      transcript: transcript.trim(),
      success: true,
      confidence: result?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0,
      provider: 'deepgram'
    });

  } catch (error) {
    console.error('Deepgram speech transcription error:', error);
    
    // Provide specific error messages
    if (error instanceof Error) {
      if (error.message.includes('file size')) {
        return res.status(413).json({ 
          error: 'Audio file too large. Please keep recordings under 25MB.',
          success: false 
        });
      }
      
      if (error.message.includes('quota') || error.message.includes('insufficient_quota')) {
        return res.status(429).json({ 
          error: 'Deepgram quota exceeded. Voice recording temporarily unavailable.',
          success: false,
          quotaExceeded: true
        });
      }
      
      if (error.message.includes('API key') || error.message.includes('unauthorized')) {
        return res.status(401).json({ 
          error: 'Deepgram API key invalid or unauthorized.',
          success: false 
        });
      }
    }

    res.status(500).json({ 
      error: 'Failed to transcribe audio. Please try again.',
      success: false 
    });
  }
});

// Get temporary API key for real-time streaming (if needed in future)
router.get('/token', async (req, res) => {
  try {
    if (!process.env.DEEPGRAM_API_KEY) {
      return res.status(500).json({ 
        error: 'Deepgram API key not configured.',
        success: false 
      });
    }

    // For now, we'll use the API key directly in frontend for simplicity
    // In production, you'd want to generate temporary tokens
    res.json({ 
      success: true,
      message: 'Use server-side transcription endpoint instead'
    });

  } catch (error) {
    console.error('Deepgram token error:', error);
    res.status(500).json({ 
      error: 'Failed to get Deepgram token.',
      success: false 
    });
  }
});

export default router;