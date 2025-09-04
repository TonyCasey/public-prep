
import Stripe from 'stripe';

// Environment-specific Stripe configuration
function getStripeSecretKey() {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction 
    ? process.env.STRIPE_SECRET_KEY
    : (process.env.STRIPE_SECRET_KEY_DEV || process.env.STRIPE_SECRET_KEY);
}

const STRIPE_SECRET_KEY = getStripeSecretKey();
const isStripeEnabled = !!STRIPE_SECRET_KEY;

console.log('Stripe configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  isProduction: process.env.NODE_ENV === 'production',
  usingDevKey: !!process.env.STRIPE_SECRET_KEY_DEV,
  keyType: STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'test' : STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 'unknown'
});

export const stripe = isStripeEnabled ? new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil',
}) : null;

export async function createCheckoutSession(customerId: string, priceId: string, successUrl: string, cancelUrl: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }
  
  console.log('Creating Stripe checkout session with params:', {
    customerId,
    priceId,
    successUrl,
    cancelUrl
  });
  
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    automatic_tax: { enabled: false },
    billing_address_collection: 'auto',
    // Remove shipping address collection for digital products
    // shipping_address_collection: {
    //   allowed_countries: ['IE', 'GB', 'US', 'CA', 'AU'],
    // },
  });
  
  console.log('Stripe session created successfully:', {
    id: session.id,
    url: session.url,
    mode: session.mode,
    status: session.status
  });
  
  return session;
}

export async function createCustomer(email: string, name?: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }
  return await stripe.customers.create({
    email,
    name,
  });
}

export async function getSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }
  return await stripe.subscriptions.retrieve(subscriptionId);
}

export async function cancelSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }
  return await stripe.subscriptions.cancel(subscriptionId);
}

export async function constructWebhookEvent(body: any, signature: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }
  
  // Use environment-specific webhook secret
  const isProduction = process.env.NODE_ENV === 'production';
  const webhookSecret = isProduction 
    ? process.env.STRIPE_WEBHOOK_SECRET
    : (process.env.STRIPE_WEBHOOK_SECRET_DEV || process.env.STRIPE_WEBHOOK_SECRET);
    
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
  }
  
  console.log('Webhook configuration:', {
    NODE_ENV: process.env.NODE_ENV,
    isProduction,
    usingDevSecret: !!process.env.STRIPE_WEBHOOK_SECRET_DEV,
    webhookSecretType: webhookSecret?.startsWith('whsec_') ? 'valid' : 'invalid'
  });
  
  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}
