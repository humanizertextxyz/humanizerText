// Security utilities for Firebase functions

// Rate limiting store (in production, use Redis or Firestore)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting function
export function checkRateLimit(ip: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = ip;
  const userLimit = rateLimitStore.get(key);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= maxRequests) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

// Security validation function
export function validateRequest(text: string, userAgent?: string): { valid: boolean; error?: string } {
  // Check text length
  if (!text || text.length === 0) {
    return { valid: false, error: 'Text is required' };
  }
  
  if (text.length > 10000) {
    return { valid: false, error: 'Text too long (max 10,000 characters)' };
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /document\./i
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(text)) {
      return { valid: false, error: 'Suspicious content detected' };
    }
  }
  
  // Check user agent
  if (userAgent && (userAgent.includes('bot') || userAgent.includes('crawler') || userAgent.includes('spider'))) {
    return { valid: false, error: 'Bot access denied' };
  }
  
  return { valid: true };
}

// Get client IP from request
export function getClientIP(req: any): string {
  return req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
}
