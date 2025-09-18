import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { sanitizeEmailForDocId } from '../utils/emailUtils';

export interface UserData {
  email: string;
  displayName: string;
  createdAt: any;
  subscription: {
    type: 'free' | 'pro' | 'premium' | 'platinum';
    status: 'free' | 'active' | 'cancelled' | 'expired';
    stripeCustomerId?: string;
    currentPeriodEnd?: any;
  };
  usage: {
    dailyWordsUsed: number;
    monthlyWordsUsed: number;
    lastResetDate: any;
  };
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
  fetchUserData: (user: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  return useContext(AuthContext);
};

// Using centralized sanitizeEmailForDocId from utils

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const signup = async (email: string, password: string, displayName: string) => {
    try {
      console.log('Starting signup process for:', email);
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created successfully in Auth:', user.uid);
      
      // Update the user's display name
      await updateProfile(user, { displayName });
      console.log('User profile updated with display name:', displayName);
      
      // Wait a moment for auth state to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create user document in Firestore with email-based ID
      const userData: UserData = {
        email: user.email!,
        displayName: displayName,
        createdAt: serverTimestamp(),
        subscription: {
          type: 'free',
          status: 'free',
        },
        usage: {
          dailyWordsUsed: 0,
          monthlyWordsUsed: 0,
          lastResetDate: serverTimestamp(),
        },
      };
      
      const sanitizedEmail = sanitizeEmailForDocId(user.email!);
      console.log('Creating Firestore document for user:', sanitizedEmail);
      console.log('User authenticated:', !!user.uid);
      
      try {
        await setDoc(doc(db, 'users', sanitizedEmail), userData);
        console.log('User document created successfully in Firestore');
      } catch (firestoreError) {
        console.error('Firestore error:', firestoreError);
        // Try again with a different approach - force refresh the auth token
        await user.getIdToken(true);
        await setDoc(doc(db, 'users', sanitizedEmail), userData);
        console.log('User document created successfully in Firestore (second attempt)');
      }
      
      // Set local state immediately - the onAuthStateChanged will handle the full user object
      setUserData(userData);
      
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      
      // Check if user document exists using email-based ID
      const sanitizedEmail = sanitizeEmailForDocId(user.email!);
      const userDoc = await getDoc(doc(db, 'users', sanitizedEmail));
      
      if (!userDoc.exists()) {
        // Create user document for new Google users with email-based ID
        const userData: UserData = {
          email: user.email!,
          displayName: user.displayName || user.email!.split('@')[0],
          createdAt: serverTimestamp(),
          subscription: {
            type: 'free',
            status: 'free',
          },
          usage: {
            dailyWordsUsed: 0,
            monthlyWordsUsed: 0,
            lastResetDate: serverTimestamp(),
          },
        };
        
        await setDoc(doc(db, 'users', sanitizedEmail), userData);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const updateUserData = async (data: Partial<UserData>) => {
    if (!currentUser) return;
    
    try {
      const sanitizedEmail = sanitizeEmailForDocId(currentUser.email!);
      const userRef = doc(db, 'users', sanitizedEmail);
      await setDoc(userRef, data, { merge: true });
      
      // Update local state
      setUserData(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      console.error('Update user data error:', error);
      throw error;
    }
  };

  const fetchUserData = async (user: User) => {
    try {
      const sanitizedEmail = sanitizeEmailForDocId(user.email!);
      const userDoc = await getDoc(doc(db, 'users', sanitizedEmail));
      
      if (userDoc.exists()) {
        setUserData(userDoc.data() as UserData);
      } else {
        console.log('No user document found, creating one...');
        
        // Create user document if it doesn't exist (for existing users)
        const userData: UserData = {
          email: user.email!,
          displayName: user.displayName || user.email!.split('@')[0],
          createdAt: serverTimestamp(),
          subscription: {
            type: 'free',
            status: 'free',
          },
          usage: {
            dailyWordsUsed: 0,
            monthlyWordsUsed: 0,
            lastResetDate: serverTimestamp(),
          },
        };
        
        console.log('Creating new user document for existing user');
        await setDoc(doc(db, 'users', sanitizedEmail), userData);
        setUserData(userData);
        console.log('New user document created successfully');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await fetchUserData(user);
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    signup,
    login,
    logout,
    signInWithGoogle,
    resetPassword,
    updateUserData,
    fetchUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
