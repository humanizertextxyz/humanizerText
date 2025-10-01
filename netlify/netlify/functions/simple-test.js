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

  try {
    console.log('Simple test function called');
    console.log('Event:', JSON.stringify(event, null, 2));
    
    // Parse request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (e) {
      console.log('Error parsing body:', e);
      requestBody = {};
    }

    console.log('Request body:', requestBody);

    // Get text from request
    const text = requestBody.text || requestBody.data?.text || 'No text provided';
    
    console.log('Text to process:', text);

    // Simple response
    const response = {
      success: true,
      humanized_text: `Test response: ${text}`,
      progress: [100],
      iterations: 1,
      final_ai_percentage: 0,
      original_text: text,
      method: 'simple_test',
      note: 'This is a simple test function'
    };

    console.log('Response:', response);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error in simple test function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};