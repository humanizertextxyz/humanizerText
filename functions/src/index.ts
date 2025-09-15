import {onCall, HttpsError} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import axios from "axios";
import OpenAI from "openai";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

// ZeroGPT AI Detection Function - Now works for both authenticated and non-authenticated users
export const checkTextForAI = onCall(async (request) => {
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
      
      // Save detection result to user's history only if authenticated
      if (request.auth) {
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

  if (text.trim().split(' ').length < 10) {
    throw new HttpsError("invalid-argument", "Text must be at least 10 words");
  }

  try {
    // Generate humanized text using OpenAI
    const prompt = generateHumanizationPrompt(text, writingStyle, textLength, customInstructions);
    const generatedText = await generateHumanizedText(text, writingStyle, textLength, customInstructions);
    
    // Test the generated text with our AI detector
    let initialDetection = await testWithYourDetector(generatedText);
    
    let finalHumanizedText = generatedText;
    let finalDetection = initialDetection;
    let iterations = 1;

    // Iterative Refinement
    while (finalDetection.ai_percentage > 15 && iterations < 3) {
      const refined = await refineText(finalHumanizedText, writingStyle, textLength, customInstructions);
      const refinedDetection = await testWithYourDetector(refined);
      
      if (refinedDetection.ai_percentage < finalDetection.ai_percentage) {
        finalHumanizedText = refined;
        finalDetection = refinedDetection;
      } else {
        break; // Stop if no improvement
      }
      iterations++;
    }

    // Save to history
    try {
      await db.collection('history').add({
        userId: request.auth.uid,
        originalText: text,
        humanizedText: finalHumanizedText,
        timestamp: new Date(),
        wordCount: text.split(' ').length,
        writingStyle: writingStyle,
        textLength: textLength,
        customInstructions: customInstructions || null,
        aiDetectionScore: finalDetection.ai_percentage,
        iterationsUsed: iterations,
      });
    } catch (error) {
      console.error('Error saving to history:', error);
    }

    return {
      success: true,
      original_text: text,
      humanized_text: finalHumanizedText,
      ai_detection_score: finalDetection.ai_percentage,
      improvement: Math.max(0, 100 - finalDetection.ai_percentage),
      writing_style: writingStyle,
      text_length: textLength,
      iterations_needed: iterations,
      word_count_original: text.split(' ').length,
      word_count_humanized: finalHumanizedText.split(' ').length,
    };
    
  } catch (error) {
    console.error('Humanization Error:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new HttpsError("internal", `Failed to humanize text: ${errorMessage}`);
  }
});

// Helper function to generate humanization prompt
function generateHumanizationPrompt(originalText: string, writingStyle: string, textLength: string, customInstructions: string): string {
  const basePrompt = `I need you to rework my text so it past AI detectors and sounds like it came straight from a real person, super natural and all. Can you make it feel like a human wrote it? Here's how to nail it:
1. Mix up sentence lengths—some short and snappy, others longer and more detailed for a natural flow.
2. Use everyday language, natural language.
3. Toss in a few tiny imperfections, like a human might when they're writing casually.
4. Swap out any AI-ish words for stuff you'd hear in a real writing.
5. Keep the vocabulary varied, avoiding repetitive words to make it sound fresh and human.
6. Weave in human-like thinking patterns
7. Don't change the core meaning of the text [important]
please output only the updated/revised text. thanks text:`;

  let styleInstructions = '';
  switch (writingStyle) {
    case 'professional':
      styleInstructions = 'Make it sound professional and polished while keeping it natural.';
      break;
    case 'casual':
      styleInstructions = 'Make it sound casual and conversational, like talking to a friend.';
      break;
    case 'academic':
      styleInstructions = 'Make it sound academic and scholarly while maintaining natural flow.';
      break;
    case 'creative':
      styleInstructions = 'Make it sound creative and expressive with vivid language.';
      break;
    default:
      styleInstructions = 'Keep the current tone and style.';
  }

  let lengthInstructions = '';
  switch (textLength) {
    case 'expand':
      lengthInstructions = 'Expand the text to be about 20% longer while keeping it natural.';
      break;
    case 'compress':
      lengthInstructions = 'Compress the text to be about 20% shorter while keeping all key information.';
      break;
    case 'maintain':
    default:
      lengthInstructions = 'Keep the text length similar to the original.';
  }

  const customPart = customInstructions ? `\n\nAdditional instructions: ${customInstructions}` : '';

  return `${basePrompt}\n\nStyle: ${styleInstructions}\nLength: ${lengthInstructions}${customPart}\n\nOriginal text: ${originalText}`;
}

// Helper function to generate humanized text using OpenAI
async function generateHumanizedText(originalText: string, writingStyle: string, textLength: string, customInstructions: string): Promise<string> {
  const prompt = generateHumanizationPrompt(originalText, writingStyle, textLength, customInstructions);
  
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
      max_tokens: 2000,
    });

    return completion.choices[0]?.message?.content || originalText;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to generate humanized text');
  }
}

// Helper function to refine text
async function refineText(originalText: string, writingStyle: string, textLength: string, customInstructions: string): Promise<string> {
  const refinementPrompt = `The following text still sounds too AI-generated. Please refine it further to make it sound completely natural and human-written. Focus on:
- Making it more conversational and natural
- Adding human-like imperfections and variations
- Using more diverse sentence structures
- Adding natural transitions and flow
- Making it sound like a real person wrote it
- Don't change the core meaning of the text [important]

Original text: ${originalText}`;
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: refinementPrompt
        }
      ],
      temperature: 0.95,
      max_tokens: 2000,
    });

    return completion.choices[0]?.message?.content || originalText;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to refine text');
  }
}

// Helper function to test with your AI detector
async function testWithYourDetector(text: string): Promise<{ai_percentage: number}> {
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
      return { ai_percentage: data.fakePercentage || 0 };
    } else {
      return { ai_percentage: 50 }; // Default fallback
    }
  } catch (error) {
    console.error('AI Detection Error:', error);
    return { ai_percentage: 50 }; // Default fallback
  }
}
