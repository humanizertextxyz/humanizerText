import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { getFirestore } from "firebase-admin/firestore";
import Stripe from "stripe";

// Define the Stripe secret key
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");

// Get Firestore instance inside functions (not at module level)
const getDb = () => getFirestore();

// CORS configuration
const corsOptions = {
  cors: true
};

// Initialize Stripe function that will be called within each function
const initializeStripe = (secretKey: string) => {
  return new Stripe(secretKey, {
    apiVersion: '2025-08-27.basil',
  });
};

// Create Stripe Products (run once to set up your products)
export const createStripeProducts = onRequest(
  { secrets: [stripeSecretKey], ...corsOptions },
  async (req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', 'https://humanizertext.xyz');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    try {
      const stripe = initializeStripe(stripeSecretKey.value());
      
      // Create Pro Plan
      const proProduct = await stripe.products.create({
        name: 'Pro Plan',
        description: '500 words per process, All modes and settings, Advanced options, Priority support',
      });

      const proMonthlyPrice = await stripe.prices.create({
        product: proProduct.id,
        unit_amount: 999, // $9.99
        currency: 'usd',
        recurring: { interval: 'month' },
        nickname: 'Pro Monthly',
      });

      const proYearlyPrice = await stripe.prices.create({
        product: proProduct.id,
        unit_amount: 9990, // $99.90 (2 months free)
        currency: 'usd',
        recurring: { interval: 'year' },
        nickname: 'Pro Yearly',
      });

      // Create Premium Plan
      const premiumProduct = await stripe.products.create({
        name: 'Premium Plan',
        description: 'Unlimited words per process, All modes and settings, Advanced options, Priority support',
      });

      const premiumMonthlyPrice = await stripe.prices.create({
        product: premiumProduct.id,
        unit_amount: 1999, // $19.99
        currency: 'usd',
        recurring: { interval: 'month' },
        nickname: 'Premium Monthly',
      });

      const premiumYearlyPrice = await stripe.prices.create({
        product: premiumProduct.id,
        unit_amount: 19990, // $199.90 (2 months free)
        currency: 'usd',
        recurring: { interval: 'year' },
        nickname: 'Premium Yearly',
      });

      // Create Platinum Plan
      const platinumProduct = await stripe.products.create({
        name: 'Platinum Plan',
        description: '1,000,000 words per month, Unlimited words per process, All modes and settings, Advanced options, Priority support',
      });

      const platinumMonthlyPrice = await stripe.prices.create({
        product: platinumProduct.id,
        unit_amount: 4999, // $49.99 (keeping same price for now)
        currency: 'usd',
        recurring: { interval: 'month' },
        nickname: 'Platinum Monthly',
      });

      const platinumYearlyPrice = await stripe.prices.create({
        product: platinumProduct.id,
        unit_amount: 49990, // $499.90 (2 months free)
        currency: 'usd',
        recurring: { interval: 'year' },
        nickname: 'Platinum Yearly',
      });

      const products = {
        pro: {
          product: proProduct.id,
          monthly: proMonthlyPrice.id,
          yearly: proYearlyPrice.id,
        },
        premium: {
          product: premiumProduct.id,
          monthly: premiumMonthlyPrice.id,
          yearly: premiumYearlyPrice.id,
        },
        platinum: {
          product: platinumProduct.id,
          monthly: platinumMonthlyPrice.id,
          yearly: platinumYearlyPrice.id,
        },
      };

      res.status(200).json({ 
        success: true, 
        message: 'Products and prices created successfully',
        products 
      });

    } catch (error) {
      console.error('Error creating Stripe products:', error);
      res.status(500).json({ 
        error: `Failed to create products: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }
);

// Validate Coupon Code
export const validateCoupon = onRequest(
  { secrets: [stripeSecretKey], ...corsOptions },
  async (req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', 'https://humanizertext.xyz');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    try {
      const { couponCode } = req.body.data || req.body;

      if (!couponCode) {
        res.status(400).json({ error: 'Coupon code is required' });
        return;
      }

      const stripe = initializeStripe(stripeSecretKey.value());

      // Check for special coupon first
      if (couponCode === 'pearsonFREEPearson') {
        res.status(200).json({ 
          success: true, 
          valid: true,
          discount: 100,
          type: 'percentage',
          description: '100% off forever - Special Access',
          couponId: 'pearsonFREEPearson'
        });
        return;
      }

      // Validate with Stripe's native coupon system
      try {
        const coupon = await stripe.coupons.retrieve(couponCode);
        
        if (coupon.valid) {
          let discount = 0;
          let type = 'percentage';
          let description = '';

          if (coupon.percent_off) {
            discount = coupon.percent_off;
            type = 'percentage';
            description = `${discount}% off`;
          } else if (coupon.amount_off) {
            discount = coupon.amount_off / 100; // Convert cents to dollars
            type = 'fixed';
            description = `$${discount} off`;
          }

          res.status(200).json({ 
            success: true, 
            valid: true,
            discount: discount,
            type: type,
            description: description,
            couponId: coupon.id,
            name: coupon.name || coupon.id
          });
        } else {
          res.status(200).json({ 
            success: true, 
            valid: false,
            message: 'Coupon is no longer valid'
          });
        }
      } catch (stripeError) {
        // Coupon doesn't exist in Stripe
        res.status(200).json({ 
          success: true, 
          valid: false,
          message: 'Invalid coupon code'
        });
      }

    } catch (error) {
      console.error('Error validating coupon:', error);
      res.status(500).json({ 
        error: `Failed to validate coupon: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }
);

// Create Checkout Session
export const createCheckoutSession = onRequest(
  { secrets: [stripeSecretKey], ...corsOptions },
  async (req, res) => {
    // Set CORS headers
    res.set('Access-Control-Allow-Origin', 'https://humanizertext.xyz');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    try {
      const stripe = initializeStripe(stripeSecretKey.value());
      const { priceId, customerEmail, successUrl, cancelUrl, couponCode } = req.body.data || req.body;

      if (!priceId) {
        res.status(400).json({ error: 'Price ID is required' });
        return;
      }

      // Handle special 100% discount coupon
      if (couponCode === 'pearsonFREEPearson') {
        // Skip Stripe checkout and directly upgrade user
        await handleFreeCouponUpgrade(customerEmail, priceId);
        
        res.status(200).json({ 
          success: true, 
          freeUpgrade: true,
          message: 'Account upgraded successfully with coupon!',
          redirectUrl: successUrl || 'https://humanizertext.xyz/account'
        });
        return;
      }

      // Build session parameters
      const sessionParams: any = {
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        customer_email: customerEmail,
        success_url: successUrl || 'https://humanizertext.xyz/account',
        cancel_url: cancelUrl || 'https://humanizertext.xyz/pricing',
        metadata: {
          customer_email: customerEmail,
        },
        allow_promotion_codes: true, // Enable promotion codes in Stripe checkout
      };

      // Add coupon if provided and valid
      if (couponCode && couponCode !== 'pearsonFREEPearson') {
        try {
          // Verify coupon exists in Stripe
          const coupon = await stripe.coupons.retrieve(couponCode);
          if (coupon.valid) {
            sessionParams.discounts = [{
              coupon: couponCode,
            }];
          }
        } catch (error) {
          console.log('Coupon not found in Stripe, proceeding without discount');
        }
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      res.status(200).json({ 
        success: true, 
        sessionId: session.id,
        url: session.url 
      });

    } catch (error) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ 
        error: `Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }
);

// Stripe Webhook Handler
export const stripeWebhook = onRequest(
  { secrets: [stripeSecretKey], ...corsOptions },
  async (req, res) => {
    try {
      const stripe = initializeStripe(stripeSecretKey.value());
      const sig = req.headers['stripe-signature'] as string;
      const endpointSecret = 'whsec_...'; // You'll need to set this after creating the webhook
      
      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        return;
      }

      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as Stripe.Checkout.Session;
          await handleSuccessfulPayment(session);
          break;
        
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionChange(subscription);
          break;
        
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.status(200).json({ received: true });

    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ 
        error: `Webhook failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }
);

// Helper function to handle successful payment
async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  try {
    const customerEmail = session.customer_email || session.metadata?.customer_email;
    
    if (!customerEmail) {
      console.error('No customer email found in session');
      return;
    }

    // Sanitize email for Firestore document ID
    const sanitizedEmail = customerEmail.replace(/[\.#$\[\]@]/g, (match) => {
      if (match === '@') return '_at_';
      return '_';
    });

    // Get subscription details from Stripe
    const stripe = initializeStripe(stripeSecretKey.value());
    const subscriptionResponse = await stripe.subscriptions.retrieve(session.subscription as string);
    const priceId = subscriptionResponse.items.data[0].price.id;
    
    // Determine subscription type based on price ID
    let subscriptionType = 'free';
    if (priceId.includes('pro') || subscriptionResponse.items.data[0].price.nickname?.toLowerCase().includes('pro')) {
      subscriptionType = 'pro';
    } else if (priceId.includes('premium') || subscriptionResponse.items.data[0].price.nickname?.toLowerCase().includes('premium')) {
      subscriptionType = 'premium';
    } else if (priceId.includes('platinum') || subscriptionResponse.items.data[0].price.nickname?.toLowerCase().includes('platinum')) {
      subscriptionType = 'platinum';
    }

    // Update user's subscription in Firestore
    const db = getDb();
    const userRef = db.collection('users').doc(sanitizedEmail);
    await userRef.update({
      subscription: {
        type: subscriptionType,
        status: subscriptionResponse.status,
        customerId: session.customer,
        subscriptionId: session.subscription,
        priceId: priceId,
        currentPeriodStart: new Date((subscriptionResponse as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscriptionResponse as any).current_period_end * 1000),
        updatedAt: new Date(),
      },
    });

    console.log(`Successfully updated subscription for ${customerEmail} to ${subscriptionType}`);

  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

// Helper function to handle free coupon upgrade
async function handleFreeCouponUpgrade(customerEmail: string, priceId: string) {
  try {
    if (!customerEmail) {
      console.error('No customer email provided for free coupon upgrade');
      return;
    }

    const sanitizedEmail = customerEmail.replace(/[\.#$\[\]@]/g, (match) => {
      if (match === '@') return '_at_';
      return '_';
    });

    // Determine subscription type from price ID
    let subscriptionType = 'pro'; // Default to pro
    if (priceId.includes('premium') || priceId === 'price_1S7m6kFFj8vcXDEeTmvVP43H' || priceId === 'price_1S7m6kFFj8vcXDEeDkFJU1EJ') {
      subscriptionType = 'premium';
    } else if (priceId.includes('platinum') || priceId === 'price_1S7m6kFFj8vcXDEefErYd6iA' || priceId === 'price_1S7m6kFFj8vcXDEet50GANvd') {
      subscriptionType = 'platinum';
    }

    const db = getDb();
    const userRef = db.collection('users').doc(sanitizedEmail);
    
    // Set subscription with special coupon status
    await userRef.update({
      subscription: {
        type: subscriptionType,
        status: 'active',
        customerId: 'coupon_customer',
        subscriptionId: 'pearsonFREEPearson',
        priceId: priceId,
        couponCode: 'pearsonFREEPearson',
        couponDiscount: 100,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        updatedAt: new Date(),
        isFreeForever: true,
      },
    });
    
    console.log(`Successfully upgraded ${customerEmail} to ${subscriptionType} with free coupon`);
  } catch (error) {
    console.error('Error handling free coupon upgrade:', error);
    throw error;
  }
}

// Helper function to handle subscription changes
async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  try {
    const stripe = initializeStripe(stripeSecretKey.value());
    const customer = await stripe.customers.retrieve(subscription.customer as string);
    
    if (!customer || customer.deleted) {
      console.error('Customer not found or deleted');
      return;
    }

    const customerEmail = (customer as Stripe.Customer).email;
    
    if (!customerEmail) {
      console.error('No customer email found');
      return;
    }

    // Sanitize email for Firestore document ID
    const sanitizedEmail = customerEmail.replace(/[\.#$\[\]@]/g, (match) => {
      if (match === '@') return '_at_';
      return '_';
    });

    const db = getDb();
    const userRef = db.collection('users').doc(sanitizedEmail);
    
    if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
      // Subscription cancelled - but keep access until period end
      await userRef.update({
        'subscription.status': subscription.status,
        'subscription.cancelAt': subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
        'subscription.updatedAt': new Date(),
      });
    } else {
      // Subscription updated
      const priceId = subscription.items.data[0].price.id;
      
      let subscriptionType = 'free';
      if (priceId.includes('pro') || subscription.items.data[0].price.nickname?.toLowerCase().includes('pro')) {
        subscriptionType = 'pro';
      } else if (priceId.includes('premium') || subscription.items.data[0].price.nickname?.toLowerCase().includes('premium')) {
        subscriptionType = 'premium';
      } else if (priceId.includes('platinum') || subscription.items.data[0].price.nickname?.toLowerCase().includes('platinum')) {
        subscriptionType = 'platinum';
      }

      await userRef.update({
        subscription: {
          type: subscriptionType,
          status: subscription.status,
          customerId: subscription.customer,
          subscriptionId: subscription.id,
          priceId: priceId,
          currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          updatedAt: new Date(),
        },
      });
    }

    console.log(`Successfully updated subscription for ${customerEmail}`);

  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
} 