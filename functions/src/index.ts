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
  apiKey: process.env.OPENAI_API_KEY
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

// ZeroGPT AI Detection Function
export const checkTextForAI = onCall(async (request) => {
  // Check if user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

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
      validateStatus: () => true
    });
    
    if (response.status === 200) {
      const result = response.data;
      const data = result.data || {};
      
      // Save detection result to user's history
      try {
        await db.collection('aiDetections').add({
          userId: request.auth.uid,
          text: text,
          result: data,
          timestamp: new Date(),
          wordCount: text.split(' ').length,
        });
      } catch (error) {
        console.log('Error saving AI detection to history:', error);
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
    console.log('ZeroGPT API Error:', error);
    
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

  if (text.trim().split(' ').length < 10) {
    throw new HttpsError("invalid-argument", "Text must be at least 10 words");
  }

  try {
    // Stage 1: Generate humanized version using OpenAI
    const humanizedText = await generateHumanizedText(text, writingStyle, textLength, customInstructions);
    
    // Stage 2: Test with your AI detector
    const detectionResult = await testWithYourDetector(humanizedText);
    
    // Stage 3: If score is too high, refine
    let finalText = humanizedText;
    let finalScore = detectionResult.ai_percentage;
    let iterations = 1;
    
    if (detectionResult.ai_percentage > 20) { // Threshold for refinement
      const refined = await refineText(humanizedText, writingStyle, textLength, customInstructions);
      const refinedDetection = await testWithYourDetector(refined);
      
      if (refinedDetection.ai_percentage < detectionResult.ai_percentage) {
        finalText = refined;
        finalScore = refinedDetection.ai_percentage;
        iterations = 2;
      }
    }
    
    // Save to user's history
    try {
      await db.collection('history').add({
        userId: request.auth.uid,
        originalText: text,
        humanizedText: finalText,
        timestamp: new Date(),
        wordCount: text.split(' ').length,
        writingStyle: writingStyle || 'professional',
        textLength: textLength || 'maintain',
        customInstructions: customInstructions || null,
        aiDetectionScore: finalScore,
        iterations: iterations
      });
    } catch (error) {
      console.log('Error saving to history:', error);
    }
    
    return {
      success: true,
      original_text: text,
      humanized_text: finalText,
      ai_detection_score: finalScore,
      improvement: Math.max(0, 100 - finalScore),
      writing_style: writingStyle || 'professional',
      text_length: textLength || 'maintain',
      iterations_needed: iterations,
      word_count_original: text.split(' ').length,
      word_count_humanized: finalText.split(' ').length
    };
    
  } catch (error) {
    console.log('Humanization Pipeline Error:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new HttpsError("internal", `Failed to humanize text: ${errorMessage}`);
  }
});

// Helper function to generate humanized text
async function generateHumanizedText(originalText: string, writingStyle: string, textLength: string, customInstructions: string): Promise<string> {
  const basePrompt = `You are an expert at humanizing AI-generated text to make it sound natural and human-written. Your goal is to rewrite the following text to be undetectable by AI detection tools while maintaining the original meaning and message.

IMPORTANT INSTRUCTIONS:
- Make the text sound completely natural and human-written
- Vary sentence structure and length
- Add natural human expressions and transitions
- Remove repetitive patterns
- Use more conversational and varied vocabulary
- Maintain the original meaning and key information
- Make it flow naturally like a human would write it`;

  let styleInstructions = '';
  let lengthInstructions = '';
  let customInstructionsText = '';

  // Add writing style instructions
  switch (writingStyle) {
    case 'professional':
      styleInstructions = 'Write in a professional, business-appropriate tone while keeping it natural and human-like.';
      break;
    case 'casual':
      styleInstructions = 'Write in a casual, conversational tone as if speaking to a friend.';
      break;
    case 'academic':
      styleInstructions = 'Write in an academic, scholarly tone while maintaining natural human expression.';
      break;
    case 'creative':
      styleInstructions = 'Write in a creative, engaging style with vivid language and natural flow.';
      break;
    default:
      styleInstructions = 'Write in a natural, human-like style.';
  }

  // Add text length instructions
  switch (textLength) {
    case 'expand':
      lengthInstructions = 'Expand the text to be approximately 20% longer while adding natural human details and explanations.';
      break;
    case 'compress':
      lengthInstructions = 'Compress the text to be approximately 20% shorter while maintaining all key information and natural flow.';
      break;
    case 'maintain':
    default:
      lengthInstructions = 'Maintain approximately the same length as the original text.';
  }

  // Add custom instructions if provided
  if (customInstructions && customInstructions.trim()) {
    customInstructionsText = `\n\nADDITIONAL CUSTOM INSTRUCTIONS: ${customInstructions}`;
  }

  const fullPrompt = `${basePrompt}

${styleInstructions}

${lengthInstructions}${customInstructionsText}

TEXT TO HUMANIZE:
${originalText}

HUMANIZED VERSION:`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert at humanizing AI-generated text. Always respond with only the humanized version, no explanations or additional text."
        },
        {
          role: "user",
          content: fullPrompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.8,
    });

    return completion.choices[0]?.message?.content?.trim() || originalText;
  } catch (error) {
    console.log('OpenAI API Error:', error);
    throw new Error('Failed to generate humanized text');
  }
}

// Helper function to refine text if needed
async function refineText(originalText: string, writingStyle: string, textLength: string, customInstructions: string): Promise<string> {
  const refinementPrompt = `The following text still sounds too AI-generated. Please refine it further to make it sound completely natural and human-written. Focus on:

- Making it more conversational and natural
- Adding human-like imperfections and variations
- Using more diverse sentence structures
- Adding natural transitions and flow
- Making it sound like a real person wrote it

${originalText}

REFINED HUMAN VERSION:`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert at making text sound completely human-written. Always respond with only the refined version, no explanations."
        },
        {
          role: "user",
          content: refinementPrompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.9,
    });

    return completion.choices[0]?.message?.content?.trim() || originalText;
  } catch (error) {
    console.log('OpenAI Refinement Error:', error);
    return originalText; // Return original if refinement fails
  }
}

// Helper function to test with your AI detector
async function testWithYourDetector(text: string): Promise<any> {
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
      highlighted_sentences: data.h || []
    };
  } else {
    throw new Error(`ZeroGPT API returned status ${response.status}`);
  }
}
