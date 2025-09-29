import {onRequest} from "firebase-functions/v2/https";
import {getFirestore} from "firebase-admin/firestore";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';

// CORS configuration
const corsOptions = {
  cors: true
};

// User-Agent pool for rotation
const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
];

// Double Humanization Function
export const doubleHumanizeText = onRequest({...corsOptions}, async (req, res) => {
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

    // Track usage if user is authenticated
    if (userEmail && userSubscription) {
      await trackUsage(userEmail, wordCount, subscriptionType);
    }

    // Run double humanization
    const result = await runDoubleHumanization(text);
    
    if (!result) {
      res.status(500).json({ error: 'Double humanization failed. Please try again.' });
      return;
    }

    // Create response
    const responseData = {
      success: true,
      original_text: text,
      humanized_text: result.second_result,
      method: 'double_humanization',
      first_result: result.first_result,
      iterations: 2
    };
    
    res.status(200).json({ result: responseData });
    
  } catch (error) {
    console.error('Double Humanization Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ error: `Failed to double humanize text: ${errorMessage}` });
  }
});

// Core double humanization logic
async function runDoubleHumanization(text: string): Promise<any> {
  const baseUrl = "https://www.gptinf.com";
  
  // Create session with rotated headers
  const session = axios.create({
    baseURL: baseUrl,
    timeout: 60000,
    headers: {
      'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
      'Accept': '*/*',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'en-US,en;q=0.9',
      'Content-Type': 'application/json',
      'Origin': 'https://www.gptinf.com',
      'Referer': 'https://www.gptinf.com/',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'DNT': '1',
      'Cache-Control': 'max-age=0'
    }
  });

  // Set cookies with 500 free words
  session.defaults.headers.common['Cookie'] = generateCookies();

  try {
    // First humanization
    console.log('🔄 Starting first humanization...');
    const firstResult = await humanizeText(session, text, 'First Humanization');
    
    if (!firstResult) {
      throw new Error('First humanization failed');
    }

    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    // Second humanization using first result
    console.log('🔄 Starting second humanization...');
    const secondResult = await humanizeText(session, firstResult, 'Second Humanization');
    
    if (!secondResult) {
      throw new Error('Second humanization failed');
    }

    return {
      original: text,
      first_result: firstResult,
      second_result: secondResult
    };

  } catch (error) {
    console.error('Double humanization error:', error);
    throw error;
  }
}

// Individual humanization step
async function humanizeText(session: any, text: string, attemptName: string): Promise<string | null> {
  try {
    const sessionId = `session_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
    
    // Step 1: Start processing
    const startPayload = {
      cacheMode: "start",
      text: text,
      model: "free2",
      keywords: [],
      sessionId: sessionId,
      alg: 0,
      trialNumber: 0
    };

    const startResponse = await session.post('/api/process_free', startPayload);
    
    if (startResponse.status !== 200) {
      throw new Error(`Start failed: ${startResponse.status}`);
    }

    const startData = startResponse.data;
    const completionId = startData.completionId;
    
    if (!completionId) {
      throw new Error('No completion ID received');
    }

    // Step 2: Wait for processing
    const waitTime = 15000 + Math.random() * 5000; // 15-20 seconds
    await new Promise(resolve => setTimeout(resolve, waitTime));

    // Step 3: Get results
    const getPayload = {
      cacheMode: "get",
      completionId: completionId,
      sessionId: sessionId,
      text: "",
      token: ""
    };

    const getResponse = await session.post('/api/process_free', getPayload);
    
    if (getResponse.status !== 200) {
      throw new Error(`Get failed: ${getResponse.status}`);
    }

    const resultData = getResponse.data;
    
    if (resultData.result && resultData.result.length > 0) {
      return resultData.result[0].text;
    } else {
      throw new Error('No result in response');
    }

  } catch (error) {
    console.error(`${attemptName} error:`, error);
    return null;
  }
}

// Generate cookies with 500 free words
function generateCookies(): string {
  const cookies = {
    '_fbp': 'fb.1.1759163539751.36833947124802341',
    '_tt_enable_cookie': '1',
    '_ttp': '01K6B52RAK7CJSJJQ6CF41HVHM_.tt.1',
    '_ga': 'GA1.1.101199240.1759163540',
    '_clck': 'e7p5fq%5E2%5Efzq%5E0%5E2098',
    'email': 'deenkulyawn%40gmail.com',
    '_gcl_au': '1.1.1268097366.1759163540.1448043288.1759179401.1759179401',
    'token': '',
    'cf_clearance': 'hcWbIly9T74uSgLCSX3irX2oI0vM96pogBw4aasX77Y-1759179404-1.2.1.1-r2GQ0bcpXGezHDYyNS5eXM3833riEw8_tD0HlzsiM2_2Sr2CntXqM0Hp0jOofhcfICNjst6N8eUnlfwUIAhNnTJBsC8ouFsJG6y1wa0YGPccZMQvLOTIF4UF37nB8xbS.qbdVtw2VHYsWX6rDXTfMwOEcsRjFIH8j8K6oj0HSEJUXgMNMNomRJUevmYFxcQv3_vXKzq1HAlUMxt9zjjNzak2lCxe9JzEFjqe7uHOuiI',
    '_ga_4XM6SHW0Z7': 'GS2.1.s1759179396$o2$g1$t1759179410$j46$l0$h0',
    '_clsk': '8yyx5s%5E1759179410217%5E2%5E1%5Ej.clarity.ms%2Fcollect',
    'ttcsid': '1759179395056::RBty5wC_kedRXE4vne_I.2.1759179457177.0',
    'ttcsid_CP32RVRC77U6BDAC73HG': '1759179395056::ttqY1hmKj2BK2g_CToeb.2.1759179457177.0',
    'freeWords': '500', // Set to 500 for good buffer
    'ph_phc_H4GAj9wCvMK8ZPAgyTyHitrkf0tOaznyhnVVq9POlQG_posthog': '%7B%22distinct_id%22%3A%2201999743-7223-7ec2-a575-0b3bc940779c%22%2C%22%24sesid%22%3A%5B1759179457179%2C%2201999743-7224-7ccf-b36b-5664e46a0f%22%2C1759179403811%5D%2C%22%24initial_person_info%22%3A%7B%22r%22%3A%22https%3A%2F%2Faccounts.google.com%2F%22%2C%22u%22%3A%22https%3A%2F%2Fwww.gptinf.com%2Faccount%22%7D%7D'
  };

  return Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
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
