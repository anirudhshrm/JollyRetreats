export type TripServiceType = 'property' | 'tour' | 'trek' | 'restaurant' | 'car'

export interface Trip {
  id: string
  userId: string
  name: string
  destination: string
  startDate: string
  endDate: string
  travelers: number
  status: 'planning' | 'booked'
  createdAt: string
}

export interface TripItem {
  id: string
  tripId: string
  serviceType: TripServiceType
  serviceId: string
  serviceName: string
  location: string
  image?: string
  scheduledDate: string
  scheduledTime: string
  quantity: number
  unitPrice: number
  priceLabel: string
  notes?: string
  status: 'planned' | 'booked'
  createdAt: string
}

export interface TripInput {
  userId: string
  name: string
  destination: string
  startDate: string
  endDate: string
  travelers: number
}

export interface TripItemInput {
  tripId: string
  serviceType: TripServiceType
  serviceId: string
  serviceName: string
  location: string
  image?: string
  scheduledDate: string
  scheduledTime: string
  quantity: number
  unitPrice: number
  priceLabel: string
  notes?: string
}

export interface TripUpdateInput {
  name: string
  destination: string
  startDate: string
  endDate: string
  travelers: number
}

const TRIPS_KEY = 'jolly-retreats-trips'
const TRIP_ITEMS_KEY = 'jolly-retreats-trip-items'

const readStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

const writeStorage = <T,>(key: string, value: T) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export const tripPlanner = {
  listTrips(userId?: string) {
    const trips = readStorage<Trip[]>(TRIPS_KEY, [])
    return userId ? trips.filter((trip) => trip.userId === userId) : trips
  },

  getTrip(id: string) {
    return readStorage<Trip[]>(TRIPS_KEY, []).find((trip) => trip.id === id) || null
  },

  createTrip(input: TripInput) {
    const trip: Trip = {
      ...input,
      id: makeId('trip'),
      status: 'planning',
      createdAt: new Date().toISOString()
    }
    const trips = readStorage<Trip[]>(TRIPS_KEY, [])
    writeStorage(TRIPS_KEY, [trip, ...trips])
    return trip
  },

  deleteTrip(id: string) {
    writeStorage(TRIPS_KEY, readStorage<Trip[]>(TRIPS_KEY, []).filter((trip) => trip.id !== id))
    writeStorage(TRIP_ITEMS_KEY, readStorage<TripItem[]>(TRIP_ITEMS_KEY, []).filter((item) => item.tripId !== id))
  },

  updateTrip(id: string, input: TripUpdateInput) {
    const trips = readStorage<Trip[]>(TRIPS_KEY, [])
    const updatedTrips = trips.map((trip) =>
      trip.id === id ? { ...trip, ...input } : trip
    )
    writeStorage(TRIPS_KEY, updatedTrips)
    return updatedTrips.find((trip) => trip.id === id) || null
  },

  bookTrip(id: string) {
    const trips = readStorage<Trip[]>(TRIPS_KEY, [])
    const items = readStorage<TripItem[]>(TRIP_ITEMS_KEY, [])
    const updatedTrips = trips.map((trip) =>
      trip.id === id ? { ...trip, status: 'booked' as const } : trip
    )
    const updatedItems = items.map((item) =>
      item.tripId === id ? { ...item, status: 'booked' as const } : item
    )
    writeStorage(TRIPS_KEY, updatedTrips)
    writeStorage(TRIP_ITEMS_KEY, updatedItems)
  },

  reopenTrip(id: string) {
    const trips = readStorage<Trip[]>(TRIPS_KEY, [])
    const items = readStorage<TripItem[]>(TRIP_ITEMS_KEY, [])
    const updatedTrips = trips.map((trip) =>
      trip.id === id ? { ...trip, status: 'planning' as const } : trip
    )
    const updatedItems = items.map((item) =>
      item.tripId === id ? { ...item, status: 'planned' as const } : item
    )
    writeStorage(TRIPS_KEY, updatedTrips)
    writeStorage(TRIP_ITEMS_KEY, updatedItems)
  },

  listItems(tripId: string) {
    return readStorage<TripItem[]>(TRIP_ITEMS_KEY, [])
      .filter((item) => item.tripId === tripId)
      .sort((left, right) => `${left.scheduledDate} ${left.scheduledTime}`.localeCompare(`${right.scheduledDate} ${right.scheduledTime}`))
  },

  addItem(input: TripItemInput) {
    const item: TripItem = {
      ...input,
      id: makeId('trip-item'),
      status: 'planned',
      createdAt: new Date().toISOString()
    }
    const items = readStorage<TripItem[]>(TRIP_ITEMS_KEY, [])
    writeStorage(TRIP_ITEMS_KEY, [item, ...items])
    return item
  },

  removeItem(id: string) {
    writeStorage(TRIP_ITEMS_KEY, readStorage<TripItem[]>(TRIP_ITEMS_KEY, []).filter((item) => item.id !== id))
  }
}

export const getTripDates = (trip: Pick<Trip, 'startDate' | 'endDate'>) => {
  const dates: string[] = []
  const current = new Date(`${trip.startDate}T00:00:00`)
  const end = new Date(`${trip.endDate}T00:00:00`)

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }

  return dates
}

export const formatTripDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

export const getTripItemTotal = (item: Pick<TripItem, 'unitPrice' | 'quantity'>) =>
  Number(item.unitPrice || 0) * Math.max(1, Number(item.quantity || 1))
