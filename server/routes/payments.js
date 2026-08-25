import express from 'express'
import Stripe from 'stripe'
import { query } from '../config/db.js'

const router = express.Router()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder')

/**
 * POST /api/payments/create-intent
 * Create a Stripe Payment Intent for advance payment
 */
router.post('/create-intent', async (req, res) => {
  try {
    const userId = req.userId // Set by auth middleware
    const { bookingId, amount } = req.body

    if (!bookingId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bookingId or amount'
      })
    }

    // Verify booking exists and belongs to user
    const [booking] = await query('SELECT id, user_id FROM bookings WHERE id = ?', [bookingId])

    if (!booking || booking.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Booking not found or unauthorized'
      })
    }

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        bookingId: String(bookingId),
        userId: String(userId)
      }
    })

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        amount,
        currency: 'usd'
      }
    })
  } catch (error) {
    console.error('Payment intent creation error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create payment intent'
    })
  }
})

/**
 * POST /api/payments/confirm
 * Confirm payment after successful Stripe processing
 */
router.post('/confirm', async (req, res) => {
  try {
    const userId = req.userId
    const { bookingId, paymentIntentId } = req.body

    if (!bookingId || !paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bookingId or paymentIntentId'
      })
    }

    // Verify booking and payment
    const [booking] = await query('SELECT id, user_id FROM bookings WHERE id = ?', [bookingId])

    if (!booking || booking.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      })
    }

    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not successful'
      })
    }

    // Record payment in database (create a payment record)
    const paymentResult = await query(
      `INSERT INTO payments (booking_id, user_id, stripe_payment_intent_id, amount, currency, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        bookingId,
        userId,
        paymentIntentId,
        paymentIntent.amount / 100, // Convert from cents
        paymentIntent.currency,
        'completed'
      ]
    ).catch(() => null)

    const paymentId = paymentResult?.insertId || paymentIntentId

    res.json({
      success: true,
      data: {
        success: true,
        paymentId: paymentId || paymentIntentId,
        bookingId
      }
    })
  } catch (error) {
    console.error('Payment confirmation error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Payment confirmation failed'
    })
  }
})

/**
 * Webhook endpoint for Stripe events (optional, for production)
 * POST /api/payments/webhook
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    return res.status(400).json({ received: true })
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)

    // Handle relevant events
    if (event.type === 'payment_intent.succeeded') {
      console.log('Payment succeeded:', event.data.object)
    } else if (event.type === 'payment_intent.payment_failed') {
      console.log('Payment failed:', event.data.object)
    }

    res.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(400).send(`Webhook Error: ${error instanceof Error ? error.message : 'Unknown'}`)
  }
})

export default router
