export interface SubscriptionTier {
  name: string;
  type: 'free' | 'pro' | 'premium' | 'platinum';
  dailyWords: number;
  monthlyWords: number;
  wordsPerProcess: number;
  price: number;
  features: string[];
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  free: {
    name: 'Free',
    type: 'free',
    dailyWords: 1000,
    monthlyWords: 0, // Not applicable for free tier
    wordsPerProcess: 150,
    price: 0,
    features: [
      '1,000 words per day',
      '150 words per process',
      'Basic humanization',
      'AI detection',
    ],
  },
  pro: {
    name: 'Pro',
    type: 'pro',
    dailyWords: 0, // Not applicable for paid tiers
    monthlyWords: 0, // No monthly limit for Pro
    wordsPerProcess: 500,
    price: 9.99,
    features: [
      '500 words per process',
      'All modes and settings',
      'Advanced options',
      'Priority support',
    ],
  },
  premium: {
    name: 'Premium',
    type: 'premium',
    dailyWords: 0, // Not applicable for paid tiers
    monthlyWords: 0, // No monthly limit for Premium
    wordsPerProcess: 0, // Unlimited
    price: 19.99,
    features: [
      'Unlimited words per process',
      'All modes and settings',
      'Advanced options',
      'Priority support',
    ],
  },
  platinum: {
    name: 'Platinum',
    type: 'platinum',
    dailyWords: 0, // Not applicable for paid tiers
    monthlyWords: 1000000, // 1 million words per month
    wordsPerProcess: 0, // Unlimited
    price: 0, // Will be set dynamically
    features: [
      '1,000,000 words per month',
      'Unlimited words per process',
      'All modes and settings',
      'Advanced options',
      'Priority support',
    ],
  },
};

export const getSubscriptionTier = (type: string): SubscriptionTier => {
  return SUBSCRIPTION_TIERS[type] || SUBSCRIPTION_TIERS.free;
};

// Check if daily usage should be reset (every 24 hours)
export const shouldResetDailyUsage = (lastResetDate: any): boolean => {
  if (!lastResetDate) return true;
  
  const lastReset = lastResetDate.toDate ? lastResetDate.toDate() : new Date(lastResetDate);
  const now = new Date();
  const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysSinceReset >= 1;
};

// Check if monthly usage should be reset (every 30 days from signup)
export const shouldResetMonthlyUsage = (createdAt: any, lastResetDate: any): boolean => {
  if (!createdAt) return true;
  
  const signupDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  const now = new Date();
  
  // Calculate the current 30-day cycle start date
  const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24));
  const currentCycle = Math.floor(daysSinceSignup / 30);
  const currentCycleStart = new Date(signupDate.getTime() + (currentCycle * 30 * 24 * 60 * 60 * 1000));
  
  if (!lastResetDate) return true;
  
  const lastReset = lastResetDate.toDate ? lastResetDate.toDate() : new Date(lastResetDate);
  
  // Reset if we've entered a new 30-day cycle
  return lastReset.getTime() < currentCycleStart.getTime();
};

// Get days until next monthly reset
export const getDaysUntilMonthlyReset = (createdAt: any): number => {
  if (!createdAt) return 30;
  
  const signupDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  const now = new Date();
  
  const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysInCurrentCycle = daysSinceSignup % 30;
  
  return 30 - daysInCurrentCycle;
};

// Enhanced validation function with detailed feedback
export const canUserProcessText = (
  userTier: string,
  dailyWordsUsed: number,
  monthlyWordsUsed: number,
  wordsToProcess: number
): { canProcess: boolean; reason?: string; limit?: number } => {
  const tier = getSubscriptionTier(userTier);
  
  // Check words per process limit
  if (tier.wordsPerProcess > 0 && wordsToProcess > tier.wordsPerProcess) {
    return {
      canProcess: false,
      reason: 'per_process_limit',
      limit: tier.wordsPerProcess
    };
  }
  
  // Check daily limit for free users
  if (tier.type === 'free') {
    if (dailyWordsUsed >= tier.dailyWords) {
      return {
        canProcess: false,
        reason: 'daily_limit_reached',
        limit: tier.dailyWords
      };
    }
    if (dailyWordsUsed + wordsToProcess > tier.dailyWords) {
      return {
        canProcess: false,
        reason: 'daily_limit_exceeded',
        limit: tier.dailyWords
      };
    }
  }
  
  // Check monthly limit for paid users (only Platinum has monthly limit)
  if (tier.type === 'platinum' && tier.monthlyWords > 0) {
    if (monthlyWordsUsed >= tier.monthlyWords) {
      return {
        canProcess: false,
        reason: 'monthly_limit_reached',
        limit: tier.monthlyWords
      };
    }
    if (monthlyWordsUsed + wordsToProcess > tier.monthlyWords) {
      return {
        canProcess: false,
        reason: 'monthly_limit_exceeded',
        limit: tier.monthlyWords
      };
    }
  }
  
  return { canProcess: true };
};

export const getWordsRemaining = (
  userTier: string,
  dailyWordsUsed: number,
  monthlyWordsUsed: number
): { daily: number; monthly: number; displayText: string } => {
  const tier = getSubscriptionTier(userTier);
  
  if (tier.type === 'free') {
    const dailyRemaining = Math.max(0, tier.dailyWords - dailyWordsUsed);
    return {
      daily: dailyRemaining,
      monthly: 0,
      displayText: `${dailyRemaining} words left (Daily)`
    };
  }
  
  const monthlyRemaining = Math.max(0, tier.monthlyWords - monthlyWordsUsed);
  return {
    daily: 0,
    monthly: monthlyRemaining,
    displayText: `${monthlyRemaining} words left (Monthly)`
  };
};

export const getMaxWordsPerProcess = (userTier: string): number => {
  const tier = getSubscriptionTier(userTier);
  return tier.wordsPerProcess;
};

export const getUsagePercentage = (
  userTier: string,
  dailyWordsUsed: number,
  monthlyWordsUsed: number
): number => {
  const tier = getSubscriptionTier(userTier);
  
  if (tier.type === 'free') {
    return Math.min(100, (dailyWordsUsed / tier.dailyWords) * 100);
  }
  
  return Math.min(100, (monthlyWordsUsed / tier.monthlyWords) * 100);
};

export const formatWordsLimit = (limit: number): string => {
  if (limit === 0) return 'Unlimited';
  if (limit >= 1000) return `${(limit / 1000).toFixed(0)}K`;
  return limit.toString();
};

export const getPlanColor = (type: string): string => {
  switch (type) {
    case 'free': return '#6b7280';
    case 'pro': return '#3b82f6';
    case 'premium': return '#8b5cf6';
    case 'platinum': return '#f59e0b';
    default: return '#6b7280';
  }
};
