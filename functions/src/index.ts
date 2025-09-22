import {onCall, onRequest, HttpsError} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import axios from "axios";
import OpenAI from "openai";

// Export Stripe functions
export { createStripeProducts, createCheckoutSession, stripeWebhook, validateCoupon } from './stripe-functions';

// Define the OpenAI API key as a secret
const openaiApiKey = defineSecret("OPENAI_API_KEY");

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// OpenAI will be initialized within functions that need it

// CORS configuration for HTTP functions
const corsOptions = {
  cors: true
};

// Example function - you can add more functions here
export const helloWorld = onCall(async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  // Use the db variable to avoid unused variable error
  const userDoc = await db.collection('users').doc(request.auth.uid).get();
  
  return {
    message: "Hello from Firebase Functions!",
    userId: request.auth.uid,
    userExists: userDoc.exists,
  };
});

// Test function to verify dash removal
export const testDashRemoval = onRequest(corsOptions, async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', 'https://humanizertext.xyz');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  const testString = "This is a test—with em dashes—to see if they get removed properly.";
  const cleaned = testString.replace(/—/g, ", ");
  
  res.json({
    original: testString,
    cleaned: cleaned,
    success: true
  });
});

// SIMPLE TEST FUNCTION
export const testFunction = onRequest(corsOptions, async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  const { text } = req.body.data || req.body;
  
  // Process text
  
  // Simple dash removal
  let cleaned = text || "No text provided";
  cleaned = cleaned.replace(/—/g, ", ");
  cleaned = cleaned.replace(/–/g, ", ");
  cleaned = cleaned.replace(/―/g, ", ");
  
  // Return cleaned text
  
  res.json({
    success: true,
    original: text,
    cleaned: cleaned,
    method: 'test_function'
  });
});

// NEW HUMANIZE FUNCTION - Fresh start with dash removal
export const humanizeTextNew = onRequest(corsOptions, async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', 'https://humanizertext.xyz');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const {
      text,
      writingStyle = 'natural',
      textLength = 'same',
      keywordsToPreserve = '',
      readingLevel = '',
      toneGuardrails = '',
      prohibitedItems = '',
      personaLens = '',
      customRequest = '',
      temperature = 0.9,
      top_p = 0.9,
      frequency_penalty = 0.1,
      presence_penalty = 0.1
    } = req.body.data || req.body;
    
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required and must be a string' });
      return;
    }

    if (text.trim().split(' ').length < 30) {
      res.status(400).json({ error: 'Text must be at least 30 words' });
      return;
    }

    // Process text

    // Generate humanized text using OpenAI
    const humanizedText = await generateAdvancedHumanizedText(
      text, 
      writingStyle, 
      textLength, 
      keywordsToPreserve, 
      readingLevel, 
      toneGuardrails, 
      prohibitedItems, 
      personaLens, 
      customRequest,
      temperature,
      top_p,
      frequency_penalty,
      presence_penalty
    );
    
    // Clean the text
    
    // FORCE DASH REMOVAL - This MUST work
    let finalCleanedText = humanizedText;
    finalCleanedText = finalCleanedText.replace(/—/g, ", ");
    finalCleanedText = finalCleanedText.replace(/–/g, ", ");
    finalCleanedText = finalCleanedText.replace(/―/g, ", ");
    
    // Create response
    
    // Force the response to use the cleaned text
    const responseData = {
      success: true,
      original_text: text,
      humanized_text: finalCleanedText,
      method: 'new_humanize_function'
    };
    
    // FINAL FORCE: Remove any remaining dashes
    responseData.humanized_text = responseData.humanized_text.replace(/—/g, ", ");
    responseData.humanized_text = responseData.humanized_text.replace(/–/g, ", ");
    responseData.humanized_text = responseData.humanized_text.replace(/―/g, ", ");
    
    // Return response
    
    res.status(200).json({ result: responseData });
    
  } catch (error) {
    console.error('NEW FUNCTION Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ 
      error: 'Humanization failed', 
      details: errorMessage 
    });
  }
});

// ZeroGPT AI Detection Function - HTTP Function (NO AUTHENTICATION REQUIRED)
export const detectAiText = onRequest(corsOptions, async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', 'https://humanizertext.xyz');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { text } = req.body.data || req.body;
    
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required and must be a string' });
      return;
    }

    if (text.trim().split(' ').length < 30) {
      res.status(400).json({ error: 'Text must be at least 30 words' });
      return;
    }

    const url = 'https://api.zerogpt.com/api/detect/detectText';
    
    const headers = {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'en-US,en;q=0.9',
      'Connection': 'keep-alive',
      'Content-Type': 'application/json',
      'DNT': '1',
      'Origin': 'https://www.zerogpt.com',
      'Referer': 'https://www.zerogpt.com/',
      'Sec-Ch-Ua': '"Chromium";v="139", "Not;A=Brand";v="99"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
    };
    
    const payload = { input_text: text };
    
    const response = await axios.post(url, payload, { 
      headers, 
      timeout: 30000,
      validateStatus: () => true
    });
    
    if (response.status === 200) {
      const result = response.data;
      // Process API response
      
      // Handle different response structures
      const data = result.data || result;
      
      const responseData = {
        success: true,
        is_ai: data.isHuman === 0 || data.is_human === 0 || data.isHuman === false,
        is_human: data.isHuman === 1 || data.is_human === 1 || data.isHuman === true,
        ai_percentage: data.fakePercentage || data.ai_percentage || data.percentage || 0,
        human_percentage: data.humanPercentage || data.human_percentage || (100 - (data.fakePercentage || data.ai_percentage || data.percentage || 0)),
        feedback: data.feedback || data.message || '',
        language: data.detected_language || data.language || '',
        text_words: data.textWords || data.text_words || 0,
        ai_words: data.aiWords || data.ai_words || 0,
        highlighted_sentences: data.h || data.highlighted_sentences || [],
        full_response: result
      };
      
      // Return processed response
      res.status(200).json({ result: responseData });
    } else {
      console.error('ZeroGPT API Error:', response.status, response.data);
      res.status(500).json({ error: `ZeroGPT API returned status ${response.status}: ${JSON.stringify(response.data)}` });
    }
    
  } catch (error) {
    console.error('ZeroGPT API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ error: `Failed to check text for AI: ${errorMessage}` });
  }
});

// Advanced Humanization Function - HTTP Function (NO AUTHENTICATION REQUIRED)
export const humanizeText = onRequest({secrets: [openaiApiKey], ...corsOptions}, async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', 'https://humanizertext.xyz');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { 
      text, 
      writingStyle, 
      textLength, 
      keywordsToPreserve, 
      readingLevel, 
      toneGuardrails, 
      prohibitedItems, 
      personaLens, 
      customRequest,
      temperature,
      top_p,
      frequency_penalty,
      presence_penalty,
      userEmail,
      userSubscription
    } = req.body.data || req.body;
    
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required and must be a string' });
      return;
    }

    if (text.trim().split(' ').length < 30) {
      res.status(400).json({ error: 'Text must be at least 30 words' });
      return;
    }

    // Check subscription limits
    const wordCount = text.trim().split(' ').length;
    const subscriptionType = userSubscription?.type || 'free';
    
    // Define limits based on new subscription tiers
    const limits = {
      free: { wordsPerProcess: 150, dailyWords: 1000, monthlyWords: 0 },
      pro: { wordsPerProcess: 500, dailyWords: 0, monthlyWords: 20000 },
      premium: { wordsPerProcess: 0, dailyWords: 0, monthlyWords: 50000 },
      platinum: { wordsPerProcess: 0, dailyWords: 0, monthlyWords: 1000000000 } // 1 billion (unlimited)
    };
    
    const userLimits = limits[subscriptionType as keyof typeof limits] || limits.free;
    
    // Check words per process limit
    if (userLimits.wordsPerProcess > 0 && wordCount > userLimits.wordsPerProcess) {
      res.status(400).json({ 
        error: `Text exceeds limit for ${subscriptionType} plan. Maximum ${userLimits.wordsPerProcess} words per process.`,
        limit: userLimits.wordsPerProcess,
        current: wordCount,
        subscriptionType
      });
      return;
    }

    // Check monthly limit for paid users
    if (userLimits.monthlyWords > 0 && userEmail && userSubscription) {
      // Get current monthly usage from database
      const db = getFirestore();
      const sanitizedEmail = userEmail.replace(/[\.#$\[\]@]/g, (match: string) => {
        if (match === '@') return '_at_';
        return '_';
      });
      
      const userRef = db.collection('users').doc(sanitizedEmail);
      const userDoc = await userRef.get();
      const userData = userDoc.data();
      
      const currentMonthlyUsage = userData?.usage?.monthlyWordsUsed || 0;
      
      if (currentMonthlyUsage >= userLimits.monthlyWords) {
        res.status(400).json({ 
          error: `Monthly limit reached for ${subscriptionType} plan. You have used ${currentMonthlyUsage} of ${userLimits.monthlyWords} words this month.`,
          limit: userLimits.monthlyWords,
          current: currentMonthlyUsage,
          subscriptionType
        });
        return;
      }
      
      if (currentMonthlyUsage + wordCount > userLimits.monthlyWords) {
        res.status(400).json({ 
          error: `This request would exceed your monthly limit. You have ${userLimits.monthlyWords - currentMonthlyUsage} words remaining.`,
          limit: userLimits.monthlyWords,
          current: currentMonthlyUsage,
          remaining: userLimits.monthlyWords - currentMonthlyUsage,
          subscriptionType
        });
        return;
      }
    }

    // Track usage if user is authenticated
    if (userEmail && userSubscription) {
      await trackUsage(userEmail, wordCount, subscriptionType);
    }

    // Generate humanized text using the exact same approach as emdash.py
    const humanizedText = await generateAdvancedHumanizedText(
      text, 
      writingStyle, 
      textLength, 
      keywordsToPreserve, 
      readingLevel, 
      toneGuardrails, 
      prohibitedItems, 
      personaLens, 
      customRequest,
      temperature,
      top_p,
      frequency_penalty,
      presence_penalty
    );
    
    // Original function - no dash removal (we'll handle this in frontend)
    const finalCleanedText = humanizedText;
    
    // Force the response to use the cleaned text
    const responseData = {
      success: true,
      original_text: text,
      humanized_text: finalCleanedText,
      method: 'advanced_undetectable_prompt'
    };
    
    // Return final response
    
    // No additional processing - frontend will handle dash removal
    
    res.status(200).json({ result: responseData });
    
  } catch (error) {
    console.error('Humanization Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ error: `Failed to humanize text: ${errorMessage}` });
  }
});

// Advanced Humanization Function with Undetectable Prompt - EXACTLY like emdash.py
async function generateAdvancedHumanizedText(
  text: string, 
  writingStyle?: string, 
  textLength?: string, 
  keywordsToPreserve?: string, 
  readingLevel?: string, 
  toneGuardrails?: string, 
  prohibitedItems?: string, 
  personaLens?: string, 
  customRequest?: string,
  temperature?: number,
  top_p?: number,
  frequency_penalty?: number,
  presence_penalty?: number
): Promise<string> {
  
  // Simplified prompt - no need for complex length instructions
  
  // Simplified, clear prompt that works better
  const prompt = `Rewrite the following text to sound more natural and human-like. Keep the same meaning but use different words and sentence structures.

IMPORTANT RULES:
- Do NOT use any dashes (—, –, ―) in your output
- Keep the same meaning and facts
- Use natural, conversational language
- Vary sentence lengths
- Return ONLY the rewritten text, no explanations

Text to rewrite:
${text}`;

  try {
    // Initialize OpenAI with the secret
    const openai = new OpenAI({
      apiKey: openaiApiKey.value(),
    });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      max_tokens: 2000
    });

    const result = completion.choices[0]?.message?.content?.trim() || text;
    
    // Return the result
    
    // Clean the result
    
    // Replace ALL types of dashes with commas (comprehensive approach)
    let resultCleaned = result;
    
    // Replace all dash types with commas
    resultCleaned = resultCleaned.replace(/—/g, ", ");  // Em dash
    resultCleaned = resultCleaned.replace(/–/g, ", ");  // En dash
    resultCleaned = resultCleaned.replace(/―/g, ", ");  // Horizontal bar
    resultCleaned = resultCleaned.replace(/‐/g, ", ");  // Hyphen
    resultCleaned = resultCleaned.replace(/‑/g, ", ");  // Non-breaking hyphen
    resultCleaned = resultCleaned.replace(/‒/g, ", ");  // Figure dash
    resultCleaned = resultCleaned.replace(/⁓/g, ", ");  // Swung dash
    resultCleaned = resultCleaned.replace(/〜/g, ", ");  // Wave dash
    resultCleaned = resultCleaned.replace(/～/g, ", ");  // Fullwidth tilde
    
    // Additional comprehensive dash removal using Unicode ranges
    resultCleaned = resultCleaned.replace(/[\u2010-\u2015\u2043-\u205F\u2212\u301C-\u301F\u3030\u30FC\uFF0D\uFF5E]/g, ", ");
    
    // Final cleanup - replace any remaining dash-like characters
    resultCleaned = resultCleaned.replace(/[—–―‐‑‒⁓〜～\u2010-\u2015\u2043-\u205F\u2212\u301C-\u301F\u3030\u30FC\uFF0D\uFF5E]/g, ", ");

    
    // Return cleaned result

    return resultCleaned;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Temporary error, please try again later');
  }
}

// Helper function to get length instructions
// Removed unused function

// Helper function to track user usage
async function trackUsage(userEmail: string, wordCount: number, subscriptionType: string) {
  try {
    const db = getFirestore();
    const sanitizedEmail = userEmail.replace(/[\.#$\[\]@]/g, (match) => {
      if (match === '@') return '_at_';
      return '_';
    });
    
    const userRef = db.collection('users').doc(sanitizedEmail);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Get current usage data
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    
    const currentDailyUsage = userData?.usage?.dailyWordsUsed || 0;
    const currentMonthlyUsage = userData?.usage?.monthlyWordsUsed || 0;
    const lastUsageDate = userData?.usage?.lastUsageDate;
    
    // Reset daily usage if it's a new day
    const shouldResetDaily = lastUsageDate !== todayStr;
    const newDailyUsage = shouldResetDaily ? wordCount : currentDailyUsage + wordCount;
    
    // Reset monthly usage if it's a new month
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const lastUsageMonth = userData?.usage?.lastUsageMonth;
    const lastUsageYear = userData?.usage?.lastUsageYear;
    const shouldResetMonthly = lastUsageMonth !== currentMonth || lastUsageYear !== currentYear;
    const newMonthlyUsage = shouldResetMonthly ? wordCount : currentMonthlyUsage + wordCount;
    
    // Update usage tracking
    await userRef.update({
      usage: {
        dailyWordsUsed: newDailyUsage,
        monthlyWordsUsed: newMonthlyUsage,
        lastUsageDate: todayStr,
        lastUsageMonth: currentMonth,
        lastUsageYear: currentYear,
        totalWords: (userData?.usage?.totalWords || 0) + wordCount,
        lastUpdated: new Date()
      }
    });
    
    // Usage tracked successfully
    
  } catch (error) {
    console.error('Error tracking usage:', error);
    // Don't throw error to avoid breaking the main function
  }
}
