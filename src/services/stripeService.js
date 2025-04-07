// Stripe service for payment processing
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with the public key from environment variables
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripeSecretKey = import.meta.env.VITE_STRIPE_SECRET_KEY;

let stripePromise;

if (!stripePublicKey) {
  console.error('Stripe public key is missing. Please check your environment variables.');
  console.warn('Using Stripe with placeholder values. Payment features will not work properly.');
}

// Get the Stripe instance (lazy-loaded)
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublicKey || 'placeholder_key');
  }
  return stripePromise;
};

/**
 * Create a checkout session for subscription
 * @param {string} priceId - The Stripe price ID for the selected plan
 * @param {string} userId - The user ID for the customer
 * @param {string} customerEmail - The customer's email address
 * @param {boolean} isTrial - Whether this is a free trial signup
 * @returns {Promise<string>} - The checkout session URL
 */
export const createCheckoutSession = async (priceId, userId, customerEmail, isTrial = false) => {
  try {
    // In a real implementation, this would call your backend API
    // For now, we'll implement a client-side checkout flow for development
    
    // Get the Stripe instance
    const stripe = await getStripe();
    
    if (!stripe) {
      throw new Error('Stripe failed to initialize');
    }
    
    console.log(`Creating checkout session for: ${priceId}, ${userId}, ${customerEmail}, isTrial: ${isTrial}`);
    
    // In a production environment, you would create a checkout session through your backend
    // For development, we'll redirect to the success page directly
    // This simulates a successful payment flow
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Store checkout information for development purposes
    await storeCheckoutInfo(userId, priceId);
    
    return '/transcribe?checkout=success&plan=' + priceId;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

/**
 * Get subscription plans
 * @returns {Promise<Array>} - Array of subscription plans
 */
export const getSubscriptionPlans = async () => {
  // These would typically come from your backend, but for now we'll hardcode them
  // In a real implementation, you would fetch these from your backend which would get them from Stripe
  return [
    {
      id: 'monthly',
      name: 'Monthly',
      price: 16.99,
      interval: 'month',
      features: [
        'Unlimited transcriptions',
        'Advanced AI processing',
        'Priority support',
        'Cancel anytime'
      ],
      stripePriceId: 'price_monthly' // This would be the actual Stripe price ID in production
    },
    {
      id: 'yearly',
      name: 'Yearly',
      price: 156,
      interval: 'year',
      features: [
        'Everything in monthly plan',
        '2 months free',
        'Higher usage limits',
        'Premium support'
      ],
      stripePriceId: 'price_yearly' // This would be the actual Stripe price ID in production
    }
  ];
};

/**
 * Check subscription status
 * @param {string} userId - The user ID to check subscription for
 * @returns {Promise<Object>} - Subscription status information
 */
export const checkSubscriptionStatus = async (userId) => {
  try {
    // In a real implementation, this would call your backend API
    // which would check the subscription status in Stripe
    
    // For development, we'll check if there's a subscription in localStorage
    const storedCheckout = localStorage.getItem(`checkout_${userId}`);
    
    if (storedCheckout) {
      // Parse the stored checkout data
      const checkoutData = JSON.parse(storedCheckout);
      const now = new Date();
      
      // Calculate expiration date (30 days from checkout for monthly, 365 for yearly)
      const checkoutDate = new Date(checkoutData.date);
      const planType = checkoutData.plan.includes('yearly') ? 'yearly' : 'monthly';
      const daysToAdd = planType === 'yearly' ? 365 : 30;
      const expirationDate = new Date(checkoutDate);
      expirationDate.setDate(expirationDate.getDate() + daysToAdd);
      
      // Check if subscription is still active
      const isActive = now < expirationDate;
      
      return {
        active: isActive,
        plan: planType,
        currentPeriodEnd: expirationDate.toISOString(),
        cancelAtPeriodEnd: false,
        trialEnd: null
      };
    }
    
    // If no stored checkout, return inactive subscription
    return {
      active: false,
      plan: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      trialEnd: null
    };
  } catch (error) {
    console.error('Error checking subscription status:', error);
    // Return a default status for development
    return {
      active: false,
      plan: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      trialEnd: null
    };
  }
};

/**
 * Store checkout information for development purposes
 * @param {string} userId - The user ID
 * @param {string} planId - The plan ID
 * @returns {Promise<void>}
 */
export const storeCheckoutInfo = async (userId, planId) => {
  try {
    // Store checkout information in localStorage for development
    const checkoutInfo = {
      date: new Date().toISOString(),
      plan: planId,
      status: 'active'
    };
    
    localStorage.setItem(`checkout_${userId}`, JSON.stringify(checkoutInfo));
    return true;
  } catch (error) {
    console.error('Error storing checkout info:', error);
    return false;
  }
};