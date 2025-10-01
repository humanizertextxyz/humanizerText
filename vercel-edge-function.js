// Vercel Edge Function - might have different IP
export default async function handler(request) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': 'https://humanizertext.xyz',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response('', { status: 200, headers });
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers
    });
  }

  try {
    const requestBody = await request.json();
    const text = requestBody.text || requestBody.data?.text || 'No text provided';
    
    if (!text || text === 'No text provided') {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers
      });
    }

    console.log('Edge function processing:', text);

    // Test GPTinf from Edge Function
    const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRpYWxkcmFtYXNAZ21haWwuY29tIiwiaWF0IjoxNzU5MTYzNTU5fQ.RkeQJJCovejH3gD4sZQFsPEeoa_tEGQ7CC3YM0SaQA';
    
    // Step 1: Start processing
    const startPayload = {
      "cacheMode": "start",
      "text": text,
      "model": "free2",
      "keywords": [],
      "sessionId": `edge_${Date.now()}`,
      "alg": 0,
      "trialNumber": 0
    };
    
    const startResponse = await fetch('https://www.gptinf.com/api/process', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://www.gptinf.com',
        'Referer': 'https://www.gptinf.com/editor'
      },
      body: JSON.stringify(startPayload)
    });
    
    console.log('Start response status:', startResponse.status);
    
    if (startResponse.status !== 200) {
      throw new Error(`Start failed: ${startResponse.status}`);
    }
    
    const startData = await startResponse.json();
    const completionId = startData.completionId;
    
    if (!completionId) {
      throw new Error('No completion ID received');
    }
    
    console.log('✅ Got completion ID:', completionId);
    
    // Step 2: Wait and get results
    await new Promise(resolve => setTimeout(resolve, 20000));
    
    const getPayload = {
      "cacheMode": "get",
      "completionId": completionId,
      "sessionId": `edge_${Date.now()}`,
      "text": "",
      "token": authToken
    };
    
    const getResponse = await fetch('https://www.gptinf.com/api/process', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://www.gptinf.com',
        'Referer': 'https://www.gptinf.com/editor'
      },
      body: JSON.stringify(getPayload)
    });
    
    if (getResponse.status === 200) {
      const resultData = await getResponse.json();
      
      if (resultData.result && resultData.result.length > 0) {
        const humanizedText = resultData.result[0].text;
        console.log('✅ Edge function GPTinf successful!');
        
        const response = {
          success: true,
          humanized_text: humanizedText,
          progress: [100],
          iterations: 1,
          final_ai_percentage: 0,
          original_text: text,
          method: 'vercel_edge_function',
          note: 'GPTinf humanization through Vercel Edge Function'
        };

        return new Response(JSON.stringify(response), {
          status: 200,
          headers
        });
      } else {
        throw new Error('No result in GPTinf response');
      }
    } else {
      throw new Error(`Get failed: ${getResponse.status}`);
    }

  } catch (error) {
    console.error('Error in edge function:', error);
    return new Response(JSON.stringify({
      error: 'Edge function GPTinf processing failed',
      details: error.message,
      success: false,
      humanized_text: `Error: ${error.message}`,
      progress: [0],
      iterations: 0,
      final_ai_percentage: 100,
      original_text: 'Unknown',
      method: 'vercel_edge_function_error',
      note: 'Edge function GPTinf processing failed'
    }), {
      status: 500,
      headers
    });
  }
}
