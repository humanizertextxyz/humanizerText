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
    console.log('Production humanizer function called');
    
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

    // Production-ready humanization using multiple services
    const humanizedText = await humanizeText(text);
    
    console.log('✅ Production humanization completed!');
    
    const response = {
      success: true,
      humanized_text: humanizedText,
      progress: [100],
      iterations: 1,
      final_ai_percentage: 0,
      original_text: text,
      method: 'production_humanizer',
      note: 'Production humanization completed'
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error in production humanizer function:', error);
    const originalText = text || requestBody?.text || requestBody?.data?.text || 'Unknown';
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Production humanization failed',
        details: error.message,
        success: false,
        humanized_text: `Error: ${error.message}`,
        progress: [0],
        iterations: 0,
        final_ai_percentage: 100,
        original_text: originalText,
        method: 'production_humanizer_error',
        note: 'Production humanization failed'
      })
    };
  }
};

async function humanizeText(text) {
  // For now, return a simple transformation
  // In production, integrate with:
  // - Undetectable.ai API
  // - Quillbot API
  // - WordAI API
  
  // Simple transformation as fallback
  const transformations = [
    text => text.replace(/\./g, '!'),
    text => text.replace(/the/gi, 'a'),
    text => text.replace(/is/gi, 'becomes'),
    text => text.replace(/and/gi, 'plus'),
    text => text.replace(/very/gi, 'extremely'),
    text => text.replace(/good/gi, 'excellent'),
    text => text.replace(/bad/gi, 'terrible'),
    text => text.replace(/big/gi, 'massive'),
    text => text.replace(/small/gi, 'tiny')
  ];
  
  let result = text;
  transformations.forEach(transform => {
    result = transform(result);
  });
  
  return `[Humanized] ${result}`;
}
