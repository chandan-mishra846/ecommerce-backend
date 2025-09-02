import express from 'express';
import { 
  createRazorpayOrder, 
  verifyRazorpayPayment, 
  getRazorpayKey,
  handleRazorpayWebhook,
  createStripePaymentIntent,
  verifyStripePayment,
  getStripeKey,
  handleStripeWebhook
} from '../controller/paymentController.js';
import { verifyUserAuth } from '../middleware/userAuth.js';

const router = express.Router();

// ========== RAZORPAY ROUTES ==========
// Create Razorpay order
router.post('/razorpay/order', verifyUserAuth, createRazorpayOrder);

// Verify Razorpay payment and create order
router.post('/razorpay/verify', verifyUserAuth, verifyRazorpayPayment);

// Get Razorpay key
router.get('/razorpay/key', getRazorpayKey);

// Razorpay webhook
router.post('/razorpay/webhook', handleRazorpayWebhook);

// ========== STRIPE ROUTES ==========
// Create Stripe payment intent
router.post('/stripe/create-payment-intent', verifyUserAuth, createStripePaymentIntent);

// Verify Stripe payment and create order
router.post('/stripe/verify', verifyUserAuth, verifyStripePayment);

// Get Stripe publishable key
router.get('/stripe/key', getStripeKey);

// Stripe webhook
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

export default router;
