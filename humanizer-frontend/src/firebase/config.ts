import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCypCbTk-aqBATtj9UiWE6EcyuTOvRxR7k",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "humanizertext-551ee.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "humanizertext-551ee",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "humanizertext-551ee.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "1067510987518",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:1067510987518:web:536d30569ca8c02cb583af",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-G045SQRZPT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
