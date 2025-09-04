import express from 'express';
import multer from 'multer';
import { OpenAI } from 'openai';

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

// Initialize OpenAI client only if API key is available
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Convert audio to text using OpenAI Whisper
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ 
        error: 'Speech transcription service not available. OPENAI_API_KEY not configured.' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('Transcribing audio file:', {
      size: req.file.size,
      mimetype: req.file.mimetype,
      originalname: req.file.originalname
    });

    // Create a File object from the buffer
    const audioFile = new File([req.file.buffer], req.file.originalname || 'audio.webm', {
      type: req.file.mimetype
    });

    // Use OpenAI Whisper to transcribe the audio
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en', // English for Irish Public Service context
      response_format: 'json',
      temperature: 0.2, // Lower temperature for more consistent results
    });

    console.log('Transcription successful:', transcription.text);

    res.json({ 
      transcript: transcription.text,
      success: true 
    });

  } catch (error) {
    console.error('Speech transcription error:', error);
    
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
          error: 'OpenAI quota exceeded. Voice recording temporarily unavailable.',
          success: false,
          quotaExceeded: true
        });
      }
      
      if (error.message.includes('API key')) {
        return res.status(500).json({ 
          error: 'Speech recognition service temporarily unavailable.',
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

export default router;