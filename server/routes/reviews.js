import express from 'express'
import { asyncHandler } from '../middleware/errorHandler.js'
import { requireAuth, requireUser } from '../middleware/auth.js'
import { isDbConnected } from '../config/runtime.js'
import { reviewsModel } from '../models/reviewsModel.js'
import { fallbackReviewsModel } from '../models/fallbackModels.js'
import { normalizeWhitespace, validServiceTypes } from '../utils/validators.js'

const router = express.Router()
const store = () => (isDbConnected() ? reviewsModel : fallbackReviewsModel)

const parseService = (req, res) => {
  const serviceType = String(req.params.serviceType || req.body.serviceType || '')
  const serviceId = Number(req.params.serviceId || req.body.serviceId)

  if (!validServiceTypes.has(serviceType)) {
    res.status(400).json({ success: false, message: 'Invalid service type' })
    return null
  }
  if (!Number.isInteger(serviceId) || serviceId <= 0) {
    res.status(400).json({ success: false, message: 'serviceId must be a positive integer' })
    return null
  }

  return { serviceType, serviceId }
}

router.get('/:serviceType/:serviceId', asyncHandler(async (req, res) => {
  const service = parseService(req, res)
  if (!service) return

  const data = await store().listByService(service.serviceType, service.serviceId)
  res.json({ success: true, data })
}))

router.get('/:serviceType/:serviceId/me', requireAuth, asyncHandler(async (req, res) => {
  const service = parseService(req, res)
  if (!service) return

  const [eligible, review] = await Promise.all([
    store().hasEligibleBooking(req.user.id, service.serviceType, service.serviceId),
    store().getUserReview(req.user.id, service.serviceType, service.serviceId)
  ])
  res.json({ success: true, data: { eligible, review } })
}))

router.post('/', requireAuth, requireUser, asyncHandler(async (req, res) => {
  const service = parseService(req, res)
  if (!service) return

  const rating = Number(req.body.rating)
  const comment = normalizeWhitespace(req.body.comment || '')

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' })
  }
  if (comment.length < 10 || comment.length > 500) {
    return res.status(400).json({ success: false, message: 'Review must be between 10 and 500 characters' })
  }

  const eligible = await store().hasEligibleBooking(req.user.id, service.serviceType, service.serviceId)
  if (!eligible) {
    return res.status(403).json({
      success: false,
      message: 'You can review this service after you have a completed or confirmed booking.'
    })
  }

  const review = await store().upsert({
    userId: Number(req.user.id),
    serviceType: service.serviceType,
    serviceId: service.serviceId,
    rating,
    comment
  })
  const data = await store().listByService(service.serviceType, service.serviceId)
  res.status(201).json({ success: true, data: { review, ...data } })
}))

export default router
