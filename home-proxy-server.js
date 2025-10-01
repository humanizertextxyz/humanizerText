const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 8080;

// Enable CORS for all routes
app.use(cors({
  origin: ['https://humanizertext.xyz', 'https://humanizer-text.netlify.app'],
  credentials: true
}));

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Proxy to GPTinf
app.use('/gptinf', createProxyMiddleware({
  target: 'https://www.gptinf.com',
  changeOrigin: true,
  pathRewrite: {
    '^/gptinf': ''
  },
  onProxyReq: (proxyReq, req, res) => {
    // Add your home computer's headers
    proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    proxyReq.setHeader('Accept', '*/*');
    proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9');
    proxyReq.setHeader('Accept-Encoding', 'gzip, deflate, br');
    proxyReq.setHeader('Origin', 'https://www.gptinf.com');
    proxyReq.setHeader('Referer', 'https://www.gptinf.com/editor');
    proxyReq.setHeader('Sec-Fetch-Dest', 'empty');
    proxyReq.setHeader('Sec-Fetch-Mode', 'cors');
    proxyReq.setHeader('Sec-Fetch-Site', 'same-origin');
    proxyReq.setHeader('DNT', '1');
    proxyReq.setHeader('Cache-Control', 'no-cache');
    proxyReq.setHeader('Pragma', 'no-cache');
    proxyReq.setHeader('Connection', 'keep-alive');
    proxyReq.setHeader('Upgrade-Insecure-Requests', '1');
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`Response: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
  },
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
});

app.listen(PORT, () => {
  console.log(`🏠 Home Proxy Server running on port ${PORT}`);
  console.log(`📡 Proxy endpoint: http://localhost:${PORT}/gptinf`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Your home IP will be used for GPTinf requests`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down proxy server...');
  process.exit(0);
});
