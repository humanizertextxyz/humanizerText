import {onRequest} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import {getFirestore} from "firebase-admin/firestore";
import axios from "axios";

// Define the Mistral API key as a secret
const mistralApiKey = defineSecret("MISTRAL_API_KEY");

// Firebase Admin is already initialized in index.ts

// CORS configuration for HTTP functions
const corsOptions = {
  cors: true
};

// Mistral AI Humanization Function - HTTP Function (NO AUTHENTICATION REQUIRED)
export const mistralHumanizeText = onRequest({secrets: [mistralApiKey], ...corsOptions}, async (req, res) => {
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

    // Check subscription limits (same as other functions)
    const wordCount = text.trim().split(' ').length;
    const subscriptionType = userSubscription?.type || 'free';
    
    const limits = {
      free: { wordsPerProcess: 150, dailyWords: 1000, monthlyWords: 0 },
      pro: { wordsPerProcess: 500, dailyWords: 0, monthlyWords: 20000 },
      premium: { wordsPerProcess: 0, dailyWords: 0, monthlyWords: 50000 },
      platinum: { wordsPerProcess: 0, dailyWords: 0, monthlyWords: 1000000000 }
    };
    
    const userLimits = limits[subscriptionType as keyof typeof limits] || limits.free;
    
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

    // Generate humanized text using Mistral AI
    const humanizedText = await generateMistralHumanizedText(
      text, 
      writingStyle, 
      textLength, 
      keywordsToPreserve, 
      readingLevel, 
      toneGuardrails, 
      prohibitedItems, 
      personaLens, 
      customRequest
    );
    
    // Clean the text (remove dashes)
    let finalCleanedText = humanizedText;
    finalCleanedText = finalCleanedText.replace(/—/g, ", ");
    finalCleanedText = finalCleanedText.replace(/–/g, ", ");
    finalCleanedText = finalCleanedText.replace(/―/g, ", ");
    finalCleanedText = finalCleanedText.replace(/‐/g, ", ");
    finalCleanedText = finalCleanedText.replace(/‑/g, ", ");
    finalCleanedText = finalCleanedText.replace(/‒/g, ", ");
    
    // Create response
    const responseData = {
      success: true,
      original_text: text,
      humanized_text: finalCleanedText,
      method: 'mistral_ai_humanization'
    };
    
    res.status(200).json({ result: responseData });
    
  } catch (error) {
    console.error('Mistral Humanization Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ error: `Failed to humanize text with Mistral: ${errorMessage}` });
  }
});

// Mistral AI Humanization Function with Same Prompt as OpenAI
async function generateMistralHumanizedText(
  text: string, 
  writingStyle?: string, 
  textLength?: string, 
  keywordsToPreserve?: string, 
  readingLevel?: string, 
  toneGuardrails?: string, 
  prohibitedItems?: string, 
  personaLens?: string, 
  customRequest?: string
): Promise<string> {
  
  // Create length instruction based on textLength parameter
  const getLengthInstruction = (textLength?: string): string => {
    if (!textLength || textLength === 'maintain') {
      return 'Keep the text within 8% greater than or less than the original word count.';
    } else if (textLength === 'shorter') {
      return 'Make the text approximately 10% shorter while preserving all key information.';
    } else if (textLength === 'longer') {
      return 'Expand the text approximately 10% longer with additional detail while maintaining the core message.';
    }
    return 'Keep the text within 10% greater than or less than the original word count.';
  };
  
  const lengthInstruction = getLengthInstruction(textLength);
  
  // Same prompt as OpenAI version
  const prompt = `Rewrite the TEXT with the same meaning but a different style, tone, and structure. Follow this rubric strictly:

A. Perplexity (High)
* Use unexpected yet fitting verbs and nouns; avoid stock phrases.
* Replace at least 30% of content words with strong synonyms or rephrasings.
* Avoid formulaic connectors ("in conclusion," "overall," etc.).
B. Burstiness (High)
* Sentence mix:
    * 40–60% short (≤10 words),
    * 25–40% medium (11–20 words),
    * 10–20% long (28–45 words).
* Include 1 fragment and 1 parenthetical or brief self-correction.
C. Consistency (Slightly Lower)
* Have many mild shifts in tone/tempo (e.g., a quick aside).
* Keep grammar readable; include small, human imperfections.
D. Anti-Repetition
* Do not repeat distinctive phrases, sentence starters, or rhetorical patterns.
* Avoid near-duplicates and synonym ping-pong (e.g., cycling "rapid/fast/quick").
E. Fidelity
* Keep all facts, relationships, and logical order intact. Do not add claims.
* Preserve core meaning of the text,named entities, quantities, and cause-effect links.
Output Rules (IMPORTANT)
* Inclue unnoticable Imperfection
* Return only the rewritten text, no commentary.
* ${lengthInstruction}
* DO NOT INCLUDE EM DASHES "—" ANYWHERE IN YOUR OUTPUT AT ALL!
* REMOVE ALL EM DASHES "—" FROM THE INPUT TEXT AND REPLACE WITH APPROPRIATE PUNCTUATION (commas, periods, or semicolons)

${text}

Optional Add-Ons (If nothing is listed, skip over it)
* Keywords to preserve verbatim: ${keywordsToPreserve || ''}
* Reading level target: ${readingLevel || ''}
* Tone guardrails: ${toneGuardrails || ''}
* Prohibited items: clichés, emojis, corporate buzzwords, em dashes (—)${prohibitedItems ? `, ${prohibitedItems}` : ''}.
* Persona lens: ${personaLens || ''}
* Writing Style: ${writingStyle || ''}
* Custom Request: ${customRequest || ''}
`;

  try {
    // Try mistral-large-latest first, fallback to mistral-small-latest if capacity exceeded
    let model = 'mistral-large-latest';
    let response;
    
    try {
      response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
        model: model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 1.0, // Highest temperature
        top_p: 1.0, // Highest top_p
        max_tokens: 2000
      }, {
        headers: {
          'Authorization': `Bearer ${mistralApiKey.value()}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });
    } catch (firstError: any) {
      // If capacity exceeded, try with smaller model
      if (firstError.response?.status === 429 && firstError.response?.data?.type === 'service_tier_capacity_exceeded') {
        console.log('Large model at capacity, trying smaller model...');
        model = 'mistral-small-latest';
        response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
          model: model,
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 1.0,
          top_p: 1.0,
          max_tokens: 2000
        }, {
          headers: {
            'Authorization': `Bearer ${mistralApiKey.value()}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        });
      } else {
        throw firstError;
      }
    }

    const result = response.data.choices[0]?.message?.content?.trim() || text;
    
    // Clean the result (remove dashes)
    let resultCleaned = result;
    resultCleaned = resultCleaned.replace(/—/g, ", ");
    resultCleaned = resultCleaned.replace(/–/g, ", ");
    resultCleaned = resultCleaned.replace(/―/g, ", ");
    resultCleaned = resultCleaned.replace(/‐/g, ", ");
    resultCleaned = resultCleaned.replace(/‑/g, ", ");
    resultCleaned = resultCleaned.replace(/‒/g, ", ");
    
    return resultCleaned;
  } catch (error: any) {
    console.error('Mistral API Error:', error);
    
    // Handle specific Mistral API errors
    if (error.response?.status === 429) {
      const errorData = error.response.data;
      if (errorData?.type === 'service_tier_capacity_exceeded') {
        throw new Error('Mistral AI service is currently at capacity. Please try again in a few minutes or use a different AI model.');
      } else {
        throw new Error('Mistral AI rate limit exceeded. Please try again later or use a different AI model.');
      }
    } else if (error.response?.status === 401) {
      throw new Error('Mistral AI authentication failed. Please contact support.');
    } else if (error.response?.status === 400) {
      throw new Error('Invalid request to Mistral AI. Please try with different text.');
    } else {
      throw new Error('Mistral AI service temporarily unavailable. Please try again later or use a different AI model.');
    }
  }
}

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
    
  } catch (error) {
    console.error('Error tracking usage:', error);
    // Don't throw error to avoid breaking the main function
  }
}
