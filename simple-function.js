// Simple Firebase Function for Dash Removal
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.humanizeTextSimple = functions.https.onRequest((req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { text } = req.body.data || req.body;
    
    if (!text) {
      res.status(400).json({ error: 'Text is required' });
      return;
    }

    console.log('SIMPLE FUNCTION - Original text:', text);
    console.log('SIMPLE FUNCTION - Has em dash:', text.includes('—'));
    
    // Simple dash removal
    let cleaned = text;
    cleaned = cleaned.replace(/—/g, ', ');
    cleaned = cleaned.replace(/–/g, ', ');
    cleaned = cleaned.replace(/―/g, ', ');
    
    console.log('SIMPLE FUNCTION - Cleaned text:', cleaned);
    console.log('SIMPLE FUNCTION - Still has em dash:', cleaned.includes('—'));
    
    res.json({
      success: true,
      original_text: text,
      humanized_text: cleaned,
      method: 'simple_function'
    });
    
  } catch (error) {
    console.error('SIMPLE FUNCTION Error:', error);
    res.status(500).json({ 
      error: 'Function failed', 
      details: error.message 
    });
  }
});
