import express from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { normalizeWhitespace } from '../utils/validators.js'

const router = express.Router()

const suggestions = [
  'How do I book a tour?',
  'How can I download my invoice?',
  'Will I get a confirmation email?',
  'How do I rent a car?'
]

const includesAny = (text, terms) => terms.some((term) => text.includes(term))

const getReply = (message) => {
  const text = message.toLowerCase()

  if (includesAny(text, ['hello', 'hi', 'hey', 'help'])) {
    return 'Hi, I can help with Jolly Retreats bookings, tours, properties, cars, invoices, and confirmation emails.'
  }

  if (includesAny(text, ['invoice', 'receipt', 'bill', 'pdf', 'download'])) {
    return 'After a booking is confirmed, use the Download Invoice button on the confirmation screen. Tour and service invoices are downloaded from the server, while property invoices can also be previewed or printed.'
  }

  if (includesAny(text, ['email', 'confirmation', 'mail'])) {
    return 'When a reservation is confirmed, Jolly Retreats sends a confirmation email to the primary guest or traveler email. The email includes booking details and may include the invoice PDF.'
  }

  if (includesAny(text, ['tour', 'traveler', 'travelers'])) {
    return 'To book a tour, open a tour detail page, choose travel dates and traveler count, enter traveler details, review the summary, then confirm the booking.'
  }

  if (includesAny(text, ['property', 'stay', 'hotel', 'guest', 'guests'])) {
    return 'To reserve a property, choose a property, select check-in and check-out dates, enter guest details, then confirm the reservation from checkout.'
  }

  if (includesAny(text, ['car', 'rental', 'rent'])) {
    return 'To rent a car, open a car rental detail page, choose pickup details, enter traveler information, and confirm the booking. Car rental duration is limited by the booking rules.'
  }

  if (includesAny(text, ['trek', 'trekking', 'hike', 'hiking'])) {
    return 'Treks can be booked from the trek detail page. Pick the schedule, enter traveler details, and confirm once the summary looks correct.'
  }

  if (includesAny(text, ['restaurant', 'table', 'dining', 'food'])) {
    return 'Restaurant reservations are available from restaurant detail pages. Choose the schedule, party size, and contact details before confirming.'
  }

  if (includesAny(text, ['login', 'signup', 'account', 'password'])) {
    return 'Use Login or Signup from the navigation bar. If you forgot your password, use the Forgot Password link on the login page.'
  }

  if (includesAny(text, ['admin', 'dashboard', 'manage'])) {
    return 'Admin users can manage bookings, users, properties, tours, treks, restaurants, cars, and orders from the admin dashboard.'
  }

  return 'I can help with bookings, invoices, confirmation emails, tours, properties, treks, restaurants, car rentals, login, and admin dashboard questions.'
}

router.post('/', asyncHandler(async (req, res) => {
  const message = normalizeWhitespace(req.body?.message || '')

  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'Message is required'
    })
  }

  if (message.length > 500) {
    return res.status(400).json({
      success: false,
      message: 'Message must be 500 characters or less'
    })
  }

  return res.json({
    success: true,
    reply: getReply(message),
    suggestions
  })
}))

export default router
