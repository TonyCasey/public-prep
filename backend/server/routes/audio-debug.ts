import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  }
});

// Simple audio upload test
router.post('/test-upload', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const audioInfo = {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      encoding: req.file.encoding,
      bufferLength: req.file.buffer.length,
      firstBytes: req.file.buffer.slice(0, 20).toString('hex')
    };

    console.log('Audio upload test:', audioInfo);

    // Save file for inspection
    const testFilePath = path.join(process.cwd(), `test-audio-${Date.now()}.webm`);
    fs.writeFileSync(testFilePath, req.file.buffer);
    console.log('Test audio saved to:', testFilePath);

    // Check if it's actually audio data
    const isWebM = req.file.buffer.slice(0, 4).toString('hex') === '1a45dfa3';
    const isOgg = req.file.buffer.slice(0, 4).toString('ascii') === 'OggS';
    
    res.json({
      success: true,
      message: 'Audio file received successfully',
      audioInfo,
      validation: {
        isWebM,
        isOgg,
        appearsValid: isWebM || isOgg || req.file.mimetype.startsWith('audio/')
      },
      savedTo: testFilePath
    });

  } catch (error) {
    console.error('Audio test error:', error);
    res.status(500).json({ 
      error: 'Failed to process audio',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;