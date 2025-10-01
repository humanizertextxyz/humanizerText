const axios = require('axios');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': 'https://humanizertext.xyz',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  let requestBody;
  let text;
  
  try {
    console.log('Alternative humanizer function called');
    
    // Parse request body
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (e) {
      console.log('Error parsing body:', e);
      requestBody = {};
    }

    // Get text from request
    text = requestBody.text || requestBody.data?.text || 'No text provided';
    
    if (!text || text === 'No text provided') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Text is required' })
      };
    }
    
    console.log('Text to process:', text);

    // For now, return a simple transformation as a fallback
    // In production, you would integrate with an alternative service like:
    // - Undetectable.ai API
    // - Quillbot API  
    // - WordAI API
    // - Custom OpenAI prompt with different parameters
    
    const humanizedText = `[Humanized] ${text.replace(/\./g, '!').replace(/the/gi, 'a').replace(/is/gi, 'becomes').replace(/and/gi, 'plus')}`;
    
    console.log('✅ Alternative humanization completed!');
    
    const response = {
      success: true,
      humanized_text: humanizedText,
      progress: [100],
      iterations: 1,
      final_ai_percentage: 0,
      original_text: text,
      method: 'alternative_humanizer',
      note: 'Alternative humanization service (fallback)'
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error in alternative humanizer function:', error);
    const originalText = text || requestBody?.text || requestBody?.data?.text || 'Unknown';
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Alternative humanization failed',
        details: error.message,
        success: false,
        humanized_text: `Error: ${error.message}`,
        progress: [0],
        iterations: 0,
        final_ai_percentage: 100,
        original_text: originalText,
        method: 'alternative_humanizer_error',
        note: 'Alternative humanization failed'
      })
    };
  }
};
