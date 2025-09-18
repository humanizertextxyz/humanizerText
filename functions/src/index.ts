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

// ZeroGPT AI Detection Function - HTTP Function (NO AUTHENTICATION REQUIRED)
export const detectAiText = onRequest(corsOptions, async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', 'https://humanizertext.xyz, https://humanizertext-551ee.web.app');
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
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
    };
    
    const payload = { input_text: text };
    
    const response = await axios.post(url, payload, { 
      headers, 
      timeout: 30000,
      validateStatus: () => true
    });
    
    if (response.status === 200) {
      const result = response.data;
      const data = result.data || {};
      
      const responseData = {
        success: true,
        is_ai: data.isHuman === 0,
        is_human: data.isHuman === 1,
        ai_percentage: data.fakePercentage || 0,
        feedback: data.feedback || '',
        language: data.detected_language || '',
        text_words: data.textWords || 0,
        ai_words: data.aiWords || 0,
        highlighted_sentences: data.h || [],
        full_response: result
      };
      
      res.status(200).json({ result: responseData });
    } else {
      res.status(500).json({ error: `ZeroGPT API returned status ${response.status}: ${response.data}` });
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
  res.set('Access-Control-Allow-Origin', 'https://humanizertext.xyz, https://humanizertext-551ee.web.app');
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
      presence_penalty
    } = req.body.data || req.body;
    
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text is required and must be a string' });
      return;
    }

    if (text.trim().split(' ').length < 30) {
      res.status(400).json({ error: 'Text must be at least 30 words' });
      return;
    }

    // Generate humanized text using the new advanced method
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
    
    const responseData = {
      success: true,
      original_text: text,
      humanized_text: humanizedText,
      method: 'advanced_undetectable_prompt'
    };
    
    res.status(200).json({ result: responseData });
    
  } catch (error) {
    console.error('Humanization Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ error: `Failed to humanize text: ${errorMessage}` });
  }
});

// Advanced Humanization Function with Undetectable Prompt
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
  
  // Pre-process the input text to remove all em dashes
  // This ensures the model never sees them in the input, making it impossible to output them
  const cleanedText = text.replace(/—/g, ' ');
  
  // Debug logging to see if em dashes are being removed
  console.log('Original text contains em dashes:', text.includes('—'));
  console.log('Cleaned text contains em dashes:', cleanedText.includes('—'));
  console.log('Em dash count in original:', (text.match(/—/g) || []).length);
  console.log('Em dash count in cleaned:', (cleanedText.match(/—/g) || []).length);
  
  // Get length instructions based on textLength
  const lengthInstruction = getLengthInstructions(textLength || 'maintain');
  
  // Build the advanced prompt
  const prompt = `
Rewrite the TEXT with the same meaning but a different surface form. Follow this style rubric:
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
* Allow up to 2 mild shifts in tone/tempo (e.g., a quick aside or rhetorical question).
* Keep grammar readable; small, human imperfections are acceptable.
D. Anti-Repetition
* Do not repeat distinctive phrases, sentence starters, or rhetorical patterns.
* Avoid near-duplicates and synonym ping-pong (e.g., cycling "rapid/fast/quick").
E. Fidelity
* Keep all facts, relationships, and logical order intact. Do not add claims.
* Preserve core meaning of the text,named entities, quantities, and cause-effect links.
Output Rules (IMPORTANT)
* Return only the rewritten text, no commentary.
* ${lengthInstruction}
* DO NOT INCLUDE EM DASHES "—" ANYWHERE IN YOUR OUTPUT AT ALL!
* REMOVE ALL EM DASHES "—" FROM THE INPUT TEXT AND REPLACE WITH APPROPRIATE PUNCTUATION (commas, periods, or semicolons)
TEXT: ${cleanedText}

Optional Add-Ons (If nothing is listed, skip over it)
* Keywords to preserve verbatim: ${keywordsToPreserve || ''}
* Reading level target: ${readingLevel || ''}
* Tone guardrails: ${toneGuardrails || ''}
* Prohibited items: clichés, emojis, corporate buzzwords, em dashes (—)${prohibitedItems ? `, ${prohibitedItems}` : ''}.
* Persona lens: ${personaLens || ''}
* Writing Style: ${writingStyle || ''}
* Custom Request: ${customRequest || ''}
Common pitfalls to avoid
* MAKE SURE TO FOLLOW THE OUTPUT RULES STRICTLY! DO NOT BREAK THEM! THIS IS VERY VITAL!
* Overdoing "quirkiness" so meaning drifts.
* Repeating the same opening rhythm ("X is…," "Y is…").
* Adding new facts to sound "human".
* Making every sentence long—burstiness needs contrast, not uniform length.

COMPREHENSIVE WRITING GUIDELINES:
DO:
Have tiny unnoticeable imperfections

DON'T:   
AI text similarities:
Formulaic Structure
The text follows a rigid, structured format with clear transitions, headings, and connectors, making it feel predictable and formulaic.
Robotic or Impersonal Tone
The writing style is formal and polished, often impersonal and detached, focusing on clarity but lacking warmth or personality.
Artificial Simplicity
The sentence structure is overly simple and conversational, sometimes starting with conjunctions, but lacking nuance.
Overly Simple or Unimaginative Writing
The text is linear, straightforward, and grammatically correct but lacks creativity, depth, and variation in style.
Speculative or Uncertain Language
The text leans on speculative or hypothetical elements, often showing uncertainty and avoiding firm conclusions.
Technical Jargon
Complex sentences with multiple clauses rely heavily on advanced vocabulary and jargon, which can obscure readability.
Dry or Functional Vocabulary
Word choice is functional and event-focused, prioritizing clarity but limiting imagery or personal expression.
Precision Over Naturalness
Word choice prioritizes clarity and sophistication, sometimes at the cost of natural flow.
Predictable Syntax & Rhythm
The text favors repetitive structures and declarative sentences, leading to a steady and predictable rhythm.
Mechanical Style
The writing lacks literary devices or imaginative turns, focusing instead on precision and structure.
Rich Yet Shallow
The vocabulary is varied and sophisticated but lacks emotional depth and spontaneity.

DON'T USE THESE WORDS/PHRASES:
"pushing boundaries"
"swirling"
"challenges our understanding"
"Insights"
"Plays a crucial role"
"highlights the importance"
"Crucial"

Output with everything to make sure it's done to my information and instructions. If not, redo the output until it is.
`;

  try {
    // Initialize OpenAI with the secret
    const openai = new OpenAI({
      apiKey: openaiApiKey.value(),
    });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: (
            "You are a precise line editor. Rewrite the user's text with the same meaning. Increase lexical surprise " +
            "and vary sentence lengths; include one short fragment. Avoid repeating " +
            "distinctive phrases or sentence starters. Keep facts, entities, and logic. " +
            "Slightly relaxed tone is OK, but stay readable. NEVER use em dashes (—) in your output. " +
            "Replace any em dashes in the input with appropriate punctuation. Output only the rewrite."
          )
        },
        { role: "user", content: prompt }
      ],
      temperature: temperature || 0.95,
      top_p: top_p || 1.0,
      frequency_penalty: frequency_penalty || 0.6,
      presence_penalty: presence_penalty || 0.1,
      max_tokens: 1000
    });

    const result = completion.choices[0]?.message?.content?.trim() || text;
    
    // Post-process the result to remove any em dashes that the AI might have added
    const finalResult = result.replace(/—/g, ' ');
    
    // Debug logging for the final result
    console.log('AI output contains em dashes:', result.includes('—'));
    console.log('Final result contains em dashes:', finalResult.includes('—'));
    
    return finalResult;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to generate humanized text');
  }
}



// Helper function to get length instructions
function getLengthInstructions(length: string): string {
  switch (length) {
    case 'shorter':
      return 'Length: less than 15% of the original.';
    case 'longer':
      return 'Length: More than 15% of the original.';
    case 'maintain':
    default:
      return 'Length: within ±10% of the original.';
  }
}

