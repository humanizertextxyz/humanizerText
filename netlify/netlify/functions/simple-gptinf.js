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
    console.log('Simple GPTinf function called');
    
    // Parse request body
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (e) {
      console.log('Error parsing body:', e);
      requestBody = {};
    }

    console.log('Request body:', requestBody);

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

    // GPTinf configuration
    const baseUrl = "https://www.gptinf.com";
    const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRpYWxkcmFtYXNAZ21haWwuY29tIiwiaWF0IjoxNzU5MTYzNTU5fQ.RkeQJJCovejH3gD4sZQFsPEeoa_tEGQ7CC3YM0SaQA';
    
    // Simple headers for GPTinf
    const gptinfHeaders = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'en-US,en;q=0.9',
      'Origin': 'https://www.gptinf.com',
      'Referer': 'https://www.gptinf.com/editor',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'DNT': '1'
    };

    console.log('🔄 Starting GPTinf processing...');
    
    // Step 1: Start processing
    const startPayload = {
      "cacheMode": "start",
      "text": text,
      "model": "free2",
      "keywords": [],
      "sessionId": `session_${Date.now()}`,
      "alg": 0,
      "trialNumber": 0
    };
    
    const startResponse = await axios.post(
      `${baseUrl}/api/process`,
      startPayload,
      { 
        headers: gptinfHeaders,
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
    console.log('⏳ Waiting 20 seconds for processing...');
    await new Promise(resolve => setTimeout(resolve, 20000));
    
    console.log('🔄 Getting results...');
    
    const getPayload = {
      "cacheMode": "get",
      "completionId": completionId,
      "sessionId": `session_${Date.now()}`,
      "text": "",
      "token": authToken
    };
    
    const getResponse = await axios.post(
      `${baseUrl}/api/process`,
      getPayload,
      { 
        headers: gptinfHeaders,
        timeout: 30000
      }
    );
    
    console.log('Get response status:', getResponse.status);
    
    if (getResponse.status === 200) {
      const resultData = getResponse.data;
      
      if (resultData.result && resultData.result.length > 0) {
        const humanizedText = resultData.result[0].text;
        console.log('✅ GPTinf processing successful!');
        console.log('Humanized text:', humanizedText);
        
        const response = {
          success: true,
          humanized_text: humanizedText,
          progress: [100],
          iterations: 1,
          final_ai_percentage: 0,
          original_text: text,
          method: 'simple_gptinf',
          note: 'Single GPTinf humanization completed'
        };

        console.log('Response:', response);

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
    console.error('Error in simple GPTinf function:', error);
    const originalText = text || requestBody?.text || requestBody?.data?.text || 'Unknown';
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'GPTinf processing failed',
        details: error.message,
        success: false,
        humanized_text: `Error: ${error.message}`,
        progress: [0],
        iterations: 0,
        final_ai_percentage: 100,
        original_text: originalText,
        method: 'simple_gptinf_error',
        note: 'GPTinf processing failed'
      })
    };
  }
};
