import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your live publishable key
export const stripePromise = loadStripe('pk_live_51S76sfFFj8vcXDEe4W4JrI65BnByudNmPc8mgnZtTf6splYcR327iLAUCx4t4h7tnitHJpgCXkzQ6JYiSBdb1bOJ008zJookZ2');

// Live Stripe Price IDs (from the function response)
export const STRIPE_PRICES = {
  pro: {
    monthly: 'price_1S7m6jFFj8vcXDEewfzyuI6X',
    yearly: 'price_1S7m6jFFj8vcXDEe0T6naPYE',
  },
  premium: {
    monthly: 'price_1S7m6kFFj8vcXDEeTmvVP43H',
    yearly: 'price_1S7m6kFFj8vcXDEeDkFJU1EJ',
  },
  platinum: {
    monthly: 'price_1S7m6kFFj8vcXDEefErYd6iA',
    yearly: 'price_1S7m6kFFj8vcXDEet50GANvd',
  },
};

// Function to create checkout session
export const createCheckoutSession = async (priceId: string, customerEmail: string, couponCode?: string) => {
  try {
    const response = await fetch('https://createcheckoutsession-qq6lep6f5a-uc.a.run.app', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        customerEmail,
        couponCode,
        successUrl: 'https://humanizertext.xyz/account',
        cancelUrl: 'https://humanizertext.xyz/pricing',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create checkout session');
    }

    return data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

// Function to redirect to Stripe Checkout
export const redirectToCheckout = async (planType: string, interval: 'monthly' | 'yearly', customerEmail: string, couponCode?: string) => {
  try {
    const priceId = STRIPE_PRICES[planType as keyof typeof STRIPE_PRICES][interval];
    
    if (!priceId) {
      throw new Error(`Invalid plan type or interval: ${planType} ${interval}`);
    }

    const result = await createCheckoutSession(priceId, customerEmail, couponCode);
    
    // Handle free upgrade (100% discount coupon)
    if (result.freeUpgrade) {
      window.location.href = result.redirectUrl;
      return;
    }
    
    if (result.url) {
      window.location.href = result.url;
    } else {
      throw new Error('No checkout URL returned');
    }
  } catch (error) {
    console.error('Error redirecting to checkout:', error);
    throw error;
  }
}; 