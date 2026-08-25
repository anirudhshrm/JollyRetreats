import express from 'express'
import { tripsModel } from '../models/tripsModel.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'

const router = express.Router()

const ownsTrip = (trip, userId) => String(trip.userId) === String(userId)

const findOwnedTrip = async (req, res) => {
  const trip = await tripsModel.getTrip(req.params.id || req.params.tripId)
  if (!trip) {
    res.status(404).json({
      success: false,
      message: 'Trip not found'
    })
    return null
  }
  if (!ownsTrip(trip, req.user.id)) {
    res.status(403).json({
      success: false,
      message: 'Unauthorized'
    })
    return null
  }
  return trip
}

router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const trips = await tripsModel.listTrips(req.user.id)
  res.json({
    success: true,
    data: trips
  })
}))

router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const trip = await findOwnedTrip(req, res)
  if (!trip) return

  res.json({
    success: true,
    data: trip
  })
}))

router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { name, destination, startDate, endDate, travelers } = req.body

  if (!name || !destination || !startDate || !endDate || travelers === undefined) {
    return res.status(400).json({
      success: false,
      message: 'name, destination, startDate, endDate, and travelers are required'
    })
  }

  const trip = await tripsModel.createTrip({
    userId: req.user.id,
    name,
    destination,
    startDate,
    endDate,
    travelers
  })

  res.status(201).json({
    success: true,
    data: trip
  })
}))

router.put('/:id', requireAuth, asyncHandler(async (req, res) => {
  const trip = await findOwnedTrip(req, res)
  if (!trip) return

  const updated = await tripsModel.updateTrip(req.params.id, req.body)
  res.json({
    success: true,
    data: updated
  })
}))

router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const trip = await findOwnedTrip(req, res)
  if (!trip) return

  await tripsModel.deleteTrip(req.params.id)
  res.json({
    success: true,
    message: 'Trip deleted'
  })
}))

router.post('/:id/book', requireAuth, asyncHandler(async (req, res) => {
  const trip = await findOwnedTrip(req, res)
  if (!trip) return

  const updated = await tripsModel.bookTrip(req.params.id)
  res.json({
    success: true,
    data: updated
  })
}))

router.post('/:id/reopen', requireAuth, asyncHandler(async (req, res) => {
  const trip = await findOwnedTrip(req, res)
  if (!trip) return

  const updated = await tripsModel.reopenTrip(req.params.id)
  res.json({
    success: true,
    data: updated
  })
}))

router.get('/:id/items', requireAuth, asyncHandler(async (req, res) => {
  const trip = await findOwnedTrip(req, res)
  if (!trip) return

  const items = await tripsModel.listItems(req.params.id)
  res.json({
    success: true,
    data: items
  })
}))

router.post('/:id/items', requireAuth, asyncHandler(async (req, res) => {
  const trip = await findOwnedTrip(req, res)
  if (!trip) return

  const {
    serviceType,
    serviceId,
    serviceName,
    location,
    image,
    scheduledDate,
    scheduledTime,
    quantity,
    unitPrice,
    priceLabel,
    notes
  } = req.body

  if (!serviceType || !serviceId || !serviceName || !location || !scheduledDate || !scheduledTime || quantity === undefined || unitPrice === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    })
  }

  const item = await tripsModel.addItem({
    tripId: req.params.id,
    serviceType,
    serviceId,
    serviceName,
    location,
    image,
    scheduledDate,
    scheduledTime,
    quantity,
    unitPrice,
    priceLabel,
    notes
  })

  res.status(201).json({
    success: true,
    data: item
  })
}))

router.put('/:tripId/items/:itemId', requireAuth, asyncHandler(async (req, res) => {
  const trip = await findOwnedTrip(req, res)
  if (!trip) return

  const item = await tripsModel.updateItem(req.params.itemId, req.body)
  if (!item) {
    return res.status(404).json({
      success: false,
      message: 'Item not found'
    })
  }

  res.json({
    success: true,
    data: item
  })
}))

router.delete('/:tripId/items/:itemId', requireAuth, asyncHandler(async (req, res) => {
  const trip = await findOwnedTrip(req, res)
  if (!trip) return

  await tripsModel.removeItem(req.params.itemId)
  res.json({
    success: true,
    message: 'Item removed'
  })
}))

export default router
