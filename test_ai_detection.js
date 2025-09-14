// Test script for the AI detection function
const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

// Your Firebase config (you'll need to add this)
const firebaseConfig = {
  // Add your Firebase config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

// Test the AI detection function
async function testAIDetection() {
  try {
    const checkTextForAI = httpsCallable(functions, 'checkTextForAI');
    
    const testText = "This is a test message to check if it's AI generated. This text contains more than thirty words to meet the minimum requirement for the AI detection service. We are testing the ZeroGPT integration through Firebase Functions to ensure everything works correctly.";
    
    console.log('Testing AI detection with text:', testText.substring(0, 50) + '...');
    
    const result = await checkTextForAI({ text: testText });
    console.log('✅ Success! AI Detection Result:', result.data);
    
  } catch (error) {
    console.error('❌ Error testing AI detection:', error);
  }
}

// Run the test
testAIDetection();
