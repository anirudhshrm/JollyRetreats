import { properties, restaurants, tours } from '@/lib/mock-data'

export const tripDestinations = Array.from(
  new Set([
    ...properties.map((property) => property.location),
    ...tours.map((tour) => tour.location),
    ...restaurants.map((restaurant) => restaurant.location)
  ])
).sort((left, right) => left.localeCompare(right))
