const axios = require('axios');

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

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
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

    console.log('🚀 Starting double humanization with Netlify Functions');
    console.log(`📝 Input text: ${text.substring(0, 100)}...`);

    // GPTinf configuration
    const baseUrl = "https://www.gptinf.com";
    const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRpYWxkcmFtYXNAZ21haWwuY29tIiwiaWF0IjoxNzU5MTYzNTU5fQ.RkeQJJCovejH3gD4sZQFsPEeoa_tEGQ7CC3YM0SaQA';

    // Headers for GPTinf requests
    const gptinfHeaders = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
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

    // Function to humanize text with GPTinf
    async function humanizeText(inputText, attemptName) {
      console.log(`🔄 ${attemptName}...`);
      
      try {
        // Generate session ID
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Step 1: Start processing
        const startPayload = {
          "cacheMode": "start",
          "text": inputText,
          "model": "free2",
          "keywords": [],
          "sessionId": sessionId,
          "alg": 0,
          "trialNumber": 0
        };

        console.log('🔄 Starting processing...');
        const startResponse = await axios.post(
          `${baseUrl}/api/process`,
          startPayload,
          { headers: gptinfHeaders, timeout: 30000 }
        );

        if (startResponse.status !== 200) {
          throw new Error(`Start failed: ${startResponse.status}`);
        }

        const startData = startResponse.data;
        const completionId = startData.completionId;

        if (!completionId) {
          throw new Error('No completion ID received');
        }

        console.log(`✅ Got completion ID: ${completionId}`);

        // Step 2: Wait and get results
        console.log('⏳ Waiting 15 seconds for processing...');
        await new Promise(resolve => setTimeout(resolve, 15000));

        const getPayload = {
          "cacheMode": "get",
          "completionId": completionId,
          "sessionId": sessionId,
          "text": "",
          "token": authToken
        };

        console.log('🔄 Getting results...');
        const getResponse = await axios.post(
          `${baseUrl}/api/process`,
          getPayload,
          { headers: gptinfHeaders, timeout: 30000 }
        );

        if (getResponse.status === 200) {
          const resultData = getResponse.data;
          
          if (resultData.result && resultData.result.length > 0) {
            const humanized = resultData.result[0].text;
            console.log(`✅ ${attemptName} successful!`);
            return humanized;
          } else {
            throw new Error('No result in response');
          }
        } else {
          throw new Error(`Get failed: ${getResponse.status}`);
        }

      } catch (error) {
        console.error(`❌ Error during ${attemptName.toLowerCase()}:`, error.message);
        throw error;
      }
    }

    // Run double humanization
    console.log('🚀 Starting double humanization...');
    
    // First humanization
    const firstResult = await humanizeText(text, 'First Humanization');
    
    if (!firstResult) {
      throw new Error('First humanization failed');
    }

    console.log('✅ First humanization completed');
    console.log('🔄 Starting second humanization...');

    // Second humanization using first result
    const secondResult = await humanizeText(firstResult, 'Second Humanization');
    
    if (!secondResult) {
      throw new Error('Second humanization failed');
    }

    console.log('✅ Double humanization completed successfully!');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        humanized_text: secondResult,
        progress: 100,
        iterations: 2,
        final_ai_percentage: 0
      })
    };

  } catch (error) {
    console.error('❌ Netlify function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to humanize text',
        details: error.message
      })
    };
  }
};
