const axios = require('axios');

exports.handler = async (event) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': 'https://humanizertext.xyz',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400'
    };

    // Handle preflight request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        // Parse request body
        const body = JSON.parse(event.body);
        const { text } = body.data || body;

        if (!text || typeof text !== 'string') {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Text is required and must be a string' })
            };
        }

        if (text.length > 10000) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Text too long (max 10,000 characters)' })
            };
        }

        console.log('🔄 Starting GPTinf double humanization...');
        console.log(`📝 Input text (${text.split(' ').length} words): ${text.substring(0, 100)}...`);

        // Run GPTinf double humanization
        const result = await runGptinfDoubleHumanization(text);
        
        if (!result) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Double humanization failed. Please try again.' })
            };
        }

        console.log('✅ Double humanization completed successfully!');
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                original_text: text,
                humanized_text: result.second_result || result.first_result || text,
                method: 'double_humanization',
                progress: [
                    { iteration: 1, text: result.first_result, ai_percentage: null },
                    { iteration: 2, text: result.second_result, ai_percentage: null }
                ],
                iterations: 2,
                final_ai_percentage: null,
                note: 'Double humanization completed using GPTinf with AWS Lambda'
            })
        };

    } catch (error) {
        console.error('❌ Error in double humanization:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to double humanize text', 
                details: error.message 
            })
        };
    }
};

// GPTinf double humanization with Bearer token
async function runGptinfDoubleHumanization(text) {
    const baseUrl = "https://www.gptinf.com";
    const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Imh1bWFuaXplcnRleHR4eXpAZ21haWwuY29tIiwiaWF0IjoxNzU5MjQ1NTYzfQ.gxmUDN_HaAyOesZu-xvIAISM3-ACmG-rkyPx-1do1lM';
    
    // Create session with Bearer token authentication
    const session = axios.create({
        baseURL: baseUrl,
        timeout: 60000,
        headers: {
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
        }
    });

    try {
        // First humanization
        console.log('🔄 Starting first humanization...');
        const firstResult = await humanizeText(session, authToken, text, 'First Humanization');
        
        if (!firstResult) {
            throw new Error('First humanization failed');
        }

        // Wait between requests
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Second humanization
        console.log('🔄 Starting second humanization...');
        const secondResult = await humanizeText(session, authToken, firstResult, 'Second Humanization');
        
        if (!secondResult) {
            throw new Error('Second humanization failed');
        }

        return {
            original: text,
            first_result: firstResult,
            second_result: secondResult
        };
        
    } catch (error) {
        console.error('❌ GPTinf error:', error);
        throw error;
    }
}

// Humanization function using the correct API pattern
async function humanizeText(session, authToken, text, attemptName) {
    try {
        console.log(`🔄 ${attemptName}...`);
        
        // Generate unique session ID
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Step 1: Start processing
        const payload = {
            cacheMode: "start",
            text: text,
            model: "free2",
            keywords: [],
            sessionId: sessionId,
            alg: 0,
            trialNumber: 0
        };
        
        const startResponse = await session.post('/api/process', payload);
        
        if (startResponse.status !== 200) {
            console.log(`❌ Start failed with status ${startResponse.status}`);
            return null;
        }
        
        const startData = startResponse.data;
        const completionId = startData.completionId;
        
        if (!completionId) {
            console.log('❌ No completion ID');
            return null;
        }
        
        console.log(`✅ Got completion ID: ${completionId}`);
        
        // Step 2: Wait for processing
        console.log('⏳ Waiting 20 seconds for processing...');
        await new Promise(resolve => setTimeout(resolve, 20000));
        
        // Step 3: Get results
        const getPayload = {
            cacheMode: "get",
            completionId: completionId,
            sessionId: sessionId,
            text: "",
            token: authToken
        };
        
        const getResponse = await session.post('/api/process', getPayload);
        
        if (getResponse.status === 200) {
            const resultData = getResponse.data;
            
            if (resultData.result && resultData.result.length > 0) {
                const humanized = resultData.result[0].text;
                console.log(`✅ ${attemptName} successful!`);
                return humanized;
            } else {
                console.log(`❌ No result in response`);
                return null;
            }
        } else {
            console.log(`❌ Get failed with status ${getResponse.status}`);
            return null;
        }
        
    } catch (error) {
        console.log(`❌ Error during ${attemptName.toLowerCase()}: ${error.message}`);
        return null;
    }
}
