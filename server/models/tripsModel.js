import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { query } from '../config/db.js'
import { isDbConnected } from '../config/runtime.js'
import { buildUpdateClause } from './modelUtils.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tripsFile = path.join(__dirname, '../data/trips.json')

const ensureFile = () => {
  const dataDir = path.dirname(tripsFile)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  if (!fs.existsSync(tripsFile)) {
    fs.writeFileSync(tripsFile, JSON.stringify({ trips: [], tripItems: [] }, null, 2))
  }
}

const readTripsData = () => {
  ensureFile()
  const data = fs.readFileSync(tripsFile, 'utf-8')
  return JSON.parse(data)
}

const writeTripsData = (data) => {
  fs.writeFileSync(tripsFile, JSON.stringify(data, null, 2))
}

const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const formatDateOnly = (value) => {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString().split('T')[0]
  return String(value).split('T')[0]
}

const formatTimeOnly = (value) => {
  if (!value) return ''
  return String(value).slice(0, 5)
}

const mapTrip = (row) => ({
  id: row.id,
  userId: String(row.user_id),
  name: row.name,
  destination: row.destination,
  startDate: formatDateOnly(row.start_date),
  endDate: formatDateOnly(row.end_date),
  travelers: Number(row.travelers),
  status: row.status,
  createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
})

const mapTripItem = (row) => ({
  id: row.id,
  tripId: row.trip_id,
  serviceType: row.service_type,
  serviceId: String(row.service_id),
  serviceName: row.service_name,
  location: row.location,
  image: row.image || undefined,
  scheduledDate: formatDateOnly(row.scheduled_date),
  scheduledTime: formatTimeOnly(row.scheduled_time),
  quantity: Number(row.quantity),
  unitPrice: Number(row.unit_price),
  priceLabel: row.price_label || '',
  notes: row.notes || '',
  status: row.status,
  createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
})

const jsonTripsModel = {
  listTrips(userId) {
    if (!userId) return []
    const data = readTripsData()
    return data.trips.filter((trip) => String(trip.userId) === String(userId))
  },

  getTrip(id) {
    const data = readTripsData()
    return data.trips.find((trip) => trip.id === id) || null
  },

  createTrip(input) {
    const data = readTripsData()
    const trip = {
      id: generateId('trip'),
      userId: String(input.userId),
      name: input.name,
      destination: input.destination,
      startDate: input.startDate,
      endDate: input.endDate,
      travelers: input.travelers,
      status: 'planning',
      createdAt: new Date().toISOString()
    }
    data.trips.push(trip)
    writeTripsData(data)
    return trip
  },

  updateTrip(id, input) {
    const data = readTripsData()
    const tripIndex = data.trips.findIndex((trip) => trip.id === id)
    if (tripIndex === -1) return null

    const updated = {
      ...data.trips[tripIndex],
      ...input
    }
    data.trips[tripIndex] = updated
    writeTripsData(data)
    return updated
  },

  deleteTrip(id) {
    const data = readTripsData()
    data.trips = data.trips.filter((trip) => trip.id !== id)
    data.tripItems = data.tripItems.filter((item) => item.tripId !== id)
    writeTripsData(data)
    return true
  },

  bookTrip(id) {
    const data = readTripsData()
    const tripIndex = data.trips.findIndex((trip) => trip.id === id)
    if (tripIndex === -1) return null

    data.trips[tripIndex].status = 'booked'
    data.tripItems.forEach((item) => {
      if (item.tripId === id) item.status = 'booked'
    })
    writeTripsData(data)
    return data.trips[tripIndex]
  },

  reopenTrip(id) {
    const data = readTripsData()
    const tripIndex = data.trips.findIndex((trip) => trip.id === id)
    if (tripIndex === -1) return null

    data.trips[tripIndex].status = 'planning'
    data.tripItems.forEach((item) => {
      if (item.tripId === id) item.status = 'planned'
    })
    writeTripsData(data)
    return data.trips[tripIndex]
  },

  listItems(tripId) {
    const data = readTripsData()
    return data.tripItems
      .filter((item) => item.tripId === tripId)
      .sort((left, right) => `${left.scheduledDate} ${left.scheduledTime}`.localeCompare(`${right.scheduledDate} ${right.scheduledTime}`))
  },

  addItem(input) {
    const data = readTripsData()
    const item = {
      id: generateId('trip-item'),
      tripId: input.tripId,
      serviceType: input.serviceType,
      serviceId: String(input.serviceId),
      serviceName: input.serviceName,
      location: input.location,
      image: input.image,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      priceLabel: input.priceLabel,
      notes: input.notes,
      status: 'planned',
      createdAt: new Date().toISOString()
    }
    data.tripItems.push(item)
    writeTripsData(data)
    return item
  },

  updateItem(id, input) {
    const data = readTripsData()
    const itemIndex = data.tripItems.findIndex((item) => item.id === id)
    if (itemIndex === -1) return null

    const updated = {
      ...data.tripItems[itemIndex],
      ...input
    }
    data.tripItems[itemIndex] = updated
    writeTripsData(data)
    return updated
  },

  removeItem(id) {
    const data = readTripsData()
    data.tripItems = data.tripItems.filter((item) => item.id !== id)
    writeTripsData(data)
    return true
  }
}

export const tripsModel = {
  async listTrips(userId) {
    if (!isDbConnected()) return jsonTripsModel.listTrips(userId)
    const rows = await query(
      `SELECT * FROM trips WHERE user_id = ? ORDER BY created_at DESC`,
      [String(userId)]
    )
    return rows.map(mapTrip)
  },

  async getTrip(id) {
    if (!isDbConnected()) return jsonTripsModel.getTrip(id)
    const rows = await query(`SELECT * FROM trips WHERE id = ? LIMIT 1`, [id])
    return rows[0] ? mapTrip(rows[0]) : null
  },

  async createTrip(input) {
    if (!isDbConnected()) return jsonTripsModel.createTrip(input)

    const id = generateId('trip')
    await query(
      `INSERT INTO trips (id, user_id, name, destination, start_date, end_date, travelers, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'planning')`,
      [id, String(input.userId), input.name, input.destination, input.startDate, input.endDate, input.travelers]
    )
    return this.getTrip(id)
  },

  async updateTrip(id, input) {
    if (!isDbConnected()) return jsonTripsModel.updateTrip(id, input)
    const update = buildUpdateClause({
      name: input.name,
      destination: input.destination,
      start_date: input.startDate,
      end_date: input.endDate,
      travelers: input.travelers,
      status: input.status
    })

    if (update) {
      await query(`UPDATE trips SET ${update.setClause} WHERE id = ?`, [...update.values, id])
    }

    return this.getTrip(id)
  },

  async deleteTrip(id) {
    if (!isDbConnected()) return jsonTripsModel.deleteTrip(id)
    await query(`DELETE FROM trips WHERE id = ?`, [id])
    return true
  },

  async bookTrip(id) {
    if (!isDbConnected()) return jsonTripsModel.bookTrip(id)
    await query(`UPDATE trips SET status = 'booked' WHERE id = ?`, [id])
    await query(`UPDATE trip_items SET status = 'booked' WHERE trip_id = ?`, [id])
    return this.getTrip(id)
  },

  async reopenTrip(id) {
    if (!isDbConnected()) return jsonTripsModel.reopenTrip(id)
    await query(`UPDATE trips SET status = 'planning' WHERE id = ?`, [id])
    await query(`UPDATE trip_items SET status = 'planned' WHERE trip_id = ?`, [id])
    return this.getTrip(id)
  },

  async listItems(tripId) {
    if (!isDbConnected()) return jsonTripsModel.listItems(tripId)
    const rows = await query(
      `SELECT * FROM trip_items WHERE trip_id = ? ORDER BY scheduled_date ASC, scheduled_time ASC`,
      [tripId]
    )
    return rows.map(mapTripItem)
  },

  async addItem(input) {
    if (!isDbConnected()) return jsonTripsModel.addItem(input)

    const id = generateId('trip-item')
    await query(
      `INSERT INTO trip_items
         (id, trip_id, service_type, service_id, service_name, location, image, scheduled_date,
          scheduled_time, quantity, unit_price, price_label, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'planned')`,
      [
        id,
        input.tripId,
        input.serviceType,
        String(input.serviceId),
        input.serviceName,
        input.location,
        input.image || null,
        input.scheduledDate,
        input.scheduledTime,
        input.quantity,
        input.unitPrice,
        input.priceLabel || null,
        input.notes || null
      ]
    )

    const rows = await query(`SELECT * FROM trip_items WHERE id = ? LIMIT 1`, [id])
    return rows[0] ? mapTripItem(rows[0]) : null
  },

  async updateItem(id, input) {
    if (!isDbConnected()) return jsonTripsModel.updateItem(id, input)
    const update = buildUpdateClause({
      service_type: input.serviceType,
      service_id: input.serviceId !== undefined ? String(input.serviceId) : undefined,
      service_name: input.serviceName,
      location: input.location,
      image: input.image,
      scheduled_date: input.scheduledDate,
      scheduled_time: input.scheduledTime,
      quantity: input.quantity,
      unit_price: input.unitPrice,
      price_label: input.priceLabel,
      notes: input.notes,
      status: input.status
    })

    if (update) {
      await query(`UPDATE trip_items SET ${update.setClause} WHERE id = ?`, [...update.values, id])
    }

    const rows = await query(`SELECT * FROM trip_items WHERE id = ? LIMIT 1`, [id])
    return rows[0] ? mapTripItem(rows[0]) : null
  },

  async removeItem(id) {
    if (!isDbConnected()) return jsonTripsModel.removeItem(id)
    await query(`DELETE FROM trip_items WHERE id = ?`, [id])
    return true
  }
}
