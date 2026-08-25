import { getApiBaseUrl } from '@/lib/api-base'
import type { SupportedServiceType } from '@/services/bookingApi'

const API_BASE = getApiBaseUrl('/api')

type ApiResponse<T> = {
  success: boolean
  data?: T
  message?: string
}

export type Review = {
  id: number
  user_id: number
  user_name: string
  service_type: SupportedServiceType
  service_id: number
  rating: number
  comment: string
  created_at: string
  updated_at: string
}

export type ReviewsSummary = {
  averageRating: number
  count: number
}

export type ReviewsPayload = {
  reviews: Review[]
  summary: ReviewsSummary
}

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, init)
  const payload = (await response.json()) as ApiResponse<T>
  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.message || 'Request failed')
  }
  return payload.data
}

export const reviewsApi = {
  list(serviceType: SupportedServiceType, serviceId: number) {
    return fetchJson<ReviewsPayload>(`${API_BASE}/reviews/${serviceType}/${serviceId}`)
  },

  me(token: string, serviceType: SupportedServiceType, serviceId: number) {
    return fetchJson<{ eligible: boolean; review: Review | null }>(
      `${API_BASE}/reviews/${serviceType}/${serviceId}/me`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
  },

  submit(token: string, input: {
    serviceType: SupportedServiceType
    serviceId: number
    rating: number
    comment: string
  }) {
    return fetchJson<{ review: Review; reviews: Review[]; summary: ReviewsSummary }>(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(input)
    })
  }
}
