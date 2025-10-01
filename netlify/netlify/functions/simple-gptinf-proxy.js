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
    console.log('Simple GPTinf function with proxy called');
    
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

    // GPTinf configuration with enhanced headers
    const baseUrl = "https://www.gptinf.com";
    const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRpYWxkcmFtYXNAZ21haWwuY29tIiwiaWF0IjoxNzU5MTYzNTU5fQ.RkeQJJCovejH3gD4sZQFsPEeoa_tEGQ7CC3YM0SaQA';
    
    // Enhanced headers to mimic real browser
    const gptinfHeaders = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
      'Origin': 'https://www.gptinf.com',
      'Referer': 'https://www.gptinf.com/editor',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'DNT': '1',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };

    console.log('🔄 Starting GPTinf processing with enhanced headers...');
    
    // Add random delay to mimic human behavior
    const delay = Math.random() * 3000 + 2000; // 2-5 seconds
    console.log(`⏳ Waiting ${Math.round(delay)}ms before request...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Step 1: Start processing
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
      `${baseUrl}/api/process`,
      startPayload,
      { 
        headers: gptinfHeaders,
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: function (status) {
          return status >= 200 && status < 300; // Only resolve for 2xx status codes
        }
      }
    );
    
    console.log('Start response status:', startResponse.status);
    
    if (startResponse.status !== 200) {
      throw new Error(`Start failed: ${startResponse.status} - ${startResponse.statusText}`);
    }
    
    const startData = startResponse.data;
    const completionId = startData.completionId;
    
    if (!completionId) {
      throw new Error('No completion ID received');
    }
    
    console.log('✅ Got completion ID:', completionId);
    
    // Step 2: Wait and get results with random delay
    const waitTime = Math.random() * 10000 + 15000; // 15-25 seconds
    console.log(`⏳ Waiting ${Math.round(waitTime/1000)} seconds for processing...`);
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
      `${baseUrl}/api/process`,
      getPayload,
      { 
        headers: gptinfHeaders,
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: function (status) {
          return status >= 200 && status < 300;
        }
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
          method: 'simple_gptinf_enhanced',
          note: 'Single GPTinf humanization with enhanced headers completed'
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
      throw new Error(`Get failed: ${getResponse.status} - ${getResponse.statusText}`);
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
        method: 'simple_gptinf_enhanced_error',
        note: 'GPTinf processing failed with enhanced headers'
      })
    };
  }
};
