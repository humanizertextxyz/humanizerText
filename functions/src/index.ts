import {onCall, HttpsError} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import axios from "axios";
import OpenAI from "openai";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

// ZeroGPT AI Detection Function - NO AUTHENTICATION REQUIRED
export const checkTextForAI = onCall(async (request) => {
  // NO AUTHENTICATION CHECK - WORKS FOR EVERYONE
  const { text } = request.data;
  
  if (!text || typeof text !== 'string') {
    throw new HttpsError("invalid-argument", "Text is required and must be a string");
  }

  if (text.trim().split(' ').length < 30) {
    throw new HttpsError("invalid-argument", "Text must be at least 30 words");
  }

  try {
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
      validateStatus: () => true // Don't throw on HTTP error status codes
    });
    
    if (response.status === 200) {
      const result = response.data;
      const data = result.data || {};
      
      // Save detection result to user's history ONLY IF AUTHENTICATED
      if (request.auth && request.auth.uid) {
        try {
          await db.collection('aiDetections').add({
            userId: request.auth.uid,
            text: text,
            result: data,
            timestamp: new Date(),
            wordCount: text.split(' ').length,
          });
        } catch (error) {
          console.error('Error saving AI detection to history:', error);
          // Don't throw error here, just log it
        }
      }
      
      return {
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
    } else {
      throw new HttpsError("internal", `ZeroGPT API returned status ${response.status}: ${response.data}`);
    }
    
  } catch (error) {
    console.error('ZeroGPT API Error:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new HttpsError("internal", `Failed to check text for AI: ${errorMessage}`);
  }
});

// Optimal Humanization Pipeline Function
export const optimalHumanizePipeline = onCall(async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { text, writingStyle, textLength, customInstructions } = request.data;
  
  if (!text || typeof text !== 'string') {
    throw new HttpsError("invalid-argument", "Text is required and must be a string");
  }

  if (text.trim().split(' ').length < 30) {
    throw new HttpsError("invalid-argument", "Text must be at least 30 words");
  }

  try {
    // Generate humanized text using OpenAI
    const humanizedText = await generateHumanizedText(text, writingStyle, textLength, customInstructions);
    
    // Check the humanized text with our AI detector
    const detectionResult = await checkTextForAIInternal(humanizedText);
    
    // If AI score is too high, try to refine it
    let finalText = humanizedText;
    let finalScore = detectionResult.ai_percentage;
    
    if (detectionResult.ai_percentage > 15) {
      const refinedResult = await refineText(finalText, detectionResult.ai_percentage, writingStyle, textLength, customInstructions);
      finalText = refinedResult.text;
      finalScore = refinedResult.score;
    }
    
    // Save to user's history
    try {
      await db.collection('history').add({
        userId: request.auth.uid,
        originalText: text,
        humanizedText: finalText,
        timestamp: new Date(),
        wordCount: text.split(' ').length,
        writingStyle: writingStyle || 'balanced',
        textLength: textLength || 'medium',
        customInstructions: customInstructions || '',
        aiScore: finalScore,
      });
    } catch (error) {
      console.error('Error saving humanization to history:', error);
      // Don't throw error here, just log it
    }
    
    return {
      success: true,
      originalText: text,
      humanizedText: finalText,
      aiScore: finalScore,
      improvement: Math.max(0, 100 - finalScore),
      method: 'optimal_pipeline',
      iterations: detectionResult.ai_percentage > 15 ? 2 : 1
    };
    
  } catch (error) {
    console.error('Humanization Pipeline Error:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new HttpsError("internal", `Failed to humanize text: ${errorMessage}`);
  }
});

// Helper function to generate humanized text
async function generateHumanizedText(text: string, writingStyle: string, textLength: string, customInstructions?: string): Promise<string> {
  const styleInstructions = getStyleInstructions(writingStyle);
  const lengthInstructions = getLengthInstructions(textLength);
  
  const prompt = `I need you to rework my text so it past AI detectors and sounds like it came straight from a real person, super natural and all. Can you make it feel like a human wrote it? Here's how to nail it:

1. Mix up sentence lengths—some short and snappy, others longer and more detailed for a natural flow.
2. Use everyday language, natural language.
3. Toss in a few tiny imperfections, like a human might when they're writing casually.
4. Swap out any AI-ish words for stuff you'd hear in a real writing.
5. Keep the vocabulary varied, avoiding repetitive words to make it sound fresh and human.
6. Weave in human-like thinking patterns
7. Don't change the core meaning of the text

${styleInstructions}
${lengthInstructions}
${customInstructions ? `Additional instructions: ${customInstructions}` : ''}

[important] please output only the updated/revised text. thanks

text: ${text}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: Math.min(4000, text.length * 2),
    });

    return completion.choices[0]?.message?.content?.trim() || text;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to generate humanized text');
  }
}

// Helper function to refine text if AI score is too high
async function refineText(text: string, currentScore: number, writingStyle: string, textLength: string, customInstructions?: string): Promise<{text: string, score: number}> {
  const styleInstructions = getStyleInstructions(writingStyle);
  const lengthInstructions = getLengthInstructions(textLength);
  
  const prompt = `I need you to rework my text so it past AI detectors and sounds like it came straight from a real person, super natural and all. Can you make it feel like a human wrote it? Here's how to nail it:

1. Mix up sentence lengths—some short and snappy, others longer and more detailed for a natural flow.
2. Use everyday language, natural language.
3. Toss in a few tiny imperfections, like a human might when they're writing casually.
4. Swap out any AI-ish words for stuff you'd hear in a real writing.
5. Keep the vocabulary varied, avoiding repetitive words to make it sound fresh and human.
6. Weave in human-like thinking patterns
7. Don't change the core meaning of the text

The current AI detection score is ${currentScore}%. Make it even more human-like to get the score below 10%.

${styleInstructions}
${lengthInstructions}
${customInstructions ? `Additional instructions: ${customInstructions}` : ''}

[important] please output only the updated/revised text. thanks

text: ${text}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.9,
      max_tokens: Math.min(4000, text.length * 2),
    });

    const refinedText = completion.choices[0]?.message?.content?.trim() || text;
    
    // Check the refined text
    const detectionResult = await checkTextForAIInternal(refinedText);
    
    return {
      text: refinedText,
      score: detectionResult.ai_percentage
    };
  } catch (error) {
    console.error('OpenAI Refinement Error:', error);
    return {
      text: text,
      score: currentScore
    };
  }
}

// Helper function to check text internally (without authentication)
async function checkTextForAIInternal(text: string): Promise<any> {
  try {
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
      
      return {
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
    } else {
      throw new Error(`ZeroGPT API returned status ${response.status}`);
    }
  } catch (error) {
    console.error('Internal AI Detection Error:', error);
    return {
      success: false,
      is_ai: false,
      is_human: false,
      ai_percentage: 100,
      feedback: '',
      language: '',
      text_words: 0,
      ai_words: 0,
      highlighted_sentences: [],
      full_response: null
    };
  }
}

// Helper function to get style instructions
function getStyleInstructions(style: string): string {
  switch (style) {
    case 'creative':
      return 'Make the writing more creative and expressive with vivid descriptions and imaginative language.';
    case 'professional':
      return 'Keep the tone professional and formal while maintaining natural flow.';
    case 'casual':
      return 'Make the writing more casual and conversational, like talking to a friend.';
    case 'academic':
      return 'Maintain an academic tone with proper structure and formal language.';
    default:
      return 'Keep a balanced, natural writing style.';
  }
}

// Helper function to get length instructions
function getLengthInstructions(length: string): string {
  switch (length) {
    case 'shorter':
      return 'Make the text more concise while keeping all the important information.';
    case 'longer':
      return 'Expand the text with more details and explanations while keeping it natural.';
    default:
      return 'Keep the text length similar to the original.';
  }
}
