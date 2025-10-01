exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    // Parse request body
    const { text } = JSON.parse(event.body);
    
    if (!text) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Text is required' })
      };
    }

    console.log('🧪 Test function called with:', text.substring(0, 50));

    // Simple test response
    const testResponse = `Test successful! Received: "${text.substring(0, 50)}..."`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: testResponse,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Test function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Test function failed',
        details: error.message
      })
    };
  }
};
