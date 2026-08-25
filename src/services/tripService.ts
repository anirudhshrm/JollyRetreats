import AuthService from '@/services/authService'
import { getApiBaseUrl } from '@/lib/api-base'

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

export type TripServiceType = 'property' | 'tour' | 'trek' | 'restaurant' | 'car'

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

const API_BASE = getApiBaseUrl('/api/trips')

class TripService {
  private getHeaders() {
    const token = AuthService.getToken()
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  }

  // List all trips for the user
  async listTrips(): Promise<Trip[]> {
    try {
      const response = await fetch(`${API_BASE}`, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error('Failed to fetch trips')
      }

      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error('Error fetching trips:', error)
      return []
    }
  }

  // Get a single trip
  async getTrip(id: string): Promise<Trip | null> {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error('Failed to fetch trip')
      }

      const result = await response.json()
      return result.data || null
    } catch (error) {
      console.error('Error fetching trip:', error)
      return null
    }
  }

  // Create a new trip
  async createTrip(input: {
    name: string
    destination: string
    startDate: string
    endDate: string
    travelers: number
  }): Promise<Trip | null> {
    try {
      const response = await fetch(`${API_BASE}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(input)
      })

      if (!response.ok) {
        throw new Error('Failed to create trip')
      }

      const result = await response.json()
      return result.data || null
    } catch (error) {
      console.error('Error creating trip:', error)
      return null
    }
  }

  // Update a trip
  async updateTrip(
    id: string,
    input: Partial<{
      name: string
      destination: string
      startDate: string
      endDate: string
      travelers: number
    }>
  ): Promise<Trip | null> {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(input)
      })

      if (!response.ok) {
        throw new Error('Failed to update trip')
      }

      const result = await response.json()
      return result.data || null
    } catch (error) {
      console.error('Error updating trip:', error)
      return null
    }
  }

  // Delete a trip
  async deleteTrip(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      return response.ok
    } catch (error) {
      console.error('Error deleting trip:', error)
      return false
    }
  }

  // Book a trip
  async bookTrip(id: string): Promise<Trip | null> {
    try {
      const response = await fetch(`${API_BASE}/${id}/book`, {
        method: 'POST',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error('Failed to book trip')
      }

      const result = await response.json()
      return result.data || null
    } catch (error) {
      console.error('Error booking trip:', error)
      return null
    }
  }

  // Reopen a trip
  async reopenTrip(id: string): Promise<Trip | null> {
    try {
      const response = await fetch(`${API_BASE}/${id}/reopen`, {
        method: 'POST',
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error('Failed to reopen trip')
      }

      const result = await response.json()
      return result.data || null
    } catch (error) {
      console.error('Error reopening trip:', error)
      return null
    }
  }

  // List items in a trip
  async listItems(tripId: string): Promise<TripItem[]> {
    try {
      const response = await fetch(`${API_BASE}/${tripId}/items`, {
        headers: this.getHeaders()
      })

      if (!response.ok) {
        throw new Error('Failed to fetch trip items')
      }

      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error('Error fetching trip items:', error)
      return []
    }
  }

  // Add an item to a trip
  async addItem(input: {
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
  }): Promise<TripItem | null> {
    try {
      const response = await fetch(`${API_BASE}/${input.tripId}/items`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(input)
      })

      if (!response.ok) {
        throw new Error('Failed to add item')
      }

      const result = await response.json()
      return result.data || null
    } catch (error) {
      console.error('Error adding item:', error)
      return null
    }
  }

  // Update a trip item
  async updateItem(
    tripId: string,
    itemId: string,
    input: Partial<TripItem>
  ): Promise<TripItem | null> {
    try {
      const response = await fetch(`${API_BASE}/${tripId}/items/${itemId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(input)
      })

      if (!response.ok) {
        throw new Error('Failed to update item')
      }

      const result = await response.json()
      return result.data || null
    } catch (error) {
      console.error('Error updating item:', error)
      return null
    }
  }

  // Remove an item from a trip
  async removeItem(tripId: string, itemId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/${tripId}/items/${itemId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      return response.ok
    } catch (error) {
      console.error('Error removing item:', error)
      return false
    }
  }
}

export default new TripService()
