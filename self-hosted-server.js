const express = require('express');
const cors = require('cors');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(limiter);
app.use(cors({
  origin: ['https://humanizertext.xyz', 'https://humanizer-text.netlify.app'],
  credentials: true
}));
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    server: 'self-hosted-humanizer'
  });
});

// Main humanization endpoint
app.post('/humanize', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    console.log('Processing text:', text.substring(0, 100) + '...');

    // GPTinf configuration
    const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRpYWxkcmFtYXNAZ21haWwuY29tIiwiaWF0IjoxNzU5MTYzNTU5fQ.RkeQJJCovejH3gD4sZQFsPEeoa_tEGQ7CC3YM0SaQA';
    const baseUrl = 'https://www.gptinf.com';
    
    // Enhanced headers to mimic real browser
    const headers = {
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

    console.log('🔄 Starting GPTinf processing...');
    
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
      "sessionId": `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      "alg": 0,
      "trialNumber": 0
    };
    
    const startResponse = await axios.post(
      `${baseUrl}/api/process`,
      startPayload,
      { 
        headers,
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: function (status) {
          return status >= 200 && status < 300;
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
      "sessionId": `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      "text": "",
      "token": authToken
    };
    
    const getResponse = await axios.post(
      `${baseUrl}/api/process`,
      getPayload,
      { 
        headers,
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
        console.log('Humanized text length:', humanizedText.length);
        
        const response = {
          success: true,
          humanized_text: humanizedText,
          progress: [100],
          iterations: 1,
          final_ai_percentage: 0,
          original_text: text,
          method: 'self_hosted_gptinf',
          note: 'Self-hosted GPTinf humanization completed'
        };

        res.json(response);
      } else {
        throw new Error('No result in GPTinf response');
      }
    } else {
      throw new Error(`Get failed: ${getResponse.status} - ${getResponse.statusText}`);
    }

  } catch (error) {
    console.error('Error in humanization:', error);
    res.status(500).json({
      error: 'Humanization failed',
      details: error.message,
      success: false,
      humanized_text: `Error: ${error.message}`,
      progress: [0],
      iterations: 0,
      final_ai_percentage: 100,
      original_text: req.body.text || 'Unknown',
      method: 'self_hosted_error',
      note: 'Self-hosted humanization failed'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Self-hosted humanizer server running on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 Humanize endpoint: http://localhost:${PORT}/humanize`);
  console.log(`🌐 Server IP will be used for GPTinf requests`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down self-hosted server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down self-hosted server...');
  process.exit(0);
});
