import {onCall, HttpsError} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import axios from "axios";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

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
