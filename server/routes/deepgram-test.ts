import express from 'express';
import { createClient } from '@deepgram/sdk';

const router = express.Router();

// Test endpoint to verify Deepgram API key and available models
router.get('/test', async (req, res) => {
  try {
    if (!process.env.DEEPGRAM_API_KEY) {
      return res.status(500).json({ 
        error: 'Deepgram API key not configured.',
        success: false 
      });
    }

    console.log('Testing Deepgram API key...');
    console.log('Key starts with:', process.env.DEEPGRAM_API_KEY?.substring(0, 15) + '...');
    
    // Initialize client
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY);
    
    // Try to get project info to verify API key works
    try {
      const projectInfo = await deepgram.manage.getProjects();
      console.log('Deepgram project info:', projectInfo);
      
      return res.json({
        success: true,
        message: 'Deepgram API key is valid',
        keyPrefix: process.env.DEEPGRAM_API_KEY?.substring(0, 10) + '...',
        projectInfo: projectInfo
      });
    } catch (apiError: any) {
      console.error('Deepgram API error:', apiError);
      return res.json({
        success: false,
        error: 'API key might be invalid or have insufficient permissions',
        details: apiError.message || apiError.toString(),
        keyPrefix: process.env.DEEPGRAM_API_KEY?.substring(0, 10) + '...'
      });
    }
    
  } catch (error) {
    console.error('Deepgram test error:', error);
    res.status(500).json({ 
      error: 'Failed to test Deepgram connection',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false 
    });
  }
});

export default router;