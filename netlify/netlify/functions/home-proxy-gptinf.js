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
    console.log('Home proxy GPTinf function called');
    
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

    // Your home computer proxy URL
    // Replace with your actual home IP and port
    const HOME_PROXY_URL = 'http://YOUR_HOME_IP:8080/gptinf';
    
    // GPTinf configuration
    const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRpYWxkcmFtYXNAZ21haWwuY29tIiwiaWF0IjoxNzU5MTYzNTU5fQ.RkeQJJCovejH3gD4sZQFsPEeoa_tEGQ7CC3YM0SaQA';
    
    console.log('🔄 Starting GPTinf processing through home proxy...');
    
    // Step 1: Start processing through your home proxy
    const startPayload = {
      "cacheMode": "start",
      "text": text,
      "model": "free2",
      "keywords": [],
      "sessionId": `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      "alg": 0,
      "trialNumber": 0
    };
    
    const startResponse = await axios.post(
      `${HOME_PROXY_URL}/api/process`,
      startPayload,
      { 
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log('Start response status:', startResponse.status);
    
    if (startResponse.status !== 200) {
      throw new Error(`Start failed: ${startResponse.status}`);
    }
    
    const startData = startResponse.data;
    const completionId = startData.completionId;
    
    if (!completionId) {
      throw new Error('No completion ID received');
    }
    
    console.log('✅ Got completion ID:', completionId);
    
    // Step 2: Wait and get results
    const waitTime = 20000; // 20 seconds
    console.log(`⏳ Waiting ${waitTime/1000} seconds for processing...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    console.log('🔄 Getting results...');
    
    const getPayload = {
      "cacheMode": "get",
      "completionId": completionId,
      "sessionId": `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      "text": "",
      "token": authToken
    };
    
    const getResponse = await axios.post(
      `${HOME_PROXY_URL}/api/process`,
      getPayload,
      { 
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log('Get response status:', getResponse.status);
    
    if (getResponse.status === 200) {
      const resultData = getResponse.data;
      
      if (resultData.result && resultData.result.length > 0) {
        const humanizedText = resultData.result[0].text;
        console.log('✅ GPTinf processing successful through home proxy!');
        console.log('Humanized text:', humanizedText);
        
        const response = {
          success: true,
          humanized_text: humanizedText,
          progress: [100],
          iterations: 1,
          final_ai_percentage: 0,
          original_text: text,
          method: 'home_proxy_gptinf',
          note: 'GPTinf humanization through home proxy completed'
        };

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(response)
        };
      } else {
        throw new Error('No result in GPTinf response');
      }
    } else {
      throw new Error(`Get failed: ${getResponse.status}`);
    }

  } catch (error) {
    console.error('Error in home proxy GPTinf function:', error);
    const originalText = text || requestBody?.text || requestBody?.data?.text || 'Unknown';
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Home proxy GPTinf processing failed',
        details: error.message,
        success: false,
        humanized_text: `Error: ${error.message}`,
        progress: [0],
        iterations: 0,
        final_ai_percentage: 100,
        original_text: originalText,
        method: 'home_proxy_gptinf_error',
        note: 'Home proxy GPTinf processing failed'
      })
    };
  }
};
