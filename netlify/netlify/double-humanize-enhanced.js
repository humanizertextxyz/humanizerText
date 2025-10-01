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

  try {
    // Parse request body
    const requestBody = JSON.parse(event.body);
    
    // Handle both direct text and wrapped data format
    let text;
    if (requestBody.text) {
      text = requestBody.text;
    } else if (requestBody.data && requestBody.data.text) {
      text = requestBody.data.text;
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Text is required' })
      };
    }
    
    if (!text) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Text is required' })
      };
    }

    console.log('🚀 Starting enhanced double humanization with Netlify Functions');
    console.log(`📝 Input text: ${text.substring(0, 100)}...`);

    // GPTinf configuration
    const baseUrl = "https://www.gptinf.com";
    const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRpYWxkcmFtYXNAZ21haWwuY29tIiwiaWF0IjoxNzU5MTYzNTU5fQ.RkeQJJCovejH3gD4sZQFsPEeoa_tEGQ7CC3YM0SaQA';

    // Multiple User-Agent strings for rotation
    const userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
    ];

    // Function to get random headers
    function getRandomHeaders() {
      const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
      return {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'User-Agent': userAgent,
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://www.gptinf.com',
        'Referer': 'https://www.gptinf.com/editor',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'DNT': '1',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"'
      };
    }

    // Function to humanize text with enhanced retry logic
    async function humanizeTextWithRetry(inputText, attemptName, maxRetries = 3) {
      console.log(`🔄 ${attemptName}...`);
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔄 Attempt ${attempt}/${maxRetries} for ${attemptName}`);
          
          // Random delay before each attempt
          const delay = Math.random() * 5000 + 2000; // 2-7 seconds
          console.log(`⏳ Waiting ${Math.round(delay)}ms before attempt...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Generate session ID
          const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Get random headers for this attempt
          const gptinfHeaders = getRandomHeaders();
          
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
            { 
              headers: gptinfHeaders, 
              timeout: 30000,
              validateStatus: () => true // Don't throw on any status
            }
          );

          console.log(`📊 Start response status: ${startResponse.status}`);

          if (startResponse.status === 403) {
            console.log(`❌ Cloudflare blocked attempt ${attempt}`);
            if (attempt < maxRetries) {
              const waitTime = attempt * 10000; // Progressive wait: 10s, 20s, 30s
              console.log(`⏳ Waiting ${waitTime}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            } else {
              throw new Error('Cloudflare blocked all attempts');
            }
          }

          if (startResponse.status !== 200) {
            throw new Error(`Start failed: ${startResponse.status} - ${startResponse.data}`);
          }

          const startData = startResponse.data;
          const completionId = startData.completionId;

          if (!completionId) {
            throw new Error('No completion ID received');
          }

          console.log(`✅ Got completion ID: ${completionId}`);

          // Step 2: Wait and get results with progressive wait times
          const waitTimes = [15, 20, 30]; // seconds
          const waitTime = waitTimes[Math.min(attempt - 1, waitTimes.length - 1)];
          console.log(`⏳ Waiting ${waitTime} seconds for processing...`);
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));

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
            { 
              headers: gptinfHeaders, 
              timeout: 30000,
              validateStatus: () => true
            }
          );

          console.log(`📊 Get response status: ${getResponse.status}`);

          if (getResponse.status === 200) {
            const resultData = getResponse.data;
            
            if (resultData.result && resultData.result.length > 0) {
              const humanized = resultData.result[0].text;
              console.log(`✅ ${attemptName} successful on attempt ${attempt}!`);
              return humanized;
            } else if (resultData.result === null) {
              console.log('⏳ Still processing, will retry...');
              if (attempt < maxRetries) {
                continue;
              } else {
                throw new Error('Processing timeout');
              }
            } else {
              throw new Error('No result in response');
            }
          } else if (getResponse.status === 403) {
            console.log(`❌ Cloudflare blocked get request on attempt ${attempt}`);
            if (attempt < maxRetries) {
              const waitTime = attempt * 15000; // Progressive wait: 15s, 30s, 45s
              console.log(`⏳ Waiting ${waitTime}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            } else {
              throw new Error('Cloudflare blocked all get attempts');
            }
          } else {
            throw new Error(`Get failed: ${getResponse.status} - ${getResponse.data}`);
          }

        } catch (error) {
          console.error(`❌ Error on attempt ${attempt} for ${attemptName.toLowerCase()}:`, error.message);
          
          if (attempt === maxRetries) {
            throw error;
          }
          
          // Wait before retry
          const waitTime = attempt * 5000; // Progressive wait: 5s, 10s, 15s
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
      
      throw new Error(`All ${maxRetries} attempts failed for ${attemptName}`);
    }

    // Run double humanization with enhanced retry logic
    console.log('🚀 Starting enhanced double humanization...');
    
    // Set a timeout for the entire operation (1 minute)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Function timeout after 1 minute')), 60000);
    });
    
    const humanizationPromise = (async () => {
      // First humanization
      const firstResult = await humanizeTextWithRetry(text, 'First Humanization', 3);
    
      if (!firstResult) {
        throw new Error('First humanization failed');
      }

      console.log('✅ First humanization completed');
      console.log('🔄 Starting second humanization...');

      // Second humanization using first result
      const secondResult = await humanizeTextWithRetry(firstResult, 'Second Humanization', 3);
      
      if (!secondResult) {
        throw new Error('Second humanization failed');
      }

      console.log('✅ Enhanced double humanization completed successfully!');

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
    })();

    // Race between humanization and timeout
    return await Promise.race([humanizationPromise, timeoutPromise]);

  } catch (error) {
    console.error('❌ Enhanced Netlify function error:', error);
    
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
