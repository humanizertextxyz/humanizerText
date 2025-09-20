import { onRequest } from 'firebase-functions/v2/https';

const corsOptions = {
  cors: true
};

// NEW HUMANIZE FUNCTION - Fresh start with dash removal
export const humanizeTextNew = onRequest(corsOptions, async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', 'https://humanizertext.xyz, https://humanizertext-551ee.web.app, http://localhost:3000');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { text } = req.body.data || req.body;
    
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required and must be a string' });
      return;
    }

    console.log("NEW FUNCTION - Starting with text:", text.substring(0, 100) + "...");
    console.log("NEW FUNCTION - Has em dash:", text.includes('—'));
    
    // Simple dash removal test
    let cleaned = text;
    cleaned = cleaned.replace(/—/g, ", ");
    cleaned = cleaned.replace(/–/g, ", ");
    cleaned = cleaned.replace(/―/g, ", ");
    
    console.log("NEW FUNCTION - After dash removal:", cleaned.substring(0, 100) + "...");
    console.log("NEW FUNCTION - Still has em dash:", cleaned.includes('—'));
    
    res.json({
      success: true,
      original_text: text,
      humanized_text: cleaned,
      method: 'new_humanize_function'
    });
    
  } catch (error) {
    console.error('NEW FUNCTION Error:', error);
    res.status(500).json({ 
      error: 'Function failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
