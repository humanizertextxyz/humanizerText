import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Alert,
  Collapse,
  IconButton,
  Snackbar,
  useMediaQuery,
  useTheme,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  ContentCopy,
  AutoFixHigh,
  ExpandMore,
  ExpandLess,
  Psychology,
  Assessment,
  Visibility,
  Warning,
  Cancel,
  Settings,
  Save,
  Refresh,
  Info,
  Login,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  canUserProcessText, 
  getWordsRemaining, 
  getSubscriptionTier, 
  getMaxWordsPerProcess,
  getUsagePercentage,
  shouldResetDailyUsage,
  shouldResetMonthlyUsage 
} from '../utils/subscription';
import { sanitizeEmailForDocId } from '../utils/emailUtils';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { initializeApp } from 'firebase/app';
import UpgradeModal from '../components/UpgradeModal';

// AI Detection Result Interface
interface AIDetectionResult {
  success: boolean;
  is_ai: boolean;
  is_human: boolean;
  ai_percentage: number;
  feedback: string;
  language: string;
  text_words: number;
  ai_words: number;
  highlighted_sentences: string[];
  full_response?: any;
  error?: string;
}

// Humanization Result Interface
interface HumanizationResult {
  success: boolean;
  original_text: string;
  humanized_text: string;
  method: string;
  progress?: any[];
  iterations?: number;
  final_ai_percentage?: number;
  note?: string;
}

// Detection Service Interface
interface DetectionService {
  name: string;
  icon: string;
  checked: boolean;
  visible: boolean;
  delay: number;
}

// Using centralized sanitizeEmailForDocId from utils

// Call HTTP functions directly
const callHttpFunction = async (functionName: string, data: any) => {
  let functionUrl;
  
  if (functionName === 'humanizeText') {
    functionUrl = process.env.REACT_APP_HUMANIZE_FUNCTION_URL || 'https://humanizetext-qq6lep6f5a-uc.a.run.app';
  } else if (functionName === 'iterativeHumanizeText') {
    functionUrl = process.env.REACT_APP_ITERATIVE_HUMANIZE_FUNCTION_URL || 'https://us-central1-humanizertext-551ee.cloudfunctions.net/iterativeHumanizeText';
  } else if (functionName === 'mistralHumanizeText') {
    functionUrl = process.env.REACT_APP_MISTRAL_HUMANIZE_FUNCTION_URL || 'https://us-central1-humanizertext-551ee.cloudfunctions.net/mistralHumanizeText';
  } else if (functionName === 'doubleHumanizeText') {
    functionUrl = process.env.REACT_APP_DOUBLE_HUMANIZE_FUNCTION_URL || 'https://deendecal-store-5a4ui84ce-curious-plugs-projects.vercel.app/api/double-humanize';
  } else {
    functionUrl = process.env.REACT_APP_DETECT_AI_FUNCTION_URL || 'https://detectaitext-qq6lep6f5a-uc.a.run.app';
  }
  
  // Debug logging
  console.log('Calling function:', functionName);
  console.log('Function URL:', functionUrl);
  
  // Check if URL is undefined
  if (!functionUrl) {
    throw new Error(`Function URL not found for ${functionName}. Please check environment variables.`);
  }
    
  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data }),
  });
  
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.error || errorMessage;
    } catch (e) {
      // If response isn't JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  
  let result;
  try {
    result = await response.json();
  } catch (e) {
    console.error('JSON parsing error:', e);
    console.error('Response text:', await response.text());
    throw new Error('Invalid JSON response from server');
  }
  
  return { data: result };
};

const Home: React.FC = () => {
  const { currentUser, userData, updateUserData } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [iterativeMode, setIterativeMode] = useState(false);
  const [iterativeProgress, setIterativeProgress] = useState<any[]>([]);
  const [mistralMode, setMistralMode] = useState(false);
  const [doubleMode, setDoubleMode] = useState(false);
  const [writingStyle, setWritingStyle] = useState('professional');
  const [textLength, setTextLength] = useState('maintain');
  const [customInstructions, setCustomInstructions] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiCheckText, setAiCheckText] = useState('');
  const [isAiChecking, setIsAiChecking] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // New AI Detection States
  const [aiDetectionResult, setAiDetectionResult] = useState<AIDetectionResult | null>(null);
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  
  // New Humanization Result State
  const [humanizationResult, setHumanizationResult] = useState<HumanizationResult | null>(null);

  // Usage tracking states
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');
  const [upgradeLimit, setUpgradeLimit] = useState(0);
  const [textLimitWarning, setTextLimitWarning] = useState('');

  // Advanced Settings States
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [customOptionsExpanded, setCustomOptionsExpanded] = useState(false);
  const [keywordsToPreserve, setKeywordsToPreserve] = useState('');
  const [readingLevel, setReadingLevel] = useState('');
  const [toneGuardrails, setToneGuardrails] = useState('');
  const [prohibitedItems, setProhibitedItems] = useState('');
  const [personaLens, setPersonaLens] = useState('');
  const [customRequest, setCustomRequest] = useState('');
  
  // OpenAI Parameter States (Frontend display numbers 1-5)
  const [temperature, setTemperature] = useState(5); // 5 = 0.95
  const [topP, setTopP] = useState(4); // 4 = 1.0
  const [frequencyPenalty, setFrequencyPenalty] = useState(5); // 5 = 0.6
  const [presencePenalty, setPresencePenalty] = useState(1); // 1 = 0.0

  // Helper functions to convert between frontend numbers and backend values
  const convertTemperatureToBackend = (frontendValue: number): number => {
    const values = [0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3];
    return values[frontendValue - 1];
  };

  const convertTopPToBackend = (frontendValue: number): number => {
    const values = [0.85, 0.9, 0.95, 1.0, 0.95, 1.0];
    return values[frontendValue - 1];
  };

  const convertFrequencyPenaltyToBackend = (frontendValue: number): number => {
    const values = [0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8];
    return values[frontendValue - 1];
  };

  const convertPresencePenaltyToBackend = (frontendValue: number): number => {
    const values = [0.0, 0.05, 0.1, 0.15, 0.2];
    return values[frontendValue - 1];
  };

  // Helper functions to convert from backend values to frontend numbers
  const convertTemperatureToFrontend = (backendValue: number): number => {
    const values = [0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3];
    return values.indexOf(backendValue) + 1;
  };

  const convertTopPToFrontend = (backendValue: number): number => {
    const values = [0.85, 0.9, 0.95, 1.0, 0.95, 1.0];
    return values.indexOf(backendValue) + 1;
  };

  const convertFrequencyPenaltyToFrontend = (backendValue: number): number => {
    const values = [0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8];
    return values.indexOf(backendValue) + 1;
  };

  const convertPresencePenaltyToFrontend = (backendValue: number): number => {
    const values = [0.0, 0.05, 0.1, 0.15, 0.2];
    return values.indexOf(backendValue) + 1;
  };

  // AI Detection Services - initially all visible
  const [detectionServices, setDetectionServices] = useState<DetectionService[]>([
    { name: 'Turnitin', icon: '♪', checked: false, visible: true, delay: 0 },
    { name: 'Copyleaks', icon: '©', checked: false, visible: true, delay: 0 },
    { name: 'OriginalityAI', icon: '🧠', checked: false, visible: true, delay: 0 },
    { name: 'GPTZero', icon: '○', checked: false, visible: true, delay: 0 },
    { name: 'Crossplag', icon: 'S', checked: false, visible: true, delay: 0 },
    { name: 'Sapling.ai', icon: 'V', checked: false, visible: true, delay: 0 },
    { name: 'Gowinston.ai', icon: 'W', checked: false, visible: true, delay: 0 },
    { name: 'ZeroGPT', icon: '🔍', checked: false, visible: true, delay: 0 },
  ]);

  // Get user's current usage and limits (default to free for unauthenticated users)
  const userTier = userData?.subscription.type || 'free';
  const dailyWordsUsed = userData?.usage.dailyWordsUsed || 0;
  const monthlyWordsUsed = userData?.usage.monthlyWordsUsed || 0;
  const wordsRemaining = getWordsRemaining(userTier, dailyWordsUsed, monthlyWordsUsed);
  const tier = getSubscriptionTier(userTier);
  const maxWordsPerProcess = getMaxWordsPerProcess(userTier);

  // Check if usage should be reset (only for authenticated users)
  const shouldResetDaily = currentUser ? shouldResetDailyUsage(userData?.usage.lastResetDate) : false;
  const shouldResetMonthly = currentUser ? shouldResetMonthlyUsage(userData?.createdAt, userData?.usage.lastResetDate) : false;
  
  // Calculate effective usage (considering resets) - for unauthenticated users, always start fresh
  const effectiveDailyUsage = currentUser ? (shouldResetDaily ? 0 : dailyWordsUsed) : 0;
  const effectiveMonthlyUsage = currentUser ? (shouldResetMonthly ? 0 : monthlyWordsUsed) : 0;

  // Word counters
  const inputWordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const aiCheckWordCount = aiCheckText.trim() ? aiCheckText.trim().split(/\s+/).length : 0;
  const wordCount = inputWordCount;

  // Check if text exceeds per-process limit and determine if button should be disabled
  const isTextTooLong = maxWordsPerProcess > 0 && inputWordCount > maxWordsPerProcess;
  const canProcess = currentUser 
    ? canUserProcessText(userTier, effectiveDailyUsage, effectiveMonthlyUsage, inputWordCount)
    : { canProcess: !isTextTooLong }; // For unauthenticated users, only check text length
  const isButtonDisabled = !canProcess.canProcess || !inputText.trim() || isProcessing;

  useEffect(() => {
    if (isTextTooLong) {
      setTextLimitWarning(`Your text has ${inputWordCount} words, but your ${tier.name} plan allows only ${maxWordsPerProcess} words per process. ${!currentUser ? 'Sign up for free to get started or upgrade for higher limits.' : 'Please shorten your text or upgrade your plan.'}`);
    } else if (currentUser && !canProcess.canProcess) {
      // Additional warning for other limits (only for authenticated users)
      switch (canProcess.reason) {
        case 'daily_limit_reached':
          setTextLimitWarning('You have reached your daily word limit. Upgrade to continue processing.');
          break;
        case 'monthly_limit_reached':
          setTextLimitWarning('You have reached your monthly word limit. Upgrade to continue processing.');
          break;
        case 'daily_limit_exceeded':
        case 'monthly_limit_exceeded':
          setTextLimitWarning(`This request would exceed your ${userTier === 'free' ? 'daily' : 'monthly'} limit. Please shorten your text or upgrade your plan.`);
          break;
        default:
          setTextLimitWarning('');
      }
    } else {
      setTextLimitWarning('');
    }
  }, [inputWordCount, maxWordsPerProcess, tier.name, isTextTooLong, canProcess, userTier, currentUser]);

  // Load user settings when component mounts or user changes
  useEffect(() => {
    if (currentUser) {
      loadUserSettings();
    }
  }, [currentUser]);

  // Function to set up staggered detection services
  const setupStaggeredDetectionServices = (aiScore: number) => {
    const isHumanLike = aiScore < 30;
    
    // Reset all services to not visible first
    setDetectionServices(prev => prev.map(service => ({ 
      ...service,
      checked: isHumanLike,
      visible: false 
    })));
    
    // Set up staggered timing for each service
        setTimeout(() => {
      // Get the current number of services to animate
      setDetectionServices(prev => {
        prev.forEach((service, index) => {
          const delay = 800 + (index * 300); // Base delay + staggered timing
          setTimeout(() => {
            setDetectionServices(current => current.map((s, i) => 
            i === index ? { ...s, visible: true } : s
          ));
          }, delay);
        });
        return prev; // Return unchanged for this update
      });
    }, 200); // Initial delay to ensure AI result is displayed first
  };

  const saveToHistory = async (originalText: string, humanizedText: string) => {
    if (!currentUser || !currentUser.email) return;

    try {
      const sanitizedEmail = sanitizeEmailForDocId(currentUser.email);
      
      // Save to user's history subcollection
      await addDoc(collection(db, 'users', sanitizedEmail, 'history'), {
        originalText: originalText,
        humanizedText: humanizedText,
        timestamp: serverTimestamp(),
        wordCount: wordCount,
        writingStyle: writingStyle,
        textLength: textLength,
        keywordsToPreserve: keywordsToPreserve || null,
        readingLevel: readingLevel || null,
        toneGuardrails: toneGuardrails || null,
        prohibitedItems: prohibitedItems || null,
        personaLens: personaLens || null,
        customRequest: customRequest || null,
        temperature: convertTemperatureToBackend(temperature),
        top_p: convertTopPToBackend(topP),
        frequency_penalty: convertFrequencyPenaltyToBackend(frequencyPenalty),
        presence_penalty: convertPresencePenaltyToBackend(presencePenalty),
        deleted: false, // Default to not deleted
      });
      
      console.log('History saved successfully');
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  const updateWordUsage = async (wordsUsed: number) => {
    if (!currentUser || !userData) return;

    try {
      // Reset usage if needed and calculate new values
      const resetDaily = shouldResetDailyUsage(userData.usage.lastResetDate);
      const resetMonthly = shouldResetMonthlyUsage(userData.createdAt, userData.usage.lastResetDate);
      
      const baseDailyWords = resetDaily ? 0 : userData.usage.dailyWordsUsed;
      const baseMonthlyWords = resetMonthly ? 0 : userData.usage.monthlyWordsUsed;
      
      const newDailyWords = userTier === 'free' ? baseDailyWords + wordsUsed : baseDailyWords;
      const newMonthlyWords = userTier !== 'free' ? baseMonthlyWords + wordsUsed : baseMonthlyWords;
      
      await updateUserData({
        usage: {
          dailyWordsUsed: newDailyWords,
          monthlyWordsUsed: newMonthlyWords,
          lastResetDate: serverTimestamp(),
        }
      });
      
      console.log(`Updated usage: +${wordsUsed} words (Daily: ${newDailyWords}, Monthly: ${newMonthlyWords})`);
    } catch (error) {
      console.error('Error updating word usage:', error);
    }
  };

  const handleSignInToHumanize = () => {
    navigate('/login');
  };

  const handleAdvancedSettings = () => {
    if (currentUser) {
      setAdvancedSettingsOpen(true);
    } else {
      navigate('/signup');
    }
  };

  const handleHumanize = async () => {
    if (!inputText.trim()) return;
    
    // Pre-processing validation - only enforce for authenticated users
    if (currentUser) {
      const validation = canUserProcessText(userTier, effectiveDailyUsage, effectiveMonthlyUsage, wordCount);
      
      if (!validation.canProcess) {
        setUpgradeReason(validation.reason || '');
        setUpgradeLimit(validation.limit || 0);
        setUpgradeModalOpen(true);
        return;
      }
    } else {
      // For unauthenticated users, still check per-process limits but be more lenient
      if (maxWordsPerProcess > 0 && wordCount > maxWordsPerProcess) {
        setUpgradeReason('per_process_limit');
        setUpgradeLimit(maxWordsPerProcess);
        setUpgradeModalOpen(true);
        return;
      }
    }

    setIsProcessing(true);
    setOutputText('');
    setShowSuccess(false);
    setHumanizationResult(null);
    
    try {
      // Always use double humanization
      const functionName = 'doubleHumanizeText';
      
      const result = await callHttpFunction(functionName, {
        text: inputText,
        writingStyle: writingStyle,
        textLength: textLength,
        keywordsToPreserve: keywordsToPreserve,
        readingLevel: readingLevel,
        toneGuardrails: toneGuardrails,
        prohibitedItems: prohibitedItems,
        personaLens: personaLens,
        customRequest: customRequest,
        temperature: convertTemperatureToBackend(temperature),
        top_p: convertTopPToBackend(topP),
        frequency_penalty: convertFrequencyPenaltyToBackend(frequencyPenalty),
        presence_penalty: convertPresencePenaltyToBackend(presencePenalty),
        userEmail: currentUser?.email,
        userSubscription: userData?.subscription
      });
      
      const data = result.data as HumanizationResult;
      
      // Debug logging
      console.log('Response data:', data);
      
      // Handle iterative progress if available
      if (data && data.progress && Array.isArray(data.progress)) {
        setIterativeProgress(data.progress);
      }
      
      // Check if data exists
      if (!data) {
        throw new Error('No data received from function');
      }
      
      // FRONTEND DASH REMOVAL - Clean the text after receiving from Firebase
      let cleanedText = data.humanized_text;
      
      // Remove all types of dashes
      cleanedText = cleanedText.replace(/—/g, ", ");  // Em dash
      cleanedText = cleanedText.replace(/–/g, ", ");  // En dash
      cleanedText = cleanedText.replace(/―/g, ", ");  // Horizontal bar
      cleanedText = cleanedText.replace(/‐/g, ", ");  // Hyphen
      cleanedText = cleanedText.replace(/‑/g, ", ");  // Non-breaking hyphen
      cleanedText = cleanedText.replace(/‒/g, ", ");  // Figure dash
      
      console.log("FRONTEND DASH REMOVAL - Original:", data.humanized_text);
      console.log("FRONTEND DASH REMOVAL - Cleaned:", cleanedText);
      console.log("FRONTEND DASH REMOVAL - Still has em dash:", cleanedText.includes('—'));
      
      setOutputText(cleanedText);
      setHumanizationResult(data);
      setShowSuccess(true);
      
      // Save to history if user is authenticated (use cleaned text)
      if (currentUser) {
        await saveToHistory(inputText, cleanedText);
      }
      
      // Update word usage only for authenticated users
      if (currentUser) {
        await updateWordUsage(wordCount);
      }
      
    } catch (error: any) {
      console.error('Humanization Error:', error);
      
      // Handle specific Mistral AI errors
      if (mistralMode && error.message?.includes('Mistral AI service is currently at capacity')) {
        setOutputText('Error: Mistral AI is currently at capacity. Please try again in a few minutes or use a different AI model.');
      } else if (mistralMode && error.message?.includes('Mistral AI rate limit exceeded')) {
        setOutputText('Error: Mistral AI rate limit exceeded. Please try again later or use a different AI model.');
      } else {
        setOutputText('Error: ' + (error.message || 'Failed to humanize text'));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const saveAiDetectionToHistory = async (text: string, result: AIDetectionResult) => {
    if (!currentUser || !currentUser.email) return;

    try {
      const sanitizedEmail = sanitizeEmailForDocId(currentUser.email);
      
      // Save to user's AI detection subcollection
      await addDoc(collection(db, 'users', sanitizedEmail, 'aiDetections'), {
        text: text,
        result: result,
        timestamp: serverTimestamp(),
        textWords: result.text_words || text.trim().split(/\s+/).length,
        aiPercentage: result.ai_percentage,
        isAi: result.is_ai,
        isHuman: result.is_human,
        feedback: result.feedback,
        language: result.language,
        deleted: false, // Default to not deleted
      });
      
      console.log('AI detection result saved to history');
    } catch (error) {
      console.error('Error saving AI detection to history:', error);
    }
  };

  const handleAiCheck = async () => {
    if (!aiCheckText.trim() || aiCheckText.split(' ').length < 30) return;
    
    setIsAiChecking(true);
    setAiDetectionResult(null);
    
    try {
      const result = await callHttpFunction('detectAiText', { text: aiCheckText });
      const data = result.data as AIDetectionResult;
      
      setAiDetectionResult(data);
      setShowDetailedResults(true);
      
      // Save AI detection result to user's history (only if successful)
      if (data.success && currentUser) {
        await saveAiDetectionToHistory(aiCheckText, data);
      }
      
      // Set up staggered detection services based on AI score
      setupStaggeredDetectionServices(data.ai_percentage);
      
    } catch (error: any) {
      console.error('AI Detection Error:', error);
      setAiDetectionResult({
        success: false,
        is_ai: false,
        is_human: false,
        ai_percentage: 0,
        feedback: '',
        language: '',
        text_words: 0,
        ai_words: 0,
        highlighted_sentences: [],
        error: error.message || 'Failed to check text for AI'
      });
    } finally {
      setIsAiChecking(false);
    }
  };

  const getAiCheckColor = (score: number): string => {
    if (score < 30) return '#4ade80';
    if (score < 70) return '#fbbf24';
    return '#ef4444';
  };

  const getAiCheckLabel = (score: number): string => {
    if (score < 30) return 'Human-like';
    if (score < 70) return 'Mixed';
    return 'AI-generated';
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Load user settings from Firestore
  const loadUserSettings = async () => {
    if (!currentUser) return;
    
    setIsLoadingSettings(true);
    try {
      const userEmail = sanitizeEmailForDocId(currentUser.email || '');
      const settingsDocRef = doc(db, 'users', userEmail, 'settings', 'preferences');
      const settingsDoc = await getDoc(settingsDocRef);
      
      if (settingsDoc.exists()) {
        const settings = settingsDoc.data();
        setWritingStyle(settings?.writingStyle || 'professional');
        setTextLength(settings?.textLength || 'maintain');
        setKeywordsToPreserve(settings?.keywordsToPreserve || '');
        setReadingLevel(settings?.readingLevel || '');
        setToneGuardrails(settings?.toneGuardrails || '');
        setProhibitedItems(settings?.prohibitedItems || '');
        setPersonaLens(settings?.personaLens || '');
        setCustomRequest(settings?.customRequest || '');
        setTemperature(convertTemperatureToFrontend(settings?.temperature || 0.95));
        setTopP(convertTopPToFrontend(settings?.top_p || 1.0));
        setFrequencyPenalty(convertFrequencyPenaltyToFrontend(settings?.frequency_penalty || 0.6));
        setPresencePenalty(convertPresencePenaltyToFrontend(settings?.presence_penalty || 0.0));
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // Save user settings to Firestore
  const saveUserSettings = async () => {
    if (!currentUser) return;
    
    setIsSavingSettings(true);
    try {
      const userEmail = sanitizeEmailForDocId(currentUser.email || '');
      const settingsDocRef = doc(db, 'users', userEmail, 'settings', 'preferences');
      await setDoc(settingsDocRef, {
        writingStyle,
        textLength,
        keywordsToPreserve,
        readingLevel,
        toneGuardrails,
        prohibitedItems,
        personaLens,
        customRequest,
        temperature: convertTemperatureToBackend(temperature),
        top_p: convertTopPToBackend(topP),
        frequency_penalty: convertFrequencyPenaltyToBackend(frequencyPenalty),
        presence_penalty: convertPresencePenaltyToBackend(presencePenalty),
        lastUpdated: serverTimestamp()
      });
      
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Error saving user settings:', error);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Reset settings to defaults
  const resetUserSettings = () => {
    setWritingStyle('professional');
    setTextLength('maintain');
    setKeywordsToPreserve('');
    setReadingLevel('');
    setToneGuardrails('');
    setProhibitedItems('');
    setPersonaLens('');
    setCustomRequest('');
    setTemperature(5); // 5 = 0.95
    setTopP(4); // 4 = 1.0
    setFrequencyPenalty(5); // 5 = 0.6
    setPresencePenalty(1); // 1 = 0.0
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      py: 4,
    }}>
      <Container maxWidth="lg">
        {/* Main Content */}
        <Box sx={{ mb: 6 }}>
          {/* Main Title and Subtitle - Outside the box */}
            <Box textAlign="center" mb={4}>
              <Typography
              variant="h2"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  background: 'linear-gradient(45deg, #FFFFFF 30%, #FFD700 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                }}
              >
              Humanizer Text
              </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ mb: 3, fontSize: { xs: '1.1rem', md: '1.3rem' } }}>
              Transform AI-generated content into natural, human-like text
              that passes all detection tools
              </Typography>
            </Box>

          {/* Section 1: Humanizer Text */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              background: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              mb: 4,
            }}
          >
            {/* Input and Output Text Areas */}
            <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap={4} mb={4}>
              {/* Original Text */}
              <Box flex={1}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                    Original Text
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                  <Chip
                    label={`${inputWordCount} words`}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        color: '#6366f1',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        '& .MuiChip-label': {
                          px: 2,
                        },
                        '& .MuiChip-icon': {
                          color: '#6366f1',
                        },
                      }}
                      icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#6366f1' }} />}
                    />
                    <Chip
                      label={currentUser 
                        ? getWordsRemaining(userTier, effectiveDailyUsage, effectiveMonthlyUsage).displayText
                        : "Sign in to use"
                      }
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(34, 197, 94, 0.2)',
                      color: '#4ade80',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      fontWeight: 600,
                        fontSize: '0.75rem',
                        '& .MuiChip-label': {
                          px: 2,
                        },
                      '& .MuiChip-icon': {
                        color: '#4ade80',
                      },
                    }}
                    icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4ade80' }} />}
                  />
                  </Box>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={12}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your AI-generated text here..."
                  error={!!textLimitWarning}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(55, 65, 81, 0.3)',
                      '& fieldset': {
                        borderColor: textLimitWarning ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.1)',
                      },
                      '&:hover fieldset': {
                        borderColor: textLimitWarning ? 'rgba(239, 68, 68, 0.7)' : 'rgba(255, 255, 255, 0.2)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: textLimitWarning ? '#ef4444' : '#6366f1',
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: 'white',
                      '&::placeholder': {
                        color: 'rgba(255, 255, 255, 0.5)',
                        opacity: 1,
                      },
                    },
                  }}
                />
                {textLimitWarning && (
                  <Alert 
                    severity="warning" 
                    sx={{ 
                      mt: 1,
                      backgroundColor: 'rgba(251, 191, 36, 0.1)',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      color: '#fbbf24',
                      '& .MuiAlert-icon': {
                        color: '#fbbf24',
                      },
                    }}
                  >
                    {textLimitWarning}
                  </Alert>
                )}
              </Box>

              {/* Humanized Text */}
              <Box flex={1}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                    Humanized Text
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                      label={`${outputText.trim() ? outputText.trim().split(/\s+/).length : 0} words`}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        color: '#6366f1',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        '& .MuiChip-label': {
                          px: 2,
                        },
                        '& .MuiChip-icon': {
                          color: '#6366f1',
                        },
                      }}
                      icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#6366f1' }} />}
                    />
                    {outputText && (
                      <IconButton
                        onClick={() => copyToClipboard(outputText)}
                        size="small"
                        sx={{ color: '#60a5fa' }}
                      >
                        <ContentCopy />
                      </IconButton>
                    )}
                  </Box>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={12}
                  value={outputText}
                  placeholder="Your humanized text will appear here..."
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(55, 65, 81, 0.3)',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: 'white',
                      '&::placeholder': {
                        color: 'rgba(255, 255, 255, 0.5)',
                        opacity: 1,
                      },
                    },
                  }}
                />
                
                {/* Iterative Progress Display */}
                {iterativeMode && iterativeProgress.length > 0 && (
                  <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(26, 26, 46, 0.6)', borderRadius: 2, border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <Typography variant="h6" sx={{ color: 'white', mb: 1, fontSize: '1rem' }}>
                      🎯 Iterative Progress
                    </Typography>
                    {iterativeProgress.map((step, index) => (
                      <Box key={index} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', minWidth: '80px' }}>
                          Iteration {step.iteration}:
                        </Typography>
                        <Typography variant="body2" sx={{ color: step.ai_percentage === 0 ? '#22c55e' : '#fbbf24' }}>
                          {step.ai_percentage}% AI detected
                        </Typography>
                        {step.status === 're-humanizing' && (
                          <CircularProgress size={16} sx={{ color: '#667eea' }} />
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>

            {/* Controls */}
            <Box display="flex" gap={3} alignItems="center" mb={3} flexWrap="wrap">
              <Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1.5, fontWeight: 500 }}>
                  Writing Style
                </Typography>
              <FormControl sx={{ minWidth: 180 }}>
                <Select
                  value={writingStyle}
                  onChange={(e) => setWritingStyle(e.target.value)}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#6366f1',
                    },
                    '& .MuiSvgIcon-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  }}
                >
                    <MenuItem value="professional">💼 Professional</MenuItem>
                    <MenuItem value="creative">🎨 Creative</MenuItem>
                    <MenuItem value="casual">💬 Casual</MenuItem>
                    <MenuItem value="academic">🎓 Academic</MenuItem>
                </Select>
              </FormControl>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1.5, fontWeight: 500 }}>
                  Text Length
                </Typography>
              <FormControl sx={{ minWidth: 180 }}>
                <Select
                  value={textLength}
                  onChange={(e) => setTextLength(e.target.value)}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#6366f1',
                    },
                    '& .MuiSvgIcon-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                  }}
                >
                    <MenuItem value="maintain">⚖️ Maintain</MenuItem>
                    <MenuItem value="shorter">📉 Shorter</MenuItem>
                    <MenuItem value="longer">📈 Longer</MenuItem>
                </Select>
              </FormControl>
            </Box>

              <Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1.5, fontWeight: 500 }}>
                  &nbsp;
                </Typography>
                
                
              <Button
                  variant="outlined"
                  onClick={handleAdvancedSettings}
                  startIcon={<Settings />}
                sx={{
                    py: 1.2,
                    px: 3,
                    color: 'rgba(255, 255, 255, 0.8)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  textTransform: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  Advanced
              </Button>
            </Box>

              <Button
                variant="contained"
                onClick={currentUser ? handleHumanize : handleSignInToHumanize}
                disabled={currentUser ? isButtonDisabled : false}
                startIcon={currentUser ? <AutoFixHigh /> : <Login />}
                sx={{
                  py: 1.2,
                  px: 6,
                  background: currentUser 
                    ? (isButtonDisabled 
                        ? 'rgba(107, 114, 128, 0.5)' 
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  boxShadow: currentUser 
                    ? (isButtonDisabled 
                        ? 'none' 
                        : '0 4px 20px rgba(102, 126, 234, 0.4)')
                    : '0 4px 20px rgba(16, 185, 129, 0.4)',
                  flex: 1,
                  minWidth: 200,
                  alignSelf: 'flex-end',
                  color: 'white',
                  '&:hover': {
                    background: currentUser 
                      ? (isButtonDisabled 
                          ? 'rgba(107, 114, 128, 0.5)' 
                          : 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)')
                      : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    boxShadow: currentUser 
                      ? (isButtonDisabled 
                          ? 'none' 
                          : '0 6px 25px rgba(102, 126, 234, 0.6)')
                      : '0 6px 25px rgba(16, 185, 129, 0.6)',
                  },
                  '&:disabled': {
                    background: 'rgba(107, 114, 128, 0.5)',
                    color: 'rgba(255, 255, 255, 0.5)',
                  },
                }}
              >
                {currentUser 
                  ? (isProcessing ? 'Humanizing...' : '✨ HUMANIZE TEXT')
                  : '🔐 SIGN IN TO HUMANIZE'
                }
              </Button>
            </Box>


            {/* Processing Indicator */}
            {isProcessing && (
              <Box mt={3} textAlign="center">
                <LinearProgress
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                    },
                  }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Processing your text with advanced AI...
                </Typography>
              </Box>
            )}

            {/* Success Message */}
            {showSuccess && humanizationResult && (
              <Box mt={3}>
                <Alert
                  severity="success"
                  sx={{
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    color: '#4ade80',
                    '& .MuiAlert-icon': {
                      color: '#4ade80',
                    },
                  }}
                >
                  <Typography variant="body2">
                    Text humanized successfully! Your content has been transformed into natural, human-like text.
                  </Typography>
                </Alert>
              </Box>
            )}
          </Paper>

          {/* Section 2: Free AI Detection */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              background: 'rgba(26, 26, 46, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 4,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            }}
          >
            <Box textAlign="center" mb={4}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  background: 'linear-gradient(45deg, #FFFFFF 30%, #FFD700 90%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Free AI Detection
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                100% free and unlimited use to detect AI-generated content. Get instant
                results from multiple detection engines to verify if your text is human-
                written or AI-generated.
              </Typography>
            </Box>

            {/* AI Detection Input and Results */}
            <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap={4}>
              {/* Text Input */}
              <Box flex={1} display="flex" flexDirection="column">
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                    Text to Check
                  </Typography>
                  <Chip
                    label={`${aiCheckWordCount} words`}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(99, 102, 241, 0.2)',
                      color: '#6366f1',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={12}
                  value={aiCheckText}
                  onChange={(e) => setAiCheckText(e.target.value)}
                  placeholder="Add 30 + words to run the AI check."
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(55, 65, 81, 0.3)',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#6366f1',
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: 'white',
                      '&::placeholder': {
                        color: 'rgba(255, 255, 255, 0.5)',
                        opacity: 1,
                      },
                    },
                  }}
                />
                <Box textAlign="center" mt={3}>
                  <Button
                    variant="contained"
                    onClick={handleAiCheck}
                    disabled={isAiChecking || !aiCheckText.trim() || aiCheckText.split(' ').length < 30}
                    startIcon={<Assessment />}
                    sx={{
                      py: 1.5,
                      px: 4,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                        boxShadow: '0 6px 25px rgba(102, 126, 234, 0.6)',
                      },
                      '&:disabled': {
                        background: 'rgba(255, 255, 255, 0.1)',
                        color: 'rgba(255, 255, 255, 0.5)',
                      },
                    }}
                  >
                    {isAiChecking ? 'Checking...' : 'CHECK FOR AI'}
                  </Button>
                </Box>
              </Box>

              {/* AI Check Results */}
              <Box flex={1} display="flex" flexDirection="column">
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2, md: 3 },
                    backgroundColor: 'rgba(55, 65, 81, 0.3)',
                    borderRadius: 3,
                    border: '1px solid rgba(255,255,255,0.1)',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '400px',
                  }}
                >
                  <Box textAlign="center" sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    {!aiDetectionResult ? (
                      <>
                        <Typography variant="body1" color="rgba(255,255,255,0.7)" mb={3} fontWeight={500} sx={{ fontSize: { xs: '0.8rem', md: '0.9rem' } }}>
                          Waiting for text...
                        </Typography>
                        <Box
                          sx={{
                            width: { xs: 120, md: 160 },
                            height: { xs: 60, md: 80 },
                            borderRadius: '80px 80px 0 0',
                            background: 'rgba(55, 65, 81, 0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            mb: 3,
                            mx: 'auto',
                            border: '2px solid rgba(255,255,255,0.1)',
                          }}
                        >
                          <Typography variant="body2" color="rgba(255,255,255,0.7)" fontWeight={600} sx={{ fontSize: { xs: '0.8rem', md: '1rem' } }}>
                            AI GPT
                          </Typography>
                        </Box>
                      </>
                    ) : (
                      <>
                        <Box
                          sx={{
                            width: { xs: 180, md: 220 },
                            height: { xs: 90, md: 110 },
                            position: 'relative',
                            mb: 3,
                            mx: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {/* Balanced SVG Gauge */}
                          <svg
                            width="100%"
                            height="100%"
                            viewBox="0 0 220 110"
                            style={{ position: 'absolute' }}
                          >
                            <defs>
                              {/* Clean gradient for progress */}
                              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor={`${getAiCheckColor(aiDetectionResult.ai_percentage)}40`} />
                                <stop offset="50%" stopColor={getAiCheckColor(aiDetectionResult.ai_percentage)} />
                                <stop offset="100%" stopColor={`${getAiCheckColor(aiDetectionResult.ai_percentage)}40`} />
                              </linearGradient>
                            </defs>
                            
                            {/* Background Track */}
                            <path
                              d="M 30 85 A 80 80 0 0 1 190 85"
                              fill="none"
                              stroke="rgba(55, 65, 81, 0.25)"
                              strokeWidth="12"
                              strokeLinecap="round"
                            />
                            
                            {/* Progress Fill */}
                            <path
                              d="M 30 85 A 80 80 0 0 1 190 85"
                              fill="none"
                              stroke="url(#progressGradient)"
                              strokeWidth="12"
                              strokeLinecap="round"
                              strokeDasharray={`${(aiDetectionResult.ai_percentage / 100) * 251.3} 251.3`}
                              strokeDashoffset="0"
                              style={{
                                transition: 'stroke-dasharray 1.8s cubic-bezier(0.4, 0, 0.2, 1)',
                                filter: `drop-shadow(0 0 8px ${getAiCheckColor(aiDetectionResult.ai_percentage)}50)`,
                              }}
                            />
                          </svg>
                          
                          {/* Centered Percentage Text */}
                          <Box
                            sx={{
                              position: 'absolute',
                              zIndex: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '100%',
                              height: '100%',
                              paddingTop: '8%',
                            }}
                          >
                            <Typography 
                              variant="h2" 
                              sx={{ 
                                color: 'white', 
                                fontWeight: 700, 
                                fontSize: { xs: '2.1rem', md: '2.7rem' },
                                textShadow: '0 2px 12px rgba(0,0,0,0.7)',
                                letterSpacing: '0.5px',
                                lineHeight: 1,
                                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
                              }}
                            >
                            {aiDetectionResult.ai_percentage}%
                          </Typography>
                          </Box>
                        </Box>
                        <Typography variant="h6" sx={{ color: getAiCheckColor(aiDetectionResult.ai_percentage), fontWeight: 700, mb: 3 }}>
                          {getAiCheckLabel(aiDetectionResult.ai_percentage)}
                        </Typography>
                        
                        {aiDetectionResult.feedback && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
                            "{aiDetectionResult.feedback}"
                          </Typography>
                        )}
                      </>
                    )}
                  </Box>

                  {/* Detection Services - Always show */}
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                      Also checked with:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1.5} justifyContent="center" alignItems="center">
                      {detectionServices.map((service, index) => (
                        <Box
                          key={service.name}
                          sx={{
                            opacity: service.visible ? 1 : 0,
                            transform: service.visible ? 'translateY(0)' : 'translateY(10px)',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            px: 2,
                            py: 1,
                            borderRadius: 2,
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            minHeight: 40,
                          }}
                        >
                          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                            {service.icon}
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>
                            {service.name}
                          </Typography>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', color: service.checked ? '#4ade80' : '#ef4444' }}>
                            {service.checked ? '✓' : '✗'}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Paper>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>

      {/* Copy Success Snackbar */}
      <Snackbar
        open={copySuccess}
        autoHideDuration={2000}
        onClose={() => setCopySuccess(false)}
        message="Text copied to clipboard!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        currentTier={userTier}
        reason={upgradeReason}
        limit={upgradeLimit}
        wordsAttempted={wordCount}
      />

      {/* Advanced Settings Modal */}
      <Dialog 
        open={advancedSettingsOpen} 
        onClose={() => setAdvancedSettingsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(26, 26, 46, 0.95)',
            backdropFilter: 'blur(20px)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 3,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          pb: 3,
          pt: 3
        }}>
          <Settings sx={{ color: '#667eea' }} />
          <Typography variant="h5" sx={{ 
            fontWeight: 600,
            background: 'linear-gradient(45deg, #FFFFFF 5%, #FFD700 30%, #FFA500 60%, #FF8C00 90%, #FF6600 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            flex: 1
          }}>
            Advanced Humanization Settings
          </Typography>
          <Tooltip title="Visit the Guide page to learn more about these settings and how to use them effectively" arrow>
            <IconButton sx={{ color: 'rgba(255, 255, 255, 0.7)', ml: 'auto' }}>
              <Info />
            </IconButton>
          </Tooltip>
        </DialogTitle>
        <DialogContent sx={{ pt: 4, pb: 2 }}>
          {/* Advanced Options - Always Visible */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <Box sx={{ pt: 2 }}>
                <Typography variant="subtitle1" sx={{ 
                  background: 'linear-gradient(45deg, #FFFFFF 5%, #FFD700 30%, #FFA500 60%, #FF8C00 90%, #FF6600 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  mb: 1.5, 
                  fontWeight: 600 
                }}>
                  Keywords to Preserve
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Ex. Quotes, Statistics"
                  value={keywordsToPreserve}
                  onChange={(e) => setKeywordsToPreserve(e.target.value)}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                      '& fieldset': { 
                        borderColor: 'rgba(255, 255, 255, 0.15)',
                        borderRadius: 2,
                      },
                      '&:hover fieldset': { 
                        borderColor: 'rgba(255, 255, 255, 0.25)',
                      },
                      '&.Mui-focused fieldset': { 
                        borderColor: '#667eea',
                        boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                      },
                      transition: 'all 0.2s ease',
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: 'rgba(255, 255, 255, 0.5)',
                      opacity: 1,
                    },
                  }}
                />
              </Box>
              <Box sx={{ pt: 2 }}>
                <Typography variant="subtitle1" sx={{ 
                  background: 'linear-gradient(45deg, #FFFFFF 5%, #FFD700 30%, #FFA500 60%, #FF8C00 90%, #FF6600 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  mb: 1.5, 
                  fontWeight: 600 
                }}>
                  Reading Level Target
                </Typography>
                <TextField
                  fullWidth
                  placeholder="College Level, Grade 9-10"
                  value={readingLevel}
                  onChange={(e) => setReadingLevel(e.target.value)}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                      '& fieldset': { 
                        borderColor: 'rgba(255, 255, 255, 0.15)',
                        borderRadius: 2,
                      },
                      '&:hover fieldset': { 
                        borderColor: 'rgba(255, 255, 255, 0.25)',
                      },
                      '&.Mui-focused fieldset': { 
                        borderColor: '#667eea',
                        boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                      },
                      transition: 'all 0.2s ease',
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: 'rgba(255, 255, 255, 0.5)',
                      opacity: 1,
                    },
                  }}
                />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ 
                  background: 'linear-gradient(45deg, #FFFFFF 5%, #FFD700 30%, #FFA500 60%, #FF8C00 90%, #FF6600 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  mb: 1.5, 
                  fontWeight: 600 
                }}>
                  Tone Guardrails
                </Typography>
                <TextField
                  fullWidth
                  placeholder="curious but not snarky"
                  value={toneGuardrails}
                  onChange={(e) => setToneGuardrails(e.target.value)}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                      '& fieldset': { 
                        borderColor: 'rgba(255, 255, 255, 0.15)',
                        borderRadius: 2,
                      },
                      '&:hover fieldset': { 
                        borderColor: 'rgba(255, 255, 255, 0.25)',
                      },
                      '&.Mui-focused fieldset': { 
                        borderColor: '#667eea',
                        boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                      },
                      transition: 'all 0.2s ease',
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: 'rgba(255, 255, 255, 0.5)',
                      opacity: 1,
                    },
                  }}
                />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ 
                  background: 'linear-gradient(45deg, #FFFFFF 5%, #FFD700 30%, #FFA500 60%, #FF8C00 90%, #FF6600 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  mb: 1.5, 
                  fontWeight: 600 
                }}>
                  Additional Prohibited Items
                </Typography>
                <TextField
                  fullWidth
                  placeholder="corporate buzzwords"
                  value={prohibitedItems}
                  onChange={(e) => setProhibitedItems(e.target.value)}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                      '& fieldset': { 
                        borderColor: 'rgba(255, 255, 255, 0.15)',
                        borderRadius: 2,
                      },
                      '&:hover fieldset': { 
                        borderColor: 'rgba(255, 255, 255, 0.25)',
                      },
                      '&.Mui-focused fieldset': { 
                        borderColor: '#667eea',
                        boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                      },
                      transition: 'all 0.2s ease',
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: 'rgba(255, 255, 255, 0.5)',
                      opacity: 1,
                    },
                  }}
                />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ 
                  background: 'linear-gradient(45deg, #FFFFFF 5%, #FFD700 30%, #FFA500 60%, #FF8C00 90%, #FF6600 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  mb: 1.5, 
                  fontWeight: 600 
                }}>
                  Persona Lens
                </Typography>
                <TextField
                  fullWidth
                  placeholder="teacher explaining to students"
                  value={personaLens}
                  onChange={(e) => setPersonaLens(e.target.value)}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.02)',
                      '& fieldset': { 
                        borderColor: 'rgba(255, 255, 255, 0.15)',
                        borderRadius: 2,
                      },
                      '&:hover fieldset': { 
                        borderColor: 'rgba(255, 255, 255, 0.25)',
                      },
                      '&.Mui-focused fieldset': { 
                        borderColor: '#667eea',
                        boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                      },
                      transition: 'all 0.2s ease',
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: 'rgba(255, 255, 255, 0.5)',
                      opacity: 1,
                    },
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Custom Options Collapsible Section */}
          <Box>
            <Box
              onClick={() => setCustomOptionsExpanded(!customOptionsExpanded)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
                p: 2,
                borderRadius: 2,
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                }
              }}
            >
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, flex: 1 }}>
                🎛️ Custom Options
              </Typography>
              <IconButton 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  transition: 'transform 0.2s ease',
                  transform: customOptionsExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              >
                <ExpandMore />
              </IconButton>
            </Box>
            
            <Collapse in={customOptionsExpanded}>
              <Box sx={{ pt: 3 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ 
                    background: 'linear-gradient(45deg, #FFFFFF 5%, #FFD700 30%, #FFA500 60%, #FF8C00 90%, #FF6600 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    mb: 1.5, 
                    fontWeight: 600 
                  }}>
                    Custom Request
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Any specific instructions..."
                    value={customRequest}
                    onChange={(e) => setCustomRequest(e.target.value)}
                    multiline
                    rows={3}
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        bgcolor: 'rgba(255, 255, 255, 0.02)',
                        '& fieldset': { 
                          borderColor: 'rgba(255, 255, 255, 0.15)',
                          borderRadius: 2,
                        },
                        '&:hover fieldset': { 
                          borderColor: 'rgba(255, 255, 255, 0.25)',
                        },
                        '&.Mui-focused fieldset': { 
                          borderColor: '#667eea',
                          boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                        },
                        transition: 'all 0.2s ease',
                      },
                      '& .MuiInputBase-input::placeholder': {
                        color: 'rgba(255, 255, 255, 0.5)',
                        opacity: 1,
                      },
                    }}
                  />
                </Box>

                {/* OpenAI Parameters */}
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" sx={{ 
                    background: 'linear-gradient(45deg, #FFFFFF 5%, #FFD700 30%, #FFA500 60%, #FF8C00 90%, #FF6600 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    mb: 2, 
                    fontWeight: 600 
                  }}>
                    AI Engine Parameters
                  </Typography>
                  <Alert severity="warning" sx={{ mb: 3, bgcolor: 'rgba(255, 193, 7, 0.1)', color: 'rgba(255, 193, 7, 0.9)' }}>
                    ⚠️ Adjusting these parameters affects both AI detection bypass and text variation
                  </Alert>
                  
                  {/* Creativity (Temperature) */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        Creativity
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {temperature}
                      </Typography>
                    </Box>
                    <Slider
                      value={temperature}
                      onChange={(_, newValue) => setTemperature(newValue as number)}
                      min={1}
                      max={7}
                      step={1}
                      sx={{
                        color: '#667eea',
                        '& .MuiSlider-thumb': {
                          '&:hover, &.Mui-focusVisible': {
                            boxShadow: '0 0 0 8px rgba(102, 126, 234, 0.16)',
                          },
                        },
                      }}
                    />
                  </Box>

                  {/* Diversity (Top P) */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        Diversity
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {topP}
                      </Typography>
                    </Box>
                    <Slider
                      value={topP}
                      onChange={(_, newValue) => setTopP(newValue as number)}
                      min={1}
                      max={6}
                      step={1}
                      sx={{
                        color: '#667eea',
                        '& .MuiSlider-thumb': {
                          '&:hover, &.Mui-focusVisible': {
                            boxShadow: '0 0 0 8px rgba(102, 126, 234, 0.16)',
                          },
                        },
                      }}
                    />
                  </Box>

                  {/* Reduce Repeats (Frequency Penalty) */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        Reduce Repeats
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {frequencyPenalty}
                      </Typography>
                    </Box>
                    <Slider
                      value={frequencyPenalty}
                      onChange={(_, newValue) => setFrequencyPenalty(newValue as number)}
                      min={1}
                      max={9}
                      step={1}
                      sx={{
                        color: '#667eea',
                        '& .MuiSlider-thumb': {
                          '&:hover, &.Mui-focusVisible': {
                            boxShadow: '0 0 0 8px rgba(102, 126, 234, 0.16)',
                          },
                        },
                      }}
                    />
                  </Box>

                  {/* Explore New Topics (Presence Penalty) */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        Explore New Topics
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {presencePenalty}
                      </Typography>
                    </Box>
                    <Slider
                      value={presencePenalty}
                      onChange={(_, newValue) => setPresencePenalty(newValue as number)}
                      min={1}
                      max={5}
                      step={1}
                      sx={{
                        color: '#667eea',
                        '& .MuiSlider-thumb': {
                          '&:hover, &.Mui-focusVisible': {
                            boxShadow: '0 0 0 8px rgba(102, 126, 234, 0.16)',
                          },
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Collapse>
          </Box>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', gap: 2, p: 3 }}>
          <Button
            onClick={resetUserSettings}
            startIcon={<Refresh />}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 2,
              px: 3,
              py: 1,
              transition: 'all 0.2s ease',
              '&:hover': { 
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
              }
            }}
          >
            Reset
          </Button>
          <Button
            onClick={() => {
              saveUserSettings();
              setAdvancedSettingsOpen(false);
            }}
            disabled={isSavingSettings}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 2,
              px: 4,
              py: 1,
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.2s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                transform: 'translateY(-1px)',
              },
              '&:disabled': {
                background: 'rgba(102, 126, 234, 0.3)',
                color: 'rgba(255, 255, 255, 0.7)',
              }
            }}
          >
            {isSavingSettings ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1, color: 'white' }} />
                Saving...
              </>
            ) : (
              'Save & Close'
            )}
          </Button>
          <Button
            onClick={() => setAdvancedSettingsOpen(false)}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 2,
              px: 3,
              py: 1,
              transition: 'all 0.2s ease',
              '&:hover': { 
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
              }
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Home;
