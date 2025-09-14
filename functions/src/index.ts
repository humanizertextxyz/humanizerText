import {onCall, HttpsError} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import axios from "axios";
import OpenAI from "openai";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// OpenAI client initialization
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
        console.error('Error saving AI detection to history:', error);
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
    // Stage 1 & 2: Generate humanized text with improved prompt
    const humanizedText = await generateHumanizedText(text, writingStyle, textLength, customInstructions);
    
    // Stage 3: Test with AI detector
    const initialDetection = await testWithYourDetector(humanizedText);
    
    let finalHumanizedText = humanizedText;
    let finalDetection = initialDetection;
    let iterations = 1;

    // Stage 4: Iterative refinement if needed (if AI score > 20%)
    if (initialDetection.ai_percentage > 20) {
      const refinementResult = await iterativeRefinement(humanizedText, initialDetection, writingStyle, textLength, customInstructions);
      finalHumanizedText = refinementResult.text;
      finalDetection = refinementResult.detection;
      iterations = refinementResult.iterations;
    }

    // Calculate improvement
    const originalDetection = await testWithYourDetector(text);
    const improvement = Math.max(0, originalDetection.ai_percentage - finalDetection.ai_percentage);

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
        customInstructions: customInstructions || '',
        aiScore: finalDetection.ai_percentage,
        improvement: improvement,
        iterations: iterations,
      });
    } catch (error) {
      console.error('Error saving to history:', error);
    }

    return {
      success: true,
      original_text: text,
      humanized_text: finalHumanizedText,
      ai_detection_score: finalDetection.ai_percentage,
      improvement: improvement,
      writing_style: writingStyle,
      text_length: textLength,
      iterations_needed: iterations,
      word_count_original: text.split(' ').length,
      word_count_humanized: finalHumanizedText.split(' ').length,
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

// Helper function to generate humanized text with improved prompt
async function generateHumanizedText(originalText: string, writingStyle: string, textLength: string, customInstructions: string): Promise<string> {
  const basePrompt = `Hey there! I need you to rework my text so it slips past AI detectors and sounds like it came straight from a real person, super natural and all. Can you make it feel like a human wrote it, with that authentic, casual vibe? Here's how to nail it:

1. Mix up sentence lengths—some short and snappy, others longer and more detailed for a natural flow.
2. Use everyday language, like how people actually talk, with a conversational tone.
3. Toss in a few quirks or tiny imperfections, like a human might when they're writing casually.
4. Swap out any stiff, formal, or AI-ish words for stuff you'd hear in a real conversation.
5. Add a bit of personal flair or small connectors to make it feel warm and genuine.
6. Keep the vocabulary varied, avoiding repetitive words to make it sound fresh and human.
7. Make it read like a chat with a friend—relaxed, authentic, and totally natural.
8. Weave in human-like thinking patterns, like little asides, casual phrases, or a touch of humor.
9. Don't change the core meaning of the text important

please output only the updated/revised text. thanks

text:`;

  let styleInstructions = '';
  let lengthInstructions = '';
  let customInstructionsText = '';

  // Add writing style instructions
  switch (writingStyle) {
    case 'professional':
      styleInstructions = 'Keep it professional but still natural and conversational - like a smart colleague explaining something.';
      break;
    case 'casual':
      styleInstructions = 'Make it super casual and friendly - like you\'re chatting with a buddy.';
      break;
    case 'academic':
      styleInstructions = 'Keep it scholarly but still human and engaging - like a smart professor who talks naturally.';
      break;
    case 'creative':
      styleInstructions = 'Make it creative and engaging with vivid language - like a storyteller sharing something cool.';
      break;
    default:
      styleInstructions = 'Keep it natural and human-like.';
  }

  // Add text length instructions
  switch (textLength) {
    case 'expand':
      lengthInstructions = 'Make it about 20% longer by adding natural human details, examples, or explanations.';
      break;
    case 'compress':
      lengthInstructions = 'Make it about 20% shorter while keeping all the important stuff and natural flow.';
      break;
    case 'maintain':
    default:
      lengthInstructions = 'Keep it about the same length as the original.';
  }

  // Add custom instructions if provided
  if (customInstructions && customInstructions.trim()) {
    customInstructionsText = `\n\nAlso, here's what I specifically want: ${customInstructions}`;
  }

  const fullPrompt = `${basePrompt}

${styleInstructions}

${lengthInstructions}${customInstructionsText}

${originalText}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert at making text sound completely human-written. Always respond with only the humanized version, no explanations or additional text."
        },
        {
          role: "user",
          content: fullPrompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.9, // Higher temperature for more creativity and variation
    });

    return completion.choices[0]?.message?.content?.trim() || originalText;
  } catch (error) {
    console.log('OpenAI API Error:', error);
    throw new Error('Failed to generate humanized text');
  }
}

// Helper function to refine text if needed
async function refineText(originalText: string, writingStyle: string, textLength: string, customInstructions: string): Promise<string> {
  const refinementPrompt = `This text still sounds too AI-generated. Make it even more human and natural:

- Add more conversational flow and natural speech patterns
- Include subtle human imperfections and variations
- Use more diverse sentence structures and lengths
- Add natural transitions and casual connectors
- Make it sound like a real person actually wrote this
- Add tiny personal touches or casual expressions
- Vary the vocabulary more to avoid repetition

${originalText}`;

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
      temperature: 0.95, // Even higher temperature for refinement
    });

    return completion.choices[0]?.message?.content?.trim() || originalText;
  } catch (error) {
    console.log('OpenAI Refinement Error:', error);
    return originalText;
  }
}

// Helper function for iterative refinement
async function iterativeRefinement(originalText: string, detection: any, writingStyle: string, textLength: string, customInstructions: string): Promise<{text: string, detection: any, iterations: number}> {
  let currentText = originalText;
  let currentDetection = detection;
  let iterations = 1;
  const maxIterations = 3;

  while (currentDetection.ai_percentage > 15 && iterations < maxIterations) {
    try {
      // Refine the text
      const refinedText = await refineText(currentText, writingStyle, textLength, customInstructions);
      
      // Test the refined text
      const newDetection = await testWithYourDetector(refinedText);
      
      // If it's better, use it
      if (newDetection.ai_percentage < currentDetection.ai_percentage) {
        currentText = refinedText;
        currentDetection = newDetection;
      }
      
      iterations++;
    } catch (error) {
      console.error('Refinement iteration error:', error);
      break;
    }
  }

  return {
    text: currentText,
    detection: currentDetection,
    iterations: iterations
  };
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
