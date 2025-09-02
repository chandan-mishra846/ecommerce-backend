import express from 'express';
import Razorpay from 'razorpay';
import Stripe from 'stripe';
import crypto from 'crypto';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import HandleError from '../utils/handleError.js';
import handleAsynError from '../middleware/handleAsynError.js';
import { verifyUserAuth } from '../middleware/userAuth.js';

const router = express.Router();

// Initialize Razorpay (will be created when needed)
let razorpay = null;

// Initialize Stripe (will be created when needed)
let stripe = null;

const initializeRazorpay = () => {
  if (!razorpay && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
};

const initializeStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

// Create Razorpay Order
export const createRazorpayOrder = handleAsynError(async (req, res, next) => {
  const { amount, currency = 'INR' } = req.body;

  if (!amount) {
    return next(new HandleError('Amount is required', 400));
  }

  // Demo Mode - Skip Razorpay API calls
  if (process.env.DEMO_MODE === 'true') {
    const demoOrder = {
      id: `order_demo_${Date.now()}`,
      entity: 'order',
      amount: amount,
      amount_paid: 0,
      amount_due: amount,
      currency: currency,
      receipt: `demo_receipt_${Date.now()}`,
      status: 'created',
      attempts: 0,
      notes: [],
      created_at: Math.floor(Date.now() / 1000)
    };

    return res.status(200).json({
      success: true,
      order: demoOrder,
      demo: true,
    });
  }

  const razorpayInstance = initializeRazorpay();
  if (!razorpayInstance) {
    return next(new HandleError('Razorpay configuration missing', 500));
  }

  const options = {
    amount: amount, // amount in paise
    currency: currency,
    receipt: `order_${Date.now()}`,
  };

  try {
    const order = await razorpayInstance.orders.create(options);
    
    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return next(new HandleError('Failed to create payment order', 500));
  }
});

// Verify Razorpay Payment and Create Order
export const verifyRazorpayPayment = handleAsynError(async (req, res, next) => {
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    shippingInfo,
    orderItems,
    PaymentInfo,
    itemPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  // Verify payment signature
  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpaySignature;

  if (!isAuthentic) {
    return next(new HandleError('Payment verification failed', 400));
  }

  // Verify payment status with Razorpay
  try {
    const razorpayInstance = initializeRazorpay();
    if (!razorpayInstance) {
      return next(new HandleError('Razorpay configuration missing', 500));
    }

    const payment = await razorpayInstance.payments.fetch(razorpayPaymentId);
    
    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return next(new HandleError('Payment not successful', 400));
    }

    // Validate and parse numeric fields
    const pincode = parseInt(shippingInfo.pinCode || shippingInfo.pincode);
    const phoneNumber = parseInt(shippingInfo.phoneNo || shippingInfo.phoneNumber);
    
    if (isNaN(pincode)) {
      return next(new HandleError('Invalid pincode format. Please enter a valid numeric pincode.', 400));
    }
    
    if (isNaN(phoneNumber)) {
      return next(new HandleError('Invalid phone number format. Please enter a valid numeric phone number.', 400));
    }

      const orderData = {
        shippingInfo: {
          address: shippingInfo.address,
          city: shippingInfo.city,
          state: shippingInfo.state,
          country: shippingInfo.country,
          pincode: pincode,
          phoneNumber: phoneNumber
        },
        orderItems: orderItems.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          product: item.product
        })),
        PaymentInfo: {
          id: razorpayPaymentId,
          status: payment.status === 'captured' ? 'succeeded' : 'pending',
        },
        itemPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paidAt: Date.now(),
        user: req.user._id,
      };

      // Create order after successful payment verification
      const order = await Order.create(orderData);

    // Update product stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock -= item.quantity;
        await product.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order,
      paymentId: razorpayPaymentId,
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return next(new HandleError('Payment verification failed', 500));
  }
});

// Get Razorpay Key (for frontend)
export const getRazorpayKey = handleAsynError(async (req, res, next) => {
  res.status(200).json({
    success: true,
    key: process.env.RAZORPAY_KEY_ID,
  });
});

// ========== STRIPE PAYMENT METHODS ==========

// Create Stripe Payment Intent
export const createStripePaymentIntent = handleAsynError(async (req, res, next) => {
  const { amount, currency = 'usd', metadata = {} } = req.body;

  if (!amount) {
    return next(new HandleError('Amount is required', 400));
  }

  // Test mode simulation - create a mock payment intent for development
  if (process.env.NODE_ENV === 'development' || !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('test_51S2w0oEjIfyJXotvGmAvK01yWZS9iivjpD9u8tPcAsE5P5QWDYHaj4Kx9IqIC7Lon5KVQ8SWYZYAR8gxTQt3Z5zu00QpYT6j42')) {
    // Create a mock client secret for testing
    const mockClientSecret = `pi_test_${Date.now()}_secret_${Math.random().toString(36).substring(7)}`;
    
    console.log('🧪 Test Mode: Creating mock payment intent for amount:', amount);
    
    return res.status(200).json({
      success: true,
      clientSecret: mockClientSecret,
      paymentIntentId: `pi_test_${Date.now()}`,
      testMode: true,
      message: 'Test payment intent created successfully'
    });
  }

  const stripeInstance = initializeStripe();
  if (!stripeInstance) {
    return next(new HandleError('Stripe configuration missing', 500));
  }

  try {
    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        userId: req.user?._id?.toString(),
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Stripe payment intent creation error:', error);
    return next(new HandleError('Failed to create payment intent', 500));
  }
});

// Verify Stripe Payment and Create Order
export const verifyStripePayment = handleAsynError(async (req, res, next) => {
  const {
    paymentIntentId,
    shippingInfo,
    orderItems,
    PaymentInfo,
    itemPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  if (!paymentIntentId) {
    return next(new HandleError('Payment Intent ID is required', 400));
  }

  // Test mode simulation - skip Stripe verification for test payments
  if (paymentIntentId.startsWith('pi_test_') || process.env.NODE_ENV === 'development') {
    console.log('🧪 Test Mode: Simulating successful payment verification for:', paymentIntentId);
    
    // Validate and parse numeric fields
    const pincode = parseInt(shippingInfo.pinCode || shippingInfo.pincode);
    const phoneNumber = parseInt(shippingInfo.phoneNo || shippingInfo.phoneNumber);
    
    if (isNaN(pincode)) {
      return next(new HandleError('Invalid pincode format. Please enter a valid numeric pincode.', 400));
    }
    
    if (isNaN(phoneNumber)) {
      return next(new HandleError('Invalid phone number format. Please enter a valid numeric phone number.', 400));
    }
    
    const orderData = {
      shippingInfo: {
        address: shippingInfo.address,
        city: shippingInfo.city,
        state: shippingInfo.state,
        country: shippingInfo.country,
        pincode: pincode,
        phoneNumber: phoneNumber
      },
      orderItems: orderItems.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        product: item.product
      })),
      PaymentInfo: {
        id: paymentIntentId,
        status: 'succeeded',
        paymentMethod: 'stripe_test',
      },
      itemPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      paidAt: Date.now(),
      user: req.user._id,
    };

    // Create order after successful payment verification
    const order = await Order.create(orderData);

    // Update product stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock -= item.quantity;
        await product.save();
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Test order placed successfully with Stripe',
      order,
      paymentId: paymentIntentId,
      testMode: true
    });
  }

  const stripeInstance = initializeStripe();
  if (!stripeInstance) {
    return next(new HandleError('Stripe configuration missing', 500));
  }

  try {
    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripeInstance.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return next(new HandleError('Payment not completed', 400));
    }

    // Verify the amount matches
    const expectedAmount = Math.round(totalPrice * 100);
    if (paymentIntent.amount !== expectedAmount) {
      return next(new HandleError('Payment amount mismatch', 400));
    }

    const orderData = {
      shippingInfo: {
        address: shippingInfo.address,
        city: shippingInfo.city,
        state: shippingInfo.state,
        country: shippingInfo.country,
        pincode: parseInt(shippingInfo.pinCode),
        phoneNumber: parseInt(shippingInfo.phoneNo)
      },
      orderItems: orderItems.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        product: item.product
      })),
      PaymentInfo: {
        id: paymentIntent.id,
        status: 'succeeded',
        paymentMethod: 'stripe',
      },
      itemPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      paidAt: Date.now(),
      user: req.user._id,
    };

    // Create order after successful payment verification
    const order = await Order.create(orderData);

    // Update product stock
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock -= item.quantity;
        await product.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully with Stripe',
      order,
      paymentId: paymentIntent.id,
    });

  } catch (error) {
    console.error('Stripe payment verification error:', error);
    return next(new HandleError('Payment verification failed', 500));
  }
});

// Get Stripe Publishable Key (for frontend)
export const getStripeKey = handleAsynError(async (req, res, next) => {
  res.status(200).json({
    success: true,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

// Razorpay webhook handler (optional, for additional security)
export const handleRazorpayWebhook = handleAsynError(async (req, res, next) => {
  const webhookSignature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(200).json({ status: 'ok' });
  }

  const body = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  if (webhookSignature !== expectedSignature) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const event = req.body.event;
  const payment = req.body.payload.payment.entity;

  // Handle different webhook events
  switch (event) {
    case 'payment.captured':
      // Update order status if needed
      console.log('Payment captured:', payment.id);
      break;
    case 'payment.failed':
      // Handle failed payment
      console.log('Payment failed:', payment.id);
      break;
    default:
      console.log('Unhandled webhook event:', event);
  }

  res.status(200).json({ status: 'ok' });
});

// Stripe webhook handler
export const handleStripeWebhook = handleAsynError(async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    return res.status(200).json({ received: true });
  }

  const stripeInstance = initializeStripe();
  if (!stripeInstance) {
    console.error('Stripe not initialized for webhook');
    return res.status(500).json({ error: 'Stripe configuration missing' });
  }

  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent was successful!', paymentIntent.id);
      // You can add additional logic here like sending confirmation emails
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('PaymentIntent failed!', failedPayment.id);
      // Handle failed payment
      break;
    case 'charge.dispute.created':
      const dispute = event.data.object;
      console.log('Charge dispute created:', dispute.id);
      // Handle dispute
      break;
    default:
      console.log(`Unhandled Stripe event type ${event.type}`);
  }

  res.status(200).json({ received: true });
});

export default router;
