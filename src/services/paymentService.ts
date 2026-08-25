import { getApiBaseUrl } from "@/lib/api-base"

const API_BASE = getApiBaseUrl("/api")

type ApiResponse<T> = {
  success: boolean
  data?: T
  message?: string
}

export interface PaymentIntentResponse {
  clientSecret: string
  amount: number
  currency: string
}

export interface PaymentConfirmResponse {
  success: boolean
  paymentId: string
  bookingId: number
}

/**
 * Create a Stripe Payment Intent for advance payment
 */
export const createPaymentIntent = async (
  token: string,
  bookingId: number,
  amount: number
): Promise<PaymentIntentResponse> => {
  const response = await fetch(`${API_BASE}/payments/create-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bookingId, amount })
  })
  
  const payload = await response.json().catch(() => null) as ApiResponse<PaymentIntentResponse> | null
  if (!response.ok || !payload || !payload.success || !payload.data) {
    throw new Error(payload?.message || 'Failed to create payment intent')
  }
  return payload.data
}

/**
 * Confirm payment after Stripe processes it
 */
export const confirmPayment = async (
  token: string,
  bookingId: number,
  paymentIntentId: string
): Promise<PaymentConfirmResponse> => {
  const response = await fetch(`${API_BASE}/payments/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bookingId, paymentIntentId })
  })
  
  const payload = await response.json().catch(() => null) as ApiResponse<PaymentConfirmResponse> | null
  if (!response.ok || !payload || !payload.success) {
    throw new Error(payload?.message || 'Payment confirmation failed')
  }
  return payload.data || { success: true, paymentId: paymentIntentId, bookingId }
}
