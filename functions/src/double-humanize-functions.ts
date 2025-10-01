import {onRequest} from "firebase-functions/v2/https";
import {getFirestore} from "firebase-admin/firestore";
import axios from "axios";
import { checkRateLimit, validateRequest, getClientIP } from './security-utils';

// CORS configuration
const corsOptions = {
  cors: true
};

// GPTinf credentials
const GPTINF_AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Imh1bWFuaXplcnRleHR4eXpAZ21haWwuY29tIiwiaWF0IjoxNzU5MjQ1NTYzfQ.gxmUDN_HaAyOesZu-xvIAISM3-ACmG-rkyPx-1do1lM';

export const doubleHumanizeText = onRequest(corsOptions, async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', 'https://humanizertext.xyz');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Credentials', 'true');
  res.set('Access-Control-Max-Age', '86400');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Security checks
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP)) {
      res.status(429).json({ error: 'Rate limit exceeded' });
      return;
    }

    const validation = validateRequest(req.body?.text || '', req.headers['user-agent']);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error });
      return;
    }

    // Extract text from request
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required and must be a string' });
      return;
    }

    if (text.length > 10000) {
      res.status(400).json({ error: 'Text too long (max 10,000 characters)' });
      return;
    }

    logger.info('🔄 Starting GPTinf double humanization...');
    logger.info(`📝 Input text (${text.split(' ').length} words): ${text.substring(0, 100)}...`);

    // Run GPTinf double humanization
    const result = await runGptinfDoubleHumanization(text);
    
    if (!result) {
      res.status(500).json({ error: 'Double humanization failed. Please try again.' });
      return;
    }

    logger.info('✅ Double humanization completed successfully!');
    res.status(200).json({
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
      note: 'Double humanization completed using GPTinf with Bearer token'
    });

  } catch (error) {
    logger.error('❌ Error in double humanization:', error);
    res.status(500).json({ 
      error: 'Failed to double humanize text', 
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GPTinf double humanization with Bearer token
async function runGptinfDoubleHumanization(text: string): Promise<any> {
  const baseUrl = "https://www.gptinf.com";
  
  // Create session with Bearer token authentication
  const session = axios.create({
    baseURL: baseUrl,
    timeout: 60000,
    headers: {
      'Authorization': `Bearer ${GPTINF_AUTH_TOKEN}`,
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
    logger.info('🔄 Starting first humanization...');
    const firstResult = await humanizeText(session, text, 'First Humanization');
    
    if (!firstResult) {
      throw new Error('First humanization failed');
    }

    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Second humanization
    logger.info('🔄 Starting second humanization...');
    const secondResult = await humanizeText(session, firstResult, 'Second Humanization');
    
    if (!secondResult) {
      throw new Error('Second humanization failed');
    }

    return {
      original: text,
      first_result: firstResult,
      second_result: secondResult
    };
    
  } catch (error) {
    logger.error('❌ GPTinf error:', error);
    throw error;
  }
}

// Humanization function using the correct API pattern
async function humanizeText(session: any, text: string, attemptName: string): Promise<string | null> {
  try {
    logger.info(`🔄 ${attemptName}...`);
    
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
      logger.error(`❌ Start failed with status ${startResponse.status}`);
      return null;
    }
    
    const startData = startResponse.data;
    const completionId = startData.completionId;
    
    if (!completionId) {
      logger.error('❌ No completion ID');
      return null;
    }
    
    logger.info(`✅ Got completion ID: ${completionId}`);
    
    // Step 2: Wait for processing
    logger.info('⏳ Waiting 20 seconds for processing...');
    await new Promise(resolve => setTimeout(resolve, 20000));
    
    // Step 3: Get results
    const getPayload = {
      cacheMode: "get",
      completionId: completionId,
      sessionId: sessionId,
      text: "",
      token: GPTINF_AUTH_TOKEN
    };
    
    const getResponse = await session.post('/api/process', getPayload);
    
    if (getResponse.status === 200) {
      const resultData = getResponse.data;
      
      if (resultData.result && resultData.result.length > 0) {
        const humanized = resultData.result[0].text;
        logger.info(`✅ ${attemptName} successful!`);
        return humanized;
      } else {
        logger.error(`❌ No result in response`);
        return null;
      }
    } else {
      logger.error(`❌ Get failed with status ${getResponse.status}`);
      return null;
    }
    
  } catch (error) {
    logger.error(`❌ Error during ${attemptName.toLowerCase()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
}
